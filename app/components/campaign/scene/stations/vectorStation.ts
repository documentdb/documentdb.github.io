// Beyond CRUD: vector and geospatial search over the same rows. On the way
// back up, the film stops here for the two queries behind the phone's
// "Similar gear" and "Pick up today" rows.
//
// The layered graph is a small, real HNSW: every node lives on layer 0, a
// subset on layer 1, a few on layer 2, each connected to its nearest
// neighbours on that layer. The search shown is the actual greedy descent for
// the query point, so the highlighted path is what the algorithm would take.
//
// The globe stands for 2dsphere indexes, which DocumentDB builds on PostGIS.

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineSegments,
  Mesh,
  PlaneGeometry,
  Points,
  RingGeometry,
  Sprite,
  Vector3,
  MeshBasicMaterial,
  AdditiveBlending,
  DoubleSide,
} from "three";
import { CUE } from "../film";
import { Fader, glowSpriteMaterial, holoMaterial, lineMaterial, pointsMaterial } from "../materials";
import { PRODUCT } from "../mockups";
import { hex } from "../palette";
import { envelope, mulberry32, pulse, smoothstep } from "../util";
import { Y, type Frame, type Kit, type Station } from "../world";

const LAYER_Y = [-1.5, 0.3, 2.1];
/** The top-layer node where every search starts, in the layer plane. */
const ENTRY: [number, number] = [-1.5, 0.35];
/** Seconds per hop of the greedy search. */
const HOP = 0.2;
/** Where the query embedding falls in the layer plane. */
const QUERY: [number, number] = [2.1, -0.9];
const TOP_K = 4;

interface Hop {
  layer: number;
  node: number;
}

function buildGraph() {
  const rng = mulberry32(33);
  const points: [number, number][] = [ENTRY];
  let guard = 0;
  while (points.length < 54 && guard++ < 4000) {
    const angle = rng() * Math.PI * 2;
    const radius = Math.sqrt(rng());
    const candidate: [number, number] = [Math.cos(angle) * radius * 3.2, Math.sin(angle) * radius * 2.2];
    if (points.every(([x, z]) => Math.hypot(x - candidate[0], z - candidate[1]) > 0.5)) points.push(candidate);
  }
  const distance = (a: number, b: number) => Math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1]);

  // Layer membership: everything on 0, about a third on 1, a handful on 2.
  const all = points.map((_, i) => i);
  const layer1 = all.filter((i) => i === 0 || rng() < 0.3);
  const layer2 = layer1.filter((i) => i === 0 || rng() < 0.28);
  const members = [all, layer1, layer2];
  const degree = [3, 3, 2];
  const neighbours = members.map((layer, level) => {
    const map = new Map<number, Set<number>>();
    for (const node of layer) map.set(node, new Set());
    for (const node of layer) {
      const nearest = layer
        .filter((other) => other !== node)
        .sort((a, b) => distance(node, a) - distance(node, b))
        .slice(0, degree[level]);
      for (const other of nearest) {
        map.get(node)?.add(other);
        map.get(other)?.add(node);
      }
    }
    return map;
  });
  return { points, members, neighbours };
}

export function createVectorStation(kit: Kit): Station {
  const group = new Group();
  group.position.set(0, Y.vector, 0);
  const fader = new Fader();
  const { points, members, neighbours } = buildGraph();
  const position = (hop: Hop, out = new Vector3()) =>
    out.set(points[hop.node][0], LAYER_Y[hop.layer], points[hop.node][1]);

  /* Layer planes. */
  for (const [level, y] of LAYER_Y.entries()) {
    const plane = new Mesh(
      new PlaneGeometry(7.4, 5.2),
      fader.add(holoMaterial({ color: hex.violetDeep, fill: 0.018, line: 0.5, glow: 0.1, opacity: 0.55 })),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = y - 0.02;
    group.add(plane);
    const tag = kit.tex.label(`layer ${level}`, 0.3, { color: "dim", align: "left" });
    tag.position.set(-3.55, y + 0.05, 2.35);
    fader.add(tag.material);
    group.add(tag);
  }

  /* Edges within layers and the vertical links between copies of a node. */
  {
    const edges: number[] = [];
    neighbours.forEach((map, level) => {
      for (const [node, set] of map) {
        for (const other of set) {
          if (other < node) continue;
          edges.push(points[node][0], LAYER_Y[level], points[node][1], points[other][0], LAYER_Y[level], points[other][1]);
        }
      }
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(edges), 3));
    group.add(new LineSegments(geometry, fader.add(lineMaterial(hex.violetDeep, 0.42))));

    const links: number[] = [];
    for (let level = 1; level < members.length; level++) {
      for (const node of members[level]) {
        links.push(points[node][0], LAYER_Y[level], points[node][1], points[node][0], LAYER_Y[level - 1], points[node][1]);
      }
    }
    const linkGeometry = new BufferGeometry();
    linkGeometry.setAttribute("position", new BufferAttribute(new Float32Array(links), 3));
    group.add(new LineSegments(linkGeometry, fader.add(lineMaterial(hex.violetDeep, 0.18))));
  }

  /* Nodes. One point per (layer, node) pair. */
  const hops: Hop[] = [];
  members.forEach((layer, level) => layer.forEach((node) => hops.push({ layer: level, node })));
  const nodePositions = new Float32Array(hops.length * 3);
  const nodeColors = new Float32Array(hops.length * 3);
  const nodeSizes = new Float32Array(hops.length);
  const nodeAlpha = new Float32Array(hops.length).fill(1);
  const scratch = new Vector3();
  hops.forEach((hop, i) => position(hop, scratch).toArray(nodePositions, i * 3));
  const nodeGeometry = new BufferGeometry();
  nodeGeometry.setAttribute("position", new BufferAttribute(nodePositions, 3));
  nodeGeometry.setAttribute("aColor", new BufferAttribute(nodeColors, 3));
  nodeGeometry.setAttribute("aSize", new BufferAttribute(nodeSizes, 1));
  nodeGeometry.setAttribute("aAlpha", new BufferAttribute(nodeAlpha, 1));
  const nodeCloud = new Points(nodeGeometry, fader.add(pointsMaterial()));
  nodeCloud.frustumCulled = false;
  group.add(nodeCloud);
  const hopIndex = (hop: Hop) => hops.findIndex((h) => h.layer === hop.layer && h.node === hop.node);

  /* Precompute the query's greedy path and its true nearest neighbours. */
  const search = (() => {
    const [qx, qz] = QUERY;
    const toQuery = (node: number) => Math.hypot(points[node][0] - qx, points[node][1] - qz);
    const path: Hop[] = [];
    let current = 0;
    for (let level = members.length - 1; level >= 0; level--) {
      path.push({ layer: level, node: current });
      for (;;) {
        let best = current;
        for (const other of neighbours[level].get(current) ?? []) {
          if (toQuery(other) < toQuery(best)) best = other;
        }
        if (best === current) break;
        current = best;
        path.push({ layer: level, node: current });
      }
    }
    const nearest = members[0]
      .slice()
      .sort((a, b) => toQuery(a) - toQuery(b))
      .slice(0, TOP_K);
    return { qx, qz, path, pathIndices: path.map(hopIndex), nearest, nearestIndices: nearest.map((node) => hopIndex({ layer: 0, node })) };
  })();

  /* Query marker: a ring on every layer joined by a vertical line. */
  const queryMaterial = new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
  const ringGeometry = new RingGeometry(0.17, 0.23, 32);
  ringGeometry.rotateX(-Math.PI / 2);
  const queryRings = LAYER_Y.map((y) => {
    const ring = new Mesh(ringGeometry, queryMaterial);
    ring.position.y = y;
    group.add(ring);
    return ring;
  });
  const queryLineMaterial = lineMaterial(0xffffff, 0);
  const queryLine = new Line(
    new BufferGeometry().setFromPoints([new Vector3(0, LAYER_Y[0], 0), new Vector3(0, LAYER_Y[2] + 1.7, 0)]),
    queryLineMaterial,
  );
  group.add(queryLine);
  const queryLabel = kit.tex.label(`similar to ${PRODUCT.name}`, 0.3, { color: "ink", pill: true, align: "center" });
  group.add(queryLabel);

  /* Search path so far, and the result fan. */
  const maxPath = search.path.length;
  const trailPositions = new Float32Array(maxPath * 3);
  const trailGeometry = new BufferGeometry();
  trailGeometry.setAttribute("position", new BufferAttribute(trailPositions, 3));
  const trailMaterial = lineMaterial(0xffffff, 0);
  const trail = new Line(trailGeometry, trailMaterial);
  trail.frustumCulled = false;
  group.add(trail);

  const resultPositions = new Float32Array(TOP_K * 6);
  const resultGeometry = new BufferGeometry();
  resultGeometry.setAttribute("position", new BufferAttribute(resultPositions, 3));
  const resultMaterial = lineMaterial(hex.emerald, 0);
  const resultLines = new LineSegments(resultGeometry, resultMaterial);
  resultLines.frustumCulled = false;
  group.add(resultLines);

  const pulseSprite = new Sprite(glowSpriteMaterial(kit.tex.glow(), 0xffffff, 0));
  pulseSprite.scale.setScalar(0.9);
  pulseSprite.renderOrder = 25;
  group.add(pulseSprite);

  /* Globe. */
  const globe = new Group();
  globe.position.set(5.4, 0.25, -0.2);
  const globeRadius = 1.2;
  const areaMaterial = lineMaterial(hex.emerald, 0.95);
  const ping = new Sprite(glowSpriteMaterial(kit.tex.glow(), hex.emerald, 0));
  {
    const lines: number[] = [];
    const onSphere = (lat: number, lon: number, out: number[]) => {
      out.push(
        Math.cos(lat) * Math.sin(lon) * globeRadius,
        Math.sin(lat) * globeRadius,
        Math.cos(lat) * Math.cos(lon) * globeRadius,
      );
    };
    const steps = 48;
    for (let m = 0; m < 12; m++) {
      const lon = (m / 12) * Math.PI * 2;
      for (let i = 0; i < steps; i++) {
        onSphere(-Math.PI / 2 + (i / steps) * Math.PI, lon, lines);
        onSphere(-Math.PI / 2 + ((i + 1) / steps) * Math.PI, lon, lines);
      }
    }
    for (let p = 1; p < 6; p++) {
      const lat = -Math.PI / 2 + (p / 6) * Math.PI;
      for (let i = 0; i < steps; i++) {
        onSphere(lat, (i / steps) * Math.PI * 2, lines);
        onSphere(lat, ((i + 1) / steps) * Math.PI * 2, lines);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(lines), 3));
    globe.add(new LineSegments(geometry, fader.add(lineMaterial(0x2f8f86, 0.42))));

    // Stores, and a $near search area around one of them.
    const rng = mulberry32(5);
    const centerLat = 0.55;
    const centerLon = 0.5;
    const places: number[] = [];
    onSphere(centerLat, centerLon, places);
    for (let i = 0; i < 11; i++) onSphere(centerLat + (rng() - 0.5) * 1.5, centerLon + (rng() - 0.5) * 2.2, places);
    const placeGeometry = new BufferGeometry();
    const count = places.length / 3;
    const colors = new Float32Array(count * 3);
    const emerald = new Color(hex.emerald);
    for (let i = 0; i < count; i++) emerald.toArray(colors, i * 3);
    placeGeometry.setAttribute("position", new BufferAttribute(new Float32Array(places), 3));
    placeGeometry.setAttribute("aColor", new BufferAttribute(colors, 3));
    placeGeometry.setAttribute("aSize", new BufferAttribute(new Float32Array(count).fill(0.2), 1));
    placeGeometry.setAttribute("aAlpha", new BufferAttribute(new Float32Array(count).fill(1), 1));
    globe.add(new Points(placeGeometry, fader.add(pointsMaterial())));

    const area: number[] = [];
    const reach = 0.42;
    for (let i = 0; i < 40; i++) {
      for (const step of [i, i + 1]) {
        const bearing = (step / 40) * Math.PI * 2;
        onSphere(centerLat + Math.sin(bearing) * reach, centerLon + (Math.cos(bearing) * reach) / Math.cos(centerLat), area);
      }
    }
    const areaGeometry = new BufferGeometry();
    areaGeometry.setAttribute("position", new BufferAttribute(new Float32Array(area), 3));
    globe.add(new LineSegments(areaGeometry, areaMaterial));

    const centre: number[] = [];
    onSphere(centerLat, centerLon, centre);
    ping.position.set(centre[0], centre[1], centre[2]).multiplyScalar(1.02);
    globe.add(ping);
  }
  group.add(globe);
  const nearLabel = kit.tex.label("$near: [-122.33, 47.61]", 0.28, { color: "ink", pill: true, align: "center" });
  nearLabel.position.set(globe.position.x, globe.position.y - globeRadius - 0.6, globe.position.z);
  group.add(nearLabel);

  /* Captions. */
  const labels: Sprite[] = [];
  const caption = (text: string, sub: string, x: number, y: number, z: number, color: "violet" | "emerald") => {
    const sprite = kit.tex.label(text, 0.4, { color, sub, align: "center" });
    sprite.position.set(x, y, z);
    labels.push(sprite);
    group.add(sprite);
  };
  caption("vector-hnsw", "pgvector · cosine similarity", -0.4, LAYER_Y[2] + 2.75, 0, "violet");
  caption("2dsphere", "PostGIS · $near", globe.position.x, globe.position.y + globeRadius + 0.85, globe.position.z, "emerald");

  const violet = new Color(hex.violet);
  const white = new Color(0xffffff);
  const emerald = new Color(hex.emerald);
  const tint = new Color();
  const from = new Vector3();
  const to = new Vector3();

  return {
    group,
    update(frame: Frame) {
      const { t } = frame;
      // Glimpsed in the dark on the way down, visited on the way back up.
      const visit = envelope(t, 25.3, 26.2, 28.9, 29.9);
      const glimpse = 0.32 * envelope(t, 12.3, 13.0, 14.0, 14.8);
      const w = Math.max(visit, glimpse, frame.finale);
      group.visible = w > 0.002;
      if (!group.visible) return;
      fader.set(w);
      const detail = visit * (1 - frame.finale);
      for (const label of labels) label.material.opacity = detail;
      globe.rotation.y = Math.sin(frame.time * 0.16) * 0.2 - 0.3;

      const start = CUE.vectorQuery + 0.25;
      const travelled = Math.max(0, (t - start) / HOP);
      const lastHop = search.path.length - 1;
      const done = start + lastHop * HOP;
      const found = smoothstep(done, done + 0.4, t);
      const present = envelope(t, CUE.vectorQuery - 0.3, CUE.vectorQuery + 0.15, 28.9, 29.6);

      // Query marker.
      queryRings.forEach((ring) => {
        ring.position.x = search.qx;
        ring.position.z = search.qz;
      });
      queryLine.position.set(search.qx, 0, search.qz);
      queryMaterial.opacity = w * present * 0.95;
      queryLineMaterial.opacity = w * present * 0.4;
      queryLabel.position.set(search.qx, LAYER_Y[2] + 1.95, search.qz);
      queryLabel.material.opacity = detail * present;

      // Node colours: resting violet, white when visited, emerald when returned.
      for (let i = 0; i < hops.length; i++) {
        tint.copy(violet).multiplyScalar(hops[i].layer === 0 ? 0.62 : 0.9);
        nodeSizes[i] = hops[i].layer === 0 ? 0.17 : 0.21;
        tint.toArray(nodeColors, i * 3);
      }
      search.pathIndices.forEach((index, step) => {
        const since = travelled - step;
        if (since < 0) return;
        const glow = Math.exp(-since * 0.22) * present;
        tint.fromArray(nodeColors, index * 3).lerp(white, glow).multiplyScalar(1 + glow * 1.4);
        tint.toArray(nodeColors, index * 3);
        nodeSizes[index] += glow * 0.16;
      });
      search.nearestIndices.forEach((index) => {
        const glow = found * present;
        tint.fromArray(nodeColors, index * 3).lerp(emerald, glow).multiplyScalar(1 + glow * 1.6);
        tint.toArray(nodeColors, index * 3);
        nodeSizes[index] += glow * 0.2;
      });
      nodeGeometry.attributes.aColor.needsUpdate = true;
      nodeGeometry.attributes.aSize.needsUpdate = true;

      // The path walked so far.
      const whole = Math.min(Math.floor(travelled), lastHop);
      const part = Math.min(travelled - whole, 1);
      for (let i = 0; i < maxPath; i++) {
        const step = Math.min(i, whole);
        position(search.path[step], from);
        if (i > whole) {
          // The segment being walked right now, and padding after it.
          position(search.path[Math.min(whole + 1, lastHop)], to);
          from.lerp(to, part);
        }
        from.toArray(trailPositions, i * 3);
      }
      trailGeometry.attributes.position.needsUpdate = true;
      trailMaterial.opacity = w * (t > start ? 0.9 : 0) * present;
      position(search.path[whole], from);
      position(search.path[Math.min(whole + 1, lastHop)], to);
      pulseSprite.position.copy(from.lerp(to, whole < lastHop ? part : 1));
      pulseSprite.position.y += 0.05;
      pulseSprite.material.opacity = w * (t > start && t < done + 0.3 ? 1 : 0);

      // Results: the K nearest rows, tied back to the query.
      search.nearest.forEach((node, i) => {
        resultPositions.set([search.qx, LAYER_Y[0], search.qz, points[node][0], LAYER_Y[0], points[node][1]], i * 6);
      });
      resultGeometry.attributes.position.needsUpdate = true;
      resultMaterial.opacity = w * found * present * 0.9;

      // $near on the globe: the search area flashes as the nearest store is found.
      const near = pulse(t, CUE.nearQuery, 1.3) * (t < CUE.nearQuery + 3 ? 1 : 0);
      areaMaterial.opacity = w * (0.55 + 0.45 * Math.min(near * 1.6, 1));
      ping.scale.setScalar(0.5 + near * 1.1);
      ping.material.opacity = w * Math.min(near * 1.4, 1) * 0.9;
      nearLabel.material.opacity = detail * envelope(t, CUE.nearQuery - 0.35, CUE.nearQuery, 28.9, 29.5);
    },
  };
}
