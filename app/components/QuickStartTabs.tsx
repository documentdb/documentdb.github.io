"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import CommandSnippet from "./CommandSnippet";

export type QuickStartStep = {
  step: string;
  description: string;
};

type QuickStartTabsProps = {
  dockerCommand: string;
  dockerSteps: QuickStartStep[];
  vscodeSteps: QuickStartStep[];
  /** Deep link that opens the extension's DocumentDB Local setup wizard. */
  vscodeDeepLinkUrl: string;
  /** Marketplace page, for visitors who do not have the extension yet. */
  vscodeMarketplaceUrl: string;
};

const TABS = [
  { id: "docker", label: "Docker" },
  { id: "vscode", label: "VS Code" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function StepList({ steps }: { steps: QuickStartStep[] }) {
  return (
    <ol className="mt-5 overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/50">
      {steps.map((item) => (
        <li
          key={item.step}
          className="grid grid-cols-[auto_1fr] items-center gap-3 border-t border-neutral-800/80 px-4 py-3.5 first:border-t-0"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-[11px] font-semibold text-blue-200">
            {item.step}
          </span>
          <p className="text-sm leading-6 text-gray-300">{item.description}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * The home page quick start, offering the two ways to get a local DocumentDB running.
 *
 * Docker stays first because it is the path that works everywhere and needs nothing installed
 * beyond Docker itself. The VS Code path is newer and shorter — the extension provisions the
 * container itself — but only pays off for people who already work in VS Code, so it is offered
 * rather than assumed.
 */
export default function QuickStartTabs({
  dockerCommand,
  dockerSteps,
  vscodeSteps,
  vscodeDeepLinkUrl,
  vscodeMarketplaceUrl,
}: QuickStartTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("docker");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Arrow keys move between tabs, which is what a tablist is expected to do; without it the
  // only way through is Tab, and that leaves the panel.
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(currentIndex + delta + TABS.length) % TABS.length];

    setActiveTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Ways to run DocumentDB locally"
        className="mb-4 inline-flex rounded-full border border-neutral-700 bg-neutral-900/80 p-1"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              type="button"
              role="tab"
              id={`quickstart-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`quickstart-panel-${tab.id}`}
              // Only the selected tab is in the tab order; arrow keys move between them.
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={onTabKeyDown}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-blue-500/20 text-blue-100"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="quickstart-panel-docker"
        aria-labelledby="quickstart-tab-docker"
        hidden={activeTab !== "docker"}
      >
        <CommandSnippet command={dockerCommand} label="Docker" />
        <StepList steps={dockerSteps} />
      </div>

      <div
        role="tabpanel"
        id="quickstart-panel-vscode"
        aria-labelledby="quickstart-tab-vscode"
        hidden={activeTab !== "vscode"}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={vscodeMarketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-600 px-4 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
          >
            Get the extension
          </Link>
          {/*
           * A `vscode://` link does nothing at all when VS Code is not installed — no error, no
           * navigation — so it is offered second and never on its own. Someone arriving without
           * the extension gets the install link first and this becomes the obvious next step.
           */}
          <Link
            href={vscodeDeepLinkUrl}
            className="inline-flex items-center justify-center rounded-lg border border-blue-400/30 bg-blue-500/20 px-4 py-2.5 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/30"
          >
            Open in VS Code
          </Link>
        </div>
        <StepList steps={vscodeSteps} />
      </div>
    </div>
  );
}
