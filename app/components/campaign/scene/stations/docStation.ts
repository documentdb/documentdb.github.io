// "Inside the app": the product card on the phone is one document. It slides
// out of the card as JSON, its array, location and embedding light up, the one
// field this tap changes is marked, and then the whole document packs down to
// the BSON bytes that actually leave the phone. Those bytes become the light
// the camera follows for the rest of the film.

import {
  BufferAttribute,
  BufferGeometry,
  Group,
  LineSegments,
  Mesh,
  PlaneGeometry,
  Sprite,
  Vector3,
  type ShaderMaterial,
} from "three";
import { CUE } from "../film";
import { glowSpriteMaterial, holoMaterial, lineMaterial, panelMaterial } from "../materials";
import { CARD_UV, PRODUCT, STOCK_BEFORE } from "../mockups";
import { hex } from "../palette";
import type { Tok } from "../textures";
import { lerp, pulse, smoothstep } from "../util";
import { DOC, PHONE, type Frame, type Kit, type Station } from "../world";

const p = (text: string): Tok => [text, "punct"];
const k = (text: string): Tok => [text, "key"];
const s = (text: string): Tok => [text, "string"];
const n = (text: string): Tok => [text, "number"];

const STOCK_PREFIX = [p("  "), k('"stock"'), p(": { "), k('"store"'), p(": "), s('"SEA-1"'), p(", "), k('"qty"'), p(": ")];

// The example document. With a 128-float embedding its BSON encoding is 1,776
// bytes; the hex further down is the real start of that encoding.
const DOCUMENT: Tok[][] = [
  [p("{")],
  [p("  "), k('"_id"'), p(": "), ["ObjectId", "fn"], p("("), s('"6741c0de…6f70"'), p("),")],
  [p("  "), k('"name"'), p(": "), s(`"${PRODUCT.name}"`), p(",")],
  [p("  "), k('"price"'), p(": "), n("129"), p(",")],
  [p("  "), k('"tags"'), p(": ["), s('"trail"'), p(", "), s('"shoes"'), p(", "), s('"new"'), p("],")],
  [...STOCK_PREFIX, n(String(STOCK_BEFORE)), p(" },")],
  [p("  "), k('"geo"'), p(": { "), k('"type"'), p(": "), s('"Point"'), p(", "), k('"coordinates"'), p(":")],
  [p("           ["), n("-122.33"), p(", "), n("47.61"), p("] },")],
  [p("  "), k('"embedding"'), p(": ["), n("0.12"), p(", "), n("-0.48"), p(", "), n("0.91"), p(", … ]")],
  [p("}")],
];
const ROW = { tags: 4, stock: 5, geo: 6, embedding: 8 };
/** Column of the stock count on its line. */
const QTY_COLUMN = STOCK_PREFIX.reduce((sum, [text]) => sum + text.length, 0);

// f0 06 00 00 is the length, 1776; then _id, then the name, byte for byte.
const BSON: Tok[][] = [
  [n("f0 06 00 00"), ["  07", "fn"], k(" 5f 69 64 00"), s(" 67 41 c0 de 9f 1b 2a 3c 4d 5e 6f 70")],
  [["02", "fn"], k(" 6e 61 6d 65 00"), n(" 0b 00 00 00"), s(" 54 72 61 69 6c 79 20 52 75 6e 00"), p(" …")],
];

export function createDocStation(kit: Kit): Station {
  const group = new Group();
  group.position.set(PHONE.x, PHONE.y, PHONE.z);

  /* The document, as the application's driver sees it. */
  const json = kit.tex.code(DOCUMENT, { title: "shop.products · one document", titleColor: "emerald", fontPx: 30 });
  const jsonW = 2.4;
  const jsonH = jsonW / json.aspect;
  const jsonMesh: Mesh<PlaneGeometry, ShaderMaterial> = new Mesh(
    new PlaneGeometry(jsonW, jsonH),
    panelMaterial({ map: json.texture, size: [jsonW, jsonH], radius: 0.07, border: hex.emerald, borderWidth: 1.2, bright: 1.08 }),
  );
  jsonMesh.renderOrder = 10;
  group.add(jsonMesh);

  // It starts where the card is drawn on the phone's screen.
  const cardHome = new Vector3((CARD_UV.u + CARD_UV.w / 2 - 0.5) * PHONE.w, (0.5 - CARD_UV.v - CARD_UV.h / 2) * PHONE.h, 0.06);
  const cardEdgeX = cardHome.x + (CARD_UV.w * PHONE.w) / 2;

  /* Outlines over the parts a relational row would have needed more tables for. */
  const lineY = (row: number) => (0.5 - json.lineV(row)) * jsonH;
  const lineH = json.lineHeightV * jsonH;
  const marker = (rows: [number, number], color: number, at: number) => {
    const endU = Math.max(json.lineEndU(rows[0]), json.lineEndU(rows[1]));
    const width = (endU - json.startU) * jsonW + 0.09;
    const height = lineH * (rows[1] - rows[0] + 1) - 0.012;
    const mesh = new Mesh(
      new PlaneGeometry(width, height),
      holoMaterial({ color, fill: 0.09, line: 0.6, glow: 0.3, opacity: 0 }),
    );
    mesh.position.set((json.startU - 0.5) * jsonW + width / 2 - 0.045, (lineY(rows[0]) + lineY(rows[1])) / 2, 0.012);
    mesh.renderOrder = 11;
    jsonMesh.add(mesh);
    return { mesh, at };
  };
  const markers = [
    marker([ROW.tags, ROW.tags], hex.emerald, CUE.fieldTags),
    marker([ROW.geo, ROW.geo + 1], hex.emerald, CUE.fieldGeo),
    marker([ROW.embedding, ROW.embedding], hex.violet, CUE.fieldEmbedding),
  ];

  /* The field this tap changes, and the change itself. */
  const qtyX = (json.startU + (QTY_COLUMN + 0.5) * json.charU - 0.5) * jsonW;
  const qtyBox = new Mesh(
    new PlaneGeometry(json.charU * jsonW * 2.1, lineH * 0.92),
    holoMaterial({ color: hex.amber, fill: 0.16, line: 0.8, glow: 0.4, opacity: 0 }),
  );
  qtyBox.position.set(qtyX, lineY(ROW.stock), 0.014);
  qtyBox.renderOrder = 12;
  jsonMesh.add(qtyBox);

  const change = kit.tex.label('$inc "stock.qty": -1', 0.17, {
    color: "amber",
    sub: "the one change this tap makes",
    pill: true,
    align: "center",
  });
  const changeY = jsonH / 2 + 0.3;
  change.position.set(Math.min(qtyX, jsonW / 2 - change.scale.x / 2), changeY, 0.02);
  change.renderOrder = 22;
  jsonMesh.add(change);
  const leaderMaterial = lineMaterial(hex.amber, 0);
  const leader = new LineSegments(
    new BufferGeometry().setFromPoints([
      new Vector3(qtyX, changeY - change.scale.y / 2, 0.016),
      new Vector3(qtyX, lineY(ROW.stock) + lineH * 0.5, 0.016),
    ]),
    leaderMaterial,
  );
  jsonMesh.add(leader);

  /* The bytes that actually leave the application. */
  const bson = kit.tex.code(BSON, { title: "as BSON · 1,776 bytes", titleColor: "sky", fontPx: 26 });
  const bsonW = 2.4;
  const bsonH = bsonW / bson.aspect;
  const bsonMesh: Mesh<PlaneGeometry, ShaderMaterial> = new Mesh(
    new PlaneGeometry(bsonW, bsonH),
    panelMaterial({ map: bson.texture, size: [bsonW, bsonH], radius: 0.06, border: hex.sky, borderWidth: 1.2, bright: 1.08 }),
  );
  bsonMesh.renderOrder = 13;
  group.add(bsonMesh);

  // A spark where the ribbon closes, handing over to the travelling light.
  const spark = new Sprite(glowSpriteMaterial(kit.tex.glow(), hex.emerald, 0));
  spark.position.copy(DOC.bson);
  spark.renderOrder = 30;
  group.add(spark);

  /* Card → document connector. */
  const linkPositions = new Float32Array(6);
  const linkGeometry = new BufferGeometry();
  linkGeometry.setAttribute("position", new BufferAttribute(linkPositions, 3));
  const linkMaterial = lineMaterial(hex.emerald, 0);
  const link = new LineSegments(linkGeometry, linkMaterial);
  link.frustumCulled = false;
  group.add(link);

  const position = new Vector3();

  return {
    group,
    update(frame: Frame) {
      const { t } = frame;
      group.visible = t > CUE.docOut - 0.05 && t < CUE.depart + 0.2;
      if (!group.visible) return;

      const out = smoothstep(CUE.docOut, CUE.docOpen, t);
      const packing = smoothstep(CUE.pack, CUE.pack + 0.42, t);
      const closing = smoothstep(CUE.depart - 0.3, CUE.depart, t);

      // The document slides out of the card and grows to reading size, then
      // folds flat onto the ribbon below it.
      position.lerpVectors(cardHome, DOC.json, out);
      position.y = lerp(position.y, DOC.bson.y + bsonH / 2, packing);
      jsonMesh.position.copy(position);
      const scale = lerp(0.28, 1, out);
      jsonMesh.scale.set(scale, scale * lerp(1, 0.03, packing), 1);
      const shown = out * (1 - packing ** 1.4);
      jsonMesh.material.uniforms.uOpacity.value = shown;
      jsonMesh.visible = shown > 0.002;

      for (const { mesh, at } of markers) {
        mesh.material.uniforms.uOpacity.value = shown * smoothstep(at, at + 0.18, t) * (0.7 + 0.6 * pulse(t, at, 3.5));
      }
      const marked = smoothstep(CUE.fieldStock, CUE.fieldStock + 0.2, t);
      qtyBox.material.uniforms.uOpacity.value = shown * marked * (0.8 + 0.5 * pulse(t, CUE.fieldStock, 3));
      change.material.opacity = shown * marked * (1 - packing);
      leaderMaterial.opacity = shown * marked * 0.9;

      // The ribbon drops out from under the document, brightens as the
      // document folds into it, and closes to a point.
      const ribbon = smoothstep(CUE.bson, CUE.bson + 0.45, t);
      bsonMesh.position.set(DOC.bson.x, lerp(DOC.json.y - jsonH / 2 + bsonH / 2, DOC.bson.y, ribbon), DOC.bson.z);
      bsonMesh.scale.set(lerp(1, 0.02, closing), lerp(1, 0.4, closing), 1);
      bsonMesh.material.uniforms.uOpacity.value = ribbon * (1 - smoothstep(CUE.depart - 0.06, CUE.depart + 0.04, t));
      bsonMesh.material.uniforms.uBright.value = 1.08 + packing * 0.7 + closing * 1.2;
      bsonMesh.visible = ribbon > 0.002;

      const handover = closing * (1 - smoothstep(CUE.depart, CUE.depart + 0.18, t));
      spark.material.opacity = handover;
      spark.scale.setScalar(0.3 + closing * 0.25);

      // Card → document: drawn once the document has cleared the phone.
      const left = jsonMesh.position.x - (jsonW / 2) * scale;
      linkPositions.set([cardEdgeX, cardHome.y, 0.03, left, jsonMesh.position.y, jsonMesh.position.z]);
      linkGeometry.attributes.position.needsUpdate = true;
      linkMaterial.opacity = 0.75 * smoothstep(0.75, 1, out) * (1 - packing);
    },
  };
}
