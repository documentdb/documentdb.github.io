import { CatmullRomCurve3, Vector3, type Group } from "three";
import type { Signal } from "./signal";
import type { TextureKit } from "./textures";

// The world is a tower. A phone floats above a hall of server racks; inside
// one of those machines, drawn large, the gateway sits over PostgreSQL, whose
// indexes sit over the heap they point into. Y is the height of each level.
export const Y = {
  gateway: -14,
  vector: -26,
  index: -38,
  heap: -50,
} as const;

/** The phone whose tap the film follows: centre of its screen, facing +z. */
export const PHONE = { x: 0, y: 1.45, z: 6.5, w: 1.2, h: 2.6 } as const;

/** Where the document and its bytes float, relative to the phone's centre. */
export const DOC = {
  json: new Vector3(2.05, 0.42, 0.55),
  bson: new Vector3(2.05, -0.72, 0.55),
};

/** The hall of racks between the phone and the machine the film goes into. */
export const HALL = {
  floor: -8.4,
  /** Height at which the light runs along the aisle and enters the last rack. */
  port: -6.6,
  rack: { w: 1.5, h: 3.4, d: 1.9 },
  /** The two rows facing the aisle stand this far either side of the axis. */
  aisle: 2.35,
  /** Where the aisle opens towards the camera. */
  mouth: 11.4,
  perRow: 5,
} as const;

/** Vertical extent of the machine that holds everything below the hall. */
export const SERVER = { top: -9.2, bottom: -57.4, half: 10.5 };

/** Where the spine of that machine starts: the heart of the rack at the aisle's end. */
export const TRUNK_TOP = HALL.port;

/** One heap page, shared by the station that draws it and the light that lands on it. */
export const HEAP = {
  w: 6.6,
  h: 7.6,
  /** The page stands slightly behind the tower's axis. */
  z: -0.4,
  tupleH: 0.72,
  /** Row version the update supersedes, and the one it writes above it. */
  oldY: -1.6,
  newY: -0.78,
  /** Line pointers of those two versions (their offsets in the page, minus one). */
  oldPointer: 2,
  newPointer: 3,
  pointerY: 2.72,
  /** The write-ahead log runs under the page. */
  walY: -4.6,
} as const;

/** Width of the page's contents, inside its outline. */
export const HEAP_INNER = HEAP.w - 0.36;

export const pointerX = (index: number) => -HEAP_INNER / 2 + 0.25 + index * 0.62;

/** Both index trees: three levels over a strip of the heap rows they point to. */
export const TREE = {
  levelY: [2.5, 0.95, -0.6],
  rowY: -2.75,
  btreeX: -3.1,
  rumX: 3.5,
  btreeInner: [-1.45, 1.45],
  btreeLeaves: [-2.4, -1.45, -0.5, 0.5, 1.45, 2.4],
  /** The path an _id lookup takes: second internal page, fifth leaf. */
  pkInner: 1,
  pkLeaf: 4,
  rows: 12,
} as const;

export const rowX = (index: number) => -5.5 + (index * 11) / (TREE.rows - 1);

/** World-space stops of the primary-key lookup: root, internal page, leaf, heap row. */
export function pkLookupPath() {
  const x = TREE.btreeX;
  return [
    new Vector3(x, Y.index + TREE.levelY[0], 0),
    new Vector3(x + TREE.btreeInner[TREE.pkInner], Y.index + TREE.levelY[1], 0),
    new Vector3(x + TREE.btreeLeaves[TREE.pkLeaf], Y.index + TREE.levelY[2], 0),
    new Vector3(rowX(TREE.pkLeaf), Y.index + TREE.rowY, 0),
  ];
}

/**
 * The way from the phone into the machine: down from the phone's bottom edge
 * to the mouth of the aisle, along the aisle into the front of the last rack,
 * and on to its heart, where the spine begins.
 */
export function entryRoute() {
  const bottom = PHONE.y - PHONE.h / 2 - 0.06;
  const mouth = new Vector3(0, HALL.port, HALL.mouth);
  return {
    link: new CatmullRomCurve3([
      new Vector3(PHONE.x, bottom, PHONE.z - 0.04),
      new Vector3(0, bottom - 1.25, 7.3),
      new Vector3(0, -3.7, 10.6),
      new Vector3(0, -5.8, 13.1),
      new Vector3(0, HALL.port + 0.06, 12.75),
      mouth,
    ]),
    mouth,
    front: new Vector3(0, HALL.port, HALL.rack.d / 2),
    heart: new Vector3(0, HALL.port, 0),
  };
}

export interface Frame {
  /** Film time in seconds, 0..DURATION. Everything choreographed keys on it. */
  t: number;
  /** Free-running clock for ambient motion that never has to line up. */
  time: number;
  dt: number;
  /** Completed loops; the phone only resets its screen after the first. */
  loop: number;
  /** 0..1 while the camera stands back to show the whole stack. */
  finale: number;
}

export interface Station {
  group: Group;
  update(frame: Frame): void;
}

export interface Kit {
  tex: TextureKit;
  /** The light the camera follows; stations attach things to it. */
  signal: Signal;
  /** Constrained device: fewer particles, smaller textures, no bloom. */
  low: boolean;
  /**
   * Narrow screen: the film plays in a third of the width, so a few labels are
   * drawn larger and anything that would stick out of the frame moves inside.
   */
  compact: boolean;
}
