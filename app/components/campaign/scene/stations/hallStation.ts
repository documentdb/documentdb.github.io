// "To the backend": a hall of server racks under the phone. The light comes
// down in front of an aisle, runs along it between the cabinets and enters the
// one at the end. Everything below this station is the inside of that one
// machine, drawn large.

import {
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
  Points,
  Quaternion,
  Sprite,
  Vector3,
} from "three";
import { CUE } from "../film";
import { Fader, glowSpriteMaterial, holoMaterial, lineMaterial, panelMaterial, pointsMaterial } from "../materials";
import { css, hex } from "../palette";
import { roundRect, type Ctx } from "../textures";
import { envelope, mulberry32, pulse } from "../util";
import { HALL, type Frame, type Kit, type Station } from "../world";

const { w: RW, h: RH, d: RD } = HALL.rack;
const FRONT_PX: [number, number] = [256, 580];
const UNITS = 14;

/** One cabinet's front: rack units with status lights, drive bays or vents. */
function paintFront(ctx: Ctx, seed: number) {
  const [w, h] = FRONT_PX;
  const rng = mulberry32(seed);
  ctx.fillStyle = "#050a12";
  ctx.fillRect(0, 0, w, h);
  const lights = [css.emerald, css.emerald, css.sky, css.sky, css.amber];
  const pitch = (h - 24) / UNITS;
  for (let unit = 0; unit < UNITS; unit++) {
    const y = 12 + unit * pitch;
    roundRect(ctx, 14, y + 2, w - 28, pitch - 5, 5);
    ctx.fillStyle = "#0b1624";
    ctx.fill();
    ctx.strokeStyle = "#2a4c69";
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let k = 0; k < 2; k++) {
      ctx.globalAlpha = 0.45 + rng() * 0.55;
      ctx.fillStyle = lights[Math.floor(rng() * lights.length)];
      ctx.beginPath();
      ctx.arc(30 + k * 15, y + pitch / 2, 4.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (rng() < 0.55) {
      ctx.fillStyle = "#17304a";
      for (let bay = 0; bay < 8; bay++) ctx.fillRect(66 + bay * 21, y + 9, 15, pitch - 19);
    } else {
      ctx.strokeStyle = "#1a3550";
      ctx.lineWidth = 2;
      for (let vent = 0; vent < 13; vent++) {
        ctx.beginPath();
        ctx.moveTo(68 + vent * 13, y + 10);
        ctx.lineTo(68 + vent * 13, y + pitch - 10);
        ctx.stroke();
      }
    }
  }
}

interface Rack {
  /** Centre of the cabinet. */
  position: Vector3;
  /** Direction its front faces, as a rotation about y. */
  facing: number;
  /** How bright it is; the far rows are only there for depth. */
  level: number;
}

export function createHallStation(kit: Kit): Station {
  const group = new Group();
  const fader = new Fader();
  const rng = mulberry32(44);
  const centreY = HALL.floor + RH / 2;

  /* Cabinets: two rows facing each other across the aisle, two more behind them. */
  const racks: Rack[] = [];
  for (let i = 0; i < HALL.perRow; i++) {
    const z = HALL.mouth - RW / 2 - 0.25 - i * (RW + 0.22);
    for (const side of [-1, 1]) {
      racks.push({ position: new Vector3(side * HALL.aisle, centreY, z), facing: (-side * Math.PI) / 2, level: 1 });
      racks.push({ position: new Vector3(side * (HALL.aisle + 4.7), centreY, z), facing: (-side * Math.PI) / 2, level: 0.5 });
    }
  }
  // The one at the end of the aisle is the machine the film goes into.
  const target: Rack = { position: new Vector3(0, centreY, 0), facing: 0, level: 1.2 };

  const boxes = new InstancedMesh(
    new BoxGeometry(RW, RH, RD),
    fader.add(holoMaterial({ color: 0xffffff, fill: 0.025, line: 0.6, glow: 0.14 })),
    racks.length + 1,
  );
  // Solid, near-black bodies inside the outlines, so a cabinet hides what is behind it.
  const bodyMaterial = fader.add(new MeshBasicMaterial({ color: 0x04080e, transparent: true }));
  const bodies = new InstancedMesh(new BoxGeometry(RW - 0.03, RH - 0.03, RD - 0.03), bodyMaterial, racks.length + 1);
  bodies.renderOrder = 1;
  const fronts = [0, 1, 2].map((seed) => kit.tex.draw(FRONT_PX[0], FRONT_PX[1], (ctx) => paintFront(ctx, 31 + seed * 7)));
  const frontGeometry = new PlaneGeometry(RW - 0.12, RH - 0.12);
  const frontMaterials = fronts.map((map) =>
    fader.add(panelMaterial({ map, size: [RW - 0.12, RH - 0.12], radius: 0.05, border: hex.skyDeep, borderWidth: 0.9, bright: 1.25 })),
  );
  const targetMaterial = fader.add(
    panelMaterial({ map: fronts[0], size: [RW - 0.12, RH - 0.12], radius: 0.05, border: hex.emerald, borderWidth: 1.6, bright: 1.7 }),
  );

  const lights: number[] = [];
  {
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const up = new Vector3(0, 1, 0);
    const one = new Vector3(1, 1, 1);
    const normal = new Vector3();
    const across = new Vector3();
    const tint = new Color();
    [...racks, target].forEach((rack, index) => {
      rotation.setFromAxisAngle(up, rack.facing);
      matrix.compose(rack.position, rotation, one);
      boxes.setMatrixAt(index, matrix);
      bodies.setMatrixAt(index, matrix);
      boxes.setColorAt(index, tint.set(rack === target ? hex.emerald : hex.sky).multiplyScalar(rack.level));

      normal.set(Math.sin(rack.facing), 0, Math.cos(rack.facing));
      across.set(Math.cos(rack.facing), 0, -Math.sin(rack.facing));
      const front = new Mesh(frontGeometry, rack === target ? targetMaterial : frontMaterials[index % frontMaterials.length]);
      front.position.copy(rack.position).addScaledVector(normal, RD / 2 + 0.012);
      front.rotation.y = rack.facing;
      front.renderOrder = 3;
      group.add(front);

      // A few status lights per cabinet that blink on their own.
      const count = rack.level < 1 ? 2 : 4;
      for (let k = 0; k < count; k++) {
        const unit = Math.floor(rng() * UNITS);
        const y = rack.position.y + (RH - 0.12) * (0.5 - (12 + (unit + 0.5) * ((FRONT_PX[1] - 24) / UNITS)) / FRONT_PX[1]);
        const x = (RW - 0.12) * ((30 + (rng() < 0.5 ? 0 : 15)) / FRONT_PX[0] - 0.5);
        lights.push(
          rack.position.x + normal.x * (RD / 2 + 0.03) + across.x * x,
          y,
          rack.position.z + normal.z * (RD / 2 + 0.03) + across.z * x,
        );
      }
    });
  }
  boxes.frustumCulled = false;
  boxes.renderOrder = 2;
  bodies.frustumCulled = false;
  group.add(bodies, boxes);

  {
    const count = lights.length / 3;
    const colors = new Float32Array(count * 3);
    const tints = [new Color(hex.emerald), new Color(hex.emerald), new Color(hex.sky), new Color(hex.amber)];
    for (let i = 0; i < count; i++) tints[Math.floor(rng() * tints.length)].toArray(colors, i * 3);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(lights), 3));
    geometry.setAttribute("aColor", new BufferAttribute(colors, 3));
    geometry.setAttribute("aAlpha", new BufferAttribute(new Float32Array(count).fill(1), 1));
    geometry.setAttribute("aSize", new BufferAttribute(new Float32Array(count).fill(0.13), 1));
    const leds = new Points(geometry, fader.add(pointsMaterial({ twinkle: 1 })));
    leds.frustumCulled = false;
    leds.renderOrder = 4;
    group.add(leds);
  }

  /* Floor: a grid under the cabinets, with the aisle picked out. */
  {
    const y = HALL.floor;
    const grid: number[] = [];
    const halfX = HALL.aisle + 7.2;
    const fromZ = -3;
    const toZ = HALL.mouth + 4.5;
    for (let x = -halfX; x <= halfX + 1e-3; x += 1.2) grid.push(x, y, fromZ, x, y, toZ);
    for (let z = fromZ; z <= toZ + 1e-3; z += 1.2) grid.push(-halfX, y, z, halfX, y, z);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(grid), 3));
    group.add(new LineSegments(geometry, fader.add(lineMaterial(0x1d5a7c, 0.2))));

    const edge = HALL.aisle - RD / 2 - 0.12;
    const aisle = [-edge, y, RD / 2, -edge, y, toZ, edge, y, RD / 2, edge, y, toZ];
    const aisleGeometry = new BufferGeometry();
    aisleGeometry.setAttribute("position", new BufferAttribute(new Float32Array(aisle), 3));
    group.add(new LineSegments(aisleGeometry, fader.add(lineMaterial(hex.emeraldDeep, 0.5))));
  }

  /* Where the light goes in, and whose machine it is. */
  const port = new Sprite(glowSpriteMaterial(kit.tex.glow(), hex.emerald, 0));
  port.position.set(0, HALL.port, RD / 2 + 0.05);
  port.renderOrder = 28;
  group.add(port);
  const nameplate = kit.tex.label("DocumentDB", 0.46, {
    color: "emerald",
    sub: "gateway + PostgreSQL, one container",
    align: "center",
    mono: false,
  });
  nameplate.position.set(0, HALL.floor + RH + 0.62, RD / 2);
  group.add(nameplate);

  return {
    group,
    update(frame: Frame) {
      const { t } = frame;
      // Only on the way in and on the way home; the overview shows the stack alone.
      // It also clears quickly once the light is inside the rack, because the
      // camera then drops through the floor between the cabinets.
      const w = Math.max(1 - envelope(t, CUE.roof + 0.05, CUE.roof + 0.7, 32.3, 33.2) - frame.finale, 0);
      group.visible = w > 0.002;
      if (!group.visible) return;
      fader.set(w);
      // Fading bodies must stop hiding what is behind them.
      bodyMaterial.depthWrite = w > 0.98;

      const entering = Math.max(pulse(t, CUE.roof, 2.6), pulse(t, CUE.replyRoof, 3.5));
      targetMaterial.uniforms.uBright.value = 1.7 + entering * 1.6;
      port.material.opacity = w * (0.35 + 0.65 * entering) * envelope(t, 7.4, 8.2, 10.2, 10.9);
      port.scale.setScalar(0.9 + entering * 1.9);
      nameplate.material.opacity = w * envelope(t, 7.5, 8.2, 9.0, 9.3);
    },
  };
}
