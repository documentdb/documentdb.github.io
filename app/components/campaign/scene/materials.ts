import {
  AdditiveBlending,
  Color,
  DoubleSide,
  LineBasicMaterial,
  NormalBlending,
  ShaderMaterial,
  SpriteMaterial,
  Vector2,
  type IUniform,
  type Material,
  type Texture,
} from "three";

// Uniforms every custom material reads. They are shared by reference, so the
// render loop updates one object per frame instead of walking the materials.
export const shared = {
  fogDensity: { value: 0.03 } as IUniform<number>,
  time: { value: 0 } as IUniform<number>,
  // Projects a world-space point size to pixels: bufferHeight / (2 tan(fov/2)).
  pointScale: { value: 800 } as IUniform<number>,
};

// Exponential-squared distance fade. It multiplies alpha (or colour, for
// additive materials) instead of mixing towards a fog colour, so additive
// geometry fades to nothing rather than to a grey haze.
const FOG = /* glsl */ `
uniform float uFogDensity;
varying float vDepth;
float fogFactor() {
  float f = uFogDensity * vDepth;
  return exp(-f * f);
}
`;

const OUTPUT = /* glsl */ `
#include <tonemapping_fragment>
#include <colorspace_fragment>
`;

/* ------------------------------------------------------------------ holo -- */
// Boxes and planes drawn as glowing outlines with a faint fill. The outline is
// computed from the face UVs with screen-space derivatives, so it keeps a
// constant pixel width at any scale or distance (GL lines cannot do that).

const HOLO_VERT = /* glsl */ `
varying vec2 vUv;
varying float vDepth;
varying vec3 vTint;
void main() {
  vUv = uv;
  vec4 p = vec4(position, 1.0);
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
  #endif
  vec4 mv = modelViewMatrix * p;
  vDepth = -mv.z;
  vTint = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
    vTint = instanceColor;
  #endif
  gl_Position = projectionMatrix * mv;
}
`;

const HOLO_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uFill;
uniform float uLine;
uniform float uGlow;
varying vec2 vUv;
varying vec3 vTint;
${FOG}
void main() {
  vec2 d = min(vUv, 1.0 - vUv);
  vec2 w = max(fwidth(vUv), vec2(1e-6));
  float e = min(d.x / w.x, d.y / w.y);
  float line = 1.0 - smoothstep(uLine, uLine + 1.2, e);
  float glow = uGlow * exp(-e * 0.085);
  float a = clamp(uFill + line + glow, 0.0, 1.0);
  gl_FragColor = vec4(uColor * vTint, a * uOpacity * fogFactor());
  ${OUTPUT}
}
`;

export interface HoloOptions {
  color: number;
  opacity?: number;
  /** Face fill, 0..1. */
  fill?: number;
  /** Outline half-width in pixels. */
  line?: number;
  /** Soft inner glow hugging the outline. */
  glow?: number;
}

export function holoMaterial(o: HoloOptions) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(o.color) },
      uOpacity: { value: o.opacity ?? 1 },
      uFill: { value: o.fill ?? 0.04 },
      uLine: { value: o.line ?? 0.55 },
      uGlow: { value: o.glow ?? 0.16 },
      uFogDensity: shared.fogDensity,
    },
    vertexShader: HOLO_VERT,
    fragmentShader: HOLO_FRAG,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
}

/* ----------------------------------------------------------------- panel -- */
// A textured card with rounded corners and a lit border: app screens, JSON
// documents, heap tuples.

const PANEL_VERT = /* glsl */ `
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const PANEL_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uSize;
uniform float uRadius;
uniform vec3 uBorder;
uniform float uBorderWidth;
uniform float uOpacity;
uniform float uBright;
uniform vec3 uTint;
varying vec2 vUv;
${FOG}
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float sd = sdRoundBox(p, uSize * 0.5, uRadius);
  float aa = max(fwidth(sd), 1e-6);
  float inside = 1.0 - smoothstep(-aa, 0.0, sd);
  if (inside < 0.004) discard;
  vec4 tex = texture2D(uMap, vUv);
  float bw = uBorderWidth * aa;
  float border = (1.0 - smoothstep(bw, bw + aa, abs(sd + bw))) * step(0.001, uBorderWidth);
  vec3 col = mix(tex.rgb * uTint * uBright, uBorder, border);
  float alpha = max(tex.a, border) * inside;
  float fog = fogFactor();
  gl_FragColor = vec4(col * fog, alpha * uOpacity * fog);
  ${OUTPUT}
}
`;

export interface PanelOptions {
  map: Texture;
  size: [number, number];
  radius?: number;
  border?: number;
  /** Border width in pixels; 0 disables it. */
  borderWidth?: number;
  opacity?: number;
  /** Values above 1 push the texture into bloom range, like a lit screen. */
  bright?: number;
  tint?: number;
}

export function panelMaterial(o: PanelOptions) {
  return new ShaderMaterial({
    uniforms: {
      uMap: { value: o.map },
      uSize: { value: new Vector2(o.size[0], o.size[1]) },
      uRadius: { value: o.radius ?? 0.06 },
      uBorder: { value: new Color(o.border ?? 0x7dd3fc) },
      uBorderWidth: { value: o.borderWidth ?? 1 },
      uOpacity: { value: o.opacity ?? 1 },
      uBright: { value: o.bright ?? 1 },
      uTint: { value: new Color(o.tint ?? 0xffffff) },
      uFogDensity: shared.fogDensity,
    },
    vertexShader: PANEL_VERT,
    fragmentShader: PANEL_FRAG,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
  });
}

/* ---------------------------------------------------------------- points -- */

const POINTS_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aAlpha;
uniform float uScale;
uniform float uTime;
uniform float uDrift;
uniform float uTwinkle;
varying vec3 vColor;
varying float vAlpha;
varying float vDepth;
void main() {
  vec3 p = position;
  // Slow, per-particle bobbing; uDrift is 0 for points animated on the CPU.
  float phase = dot(position, vec3(12.9898, 78.233, 37.719));
  p.y += sin(uTime * 0.21 + phase) * uDrift;
  p.x += cos(uTime * 0.17 + phase * 1.7) * uDrift * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  float px = aSize * uScale / max(vDepth, 0.001);
  // Sub-pixel points flicker, so hold them at one pixel and dim them instead.
  vAlpha = aAlpha * clamp(px, 0.0, 1.0);
  // Status lights: each blinks at its own rate.
  float blink = 0.5 + 0.5 * sin(uTime * (1.1 + fract(phase) * 2.8) + phase);
  vAlpha *= mix(1.0, 0.25 + 0.75 * blink * blink, uTwinkle);
  gl_PointSize = max(px, 1.0);
  vColor = aColor;
  gl_Position = projectionMatrix * mv;
}
`;

const POINTS_FRAG = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
${FOG}
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float a = 1.0 - r2;
  gl_FragColor = vec4(vColor, a * a * vAlpha * uOpacity * fogFactor());
  ${OUTPUT}
}
`;

export function pointsMaterial(o: { opacity?: number; drift?: number; twinkle?: number } = {}) {
  return new ShaderMaterial({
    uniforms: {
      uScale: shared.pointScale,
      uTime: shared.time,
      uDrift: { value: o.drift ?? 0 },
      uTwinkle: { value: o.twinkle ?? 0 },
      uOpacity: { value: o.opacity ?? 1 },
      uFogDensity: shared.fogDensity,
    },
    vertexShader: POINTS_VERT,
    fragmentShader: POINTS_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/* ------------------------------------------------------------------- rim -- */
// Phone bodies: near-black solids with a fresnel edge, so they read as objects
// lit from behind by their own screens.

const RIM_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying float vDepth;
varying vec3 vTint;
void main() {
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    n = mat3(instanceMatrix) * n;
  #endif
  vec4 mv = modelViewMatrix * p;
  // Extruded geometry can carry zero-length normals at degenerate triangles;
  // normalising those would put NaN on screen, and bloom would spread it.
  vec3 vn = normalMatrix * n;
  float len = length(vn);
  vNormal = len > 1e-6 ? vn / len : vec3(0.0, 0.0, 1.0);
  vView = normalize(-mv.xyz);
  vDepth = -mv.z;
  vTint = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
    vTint = instanceColor;
  #endif
  gl_Position = projectionMatrix * mv;
}
`;

const RIM_FRAG = /* glsl */ `
uniform float uOpacity;
uniform vec3 uBody;
uniform vec3 uRim;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vTint;
${FOG}
void main() {
  float len = length(vNormal);
  vec3 normal = len > 1e-6 ? vNormal / len : vec3(0.0, 0.0, 1.0);
  float facing = clamp(dot(normal, normalize(vView)), 0.0, 1.0);
  float rim = pow(1.0 - facing, 2.4);
  vec3 col = uBody + vTint * uRim * (rim * 1.25 + 0.05);
  float fog = fogFactor();
  gl_FragColor = vec4(col * fog * uOpacity, uOpacity);
  ${OUTPUT}
}
`;

export function rimMaterial(rim = 0xffffff) {
  return new ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1 },
      uBody: { value: new Color(0x04070b) },
      uRim: { value: new Color(rim) },
      uFogDensity: shared.fogDensity,
    },
    vertexShader: RIM_VERT,
    fragmentShader: RIM_FRAG,
    transparent: true,
    depthWrite: true,
  });
}

/* ---------------------------------------------------------------- ripple -- */
// The gateway membrane: concentric waves travelling into the centre.

const RIPPLE_FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;
${FOG}
void main() {
  vec2 q = vUv * 2.0 - 1.0;
  float r = length(q);
  if (r > 1.0) discard;
  float wave = 0.5 + 0.5 * sin(r * 26.0 + uTime * 2.4);
  float falloff = smoothstep(1.0, 0.15, r);
  float edge = smoothstep(0.9, 1.0, r);
  vec3 col = mix(uColorB, uColorA, r);
  float a = (0.05 + 0.2 * wave * wave * falloff) + edge * 0.35;
  gl_FragColor = vec4(col, a * uOpacity * fogFactor());
  ${OUTPUT}
}
`;

export function rippleMaterial(colorA: number, colorB: number) {
  return new ShaderMaterial({
    uniforms: {
      uColorA: { value: new Color(colorA) },
      uColorB: { value: new Color(colorB) },
      uOpacity: { value: 1 },
      uTime: shared.time,
      uFogDensity: shared.fogDensity,
    },
    vertexShader: PANEL_VERT,
    fragmentShader: RIPPLE_FRAG,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
}

/* -------------------------------------------------------------- backdrop -- */

const BACKDROP_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;

const BACKDROP_FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uGlow;
uniform vec2 uGlowPos;
uniform float uAspect;
varying vec2 vUv;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
  vec2 q = vUv - uGlowPos;
  q.x *= uAspect;
  col += uGlow * exp(-dot(q, q) * 2.6);
  // Dither away the banding a dark gradient would otherwise show.
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.008;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
  ${OUTPUT}
}
`;

export function backdropMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uTop: { value: new Color(0x070b12) },
      uBottom: { value: new Color(0x030405) },
      uGlow: { value: new Color(0x0b2a3a) },
      uGlowPos: { value: new Vector2(0.7, 0.45) },
      uAspect: { value: 1.6 },
    },
    vertexShader: BACKDROP_VERT,
    fragmentShader: BACKDROP_FRAG,
    depthTest: false,
    depthWrite: false,
  });
}

/* --------------------------------------------------------------- helpers -- */

export function lineMaterial(color: number, opacity = 0.5) {
  return new LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

export function glowSpriteMaterial(map: Texture, color: number, opacity = 0.5) {
  return new SpriteMaterial({
    map,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/**
 * Fades a whole station in and out. Materials with a `uOpacity` uniform and
 * built-in materials are both handled; each keeps its own base opacity.
 */
export class Fader {
  /** Current weight, for materials whose opacity is animated by hand. */
  w = 1;
  private items: { material: Material; base: number; uniform?: IUniform<number> }[] = [];

  add<T extends Material>(material: T, base?: number): T {
    const uniform = (material as unknown as ShaderMaterial).uniforms?.uOpacity as
      | IUniform<number>
      | undefined;
    this.items.push({
      material,
      uniform,
      base: base ?? (uniform ? uniform.value : material.opacity),
    });
    return material;
  }

  set(w: number) {
    this.w = w;
    for (const item of this.items) {
      if (item.uniform) item.uniform.value = item.base * w;
      else item.material.opacity = item.base * w;
    }
  }
}
