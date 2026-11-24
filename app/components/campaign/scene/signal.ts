// The light the camera follows: the update on its way from the phone to the
// row it changes, and later the reply on its way back. Its position is a pure
// function of film time, so the camera, the stations and the tests all agree
// on where it is in any frame.

import { CatmullRomCurve3, LineCurve3, QuadraticBezierCurve3, Vector3, type Curve } from "three";
import { CUE } from "./film";
import { clamp, lerp, smoothstep } from "./util";
import { DOC, HEAP, PHONE, Y, entryRoute, pkLookupPath, pointerX } from "./world";

type Ease = (u: number) => number;
const linear: Ease = (u) => u;
const easeIn: Ease = (u) => u * u;
const easeOut: Ease = (u) => 1 - (1 - u) * (1 - u);
const easeInOut: Ease = (u) => u * u * (3 - 2 * u);

interface Leg {
  from: number;
  to: number;
  curve: Curve<Vector3>;
  ease: Ease;
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const line = (a: Vector3, b: Vector3) => new LineCurve3(a, b);

export class Signal {
  private readonly legs: Leg[];

  constructor() {
    const { link, mouth, front, heart } = entryRoute();
    const ribbon = v(PHONE.x + DOC.bson.x, PHONE.y + DOC.bson.y, PHONE.z + DOC.bson.z);
    const edge = link.getPoint(0);
    const ring = Y.gateway;
    // In front of the trees and the page, so it is never hidden by them.
    const pk = pkLookupPath().map((point) => point.setZ(0.25));
    const pointer = v(pointerX(HEAP.oldPointer), Y.heap + HEAP.pointerY, HEAP.z + 0.1);
    const tuple = v(-2.3, Y.heap + HEAP.oldY, HEAP.z + 0.1);
    const pageTop = v(0, Y.heap + HEAP.h / 2, 0);

    this.legs = [
      /* The update: out of the phone, down to the hall, along the aisle, into the rack. */
      { from: CUE.depart, to: CUE.phoneEdge, curve: new QuadraticBezierCurve3(ribbon, v(0.95, ribbon.y - 0.7, PHONE.z + 0.5), edge), ease: easeInOut },
      { from: CUE.phoneEdge, to: CUE.mouth, curve: link, ease: easeIn },
      { from: CUE.mouth, to: CUE.roof, curve: line(mouth, front), ease: linear },
      { from: CUE.roof, to: CUE.roof + 0.12, curve: line(front, heart), ease: linear },
      { from: CUE.roof + 0.12, to: CUE.aboveRing, curve: line(heart, v(0, ring + 2.7, 0)), ease: easeOut },
      /* It waits above the gateway as a document command, crosses, and waits below as SQL. */
      { from: CUE.aboveRing, to: CUE.dive, curve: line(v(0, ring + 2.7, 0), v(0, ring + 1.5, 0)), ease: linear },
      { from: CUE.dive, to: CUE.cross, curve: line(v(0, ring + 1.5, 0), v(0, ring, 0)), ease: easeIn },
      { from: CUE.cross, to: CUE.belowRing, curve: line(v(0, ring, 0), v(0, ring - 1.5, 0)), ease: easeOut },
      { from: CUE.belowRing, to: CUE.leaveRing, curve: line(v(0, ring - 1.5, 0), v(0, ring - 2.3, 0)), ease: linear },
      /* Past the vector level to the root of the primary-key B-tree. */
      {
        from: CUE.leaveRing,
        to: CUE.root,
        curve: new CatmullRomCurve3([v(0, ring - 2.3, 0), v(-0.7, -22.5, 3.4), v(-2.3, -30.5, 3.2), pk[0]]),
        ease: easeInOut,
      },
      { from: CUE.root, to: CUE.inner, curve: line(pk[0], pk[1]), ease: easeInOut },
      { from: CUE.inner, to: CUE.leaf, curve: line(pk[1], pk[2]), ease: easeInOut },
      { from: CUE.leaf, to: CUE.row, curve: line(pk[2], pk[3]), ease: easeInOut },
      /* The leaf's row pointer leads to a line pointer in the heap page, and that to the tuple. */
      {
        from: CUE.row,
        to: CUE.linePointer,
        curve: new CatmullRomCurve3([pk[3], v(-1.5, -43.2, 0.7), v(-1.6, -45.6, 0.4), pointer]),
        ease: easeInOut,
      },
      { from: CUE.linePointer, to: CUE.tuple, curve: line(pointer, tuple), ease: easeInOut },

      /* The reply: up the spine, through the gateway, back to the phone. */
      { from: CUE.reply, to: CUE.replyGateway, curve: line(pageTop, v(0, ring, 0)), ease: easeIn },
      { from: CUE.replyGateway, to: CUE.replyRoof, curve: line(v(0, ring, 0), heart), ease: linear },
      { from: CUE.replyRoof, to: CUE.replyMouth, curve: line(heart, mouth), ease: linear },
      { from: CUE.replyMouth, to: CUE.replyPhone, curve: new CatmullRomCurve3(link.points.slice().reverse()), ease: easeOut },
    ];
  }

  /** Where the light is at film time `t`; between legs it rests where it last arrived. */
  position(t: number, out: Vector3) {
    const legs = this.legs;
    if (t <= legs[0].from) return legs[0].curve.getPointAt(0, out);
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      if (t < leg.from) return legs[i - 1].curve.getPointAt(1, out);
      if (t <= leg.to) {
        return leg.curve.getPointAt(clamp(leg.ease((t - leg.from) / (leg.to - leg.from)), 0, 1), out);
      }
    }
    return legs[legs.length - 1].curve.getPointAt(1, out);
  }

  /** 0 when there is nothing to see, 1 while the light is travelling. */
  presence(t: number) {
    const request = smoothstep(CUE.depart, CUE.depart + 0.12, t) * (1 - smoothstep(CUE.tuple, CUE.tuple + 0.25, t));
    const reply = smoothstep(CUE.reply - 0.05, CUE.reply + 0.15, t) * (1 - smoothstep(CUE.replyPhone, CUE.replyPhone + 0.2, t));
    return Math.max(request, reply);
  }

  /** 0 on the document side of the gateway, 1 on the PostgreSQL side. */
  side(t: number) {
    return t < (CUE.tuple + CUE.reply) / 2
      ? smoothstep(CUE.cross - 0.05, CUE.cross + 0.12, t)
      : 1 - smoothstep(CUE.replyGateway - 0.05, CUE.replyGateway + 0.12, t);
  }

  /** World-space size of the glow. */
  size(t: number) {
    if (t >= CUE.reply - 0.5) {
      // Large enough to read from the overview, small again at the phone.
      return lerp(3.3, 0.5, smoothstep(CUE.replyGateway, CUE.replyPhone, t));
    }
    const leaving = lerp(0.3, 0.44, smoothstep(CUE.depart, CUE.phoneEdge, t));
    // Rack-sized in the hall, larger once it is inside the machine.
    const entering = lerp(leaving, 0.8, smoothstep(CUE.phoneEdge, CUE.mouth, t));
    const falling = lerp(entering, 1.5, smoothstep(CUE.roof, CUE.aboveRing, t));
    return lerp(falling, 1.0, smoothstep(CUE.leaveRing, CUE.root, t));
  }
}
