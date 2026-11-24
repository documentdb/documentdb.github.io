// Where the film starts and ends: a phone showing the TrailyShop product page.
// A touch lands on "Buy now"; much later the reply comes back and the screen
// shows the order. It is the only thing in the frame, lit like a product
// shot, so the eye stays on the app.

import {
  AdditiveBlending,
  CircleGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PlaneGeometry,
  RingGeometry,
  Shape,
  Sprite,
  type ShaderMaterial,
  type Texture,
} from "three";
import { CUE } from "../film";
import { Fader, glowSpriteMaterial, holoMaterial, panelMaterial, rimMaterial } from "../materials";
import {
  BUTTON_UV,
  CARD_UV,
  STOCK_BEFORE,
  confirmedPage,
  phonePage,
  pressedButton,
  type UvRect,
} from "../mockups";
import { envelope, lerp, pulse, smoothstep } from "../util";
import { PHONE, type Frame, type Kit, type Station } from "../world";

const { w: W, h: H } = PHONE;
const BEZEL = 0.05;
/** Screen brightness: a lit white page, kept just under the bloom threshold so its text stays crisp. */
const SCREEN = 0.88;
const DEPTH = 0.1;

/** Centre and size of a texture region in the screen's local space. */
function place(rect: UvRect) {
  return {
    x: (rect.u + rect.w / 2 - 0.5) * W,
    y: (0.5 - rect.v - rect.h / 2) * H,
    w: rect.w * W,
    h: rect.h * H,
  };
}

/** A slab with rounded corners; its front face lies in the z = 0 plane. */
function bodyGeometry() {
  const w = W + BEZEL * 2;
  const h = H + BEZEL * 2;
  const r = 0.2;
  const shape = new Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geometry = new ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -DEPTH - 0.018);
  return geometry;
}

interface Handset {
  root: Group;
  before: Mesh<PlaneGeometry, ShaderMaterial>;
  after: Mesh<PlaneGeometry, ShaderMaterial>;
  halo: Sprite;
  /** How bright this phone is next to the one in front. */
  level: number;
  phase: number;
  y: number;
}

export function createPhoneStation(kit: Kit): Station {
  const group = new Group();
  const fader = new Fader();
  const glow = kit.tex.glow();

  const stocked = phonePage(kit.tex, STOCK_BEFORE);
  const confirmed = confirmedPage(kit.tex);

  const body = bodyGeometry();
  const screen = new PlaneGeometry(W, H);
  const shell = fader.add(rimMaterial(0x8fa3b8));

  const handsets: Handset[] = [];
  const handset = (
    position: [number, number, number],
    turn: [number, number],
    level: number,
    before: Texture,
    after: Texture,
  ) => {
    const root = new Group();
    root.position.set(...position);
    root.rotation.set(turn[0], turn[1], 0);

    const back = new Mesh(body, shell);
    back.renderOrder = 1;
    const panel = (map: Texture, z: number) => {
      const mesh = new Mesh(
        screen,
        panelMaterial({ map, size: [W, H], radius: 0.16, border: 0x0b1220, borderWidth: 1.4, bright: SCREEN * level }),
      );
      mesh.position.z = z;
      mesh.renderOrder = 2;
      return mesh;
    };
    const first = panel(before, 0.004);
    const second = panel(after, 0.008);
    second.renderOrder = 3;

    const halo = new Sprite(glowSpriteMaterial(glow, 0xcfe2f3, 0));
    halo.position.z = -0.4;
    halo.scale.set(W * 3.1, H * 2.1, 1);

    root.add(halo, back, first, second);
    group.add(root);
    const item: Handset = { root, before: first, after: second, halo, level, phase: handsets.length * 2.1, y: position[1] };
    handsets.push(item);
    return item;
  };

  const hero = handset([PHONE.x, PHONE.y, PHONE.z], [0, 0], 1, stocked, confirmed);

  /* The touch: a fingertip, the ripple it leaves, and the button's response. */
  const button = place(BUTTON_UV);
  const overlay = (color: number, additive: boolean) =>
    new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: additive ? AdditiveBlending : NormalBlending,
    });

  const pressed = new Mesh(
    new PlaneGeometry(button.w, button.h),
    panelMaterial({ map: pressedButton(kit.tex), size: [button.w, button.h], radius: 0.04, borderWidth: 0, opacity: 0 }),
  );
  pressed.position.set(button.x, button.y, 0.012);
  pressed.renderOrder = 4;

  const flashMaterial = overlay(0xffffff, true);
  const flash = new Mesh(new PlaneGeometry(button.w, button.h), flashMaterial);
  flash.position.set(button.x, button.y, 0.014);
  flash.renderOrder = 5;

  const fingerMaterial = overlay(0x0f172a, false);
  const finger = new Mesh(new CircleGeometry(0.085, 32), fingerMaterial);
  finger.renderOrder = 7;
  const fingerEdgeMaterial = overlay(0x0f172a, false);
  const fingerEdge = new Mesh(new RingGeometry(0.085, 0.097, 40), fingerEdgeMaterial);
  fingerEdge.renderOrder = 8;

  const rippleMaterial = overlay(0x0b74c4, false);
  const ripple = new Mesh(new RingGeometry(0.9, 1, 56), rippleMaterial);
  ripple.renderOrder = 6;
  const echoMaterial = overlay(0x0b74c4, false);
  const echo = new Mesh(new RingGeometry(0.94, 1, 56), echoMaterial);
  echo.renderOrder = 6;

  /* The product card lights up once the document starts to slide out of it. */
  const card = place(CARD_UV);
  const cardEdge = new Mesh(
    new PlaneGeometry(card.w, card.h),
    holoMaterial({ color: 0x059669, fill: 0, line: 1.3, glow: 0.3, opacity: 0 }),
  );
  // The screen is light, so the outline is painted over it instead of added to it.
  cardEdge.material.blending = NormalBlending;
  cardEdge.position.set(card.x, card.y, 0.016);
  cardEdge.renderOrder = 5;

  hero.root.add(pressed, flash, ripple, echo, finger, fingerEdge, cardEdge);

  return {
    group,
    update(frame: Frame) {
      const { t, time } = frame;
      // Out of sight while the camera is inside the server.
      const w = 1 - envelope(t, 8.5, 9.4, 28.8, 29.7);
      group.visible = w > 0.002;
      if (!group.visible) return;
      fader.set(w);

      // The document is the subject of the second shot; the screens step back.
      const reading = envelope(t, CUE.docOut, CUE.docOpen, CUE.pack + 0.3, CUE.phoneEdge);
      const firstLoop = frame.loop === 0;

      handsets.forEach((item, index) => {
        const isHero = index === 0;
        // The reply reaches the phone in front first; the others catch up on
        // their next read, a moment apart. Each loop then starts afresh.
        const arrives = CUE.replyPhone + (isHero ? 0 : 0.35 + index * 0.22);
        const landed =
          t >= arrives - 0.1
            ? smoothstep(arrives, arrives + 0.4, t)
            : firstLoop
              ? 0
              : 1 - smoothstep(0.15, 0.8, t);
        const level = item.level * (isHero ? lerp(1, 0.72, reading) : lerp(1, 0.16, reading));
        item.before.material.uniforms.uOpacity.value = w;
        item.before.material.uniforms.uBright.value = SCREEN * level;
        // Once the new screen has fully arrived there is nothing left to show of the old one.
        item.before.visible = landed < 0.999;
        item.after.material.uniforms.uOpacity.value = w * landed;
        item.after.material.uniforms.uBright.value = SCREEN * level;
        item.after.visible = landed > 0.002;
        const arrival = isHero ? pulse(t, CUE.replyPhone, 2.2) : 0;
        item.halo.material.opacity = w * (0.1 * level + arrival * 0.3);
        if (!isHero) {
          item.root.position.y = item.y + Math.sin(time * 0.55 + item.phase) * 0.06;
          item.root.rotation.z = Math.sin(time * 0.4 + item.phase * 1.3) * 0.02;
        }
      });

      // Fingertip: drifts in from the lower right, presses, lifts.
      const approach = smoothstep(CUE.finger, CUE.tap, t);
      const contact = smoothstep(CUE.tap - 0.12, CUE.tap, t) * (1 - smoothstep(CUE.tap + 0.1, CUE.tap + 0.3, t));
      const shown = smoothstep(CUE.finger, CUE.finger + 0.3, t) * (1 - smoothstep(CUE.tap + 0.18, CUE.tap + 0.5, t));
      const fx = button.x + 0.1 + (1 - approach) * 0.34;
      const fy = button.y - 0.01 - (1 - approach) * 0.5;
      finger.position.set(fx, fy, 0.03);
      fingerEdge.position.set(fx, fy, 0.031);
      const press = lerp(1.25, 0.82, contact);
      finger.scale.setScalar(press);
      fingerEdge.scale.setScalar(press);
      fingerMaterial.opacity = w * shown * lerp(0.16, 0.34, contact);
      fingerEdgeMaterial.opacity = w * shown * 0.6;

      // Two rings spread from the point of contact.
      const spread = (t - CUE.tap) / 0.75;
      ripple.position.set(button.x + 0.1, button.y - 0.01, 0.02);
      ripple.scale.setScalar(0.06 + Math.max(spread, 0) * 0.62);
      rippleMaterial.opacity = spread > 0 && spread < 1 ? w * (1 - spread) ** 1.5 * 0.95 : 0;
      const second = (t - CUE.tap - 0.16) / 0.85;
      echo.position.copy(ripple.position);
      echo.scale.setScalar(0.06 + Math.max(second, 0) * 0.95);
      echoMaterial.opacity = second > 0 && second < 1 ? w * (1 - second) ** 2 * 0.5 : 0;

      // The button answers the touch, then says the order is on its way.
      flashMaterial.opacity = w * pulse(t, CUE.tap, 5) * 0.75;
      const waiting = smoothstep(CUE.tap + 0.05, CUE.tap + 0.25, t) * (t < CUE.replyPhone ? 1 : 0);
      pressed.material.uniforms.uOpacity.value = w * waiting;
      pressed.visible = waiting > 0.002;

      const lit = envelope(t, CUE.tap + 0.25, CUE.docOut + 0.2, CUE.pack, CUE.depart + 0.2);
      cardEdge.material.uniforms.uOpacity.value = w * lit * (0.6 + 0.4 * Math.sin(time * 3.1) ** 2);
      cardEdge.visible = lit > 0.002;
    },
  };
}
