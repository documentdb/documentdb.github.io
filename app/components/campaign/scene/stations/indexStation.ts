// Two indexes over the same heap rows.
//
// Left, in sky: collection_pk_3, the B-tree primary key on
// (shard_key_value, object_id) that serves _id lookups. One key, one row. The
// update finds its row here on the way down.
//
// Right, in emerald: documents_rum_index_11 on "tags". RUM is an inverted
// index: every indexed path/value pair is a term with a posting list of the
// rows that contain it, so one array element can lead to many rows. It answers
// a tag query on the way back up.

import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  LineSegments,
  Matrix4,
  Quaternion,
  Sprite,
  Vector3,
} from "three";
import { CUE } from "../film";
import { Fader, glowSpriteMaterial, holoMaterial, lineMaterial } from "../materials";
import { hex } from "../palette";
import { clamp, envelope, lerp, pulse } from "../util";
import { TREE, Y, rowX, type Frame, type Kit, type Station } from "../world";

const LEVEL_Y = TREE.levelY;
const HEAP_Y = TREE.rowY;

interface Node {
  position: Vector3;
  size: [number, number];
  color: Color;
  /** 0 for the B-tree, 1 for RUM. */
  side: number;
}

/** Position `distance` along a polyline. */
function along(points: Vector3[], distance: number, out: Vector3) {
  let remaining = distance;
  for (let i = 0; i < points.length - 1; i++) {
    const length = points[i].distanceTo(points[i + 1]);
    if (remaining <= length) return out.lerpVectors(points[i], points[i + 1], length > 0 ? remaining / length : 0);
    remaining -= length;
  }
  return out.copy(points[points.length - 1]);
}

function polylineLength(points: Vector3[]) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) total += points[i].distanceTo(points[i + 1]);
  return total;
}

function segments(points: number[], material: ReturnType<typeof lineMaterial>) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(points), 3));
  return new LineSegments(geometry, material);
}

export function createIndexStation(kit: Kit): Station {
  const group = new Group();
  group.position.set(0, Y.index, 0);
  const fader = new Fader();
  const sky = new Color(hex.sky);
  const emerald = new Color(hex.emerald);

  const nodes: Node[] = [];
  const edges: [number[], number[]] = [[], []];
  const addNode = (x: number, y: number, width: number, side: number) => {
    nodes.push({ position: new Vector3(x, y, 0), size: [width, 0.42], color: side === 0 ? sky : emerald, side });
    return nodes.length - 1;
  };
  const link = (parent: number, child: number) => {
    const a = nodes[parent];
    const b = nodes[child];
    edges[a.side].push(a.position.x, a.position.y - 0.21, 0, b.position.x, b.position.y + 0.21, 0);
  };

  /* B-tree: root, two internal pages, six leaves. */
  const bx = TREE.btreeX;
  const bRoot = addNode(bx, LEVEL_Y[0], 1.5, 0);
  const bInner = TREE.btreeInner.map((dx) => addNode(bx + dx, LEVEL_Y[1], 1.25, 0));
  const bLeaves = TREE.btreeLeaves.map((dx) => addNode(bx + dx, LEVEL_Y[2], 0.8, 0));
  bInner.forEach((inner) => link(bRoot, inner));
  bLeaves.forEach((leaf, i) => link(bInner[i < 3 ? 0 : 1], leaf));
  // Leaf pages are chained left to right.
  for (let i = 0; i < bLeaves.length - 1; i++) {
    const a = nodes[bLeaves[i]].position;
    const b = nodes[bLeaves[i + 1]].position;
    edges[0].push(a.x + 0.4, a.y, 0, b.x - 0.4, b.y, 0);
  }

  /* RUM: an entry tree whose leaves are terms. */
  const rx = TREE.rumX;
  const rRoot = addNode(rx, LEVEL_Y[0], 1.5, 1);
  const rInner = [-1.0, 1.0].map((dx) => addNode(rx + dx, LEVEL_Y[1], 1.25, 1));
  const terms = ['"new"', '"shoes"', '"trail"', '"wide"'];
  const termX = [-1.65, -0.55, 0.55, 1.65].map((dx) => rx + dx);
  termX.forEach((x, i) => {
    const parent = nodes[rInner[i < 2 ? 0 : 1]].position;
    edges[1].push(parent.x, parent.y - 0.21, 0, x, LEVEL_Y[2] + 0.2, 0);
  });
  rInner.forEach((inner) => link(rRoot, inner));

  const boxes = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    fader.add(holoMaterial({ color: 0xffffff, fill: 0.07, line: 0.7, glow: 0.24 })),
    nodes.length,
  );
  {
    const matrix = new Matrix4();
    const identity = new Quaternion();
    nodes.forEach((node, i) => {
      matrix.compose(node.position, identity, new Vector3(node.size[0], node.size[1], 0.3));
      boxes.setMatrixAt(i, matrix);
      boxes.setColorAt(i, node.color);
    });
  }
  boxes.frustumCulled = false;
  group.add(boxes);

  const termLabels = terms.map((term, i) => {
    const label = kit.tex.label(term, 0.34, { color: "emerald", pill: true, align: "center" });
    label.position.set(termX[i], LEVEL_Y[2], 0.05);
    group.add(label);
    return label;
  });

  /* Heap rows both indexes point into. */
  const rowCount = TREE.rows;
  const rows = new InstancedMesh(
    new BoxGeometry(0.72, 0.26, 0.2),
    fader.add(holoMaterial({ color: 0xffffff, fill: 0.14, line: 0.6, glow: 0.26 })),
    rowCount,
  );
  const rowBase = new Color(hex.ink).multiplyScalar(0.5);
  {
    const matrix = new Matrix4();
    for (let i = 0; i < rowCount; i++) {
      matrix.makeTranslation(rowX(i), HEAP_Y, 0);
      rows.setMatrixAt(i, matrix);
      rows.setColorAt(i, rowBase);
    }
  }
  rows.frustumCulled = false;
  group.add(rows);

  /* Posting lists: the rows each term appears in. */
  const postings: number[][] = [
    [7, 9, 11],
    [6, 8, 9, 10, 11],
    [7, 8, 10, 11],
    [6, 10],
  ];
  const postingCells: { term: number; order: number; row: number; position: Vector3 }[] = [];
  postings.forEach((list, term) => {
    list.forEach((row, order) => {
      postingCells.push({ term, order, row, position: new Vector3(termX[term], LEVEL_Y[2] - 0.5 - order * 0.26, 0) });
    });
  });
  const cells = new InstancedMesh(
    new BoxGeometry(0.34, 0.18, 0.12),
    fader.add(holoMaterial({ color: 0xffffff, fill: 0.2, line: 0.5, glow: 0.25 })),
    postingCells.length,
  );
  const cellBase = new Color(hex.emeraldDeep).multiplyScalar(0.7);
  {
    const matrix = new Matrix4();
    postingCells.forEach((cell, i) => {
      matrix.makeTranslation(cell.position.x, cell.position.y, 0);
      cells.setMatrixAt(i, matrix);
      cells.setColorAt(i, cellBase);
    });
  }
  cells.frustumCulled = false;
  group.add(cells);

  /* Static lines: tree edges, and leaf → row pointers for the B-tree. */
  const leafRows = [0, 1, 2, 3, 4, 5];
  bLeaves.forEach((leaf, i) => {
    const from = nodes[leaf].position;
    edges[0].push(from.x, from.y - 0.21, 0, rowX(leafRows[i]), HEAP_Y + 0.13, 0);
  });
  const edgeMaterials = [lineMaterial(0x4f9fc4, 0.5), lineMaterial(0x4fc4a0, 0.5)];
  group.add(segments(edges[0], edgeMaterials[0]), segments(edges[1], edgeMaterials[1]));

  /* The posting → row lines only show while a lookup is fanning out. */
  const fanTerm = 2;
  const fanCells = postingCells.filter((cell) => cell.term === fanTerm);
  const fan: number[] = [];
  fanCells.forEach((cell) => {
    fan.push(cell.position.x + 0.17, cell.position.y, 0, rowX(cell.row), HEAP_Y + 0.13, 0);
  });
  const fanMaterial = lineMaterial(hex.emerald, 0);
  group.add(segments(fan, fanMaterial));

  /* The row the primary key leads to continues down into its heap page. */
  const pkRow = leafRows[TREE.pkLeaf];
  const dropMaterial = lineMaterial(hex.sky, 0);
  group.add(segments([rowX(pkRow), HEAP_Y - 0.13, 0, rowX(pkRow), HEAP_Y - 2.6, 0.25], dropMaterial));
  const tid = kit.tex.label("ctid (7,3)", 0.3, { color: "sky", sub: "heap page 7, line pointer 3", align: "left" });
  tid.position.set(rowX(pkRow) + 0.3, HEAP_Y - 0.95, 0.05);
  group.add(tid);

  /* Captions. */
  const caption = (
    text: string,
    sub: string,
    x: number,
    y: number,
    color: "sky" | "emerald" | "ink" | "dim",
    align: "left" | "center" | "right" = "center",
    size = 0.32,
  ) => {
    const sprite = kit.tex.label(text, size, { color, sub, align });
    sprite.position.set(x, y, 0.05);
    group.add(sprite);
    return sprite;
  };
  const sideLabels: [Sprite, number][] = [
    [caption("collection_pk_3", "B-tree · _id · one key, one row", bx, LEVEL_Y[0] + 1.15, "sky", "center", 0.38), 0],
    [caption("documents_rum_index_11", "RUM · tags · one term per element", rx, LEVEL_Y[0] + 1.15, "emerald", "center", 0.38), 1],
    [caption("heap rows of documents_3", "", rowX(rowCount - 1) + 0.36, HEAP_Y - 0.62, "dim", "right", 0.3), 1],
  ];
  const pkQuery = kit.tex.label('_id: ObjectId("…6f70")', 0.32, { color: "ink", pill: true, align: "center" });
  pkQuery.position.set(bx, LEVEL_Y[0] + 0.02, 0.6);
  const tagQuery = kit.tex.label('find({ tags: "trail" })', 0.32, { color: "ink", pill: true, align: "center" });
  tagQuery.position.set(rx, LEVEL_Y[0] + 0.02, 0.6);
  group.add(pkQuery, tagQuery);

  /* The tag lookup, as a path with the time each node is reached. */
  const speed = 4.4;
  const tagPath = [
    nodes[rRoot].position,
    nodes[rInner[1]].position,
    new Vector3(termX[fanTerm], LEVEL_Y[2], 0),
    fanCells[fanCells.length - 1].position,
  ];
  const reach = (index: number) => CUE.tagQuery + polylineLength(tagPath.slice(0, index + 1)) / speed;
  const tagEnd = reach(3);

  const spark = new Sprite(glowSpriteMaterial(kit.tex.glow(), hex.emerald, 0));
  spark.scale.setScalar(0.95);
  spark.renderOrder = 25;
  group.add(spark);

  const nodeHeat = new Float32Array(nodes.length);
  const rowHeat = new Float32Array(rowCount);
  const tint = new Color();
  const scratch = new Vector3();

  return {
    group,
    update(frame: Frame) {
      const { t } = frame;
      const w = Math.max(envelope(t, 12.7, 13.6, 25.8, 26.7), frame.finale);
      group.visible = w > 0.002;
      if (!group.visible) return;
      fader.set(w);
      const detail = w * (1 - frame.finale);

      // Whichever index is not being used steps back.
      const usingRum = envelope(t, 21.8, 23.0, 26, 27);
      const usingPk = 1 - envelope(t, 21.2, 22.4, 27, 28);
      const emphasis = [
        Math.max(lerp(0.4, 1, usingPk), frame.finale),
        Math.max(lerp(0.4, 1, usingRum), frame.finale),
      ];
      edgeMaterials.forEach((material, side) => {
        material.opacity = 0.5 * w * emphasis[side];
      });
      for (const [label, side] of sideLabels) label.material.opacity = detail * emphasis[side];

      nodeHeat.fill(0);
      rowHeat.fill(0);

      // Primary-key lookup: the update's light arrives at each page in turn.
      nodeHeat[bRoot] = pulse(t, CUE.root, 1.6);
      nodeHeat[bInner[TREE.pkInner]] = pulse(t, CUE.inner, 1.6);
      nodeHeat[bLeaves[TREE.pkLeaf]] = pulse(t, CUE.leaf, 1.6);
      const found = pulse(t, CUE.row, 0.9) * (t < CUE.tagQuery - 1 ? 1 : 0);
      rowHeat[pkRow] = found;

      // Tag lookup: one term, a posting list, several rows.
      nodeHeat[rRoot] = pulse(t, CUE.tagQuery, 1.4);
      nodeHeat[rInner[1]] = pulse(t, reach(1), 1.4);
      const termAt = reach(2);
      let fanned = 0;
      postingCells.forEach((cell, i) => {
        let level = 0;
        if (cell.term === fanTerm) {
          const at = termAt + 0.1 + cell.order * 0.14;
          level = pulse(t, at, 0.7);
          rowHeat[cell.row] = Math.max(rowHeat[cell.row], pulse(t, at + 0.16, 0.7));
          fanned = Math.max(fanned, level);
        }
        cells.setColorAt(i, tint.copy(cellBase).lerp(emerald, level).multiplyScalar((1 + level * 1.6) * emphasis[1]));
      });
      if (cells.instanceColor) cells.instanceColor.needsUpdate = true;
      fanMaterial.opacity = w * fanned * 0.9;
      termLabels.forEach((label, i) => {
        label.material.opacity = detail * emphasis[1] * (i === fanTerm ? 1 : 0.62);
      });

      nodes.forEach((node, i) => {
        boxes.setColorAt(i, tint.copy(node.color).multiplyScalar((0.8 + nodeHeat[i] * 2.6) * emphasis[node.side]));
      });
      if (boxes.instanceColor) boxes.instanceColor.needsUpdate = true;
      const rowsShown = Math.max(emphasis[0], emphasis[1]);
      for (let i = 0; i < rowCount; i++) {
        const level = rowHeat[i];
        const glow = i === pkRow && t < CUE.tagQuery - 1 ? sky : emerald;
        rows.setColorAt(i, tint.copy(rowBase).lerp(glow, clamp(level, 0, 1)).multiplyScalar((1 + level * 2) * rowsShown));
      }
      if (rows.instanceColor) rows.instanceColor.needsUpdate = true;

      // The pulse that walks the RUM entry tree.
      const inTag = t >= CUE.tagQuery && t <= tagEnd;
      if (inTag) along(tagPath, (t - CUE.tagQuery) * speed, scratch);
      spark.position.copy(scratch).setZ(0.25);
      spark.material.opacity = inTag ? w : 0;

      pkQuery.material.opacity = detail * envelope(t, 12.9, 13.4, 15.7, 16.3);
      tagQuery.material.opacity = detail * envelope(t, CUE.tagQuery - 0.5, CUE.tagQuery - 0.1, 25.3, 25.9);

      // Row pointer → heap page.
      const dropping = envelope(t, CUE.row - 0.1, CUE.row + 0.25, 17.4, 18.2);
      dropMaterial.opacity = w * dropping * 0.8;
      tid.material.opacity = detail * dropping;
    },
  };
}
