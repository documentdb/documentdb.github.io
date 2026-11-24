// Everything that spans the levels: the link from the phone and the spine down
// the machine, the machine's outline, dust for parallax, the light the camera
// follows, and the captions of the closing overview.

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Points,
  Sprite,
  Vector3,
} from "three";
import { CUE } from "./film";
import { Fader, glowSpriteMaterial, lineMaterial, pointsMaterial } from "./materials";
import { hex } from "./palette";
import { envelope, fract, lerp, mulberry32, smoothstep } from "./util";
import { HEAP, PHONE, SERVER, TRUNK_TOP, Y, entryRoute, type Frame, type Kit, type Station } from "./world";

const HALF = SERVER.half;
const TOP = SERVER.top;
const BOTTOM = SERVER.bottom;
/** Seconds between samples of the light's tail. */
const TAIL_STEP = 0.011;

function segments(points: number[], material: LineBasicMaterial) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(points), 3));
  const lines = new LineSegments(geometry, material);
  lines.frustumCulled = false;
  return lines;
}

function square(points: number[], y: number, half: number) {
  const corners = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];
  for (let i = 0; i < 4; i++) {
    const [x0, z0] = corners[i];
    const [x1, z1] = corners[(i + 1) % 4];
    points.push(x0, y, z0, x1, y, z1);
  }
}

export interface Shell extends Station {
  /** Colour of the backdrop glow for the current part of the film. */
  glow: Color;
}

export function createShell(kit: Kit): Shell {
  const group = new Group();
  const rng = mulberry32(21);
  const glowTexture = kit.tex.glow();
  const { signal } = kit;
  const emerald = new Color(hex.emerald);
  const sky = new Color(hex.sky);

  /* Link and spine: emerald from the phone to the gateway, sky below it. */
  const spineBottom = Y.heap + HEAP.h / 2;
  {
    const route = entryRoute();
    const points = route.link.getPoints(64);
    points.push(route.front, route.heart);
    const steps = 36;
    for (let i = 1; i <= steps; i++) points.push(new Vector3(0, lerp(TRUNK_TOP, spineBottom, i / steps), 0));
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    const top = new Color(hex.emeraldDeep);
    const bottom = new Color(hex.skyDeep);
    const mixed = new Color();
    points.forEach((point, i) => {
      point.toArray(positions, i * 3);
      mixed.copy(top).lerp(bottom, smoothstep(Y.gateway + 0.6, Y.gateway - 0.6, point.y));
      mixed.toArray(colors, i * 3);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    const line = new Line(
      geometry,
      new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.42, depthWrite: false, blending: AdditiveBlending }),
    );
    line.frustumCulled = false;
    group.add(line);
  }

  /* Other requests on the spine, shown only in the overview. */
  const trafficFader = new Fader();
  const trafficCount = 7;
  const trafficPositions = new Float32Array(trafficCount * 3);
  const trafficColors = new Float32Array(trafficCount * 3);
  const trafficAlpha = new Float32Array(trafficCount);
  const trafficGeometry = new BufferGeometry();
  trafficGeometry.setAttribute("position", new BufferAttribute(trafficPositions, 3));
  trafficGeometry.setAttribute("aColor", new BufferAttribute(trafficColors, 3));
  trafficGeometry.setAttribute("aAlpha", new BufferAttribute(trafficAlpha, 1));
  trafficGeometry.setAttribute("aSize", new BufferAttribute(new Float32Array(trafficCount).fill(0.5), 1));
  const traffic = new Points(trafficGeometry, trafficFader.add(pointsMaterial()));
  traffic.frustumCulled = false;
  group.add(traffic);

  /* The machine: edges, level plates and corner brackets. */
  const shellFader = new Fader();
  {
    const edges: number[] = [];
    square(edges, TOP, HALF);
    square(edges, BOTTOM, HALF);
    for (const [x, z] of [
      [-HALF, -HALF],
      [HALF, -HALF],
      [HALF, HALF],
      [-HALF, HALF],
    ]) {
      edges.push(x, TOP, z, x, BOTTOM, z);
    }
    group.add(segments(edges, shellFader.add(lineMaterial(0x1f5878, 0.34))));

    const plates: number[] = [];
    for (const y of [(Y.gateway + Y.vector) / 2, (Y.vector + Y.index) / 2, (Y.index + Y.heap) / 2]) {
      square(plates, y, HALF);
      square(plates, y, HALF * 0.62);
    }
    group.add(segments(plates, shellFader.add(lineMaterial(0x1a4a66, 0.24))));

    const brackets: number[] = [];
    const reach = 1.8;
    for (const y of [TOP, BOTTOM]) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const x = sx * HALF;
          const z = sz * HALF;
          brackets.push(x, y, z, x - sx * reach, y, z);
          brackets.push(x, y, z, x, y, z - sz * reach);
          brackets.push(x, y, z, x, y + (y === TOP ? -reach : reach), z);
        }
      }
    }
    group.add(segments(brackets, shellFader.add(lineMaterial(hex.sky, 0.6))));
  }

  /* Dust: faint motes so camera travel has parallax. */
  const dustFader = new Fader();
  {
    const count = kit.low ? 520 : 1300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const alpha = new Float32Array(count);
    const size = new Float32Array(count);
    const tints = [new Color(hex.sky), new Color(hex.emerald), new Color(hex.ink), new Color(hex.violet)];
    for (let i = 0; i < count; i++) {
      const radius = 2.5 + Math.sqrt(rng()) * 19;
      const angle = rng() * Math.PI * 2;
      positions.set([Math.cos(angle) * radius, lerp(9, BOTTOM - 6, rng()), Math.sin(angle) * radius], i * 3);
      tints[Math.floor(rng() * (rng() < 0.2 ? 4 : 3))].toArray(colors, i * 3);
      alpha[i] = 0.18 + rng() * 0.5;
      size[i] = 0.05 + rng() * rng() * 0.16;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aColor", new BufferAttribute(colors, 3));
    geometry.setAttribute("aAlpha", new BufferAttribute(alpha, 1));
    geometry.setAttribute("aSize", new BufferAttribute(size, 1));
    const dust = new Points(geometry, dustFader.add(pointsMaterial({ drift: 0.4 })));
    dust.frustumCulled = false;
    group.add(dust);
  }

  /* The light: a glow, a white core and a tail along the way it came. */
  const lightGlow = new Sprite(glowSpriteMaterial(glowTexture, hex.emerald, 0));
  const lightCore = new Sprite(glowSpriteMaterial(glowTexture, 0xffffff, 0));
  lightGlow.renderOrder = 30;
  lightCore.renderOrder = 31;
  group.add(lightGlow, lightCore);
  const tailSteps = 28;
  const tailPositions = new Float32Array(tailSteps * 3);
  const tailColors = new Float32Array(tailSteps * 3);
  const tailGeometry = new BufferGeometry();
  tailGeometry.setAttribute("position", new BufferAttribute(tailPositions, 3));
  tailGeometry.setAttribute("color", new BufferAttribute(tailColors, 3));
  const tail = new Line(
    tailGeometry,
    new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1, depthWrite: false, blending: AdditiveBlending }),
  );
  tail.frustumCulled = false;
  group.add(tail);
  const lightColor = new Color();
  const scratch = new Vector3();

  /* Layer captions for the overview. */
  const captionFader = new Fader();
  const captions: [number, string, string, "emerald" | "sky" | "violet"][] = [
    [PHONE.y + 0.4, "YOUR APP", "DocumentDB API", "emerald"],
    [Y.gateway, "GATEWAY", "wire protocol · :10260", "emerald"],
    [Y.vector, "VECTOR + GEO", "pgvector · PostGIS", "violet"],
    [Y.index, "INDEXES", "PostgreSQL B-tree · RUM", "sky"],
    [Y.heap, "HEAP + MVCC", "PostgreSQL rows · WAL", "sky"],
  ];
  {
    const leaders: number[] = [];
    for (const [y, title, sub, color] of captions) {
      const label = kit.tex.label(title, 3.3, { color, sub, pill: false });
      label.position.set(HALF + 3.2, y, 0);
      captionFader.add(label.material);
      group.add(label);
      leaders.push(HALF + 0.4, y, 0, HALF + 2.8, y, 0);
    }
    group.add(segments(leaders, captionFader.add(lineMaterial(hex.sky, 0.55))));
  }

  // Backdrop tint for each part of the film: [time, colour].
  const backdrop: [number, Color][] = [
    [0, new Color(0x30445a)],
    [6.9, new Color(0x0a3038)],
    [9.9, new Color(0x08332c)],
    [13.7, new Color(0x0a2c36)],
    [16.8, new Color(0x0c2140)],
    [22.3, new Color(0x0c2140)],
    [23.4, new Color(0x0a2c36)],
    [26.2, new Color(0x1c1a44)],
    [28.6, new Color(0x1c1a44)],
    [30.3, new Color(0x0a2233)],
    [32, new Color(0x0a2233)],
    [33.8, new Color(0x30445a)],
  ];
  const glow = new Color();

  return {
    group,
    glow,
    update(frame: Frame) {
      const { t, time, finale } = frame;

      let stop = 0;
      while (stop < backdrop.length - 2 && t >= backdrop[stop + 1][0]) stop++;
      const [from, fromColor] = backdrop[stop];
      const [to, toColor] = backdrop[stop + 1];
      glow.copy(fromColor).lerp(toColor, smoothstep(from, to, t));

      // The machine's outline appears as the light enters it and stays to the end.
      const inside = envelope(t, CUE.roof - 0.4, CUE.aboveRing, 32.6, 33.6);
      shellFader.set(Math.max(inside, finale));
      // Around the phone the backdrop is a plain studio wall: hardly any dust.
      const studio = 1 - envelope(t, CUE.depart, CUE.mouth, 32.3, 33.4);
      dustFader.set((1 - finale * 0.45) * (1 - studio * 0.85));
      captionFader.set(smoothstep(0.55, 1, finale));

      trafficFader.set(finale);
      for (let i = 0; i < trafficCount; i++) {
        const u = fract(time * 0.085 + i / trafficCount);
        const y = lerp(TRUNK_TOP, spineBottom, u);
        trafficPositions.set([0, y, 0], i * 3);
        lightColor.copy(emerald).lerp(sky, smoothstep(Y.gateway + 0.4, Y.gateway - 0.4, y));
        lightColor.toArray(trafficColors, i * 3);
        trafficAlpha[i] = Math.sqrt(Math.max(Math.sin(Math.PI * u), 0)) * 0.6;
      }
      trafficGeometry.attributes.position.needsUpdate = true;
      trafficGeometry.attributes.aColor.needsUpdate = true;
      trafficGeometry.attributes.aAlpha.needsUpdate = true;

      // The light and its tail.
      const visible = signal.presence(t);
      signal.position(t, lightGlow.position);
      lightCore.position.copy(lightGlow.position);
      lightColor.copy(emerald).lerp(sky, signal.side(t));
      lightGlow.material.color.copy(lightColor);
      const size = signal.size(t);
      lightGlow.scale.setScalar(size);
      lightCore.scale.setScalar(size * 0.3);
      lightGlow.material.opacity = visible * 0.85;
      lightCore.material.opacity = visible;
      // The tail never reaches back past the start of the current trip.
      const since = t >= CUE.reply ? CUE.reply : CUE.depart;
      for (let i = 0; i < tailSteps; i++) {
        const u = i / (tailSteps - 1);
        signal.position(Math.max(since, t - i * TAIL_STEP), scratch).toArray(tailPositions, i * 3);
        const fade = (1 - u) ** 2 * visible;
        tailColors.set([lightColor.r * fade, lightColor.g * fade, lightColor.b * fade], i * 3);
      }
      tailGeometry.attributes.position.needsUpdate = true;
      tailGeometry.attributes.color.needsUpdate = true;
      tail.visible = visible > 0.01;
    },
  };
}
