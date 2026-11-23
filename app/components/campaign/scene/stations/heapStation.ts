// One 8 kB heap page of documentdb_data.documents_3, drawn the way PostgreSQL
// lays it out: header, line pointers growing down, tuples growing up, free
// space between. The update plays out on it once per loop:
//
//   the light arrives at the product's row version,
//   the update writes a new version above it and stamps the old one's xmax,
//   another shopper's read that was already running still sees the old version,
//   the change goes to the write-ahead log before the reply is sent,
//   once nobody can see the old version, vacuum removes it.

import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Line,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  QuadraticBezierCurve3,
  Sprite,
  Vector3,
  type CanvasTexture,
  type ShaderMaterial,
} from "three";
import { CUE } from "../film";
import { Fader, glowSpriteMaterial, holoMaterial, lineMaterial, panelMaterial } from "../materials";
import { STOCK_AFTER, STOCK_BEFORE } from "../mockups";
import { css, hex } from "../palette";
import { MONO, type Ctx } from "../textures";
import { envelope, fract, lerp, pulse, smoothstep } from "../util";
import { HEAP, HEAP_INNER, Y, pointerX, type Frame, type Kit, type Station } from "../world";

const { w: W, h: H, tupleH } = HEAP;
const INNER = HEAP_INNER;
const TUPLE_PX: [number, number] = [1320, 150];
const READER_PX: [number, number] = [470, 120];
/** Transaction that wrote the version on the page, and the one that updates it. */
const XID = { before: 1041, update: 1042 };

interface TupleState {
  xmin: number;
  xmax: number;
  oid: string;
  /** Plain preview text, or the stock count drawn large. */
  preview: string | number;
  dead: boolean;
}

function paintTuple(ctx: Ctx, state: TupleState) {
  const [w, h] = TUPLE_PX;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = state.dead ? "rgba(40,28,6,0.92)" : "rgba(6,14,22,0.92)";
  ctx.fillRect(0, 0, w, h);
  const accent = state.dead ? css.amber : css.sky;
  const cells: [number, string, string, string][] = [
    [0, "xmin", String(state.xmin), css.ink],
    [176, "xmax", String(state.xmax), state.xmax ? css.amber : css.faint],
    [352, "object_id", state.oid, css.string],
  ];
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const rule = (x: number) => {
    ctx.fillStyle = state.dead ? "rgba(251,191,36,0.3)" : "rgba(125,211,252,0.28)";
    ctx.fillRect(x, 16, 2, h - 32);
  };
  const heading = (x: number, label: string) => {
    ctx.font = `500 25px ${MONO}`;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.8;
    ctx.fillText(label, x + 24, 44);
    ctx.globalAlpha = 1;
  };
  for (const [x, label, value, color] of cells) {
    if (x > 0) rule(x);
    heading(x, label);
    ctx.font = `600 37px ${MONO}`;
    ctx.fillStyle = color;
    ctx.fillText(value, x + 24, 100);
  }

  rule(572);
  heading(572, "document · bson");
  ctx.font = `600 37px ${MONO}`;
  ctx.fillStyle = state.dead ? css.dim : css.ink;
  if (typeof state.preview === "string") {
    ctx.fillText(state.preview, 596, 100);
    return;
  }
  // The row the film follows: its stock count is the one thing worth reading.
  const lead = '{ …, "stock": { "qty": ';
  ctx.fillText(lead, 596, 100);
  const x = 596 + ctx.measureText(lead).width;
  ctx.font = `700 66px ${MONO}`;
  ctx.fillStyle = state.dead ? css.amber : css.number;
  ctx.fillText(String(state.preview), x, 94);
  const digit = ctx.measureText(String(state.preview)).width;
  ctx.font = `600 37px ${MONO}`;
  ctx.fillStyle = state.dead ? css.dim : css.ink;
  ctx.fillText(" } }", x + digit, 100);
}

function paintReader(ctx: Ctx, who: string, sees: string, boxed: boolean) {
  const [w, h] = READER_PX;
  ctx.clearRect(0, 0, w, h);
  if (boxed) {
    // Inside the page the note needs a backing to stand off the hatching.
    ctx.fillStyle = "rgba(4,12,18,0.9)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(110,231,183,0.55)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
  }
  const x = boxed ? 18 : 8;
  ctx.textBaseline = "middle";
  ctx.font = `600 27px ${MONO}`;
  ctx.fillStyle = css.emerald;
  ctx.fillText(who, x, 34);
  ctx.font = `600 40px ${MONO}`;
  ctx.fillStyle = css.ink;
  ctx.fillText(sees, x, 86);
}

interface Slot {
  y: number;
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  ctx: Ctx;
  texture: CanvasTexture;
  drawn: string;
  reader: Mesh<PlaneGeometry, MeshBasicMaterial>;
  readerLine: Line<BufferGeometry, ReturnType<typeof lineMaterial>>;
}

export function createHeapStation(kit: Kit): Station {
  const group = new Group();
  group.position.set(0, Y.heap, HEAP.z);
  const fader = new Fader();

  /* Page outline, with the neighbouring pages of the table behind it. */
  group.add(new Mesh(new PlaneGeometry(W, H), fader.add(holoMaterial({ color: hex.sky, fill: 0.03, line: 0.9, glow: 0.22 }))));
  for (let i = 1; i <= 4; i++) {
    const ghost = new Mesh(
      new PlaneGeometry(W, H),
      fader.add(holoMaterial({ color: hex.skyDeep, fill: 0.004, line: 0.5, glow: 0.05, opacity: 0.5 / i })),
    );
    ghost.position.set(i * 0.2, i * 0.17, -i * 0.5);
    ghost.renderOrder = -i;
    group.add(ghost);
  }

  /* Header. */
  const headerY = H / 2 - 0.46;
  const headerTexture = kit.tex.draw(1320, 120, (ctx) => {
    ctx.fillStyle = "rgba(8,22,34,0.94)";
    ctx.fillRect(0, 0, 1320, 120);
    ctx.textBaseline = "middle";
    ctx.font = `600 34px ${MONO}`;
    ctx.fillStyle = css.sky;
    ctx.fillText("PageHeaderData", 28, 62);
    ctx.font = `500 27px ${MONO}`;
    ctx.fillStyle = css.dim;
    ctx.fillText("pd_lsn · pd_checksum · pd_lower · pd_upper · pd_special", 360, 63);
  });
  const header = new Mesh(
    new PlaneGeometry(INNER, 0.56),
    fader.add(panelMaterial({ map: headerTexture, size: [INNER, 0.56], radius: 0.05, border: hex.sky, borderWidth: 1 })),
  );
  header.position.set(0, headerY, 0.01);
  group.add(header);

  /* Line pointers: one small cell per tuple, filled from the left. */
  const pointerCount = 10;
  const pointerY = HEAP.pointerY;
  const pointers = new InstancedMesh(
    new PlaneGeometry(0.5, 0.36),
    fader.add(holoMaterial({ color: 0xffffff, fill: 0.14, line: 0.6, glow: 0.2 })),
    pointerCount,
  );
  {
    const matrix = new Matrix4();
    for (let i = 0; i < pointerCount; i++) {
      matrix.makeTranslation(pointerX(i), pointerY, 0.01);
      pointers.setMatrixAt(i, matrix);
    }
  }
  group.add(pointers);
  const pointerLive = new Color(hex.sky);
  const pointerFree = new Color(hex.skyDeep).multiplyScalar(0.22);

  /* Tuples that never change: two other products. */
  const bottom = -H / 2 + 0.2;
  const staticTuple = (row: number, state: TupleState) => {
    const texture = kit.tex.draw(TUPLE_PX[0], TUPLE_PX[1], (ctx) => paintTuple(ctx, state));
    const mesh = new Mesh(
      new PlaneGeometry(INNER, tupleH),
      fader.add(panelMaterial({ map: texture, size: [INNER, tupleH], radius: 0.05, border: hex.skyDeep, borderWidth: 0.8, tint: 0xaab8c8 }), 0.62),
    );
    mesh.position.set(0, bottom + tupleH / 2 + row * (tupleH + 0.1), 0.01);
    group.add(mesh);
  };
  staticTuple(0, { xmin: 987, xmax: 0, oid: "…6f6e", preview: '{ "name": "Traily Peak", … }', dead: false });
  staticTuple(1, { xmin: 1012, xmax: 0, oid: "…6f6f", preview: '{ "name": "Traily Hike", … }', dead: false });

  /* The product's row version, the version the update writes, and who reads which. */
  const readerWidth = 2.8;
  const readerHeight = readerWidth * (READER_PX[1] / READER_PX[0]);
  const freeBottom = HEAP.newY + tupleH / 2 + 0.12;
  // A note names who sees each version. It sits beside the page, level with
  // its row; on a narrow screen that would fall outside the frame, so there the
  // notes stack in the page's free space and a line runs down the margin.
  const note = (y: number, row: number): { at: Vector3; path: Vector3[] } => {
    if (!kit.compact) {
      return {
        at: new Vector3(W / 2 + 0.62 + readerWidth / 2, y, 0.02),
        path: [new Vector3(INNER / 2 + 0.05, y, 0.02), new Vector3(W / 2 + 0.55, y, 0.02)],
      };
    }
    const noteY = freeBottom + 0.5 + row * (readerHeight + 0.14);
    const margin = W / 2 - 0.08;
    return {
      at: new Vector3(INNER / 2 - 0.2 - readerWidth / 2, noteY, 0.03),
      path: [
        new Vector3(INNER / 2 - 0.18, noteY, 0.03),
        new Vector3(margin, noteY, 0.03),
        new Vector3(margin, y, 0.03),
        new Vector3(INNER / 2 + 0.02, y, 0.03),
      ],
    };
  };
  const makeSlot = (y: number, who: string, sees: string, row: number): Slot => {
    const [canvas, ctx] = kit.tex.canvas(TUPLE_PX[0], TUPLE_PX[1]);
    const texture = kit.tex.texture(canvas);
    const mesh = new Mesh(
      new PlaneGeometry(INNER, tupleH),
      panelMaterial({ map: texture, size: [INNER, tupleH], radius: 0.05, border: hex.sky, borderWidth: 1.4, bright: 1.1 }),
    );
    mesh.position.set(0, y, 0.02);
    group.add(mesh);

    const readerTexture = kit.tex.draw(READER_PX[0], READER_PX[1], (readerCtx) => paintReader(readerCtx, who, sees, kit.compact));
    const placed = note(y, row);
    const reader = new Mesh(
      new PlaneGeometry(readerWidth, readerHeight),
      new MeshBasicMaterial({ map: readerTexture, transparent: true, opacity: 0, depthWrite: false }),
    );
    reader.position.copy(placed.at);
    reader.renderOrder = 6;
    group.add(reader);

    const line = new Line(new BufferGeometry().setFromPoints(placed.path), lineMaterial(hex.emerald, 0));
    group.add(line);
    return { y, mesh, ctx, texture, drawn: "", reader, readerLine: line };
  };
  const older = makeSlot(HEAP.oldY, "another shopper, mid-read", `still sees qty ${STOCK_BEFORE}`, 1);
  const newer = makeSlot(HEAP.newY, "reads after the commit", `see qty ${STOCK_AFTER}`, 0);

  /* Free space between the pointers and the newest tuple. */
  const freeTop = pointerY - 0.3;
  const hatchPx: [number, number] = [1248, Math.round((1248 * (freeTop - freeBottom)) / INNER)];
  const hatch = kit.tex.draw(hatchPx[0], hatchPx[1], (ctx) => {
    const [w, h] = hatchPx;
    ctx.strokeStyle = "rgba(125,211,252,0.13)";
    ctx.lineWidth = 3;
    for (let x = -h; x < w; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + h, 0);
      ctx.stroke();
    }
    // What grows into the free space from either end.
    ctx.font = `500 30px ${MONO}`;
    ctx.fillStyle = css.dim;
    ctx.textBaseline = "middle";
    ctx.fillText("↑ line pointers, one per tuple", 26, 34);
    ctx.fillText("↓ tuples, one per row version", 26, h - 34);
    ctx.textAlign = "center";
    ctx.font = `600 36px ${MONO}`;
    ctx.fillStyle = css.sky;
    ctx.globalAlpha = 0.75;
    ctx.fillText("free space", w / 2, h / 2);
  });
  const free = new Mesh(
    new PlaneGeometry(INNER, freeTop - freeBottom),
    fader.add(panelMaterial({ map: hatch, size: [INNER, freeTop - freeBottom], radius: 0.05, border: hex.skyDeep, borderWidth: 0.6 }), 0.9),
  );
  free.position.set(0, (freeTop + freeBottom) / 2, 0.005);
  group.add(free);

  /* Captions. */
  const labels: Sprite[] = [];
  const title = kit.tex.label("8 kB heap page", 0.42, {
    color: "sky",
    align: "center",
    sub: "page 7 of documentdb_data.documents_3",
  });
  title.position.set(0, H / 2 + 0.7, 0.05);
  labels.push(title);
  group.add(title);

  /* The old version's pointer to its successor. */
  const ctidX = -W / 2 - 0.12;
  const ctidCurve = new QuadraticBezierCurve3(
    new Vector3(ctidX, HEAP.oldY, 0.02),
    new Vector3(ctidX - 0.75, (HEAP.oldY + HEAP.newY) / 2, 0.02),
    new Vector3(ctidX, HEAP.newY, 0.02),
  );
  const ctidMaterial = lineMaterial(hex.amber, 0);
  group.add(new Line(new BufferGeometry().setFromPoints(ctidCurve.getPoints(20)), ctidMaterial));
  const arrowGeometry = new BufferGeometry();
  arrowGeometry.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([
        ctidX, HEAP.newY, 0.02, ctidX - 0.2, HEAP.newY - 0.08, 0.02,
        ctidX, HEAP.newY, 0.02, ctidX - 0.06, HEAP.newY - 0.22, 0.02,
      ]),
      3,
    ),
  );
  group.add(new LineSegments(arrowGeometry, ctidMaterial));
  const ctidLabel = kit.tex.label("t_ctid", 0.3, { color: "amber", align: "right" });
  ctidLabel.position.set(ctidX - 0.5, (HEAP.oldY + HEAP.newY) / 2, 0.05);
  group.add(ctidLabel);

  /* Write-ahead log: a rail under the page that every change is appended to. */
  const walY = HEAP.walY;
  const walFrom = 4.2;
  const walLength = 8.4;
  const walCount = 14;
  const wal = new InstancedMesh(
    new BoxGeometry(0.4, 0.17, 0.32),
    fader.add(holoMaterial({ color: 0xffffff, fill: 0.2, line: 0.5, glow: 0.3 })),
    walCount,
  );
  wal.frustumCulled = false;
  group.add(wal);
  {
    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(walFrom - walLength, walY - 0.17, 0.02),
      new Vector3(walFrom, walY - 0.17, 0.02),
    ]);
    group.add(new LineSegments(geometry, fader.add(lineMaterial(hex.sky, 0.45))));
  }
  const walLabel = kit.tex.label("WAL", 0.36, {
    color: "ink",
    align: "center",
    sub: "write-ahead log · every change, before the reply",
  });
  walLabel.position.set(0, walY - 0.78, 0.05);
  labels.push(walLabel);
  group.add(walLabel);

  // The record for this update: from the new version down onto the rail.
  const recordPath = new QuadraticBezierCurve3(
    new Vector3(INNER / 2, HEAP.newY, 0.08),
    new Vector3(5.2, -3.4, 0.5),
    new Vector3(walFrom - 0.2, walY, 0.08),
  );
  const record = new Mesh(
    new BoxGeometry(0.46, 0.2, 0.34),
    holoMaterial({ color: hex.ink, fill: 0.5, line: 0.6, glow: 0.5, opacity: 0 }),
  );
  record.renderOrder = 26;
  const recordGlow = new Sprite(glowSpriteMaterial(kit.tex.glow(), hex.sky, 0));
  recordGlow.scale.setScalar(1.3);
  recordGlow.renderOrder = 25;
  const commit = kit.tex.label(`COMMIT ${XID.update}`, 0.3, { color: "sky", sub: "flushed to the log", pill: true, align: "center" });
  commit.renderOrder = 27;
  group.add(record, recordGlow, commit);

  /* Vacuum sweep. */
  const sweepMaterial = new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const sweep = new Mesh(new PlaneGeometry(W + 0.3, 0.05), sweepMaterial);
  const sweepGlow = new Sprite(glowSpriteMaterial(kit.tex.glow(), hex.ink, 0));
  sweepGlow.scale.set(W * 1.3, 0.9, 1);
  const vacuumLabel = kit.tex.label("VACUUM", 0.32, { color: "ink", align: "right" });
  group.add(sweep, sweepGlow, vacuumLabel);
  const sweepFrom = freeBottom + 1.1;
  const sweepTo = bottom - 0.2;

  const arrival = new Sprite(glowSpriteMaterial(kit.tex.glow(), hex.sky, 0));
  arrival.scale.set(W * 1.1, 1.9, 1);
  group.add(arrival);

  const matrix = new Matrix4();
  const tint = new Color();
  const walColor = new Color(hex.ink);
  const point = new Vector3();

  return {
    group,
    update(frame: Frame) {
      const { t, time } = frame;
      const w = Math.max(envelope(t, 15.3, 16.5, 22.7, 23.7), frame.finale);
      group.visible = w > 0.002;
      if (!group.visible) return;
      fader.set(w);
      const detail = w * (1 - frame.finale);
      for (const label of labels) label.material.opacity = detail;

      /* The two row versions. */
      const stamped = t >= CUE.stamp;
      const states: [Slot, TupleState][] = [
        [older, { xmin: XID.before, xmax: stamped ? XID.update : 0, oid: "…6f70", preview: STOCK_BEFORE, dead: stamped }],
        [newer, { xmin: XID.update, xmax: 0, oid: "…6f70", preview: STOCK_AFTER, dead: false }],
      ];
      for (const [slot, state] of states) {
        const key = `${state.xmax}|${state.dead}`;
        if (slot.drawn !== key) {
          paintTuple(slot.ctx, state);
          slot.texture.needsUpdate = true;
          slot.drawn = key;
          slot.mesh.material.uniforms.uBorder.value.set(state.dead ? hex.amber : hex.sky);
        }
      }

      // Vacuum passes down the page; the old version goes as the sweep reaches it.
      const sweeping = smoothstep(CUE.vacuum, CUE.vacuumEnd, t);
      const sweepY = lerp(sweepFrom, sweepTo, sweeping);
      const reached = (sweepFrom - HEAP.oldY) / (sweepFrom - sweepTo);
      const removed = smoothstep(reached - 0.07, reached + 0.07, sweeping);
      const written = smoothstep(CUE.write, CUE.write + 0.55, t);
      older.mesh.material.uniforms.uOpacity.value = w * (1 - removed);
      newer.mesh.material.uniforms.uOpacity.value = w * written;
      newer.mesh.position.x = (1 - written) * 0.7;
      newer.mesh.visible = written > 0.002;

      // Who sees which version.
      const midRead = detail * envelope(t, CUE.tuple + 0.2, CUE.tuple + 0.6, CUE.nextRead, CUE.nextRead + 0.45);
      const nextRead = detail * smoothstep(CUE.nextRead + 0.1, CUE.nextRead + 0.55, t);
      older.reader.material.opacity = midRead;
      older.readerLine.material.opacity = midRead * 0.8;
      newer.reader.material.opacity = nextRead;
      newer.readerLine.material.opacity = nextRead * 0.8;

      // t_ctid: the superseded version points at its successor.
      const linked = smoothstep(CUE.stamp, CUE.stamp + 0.4, t) * (1 - removed);
      ctidMaterial.opacity = detail * linked * 0.95;
      ctidLabel.material.opacity = detail * linked;

      const sweepOn = t > CUE.vacuum && t < CUE.vacuumEnd ? Math.sin(Math.PI * sweeping) ** 0.6 : 0;
      sweep.position.set(0, sweepY, 0.04);
      sweepGlow.position.set(0, sweepY, 0.03);
      vacuumLabel.position.set(-W / 2 - 0.3, sweepY, 0.05);
      sweepMaterial.opacity = w * sweepOn * 0.9;
      sweepGlow.material.opacity = w * sweepOn * 0.4;
      vacuumLabel.material.opacity = detail * sweepOn;

      // The light lands on the old version; the new one flares as it is written.
      const landing = pulse(t, CUE.tuple, 2.2);
      const writing = pulse(t, CUE.write + 0.1, 2.4);
      arrival.position.set(0, writing > landing ? HEAP.newY : HEAP.oldY, 0.03);
      arrival.material.opacity = w * Math.max(landing, writing) * 0.5;

      for (let i = 0; i < pointerCount; i++) {
        let level = i < 2 ? 1 : 0;
        if (i === HEAP.oldPointer) level = (1 - removed) * (1 + 1.4 * pulse(t, CUE.linePointer, 2.5));
        if (i === HEAP.newPointer) level = written;
        pointers.setColorAt(i, tint.copy(pointerFree).lerp(pointerLive, Math.min(level, 1)).multiplyScalar(Math.max(level, 1)));
      }
      if (pointers.instanceColor) pointers.instanceColor.needsUpdate = true;

      /* Write-ahead log. Records enter at the right and are carried left. */
      const appended = smoothstep(CUE.wal, CUE.walFlush, t);
      for (let i = 0; i < walCount; i++) {
        const offset = fract(i / walCount + time * 0.04);
        const age = offset * walLength;
        matrix.makeTranslation(walFrom - age, walY, 0.02);
        wal.setMatrixAt(i, matrix);
        const edge = smoothstep(0, 0.5, age) * (1 - smoothstep(walLength - 1.2, walLength, age));
        wal.setColorAt(i, tint.copy(walColor).multiplyScalar((0.3 + 1.1 * Math.exp(-age * 0.55)) * edge));
      }
      wal.instanceMatrix.needsUpdate = true;
      if (wal.instanceColor) wal.instanceColor.needsUpdate = true;

      // This update's record: off the new tuple, onto the rail, then along it.
      const riding = Math.max(0, t - CUE.walFlush) * 0.34;
      recordPath.getPoint(appended, point);
      point.x -= riding;
      record.position.copy(point);
      recordGlow.position.copy(point);
      const recorded = smoothstep(CUE.wal, CUE.wal + 0.15, t) * (1 - smoothstep(CUE.vacuumEnd, CUE.vacuumEnd + 0.8, t));
      record.material.uniforms.uOpacity.value = w * recorded;
      record.visible = recorded > 0.002;
      recordGlow.material.opacity = w * recorded * (0.35 + 0.5 * pulse(t, CUE.walFlush, 2.5));
      commit.position.set(point.x - 0.2, walY + 0.5, 0.06);
      commit.material.opacity = detail * envelope(t, CUE.walFlush - 0.05, CUE.walFlush + 0.2, CUE.vacuum + 0.2, CUE.vacuum + 0.8);
    },
  };
}
