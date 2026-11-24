// The film's clock. One tap on a phone is followed down to a PostgreSQL heap
// page and back in a single continuous shot; this file names the eight parts of
// that shot and the moments inside them that the scene is choreographed to.
//
// It must stay free of three.js imports: the page content (a server component)
// and the tests read it without loading the renderer.

import { envelope } from "./util";

export type ShotKey = "tap" | "doc" | "wire" | "gateway" | "btree" | "mvcc" | "indexes" | "stack";

export interface Shot {
  key: ShotKey;
  /** Seconds from the start of the film. */
  start: number;
  end: number;
}

/** Length of one loop, in seconds. */
export const DURATION = 36;

// Caption boundaries. Each one falls a little before the camera settles, so
// the words arrive just ahead of the picture they describe.
export const SHOTS: readonly Shot[] = [
  { key: "tap", start: 0, end: 2.9 },
  { key: "doc", start: 2.9, end: 6.9 },
  { key: "wire", start: 6.9, end: 9.6 },
  { key: "gateway", start: 9.6, end: 12.6 },
  { key: "btree", start: 12.6, end: 16.2 },
  { key: "mvcc", start: 16.2, end: 22.6 },
  { key: "indexes", start: 22.6, end: 28.9 },
  { key: "stack", start: 28.9, end: DURATION },
];

/** Index into SHOTS for a point in the film. */
export function shotIndexAt(t: number) {
  // Wrap only when needed: a second modulo would nudge exact boundaries down.
  const time = t >= 0 && t < DURATION ? t : ((t % DURATION) + DURATION) % DURATION;
  for (let i = SHOTS.length - 1; i > 0; i--) {
    if (time >= SHOTS[i].start) return i;
  }
  return 0;
}

// Named moments, in seconds. Everything that moves in the scene is a function
// of film time and these constants, so any frame can be drawn on its own.
export const CUE = {
  /* 1 · the tap */
  finger: 1.1,
  tap: 2.0,
  /* 2 · inside the app: card, document, bytes */
  docOut: 2.55,
  docOpen: 3.45,
  fieldTags: 3.75,
  fieldGeo: 4.05,
  fieldEmbedding: 4.35,
  fieldStock: 4.75,
  bson: 5.4,
  pack: 6.25,
  depart: 6.9,
  /* 3 · to the backend: down to the hall, along the aisle, into one rack */
  phoneEdge: 7.3,
  mouth: 8.35,
  roof: 9.05,
  /* 4 · the gateway */
  aboveRing: 9.75,
  dive: 10.7,
  cross: 11.0,
  belowRing: 11.4,
  leaveRing: 12.3,
  /* 5 · finding the row */
  root: 13.5,
  inner: 14.1,
  leaf: 14.7,
  row: 15.3,
  linePointer: 16.1,
  tuple: 16.6,
  /* 6 · a new version */
  write: 17.1,
  stamp: 17.8,
  wal: 18.4,
  walFlush: 19.1,
  nextRead: 19.6,
  vacuum: 20.5,
  vacuumEnd: 21.7,
  /* 7 · the way back: other indexes over the same rows */
  tagQuery: 23.3,
  vectorQuery: 26.0,
  nearQuery: 27.0,
  /* 8 · the whole stack, and the reply */
  reply: 30.5,
  replyGateway: 31.3,
  replyRoof: 31.75,
  replyMouth: 32.15,
  replyPhone: 32.7,
} as const;

/** The frame shown when motion is reduced: the whole stack. */
export const STILL_AT = 31.2;

/** 0..1 while the camera stands back and shows every layer at once. */
export function finaleAt(t: number) {
  return envelope(t, 28.9, 30.2, 32.2, 33.3);
}
