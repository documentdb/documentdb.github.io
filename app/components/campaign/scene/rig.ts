// The camera of the film. It never cuts: one spline runs from the phone down
// to the heap page and back, with a rest at every shot. Position is a pure
// function of film time, so a frame looks the same whether it is reached by
// playing, by a loop or by a seek.

import { CatmullRomCurve3, MathUtils, PerspectiveCamera, Vector3 } from "three";
import { DURATION } from "./film";
import type { Signal } from "./signal";
import { clamp, lerp, smoother } from "./util";
import { SERVER, Y } from "./world";

type Triple = [number, number, number];

interface Framing {
  pos: Triple;
  target: Triple;
  /** World width that must stay visible around the target. */
  span: number;
  /** World height that must stay visible around the target. */
  rise: number;
}

interface Key extends Framing {
  /** Film time at which the camera is here. */
  t: number;
  /**
   * How the camera gets here from the previous key:
   *   move   a travel that comes to rest here,
   *   drift  a slow, even glide between two rests (the length of a shot),
   *   pass   a waypoint in the middle of a travel.
   */
  how: "move" | "drift" | "pass";
  fog: number;
  fov?: number;
  /** How much the look-at point is pulled onto the travelling light, 0..1. */
  follow?: number;
  /** Tighter framing for narrow screens, which have a third of the width. */
  narrow?: Partial<Framing>;
}

/** Part of the canvas the scene may use, in CSS pixels from its top-left. */
export interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const FOV = 38;
const TOP = 3;
const OVERVIEW_Y = (TOP + SERVER.bottom) / 2;
const { gateway: G, vector: V, index: I, heap: H } = Y;

// Opening framing; the film also ends on it, which is what lets it loop.
const OPENING: Framing = { pos: [0.95, 1.8, 13.4], target: [0.12, 1.45, 6.5], span: 5.4, rise: 4.6 };

const KEYS: Key[] = [
  /* 1 · the phone, pushing in on the button */
  { t: 0, how: "move", ...OPENING, fog: 0.016 },
  { t: 2.3, how: "drift", pos: [0.8, 1.62, 12.3], target: [0.06, 1.3, 6.5], span: 3.9, rise: 3.5, fog: 0.018 },
  /* 2 · phone and document side by side */
  {
    t: 3.3,
    how: "move",
    pos: [2.25, 1.95, 12.6],
    target: [1.33, 1.62, 6.95],
    span: 4.6,
    rise: 3.3,
    fog: 0.02,
    narrow: { pos: [2.5, 1.78, 12.4], target: [2.05, 1.52, 7.05], span: 2.75, rise: 2.7 },
  },
  {
    t: 6.8,
    how: "drift",
    pos: [2.2, 1.85, 12.2],
    target: [1.4, 1.55, 6.95],
    span: 4.45,
    rise: 3.15,
    fog: 0.02,
    narrow: { pos: [2.45, 1.7, 12.1], target: [2.05, 1.42, 7.05], span: 2.7, rise: 2.6 },
  },
  /* 3 · down after the light, to the mouth of an aisle of server racks */
  { t: 7.85, how: "pass", pos: [1.9, -1.6, 18.2], target: [0, -3.4, 10], span: 10, rise: 8, fog: 0.014, follow: 1 },
  { t: 8.75, how: "pass", pos: [0.55, -5.3, 17], target: [0, -6.7, 4.5], span: 9, rise: 6.4, fog: 0.02, follow: 0.55 },
  /* 4 · inside the last rack: the gateway */
  {
    t: 9.95,
    how: "move",
    pos: [6.4, G + 5.4, 11.6],
    target: [0.5, G - 0.3, 0],
    span: 9.6,
    rise: 9.5,
    fog: 0.028,
    narrow: { pos: [4.2, G + 5.2, 12.4], target: [0, G - 0.5, 0], span: 7.6, rise: 8.6 },
  },
  {
    t: 12.2,
    how: "drift",
    pos: [6.1, G + 4.9, 11.3],
    target: [0.45, G - 0.7, 0],
    span: 9.6,
    rise: 9.5,
    fog: 0.028,
    narrow: { pos: [4.0, G + 4.7, 12.1], target: [0, G - 0.9, 0], span: 7.6, rise: 8.6 },
  },
  /* 5 · falling to the primary-key B-tree */
  { t: 12.95, how: "pass", pos: [3.4, -23.5, 13.8], target: [-1, -24, 2], span: 9, rise: 9, fog: 0.022, follow: 1 },
  { t: 13.7, how: "move", pos: [-0.9, I + 1.5, 14.6], target: [-2.75, I + 0.1, 0], span: 7.6, rise: 8.7, fog: 0.022 },
  { t: 15.5, how: "drift", pos: [-0.8, I + 0.5, 14.4], target: [-2.6, I - 0.9, 0], span: 7.6, rise: 8.3, fog: 0.022 },
  /* 6 · craning down to the heap page */
  { t: 16.15, how: "pass", pos: [0.9, -44.6, 15], target: [-0.8, -46, 0], span: 9.6, rise: 9.4, fog: 0.022, follow: 0.7 },
  {
    t: 16.8,
    how: "move",
    pos: [2.2, H + 0.5, 15],
    target: [0.7, H - 0.35, 0],
    span: 11.5,
    rise: 10.7,
    fog: 0.022,
    narrow: { pos: [1.0, H - 1.3, 15], target: [-0.25, H - 1.95, 0], span: 7.4, rise: 6.7 },
  },
  {
    t: 22.3,
    how: "drift",
    pos: [2.0, H + 0.3, 14.4],
    target: [0.8, H - 0.6, 0],
    span: 10.9,
    rise: 10.0,
    fog: 0.022,
    narrow: { pos: [0.9, H - 1.5, 14.6], target: [-0.25, H - 2.15, 0], span: 7.3, rise: 6.6 },
  },
  /* 7 · back up past the other indexes: RUM, then vector and geospatial */
  { t: 23.4, how: "move", pos: [5.4, I + 1.4, 14.2], target: [3.3, I + 0.05, 0], span: 7.8, rise: 8.7, fog: 0.022 },
  { t: 25.1, how: "drift", pos: [5.1, I + 1.0, 13.9], target: [3.2, I - 0.3, 0], span: 7.8, rise: 8.5, fog: 0.022 },
  { t: 26.2, how: "move", pos: [-4.6, V + 4.4, 14], target: [1.1, V + 0.7, 0], span: 11.6, rise: 8.2, fog: 0.024 },
  { t: 28.6, how: "drift", pos: [-3.7, V + 4.0, 14.2], target: [1.2, V + 0.6, 0], span: 11.6, rise: 8.2, fog: 0.024 },
  /* 8 · the whole stack, then home to the phone */
  {
    t: 30.3,
    how: "move",
    pos: [46, OVERVIEW_Y + 12, 100],
    target: [9.5, OVERVIEW_Y, 0],
    span: 45,
    rise: TOP - SERVER.bottom + 7,
    fog: 0.0026,
    fov: 40,
    narrow: { target: [0, OVERVIEW_Y, 0], span: 24 },
  },
  {
    t: 32.0,
    how: "drift",
    pos: [42, OVERVIEW_Y + 13.5, 101],
    target: [9.5, OVERVIEW_Y + 1, 0],
    span: 45,
    rise: TOP - SERVER.bottom + 7,
    fog: 0.0026,
    fov: 40,
    narrow: { target: [0, OVERVIEW_Y + 1, 0], span: 24 },
  },
  { t: 33.8, how: "move", pos: [1.02, 1.9, 13.95], target: [0.12, 1.48, 6.5], span: 5.9, rise: 5.0, fog: 0.016 },
  { t: DURATION, how: "drift", ...OPENING, fog: 0.016 },
];

const tmp = new Vector3();
const right = new Vector3();
const up = new Vector3();
const light = new Vector3();

export class Rig {
  readonly camera = new PerspectiveCamera(FOV, 1.6, 0.1, 480);
  fog = KEYS[0].fog;

  private positions!: CatmullRomCurve3;
  private targets!: CatmullRomCurve3;
  private framings: Framing[] = [];
  private narrow: boolean | null = null;
  private readonly pos = new Vector3();
  private readonly target = new Vector3();
  private readonly pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private width = 1;
  private height = 1;
  private focus: FocusRect = { x: 0, y: 0, width: 1, height: 1 };
  private hasFocus = false;

  constructor(private readonly signal: Signal) {
    this.layout(false);
  }

  /** Builds the camera path for wide or narrow framing. */
  private layout(narrow: boolean) {
    if (narrow === this.narrow) return;
    this.narrow = narrow;
    this.framings = KEYS.map((key) => {
      const base: Framing = { pos: key.pos, target: key.target, span: key.span, rise: key.rise };
      return narrow ? { ...base, ...key.narrow } : base;
    });
    this.positions = new CatmullRomCurve3(
      this.framings.map((framing) => new Vector3(...framing.pos)),
      false,
      "centripetal",
    );
    this.targets = new CatmullRomCurve3(
      this.framings.map((framing) => new Vector3(...framing.target)),
      false,
      "centripetal",
    );
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.layout(width < 1024);
    if (!this.hasFocus) this.focus = this.defaultFocus();
    this.applyProjection(this.camera.fov);
  }

  /** The page tells the rig which part of the canvas is free of copy. */
  setFocus(rect: FocusRect) {
    this.focus = rect;
    this.hasFocus = true;
    this.applyProjection(this.camera.fov);
  }

  // Until the page reports the real layout: copy on the left for wide
  // canvases, at the bottom for narrow ones.
  private defaultFocus(): FocusRect {
    const { width, height } = this;
    return width >= 1024
      ? { x: width * 0.46, y: height * 0.1, width: width * 0.5, height: height * 0.78 }
      : { x: 0, y: height * 0.08, width, height: height * 0.42 };
  }

  private applyProjection(fov: number) {
    const { width, height, focus } = this;
    this.camera.fov = fov;
    this.camera.aspect = width / Math.max(height, 1);
    // Shift the optical centre to the middle of the focus area.
    const dx = focus.x + focus.width / 2 - width / 2;
    const dy = focus.y + focus.height / 2 - height / 2;
    this.camera.setViewOffset(width, height, -dx, -dy, width, height);
  }

  setPointer(x: number, y: number) {
    this.pointer.tx = clamp(x, -1, 1);
    this.pointer.ty = clamp(y, -1, 1);
  }

  /**
   * Bends time so that every travel between two rests eases out of the first
   * and into the second, however many waypoints lie between them. Drifts are
   * left linear: they are the slow glide during a shot.
   */
  private warp(t: number) {
    let from = 0;
    for (let i = 1; i < KEYS.length; i++) {
      const key = KEYS[i];
      if (key.how === "pass") continue;
      if (t <= key.t) {
        if (key.how === "drift") return t;
        const start = KEYS[from].t;
        return start + smoother((t - start) / (key.t - start)) * (key.t - start);
      }
      from = i;
    }
    return t;
  }

  /**
   * Places the camera for film time `t`. `time` and `dt` only feed the idle
   * sway and the pointer parallax, which `still` switches off.
   */
  update(t: number, time: number, dt: number, finale: number, still: boolean) {
    const last = KEYS.length - 1;
    const warped = this.warp(clamp(t, 0, DURATION));
    let index = 0;
    while (index < last - 1 && warped >= KEYS[index + 1].t) index++;
    const a = KEYS[index];
    const b = KEYS[index + 1];
    const local = clamp((warped - a.t) / (b.t - a.t), 0, 1);
    const u = (index + local) / last;
    this.positions.getPoint(u, this.pos);
    this.targets.getPoint(u, this.target);

    // The light the film follows pulls the look-at point onto itself in transit.
    const follow = lerp(a.follow ?? 0, b.follow ?? 0, local);
    if (follow > 0) this.target.lerp(this.signal.position(t, light), follow);

    const fa = this.framings[index];
    const fb = this.framings[index + 1];
    const fov = lerp(a.fov ?? FOV, b.fov ?? FOV, local);
    const span = lerp(fa.span, fb.span, local);
    const rise = lerp(fa.rise, fb.rise, local);
    // Density is interpolated in log space: the overview is ten times clearer
    // than a close-up, and a linear blend would hide it until the last moment.
    this.fog = Math.exp(lerp(Math.log(a.fog), Math.log(b.fog), local));

    // Pull the camera back until the subject fits the focus area both ways.
    const distance = this.pos.distanceTo(this.target);
    const visibleHeight = 2 * distance * Math.tan(MathUtils.degToRad(fov) / 2);
    const visibleWidth = (visibleHeight * this.width) / Math.max(this.height, 1);
    const fitWidth = span / Math.max(visibleWidth * (this.focus.width / this.width), 1e-3);
    const fitHeight = rise / Math.max(visibleHeight * (this.focus.height / this.height), 1e-3);
    const fit = clamp(Math.max(fitWidth, fitHeight), 0.82, 4);
    this.pos.sub(this.target).multiplyScalar(fit).add(this.target);
    // Fog is tuned for a wide screen. A narrow one makes the camera stand
    // further back, so the haze thins by the same factor and the subject keeps
    // its brightness.
    this.fog *= clamp(1.3 / fit, 0.4, 1);

    if (!still) {
      // Slow sway in the overview; elsewhere a barely perceptible drift.
      const orbit = finale * Math.sin(time * 0.12) * 0.12;
      if (orbit !== 0) {
        tmp.copy(this.pos).sub(this.target);
        const cos = Math.cos(orbit);
        const sin = Math.sin(orbit);
        this.pos.set(
          this.target.x + tmp.x * cos + tmp.z * sin,
          this.pos.y,
          this.target.z - tmp.x * sin + tmp.z * cos,
        );
      }
      const scale = this.pos.distanceTo(this.target) / 16;
      const k = 1 - Math.exp(-dt * 3.2);
      this.pointer.x += (this.pointer.tx - this.pointer.x) * k;
      this.pointer.y += (this.pointer.ty - this.pointer.y) * k;
      tmp.copy(this.target).sub(this.pos).normalize();
      right.crossVectors(tmp, up.set(0, 1, 0)).normalize();
      up.crossVectors(right, tmp);
      const dx = (Math.sin(time * 0.23) * 0.16 + this.pointer.x * 0.5) * scale;
      const dy = (Math.sin(time * 0.31 + 1.3) * 0.09 - this.pointer.y * 0.28) * scale;
      this.pos.addScaledVector(right, dx).addScaledVector(up, dy);
    }

    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.target);
    if (Math.abs(this.camera.fov - fov) > 1e-3) this.applyProjection(fov);
  }
}
