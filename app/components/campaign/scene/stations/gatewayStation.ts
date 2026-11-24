// The gateway: the port in the top of the server. The update arrives from
// above as a document command, crosses the ring, and leaves below as the exact
// statement the gateway issues for it (pg_documentdb_gw, query_catalog.rs).
// Other commands keep passing through more faintly around it.

import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Sprite,
  TorusGeometry,
  Vector3,
} from "three";
import { CUE } from "../film";
import { Fader, glowSpriteMaterial, holoMaterial, lineMaterial, rippleMaterial } from "../materials";
import { hex } from "../palette";
import { envelope, fract, lerp, pulse, smoothstep } from "../util";
import { Y, type Frame, type Kit, type Station } from "../world";

const RADIUS = 2.7;

// Background traffic: what other drivers send, and what it becomes.
const TRAFFIC: [string, string][] = [
  ["find", "documentdb_api.find_cursor_first_page(…)"],
  ["insert", "documentdb_api.insert_txn_proc(…)"],
  ["aggregate", "documentdb_api.aggregate_cursor_first_page(…)"],
];

export function createGatewayStation(kit: Kit): Station {
  const group = new Group();
  group.position.set(0, Y.gateway, 0);
  const fader = new Fader();

  /* The port: two rings with a rippling membrane between them. */
  const torus = new TorusGeometry(RADIUS, 0.03, 10, 144);
  torus.rotateX(Math.PI / 2);
  const ringMaterial = (color: number) =>
    fader.add(
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
  const upper = new Mesh(torus, ringMaterial(hex.emerald));
  upper.position.y = 0.18;
  const lower = new Mesh(torus, ringMaterial(hex.sky));
  lower.position.y = -0.18;
  const membrane = new Mesh(new PlaneGeometry(RADIUS * 2, RADIUS * 2), fader.add(rippleMaterial(hex.emerald, hex.sky)));
  membrane.rotation.x = -Math.PI / 2;
  group.add(upper, lower, membrane);

  /* A collar of segments turning slowly around the port. */
  const segmentCount = 44;
  const collar = new InstancedMesh(
    new BoxGeometry(0.36, 0.1, 0.15),
    fader.add(holoMaterial({ color: 0xffffff, fill: 0.08, line: 0.5, glow: 0.22 })),
    segmentCount,
  );
  {
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const up = new Vector3(0, 1, 0);
    const one = new Vector3(1, 1, 1);
    const position = new Vector3();
    const bright = new Color(hex.sky).multiplyScalar(1.5);
    const dim = new Color(hex.skyDeep).multiplyScalar(0.55);
    for (let i = 0; i < segmentCount; i++) {
      const angle = (i / segmentCount) * Math.PI * 2;
      position.set(Math.cos(angle) * 3.4, 0, Math.sin(angle) * 3.4);
      rotation.setFromAxisAngle(up, -angle + Math.PI / 2);
      matrix.compose(position, rotation, one);
      collar.setMatrixAt(i, matrix);
      collar.setColorAt(i, i % 4 === 0 ? bright : dim);
    }
  }
  group.add(collar);

  {
    const ticks: number[] = [];
    for (let i = 0; i < 96; i++) {
      const angle = (i / 96) * Math.PI * 2;
      const inner = 3.8;
      const outer = i % 8 === 0 ? 4.2 : 3.97;
      ticks.push(Math.cos(angle) * inner, 0, Math.sin(angle) * inner, Math.cos(angle) * outer, 0, Math.sin(angle) * outer);
    }
    for (let i = 0; i < 128; i++) {
      const a0 = (i / 128) * Math.PI * 2;
      const a1 = ((i + 1) / 128) * Math.PI * 2;
      ticks.push(Math.cos(a0) * 4.55, 0, Math.sin(a0) * 4.55, Math.cos(a1) * 4.55, 0, Math.sin(a1) * 4.55);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(ticks), 3));
    group.add(new LineSegments(geometry, fader.add(lineMaterial(hex.skyDeep, 0.4))));
  }

  /* Background traffic: commands above, statements below. */
  const cards = TRAFFIC.map(([command, statement]) => {
    const above = kit.tex.label(command, 0.42, { color: "emerald", pill: true, align: "center" });
    const below = kit.tex.label(statement, 0.3, { color: "sky", pill: true, align: "center" });
    const aboveScale = above.scale.clone();
    const belowScale = below.scale.clone();
    group.add(above, below);
    return { above, below, aboveScale, belowScale };
  });

  /* The update the film follows, before and after the ring. */
  const command = kit.tex.label("update", kit.compact ? 0.68 : 0.52, {
    color: "emerald",
    sub: '$inc "stock.qty": -1',
    subColor: "ink",
    pill: true,
    align: "center",
  });
  // The statement exactly as the gateway sends it; abbreviated where it would not fit.
  const statement = kit.compact
    ? kit.tex.label("CALL documentdb_api.update_txn_proc(…)", 0.56, { color: "sky", pill: true, align: "center" })
    : kit.tex.label("CALL documentdb_api.update_txn_proc($1, $2, $3, NULL)", 0.4, { color: "sky", pill: true, align: "center" });
  command.renderOrder = 34;
  statement.renderOrder = 34;
  const commandScale = command.scale.clone();
  const statementScale = statement.scale.clone();
  group.add(command, statement);

  const flash = new Sprite(glowSpriteMaterial(kit.tex.glow(), 0xffffff, 0));
  flash.scale.setScalar(3.4);
  group.add(flash);

  /* Fixed captions on the camera side of the ring. */
  const port = kit.tex.label("port 10260", kit.compact ? 0.56 : 0.44, { color: "emerald", pill: true, align: "center" });
  port.position.set(-2.55, 0.62, 2.35);
  const protocol = kit.tex.label("DocumentDB wire protocol", 0.42, {
    color: "emerald",
    sub: "OP_MSG · SCRAM-SHA-256 · TLS",
    align: "right",
  });
  protocol.position.set(kit.compact ? 3.5 : 4.3, 2.3, -2.8);
  const postgres = kit.tex.label("PostgreSQL", 0.42, {
    color: "sky",
    sub: "calls into documentdb_api",
    align: "right",
  });
  postgres.position.set(kit.compact ? 3.7 : 5.1, kit.compact ? -3.3 : -2.6, -1.1);
  group.add(port, protocol, postgres);

  const light = new Vector3();

  return {
    group,
    update(frame: Frame) {
      const { t, time } = frame;
      const w = Math.max(envelope(t, 8.9, 9.8, 13.2, 14.3), frame.finale);
      group.visible = w > 0.002;
      if (!group.visible) return;
      fader.set(w);
      collar.rotation.y = time * 0.1;
      // Captions and SQL are unreadable from the overview distance; drop them.
      const detail = w * (1 - frame.finale);
      port.material.opacity = detail;
      protocol.material.opacity = detail;
      postgres.material.opacity = detail;

      let heat = 0;
      cards.forEach((card, i) => {
        const u = fract(time * 0.07 + (i + 0.5) / cards.length);
        const turn = (i * Math.PI * 2) / cards.length + 0.9;
        const faint = detail * 0.42;

        const down = u / 0.5;
        const falling = down <= 1;
        const radius = 2.2 * (1 - down) ** 1.25 + 0.5;
        const angle = turn + down * 1.5;
        card.above.position.set(Math.cos(angle) * radius, lerp(5.2, 0.3, down ** 1.3), Math.sin(angle) * radius - 0.6);
        card.above.scale.copy(card.aboveScale).multiplyScalar(lerp(1, 0.3, smoothstep(0.55, 1, down)));
        card.above.material.opacity = falling ? faint * smoothstep(0, 0.14, down) * (1 - smoothstep(0.8, 1, down)) : 0;

        const out = (u - 0.5) / 0.5;
        const leaving = out >= 0;
        const spread = 0.5 + 2.4 * Math.max(out, 0) ** 0.9;
        const exit = turn + 1.5 + out * 0.5;
        card.below.position.set(Math.cos(exit) * spread, lerp(-0.35, -5.2, Math.max(out, 0) ** 0.85), Math.sin(exit) * spread - 0.6);
        card.below.scale.copy(card.belowScale).multiplyScalar(lerp(0.3, 1, smoothstep(0, 0.4, out)));
        card.below.material.opacity = leaving ? faint * smoothstep(0, 0.14, out) * (1 - smoothstep(0.75, 1, out)) : 0;

        const crossing = (u - 0.5) / 0.035;
        heat += Math.exp(-crossing * crossing) * 0.25;
      });

      // The followed update rides the light: a command above the ring, SQL below.
      kit.signal.position(t, light).sub(group.position);
      const arriving = smoothstep(CUE.roof + 0.2, CUE.aboveRing, t);
      const entering = smoothstep(CUE.dive, CUE.cross - 0.03, t);
      command.position.set(light.x, light.y + 0.05, light.z + 0.05);
      command.scale.copy(commandScale).multiplyScalar(lerp(0.4, 1, arriving) * lerp(1, 0.25, entering));
      command.material.opacity = detail * arriving * (1 - entering);

      const emerging = smoothstep(CUE.cross + 0.03, CUE.belowRing, t);
      const leaving = smoothstep(CUE.leaveRing, CUE.leaveRing + 0.75, t);
      statement.position.set(light.x, light.y - 0.05, light.z + 0.05);
      statement.scale.copy(statementScale).multiplyScalar(lerp(0.25, 1, emerging) * lerp(1, 0.55, leaving));
      statement.material.opacity = detail * emerging * (1 - leaving);

      heat += pulse(t, CUE.cross, 3.2) * (t < CUE.cross + 2 ? 1 : 0);
      // The reply crosses the other way near the end of the film.
      heat += pulse(t, CUE.replyGateway, 4) * 0.8;
      flash.material.opacity = Math.min(heat, 1) * 0.85 * w;
    },
  };
}
