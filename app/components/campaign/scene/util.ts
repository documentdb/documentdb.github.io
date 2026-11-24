export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export const saturate = (x: number) => clamp(x, 0, 1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = saturate((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** 1 inside `inner` of `center`, falling to 0 at `outer`. */
export function bump(x: number, center: number, inner: number, outer: number) {
  return 1 - smoothstep(inner, outer, Math.abs(x - center));
}

/** Rises from 0 to 1 between `a` and `b`, falls back to 0 between `c` and `d`. */
export function envelope(x: number, a: number, b: number, c: number, d: number) {
  return smoothstep(a, b, x) * (1 - smoothstep(c, d, x));
}

/** 1 at `at`, decaying afterwards; 0 before. */
export function pulse(x: number, at: number, decay: number) {
  return x >= at ? Math.exp(-(x - at) * decay) : 0;
}

export const fract = (x: number) => x - Math.floor(x);

/** Small deterministic PRNG so every visitor sees the same layout. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
