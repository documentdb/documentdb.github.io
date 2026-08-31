#!/usr/bin/env python3
"""Verify that the published pools contain only the selected release assets."""

import json
import re
from pathlib import Path


ROOT = Path("out")
RELEASE_INFO = ROOT / "packages" / "release-info.json"

DEB_PREFIXES = {
    "deb11-": "deb11",
    "deb12-": "deb12",
    "deb13-": "deb13",
    "ubuntu22.04-": "ubuntu22",
    "ubuntu24.04-": "ubuntu24",
}
RPM_POOLS = ("rhel8", "rhel9")


def rpm_pool(name: str) -> str | None:
    for pool in RPM_POOLS:
        if name.startswith(f"{pool}-") or f".el{pool[-1]}." in name:
            return pool
    return None


def fail(message: str) -> None:
    raise SystemExit(message)


if not RELEASE_INFO.exists():
    fail(f"Missing {RELEASE_INFO}")

release = json.loads(RELEASE_INFO.read_text())
asset_names = {
    asset["name"]
    for asset in release.get("assets", [])
    if isinstance(asset, dict) and isinstance(asset.get("name"), str)
}
package_assets = {
    name
    for name in asset_names
    if (name.endswith(".deb") and "dbgsym" not in name)
    or (
        name.endswith(".rpm")
        and "debuginfo" not in name
        and "debugsource" not in name
    )
}

downloaded = {
    path.name
    for path in (ROOT / "packages").iterdir()
    if path.suffix in {".deb", ".rpm"}
}
if downloaded != package_assets:
    fail(
        "Direct package mirror does not match release assets.\n"
        f"Missing: {sorted(package_assets - downloaded)}\n"
        f"Unexpected: {sorted(downloaded - package_assets)}"
    )

expected_deb: dict[str, set[str]] = {}
for name in sorted(package_assets):
    if not name.endswith(".deb"):
        continue
    match = next(
        ((prefix, component) for prefix, component in DEB_PREFIXES.items() if name.startswith(prefix)),
        None,
    )
    if match is None:
        fail(f"Unrecognized DEB release asset: {name}")
    prefix, component = match
    expected_deb.setdefault(component, set()).add(name.removeprefix(prefix))

deb_pool_root = ROOT / "deb" / "pool"
actual_deb_components = {
    path.name for path in deb_pool_root.iterdir() if path.is_dir()
} if deb_pool_root.exists() else set()
if actual_deb_components != set(expected_deb):
    fail(
        "APT components do not match the selected release.\n"
        f"Expected: {sorted(expected_deb)}\n"
        f"Actual: {sorted(actual_deb_components)}"
    )

for component, expected in expected_deb.items():
    actual = {path.name for path in (deb_pool_root / component).glob("*.deb")}
    if actual != expected:
        fail(
            f"APT pool {component} does not match the selected release.\n"
            f"Missing: {sorted(expected - actual)}\n"
            f"Unexpected: {sorted(actual - expected)}"
        )

release_file = ROOT / "deb" / "dists" / "stable" / "Release"
if expected_deb:
    if not release_file.exists():
        fail(f"Missing {release_file}")
    match = re.search(r"^Components:\s*(.+)$", release_file.read_text(), re.MULTILINE)
    components = set(match.group(1).split()) if match else set()
    if components != set(expected_deb):
        fail(
            "APT Release components do not match the selected release.\n"
            f"Expected: {sorted(expected_deb)}\n"
            f"Actual: {sorted(components)}"
        )

rpm_assets = {name for name in package_assets if name.endswith(".rpm")}
explicit_rpm_pools = {pool for name in rpm_assets if (pool := rpm_pool(name))}
expected_rpm: dict[str, set[str]] = {pool: set() for pool in explicit_rpm_pools}

for name in rpm_assets:
    pool = rpm_pool(name)
    if pool:
        expected_rpm[pool].add(re.sub(r"^rhel[89]-", "", name))
    elif name.endswith(".noarch.rpm"):
        for target in explicit_rpm_pools:
            expected_rpm[target].add(name)
    else:
        fail(f"Unrecognized RPM release asset: {name}")

rpm_root = ROOT / "rpm"
expected_rpm_dirs = set(expected_rpm)
if "rhel8" in expected_rpm:
    expected_rpm_dirs.add("main")
actual_rpm_pools = {
    path.name
    for path in rpm_root.iterdir()
    if path.is_dir()
} if rpm_root.exists() else set()
if actual_rpm_pools != expected_rpm_dirs:
    fail(
        "RPM pools do not match the selected release.\n"
        f"Expected: {sorted(expected_rpm_dirs)}\n"
        f"Actual: {sorted(actual_rpm_pools)}"
    )

for pool, expected in expected_rpm.items():
    actual = {path.name for path in (rpm_root / pool).glob("*.rpm")}
    if actual != expected:
        fail(
            f"RPM pool {pool} does not match the selected release.\n"
            f"Missing: {sorted(expected - actual)}\n"
            f"Unexpected: {sorted(actual - expected)}"
        )

if "main" in expected_rpm_dirs:
    actual_main = {path.name for path in (rpm_root / "main").glob("*.rpm")}
    if actual_main != expected_rpm["rhel8"]:
        fail("Legacy RPM main pool does not match the selected release's RHEL 8 pool.")

print(
    f"Package pools exactly match {release.get('tag_name', 'the selected release')}: "
    f"{len(package_assets)} release assets."
)
