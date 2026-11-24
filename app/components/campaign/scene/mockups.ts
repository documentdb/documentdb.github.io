// Canvas-drawn screens of the example application: TrailyShop, an invented
// outdoor-gear shop, seen on a phone. The product page shows one shoe, the
// Traily Run, with a stock count; buying it is the update the film follows.
// Company and product names are made up for this page.

import { css } from "./palette";
import { roundRect, type Ctx, type TextureKit } from "./textures";

/** A rectangle in texture space, as fractions of the texture (v down). */
export interface UvRect {
  u: number;
  v: number;
  w: number;
  h: number;
}

export const SHOP = "TrailyShop";
export const PRODUCT = {
  name: "Traily Run",
  kind: "Trail running shoe",
  price: "$129",
  tags: ["trail", "shoes", "new"],
} as const;

/** Stock before the tap and after it. */
export const STOCK_BEFORE = 2;
export const STOCK_AFTER = 1;

/** Logical size of a phone screen texture. */
export const PHONE_PX: [number, number] = [600, 1300];

const CARD = { x: 24, y: 196, w: 552, h: 772 };
const S = CARD.w / 336;
const BUTTON = { x: CARD.x + 20 * S, y: CARD.y + CARD.h - 64 * S, w: CARD.w - 40 * S, h: 44 * S };

const uv = (rect: { x: number; y: number; w: number; h: number }): UvRect => ({
  u: rect.x / PHONE_PX[0],
  v: rect.y / PHONE_PX[1],
  w: rect.w / PHONE_PX[0],
  h: rect.h / PHONE_PX[1],
});

/** The product card and its Buy button on the phone screen. */
export const CARD_UV = uv(CARD);
export const BUTTON_UV = uv(BUTTON);

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = "left",
) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, x, y);
}

function fillRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, stroke: string, width = 2) {
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function textWidth(ctx: Ctx, value: string, font: string) {
  ctx.font = font;
  return ctx.measureText(value).width;
}

/** Backdrop for product art: a ridge line under a low sun. */
function ridge(ctx: Ctx, x: number, y: number, w: number, h: number, hue: [string, string], seed: number) {
  ctx.save();
  roundRect(ctx, x, y, w, h, Math.min(w, h) * 0.07);
  ctx.clip();
  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, hue[0]);
  gradient.addColorStop(1, hue[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(x + w * (0.76 - 0.1 * seed), y + h * 0.3, h * 0.12, 0, Math.PI * 2);
  ctx.fill();
  for (let layer = 0; layer < 2; layer++) {
    ctx.fillStyle = layer === 0 ? "rgba(13,116,110,0.13)" : "rgba(13,116,110,0.22)";
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    const peaks = 4 + layer;
    for (let i = 0; i <= peaks; i++) {
      const px = x + (w * i) / peaks;
      const wobble = Math.sin((i + 1) * (2.3 + seed) + layer * 1.7);
      ctx.lineTo(px, y + h * (0.6 + layer * 0.16) - Math.abs(wobble) * h * (0.22 - layer * 0.08));
    }
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * A plain running shoe in profile, toe to the right, drawn in a unit box one
 * shoe-length wide. It carries no stripes or marks, on purpose: it must not
 * resemble any real brand's shoe.
 */
function shoe(ctx: Ctx, x: number, y: number, length: number, upper: [string, string]) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(length, length);
  ctx.rotate(-0.07);

  // Contact shadow.
  ctx.fillStyle = "rgba(15,23,42,0.2)";
  ctx.beginPath();
  ctx.ellipse(0.52, 0.505, 0.47, 0.028, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lugs under the outsole.
  ctx.fillStyle = "#1c2836";
  for (let i = 0; i < 9; i++) {
    const lx = 0.075 + i * 0.086;
    ctx.fillRect(lx, 0.462, 0.054, 0.03);
  }

  const midsoleTop = () => {
    ctx.quadraticCurveTo(0.74, 0.385, 0.5, 0.385);
    ctx.quadraticCurveTo(0.24, 0.385, 0.055, 0.315);
  };

  // Midsole.
  const sole = ctx.createLinearGradient(0, 0.32, 0, 0.48);
  sole.addColorStop(0, "#e9eef4");
  sole.addColorStop(1, "#a3b2c2");
  ctx.fillStyle = sole;
  ctx.beginPath();
  ctx.moveTo(0.045, 0.47);
  ctx.lineTo(0.8, 0.47);
  ctx.quadraticCurveTo(0.93, 0.47, 0.975, 0.39);
  ctx.lineTo(0.98, 0.345);
  midsoleTop();
  ctx.quadraticCurveTo(0.005, 0.36, 0.045, 0.47);
  ctx.closePath();
  ctx.fill();

  // Upper.
  const body = ctx.createLinearGradient(0.1, 0.02, 0.8, 0.4);
  body.addColorStop(0, upper[0]);
  body.addColorStop(1, upper[1]);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0.055, 0.315);
  ctx.bezierCurveTo(0.02, 0.22, 0.035, 0.1, 0.075, 0.035);
  ctx.lineTo(0.115, 0.02);
  ctx.quadraticCurveTo(0.16, 0.16, 0.27, 0.15);
  ctx.quadraticCurveTo(0.33, 0.14, 0.37, 0.035);
  ctx.lineTo(0.425, 0.045);
  ctx.quadraticCurveTo(0.56, 0.2, 0.7, 0.235);
  ctx.quadraticCurveTo(0.9, 0.265, 0.98, 0.345);
  midsoleTop();
  ctx.closePath();
  ctx.fill();

  // Heel counter and toe cap, a shade darker.
  ctx.fillStyle = "rgba(2,30,34,0.42)";
  ctx.beginPath();
  ctx.moveTo(0.055, 0.315);
  ctx.bezierCurveTo(0.02, 0.22, 0.035, 0.1, 0.075, 0.035);
  ctx.lineTo(0.115, 0.02);
  ctx.quadraticCurveTo(0.14, 0.12, 0.19, 0.15);
  ctx.lineTo(0.2, 0.36);
  ctx.quadraticCurveTo(0.12, 0.35, 0.055, 0.315);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0.8, 0.252);
  ctx.quadraticCurveTo(0.92, 0.275, 0.98, 0.345);
  ctx.quadraticCurveTo(0.86, 0.372, 0.76, 0.378);
  ctx.quadraticCurveTo(0.74, 0.31, 0.8, 0.252);
  ctx.closePath();
  ctx.fill();

  // Eyestay along the throat, with laces across it.
  ctx.fillStyle = "rgba(255,255,255,0.17)";
  ctx.beginPath();
  ctx.moveTo(0.37, 0.035);
  ctx.lineTo(0.425, 0.045);
  ctx.quadraticCurveTo(0.56, 0.2, 0.7, 0.235);
  ctx.lineTo(0.665, 0.29);
  ctx.quadraticCurveTo(0.5, 0.25, 0.385, 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 0.013;
  ctx.lineCap = "round";
  for (let k = 0; k < 5; k++) {
    const t = 0.1 + k * 0.2;
    const lx = (1 - t) ** 2 * 0.425 + 2 * (1 - t) * t * 0.56 + t * t * 0.7;
    const ly = (1 - t) ** 2 * 0.045 + 2 * (1 - t) * t * 0.2 + t * t * 0.235;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx - 0.036, ly + 0.05);
    ctx.stroke();
  }

  // Collar lining and a pinstripe on the midsole.
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 0.008;
  ctx.beginPath();
  ctx.moveTo(0.115, 0.02);
  ctx.quadraticCurveTo(0.16, 0.16, 0.27, 0.15);
  ctx.quadraticCurveTo(0.33, 0.14, 0.37, 0.035);
  ctx.stroke();
  ctx.strokeStyle = "rgba(56,189,248,0.9)";
  ctx.lineWidth = 0.011;
  ctx.beginPath();
  ctx.moveTo(0.09, 0.4);
  ctx.quadraticCurveTo(0.5, 0.462, 0.9, 0.418);
  ctx.stroke();

  ctx.restore();
}

function stockLabel(stock: number) {
  return `Only ${stock} left`;
}

/** The product card. `s` scales every measurement. */
function productCard(ctx: Ctx, sans: string, x: number, y: number, w: number, h: number, s: number, stock: number) {
  fillRound(ctx, x, y, w, h, 18 * s, css.uiSurface);
  strokeRound(ctx, x, y, w, h, 18 * s, css.uiLine, 2 * s);

  const artW = w - 28 * s;
  const artH = 214 * s;
  ridge(ctx, x + 14 * s, y + 14 * s, artW, artH, ["#cfe8f7", "#eef7f1"], 1);
  shoe(ctx, x + 14 * s + artW * 0.1, y + 14 * s + artH * 0.34, artW * 0.8, ["#5eead4", "#0f766e"]);

  text(ctx, PRODUCT.name, x + 22 * s, y + 270 * s, `700 ${27 * s}px ${sans}`, css.uiText);
  text(ctx, PRODUCT.kind, x + 22 * s, y + 297 * s, `400 ${16 * s}px ${sans}`, css.uiMuted);
  text(ctx, PRODUCT.price, x + 22 * s, y + 343 * s, `700 ${28 * s}px ${sans}`, css.uiText);

  // Stock: the number the whole film is about.
  const stockFont = `600 ${16 * s}px ${sans}`;
  const label = stockLabel(stock);
  const labelW = textWidth(ctx, label, stockFont);
  fillRound(ctx, x + w - 22 * s - labelW - 36 * s, y + 320 * s, labelW + 36 * s, 30 * s, 15 * s, css.uiAmberSoft);
  ctx.fillStyle = css.uiAmber;
  ctx.beginPath();
  ctx.arc(x + w - 22 * s - labelW - 20 * s, y + 335 * s, 4.5 * s, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, label, x + w - 34 * s, y + 340.5 * s, stockFont, css.uiAmber, "right");

  let chipX = x + 22 * s;
  for (const tag of PRODUCT.tags) {
    const font = `500 ${14 * s}px ${sans}`;
    const chipW = textWidth(ctx, tag, font) + 22 * s;
    fillRound(ctx, chipX, y + 362 * s, chipW, 27 * s, 13.5 * s, css.uiGreenSoft);
    text(ctx, tag, chipX + 11 * s, y + 380.5 * s, font, css.uiGreen);
    chipX += chipW + 8 * s;
  }

  fillRound(ctx, x + 20 * s, y + h - 64 * s, w - 40 * s, 44 * s, 12 * s, css.uiAccent);
  text(ctx, "Buy now", x + w / 2, y + h - 64 * s + 29.5 * s, `700 ${19 * s}px ${sans}`, "#ffffff", "center");
}

function homeIndicator(ctx: Ctx) {
  fillRound(ctx, PHONE_PX[0] / 2 - 90, 1276, 180, 6, 3, "#1e293b");
}

function productPage(ctx: Ctx, sans: string, stock: number) {
  const [W, H] = PHONE_PX;
  ctx.fillStyle = css.uiBg;
  ctx.fillRect(0, 0, W, H);

  // Status bar.
  text(ctx, "9:41", 44, 50, `600 22px ${sans}`, css.uiText);
  fillRound(ctx, W / 2 - 74, 22, 148, 36, 18, "#02040a");
  strokeRound(ctx, W - 88, 30, 44, 22, 7, css.uiMuted, 2);
  fillRound(ctx, W - 84, 34, 30, 14, 4, css.uiText);

  // Shop header.
  fillRound(ctx, 28, 92, 40, 40, 11, css.uiGreen);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(35, 124);
  ctx.lineTo(45, 103);
  ctx.lineTo(51, 114);
  ctx.lineTo(55, 108);
  ctx.lineTo(62, 124);
  ctx.closePath();
  ctx.fill();
  text(ctx, SHOP, 80, 122, `700 28px ${sans}`, css.uiText);
  strokeRound(ctx, W - 80, 98, 36, 30, 8, css.uiText, 2.5);
  ctx.fillStyle = css.uiGreen;
  ctx.beginPath();
  ctx.arc(W - 42, 98, 13, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, "1", W - 42, 104, `700 16px ${sans}`, "#ffffff", "center");

  text(ctx, "‹  Trail running", 30, 174, `500 20px ${sans}`, css.uiMuted);

  productCard(ctx, sans, CARD.x, CARD.y, CARD.w, CARD.h, S, stock);

  // Pick-up row: the geospatial query in the story.
  fillRound(ctx, 24, 986, 552, 92, 20, css.uiSurface);
  strokeRound(ctx, 24, 986, 552, 92, 20, css.uiLine, 2);
  ctx.fillStyle = css.uiGreen;
  ctx.beginPath();
  ctx.arc(64, 1024, 15, Math.PI, 0);
  ctx.lineTo(64, 1058);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = css.uiSurface;
  ctx.beginPath();
  ctx.arc(64, 1024, 5.5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, "Pick up today", 98, 1026, `700 22px ${sans}`, css.uiText);
  text(ctx, "Seattle store · 1.2 km", 98, 1056, `400 18px ${sans}`, css.uiMuted);
  text(ctx, "›", 550, 1044, `500 30px ${sans}`, css.uiMuted, "right");

  // Similar gear: the vector search in the story.
  text(ctx, "Similar gear", 30, 1126, `700 22px ${sans}`, css.uiText);
  const similar: [string, string][] = [
    ["#c4b5fd", "#5b46b8"],
    ["#7dd3fc", "#1d6fa5"],
    ["#fcd34d", "#b45309"],
    ["#f0abfc", "#86198f"],
  ];
  similar.forEach((upper, i) => {
    const tx = 24 + i * 141;
    fillRound(ctx, tx, 1144, 129, 112, 16, css.uiSurface);
    strokeRound(ctx, tx, 1144, 129, 112, 16, css.uiLine, 2);
    shoe(ctx, tx + 12, 1144 + 34, 105, upper);
  });

  homeIndicator(ctx);
}

/** The product page with a given stock count. */
export function phonePage(kit: TextureKit, stock: number) {
  return kit.draw(PHONE_PX[0], PHONE_PX[1], (ctx) => productPage(ctx, kit.sans, stock));
}

/** What the phone shows once the reply is back: the order, and one pair fewer. */
export function confirmedPage(kit: TextureKit) {
  const [W, H] = PHONE_PX;
  const sans = kit.sans;
  return kit.draw(W, H, (ctx) => {
    productPage(ctx, sans, STOCK_AFTER);
    ctx.fillStyle = "rgba(15,23,42,0.45)";
    ctx.fillRect(0, 0, W, H);

    // Bottom sheet.
    roundRect(ctx, 0, 470, W, H - 470 + 60, 44);
    ctx.fillStyle = css.uiSurface;
    ctx.fill();
    ctx.strokeStyle = css.uiLine;
    ctx.lineWidth = 2;
    ctx.stroke();
    fillRound(ctx, W / 2 - 28, 488, 56, 6, 3, "#cbd5e1");

    ctx.fillStyle = css.uiGreen;
    ctx.beginPath();
    ctx.arc(W / 2, 600, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(W / 2 - 27, 602);
    ctx.lineTo(W / 2 - 7, 622);
    ctx.lineTo(W / 2 + 29, 580);
    ctx.stroke();

    text(ctx, "Order placed", W / 2, 722, `700 46px ${sans}`, css.uiText, "center");
    text(ctx, `${PRODUCT.name} · ${PRODUCT.price} · order 1042`, W / 2, 762, `400 21px ${sans}`, css.uiMuted, "center");

    fillRound(ctx, 36, 800, 528, 184, 20, css.uiSurface2);
    text(ctx, "Pick up", 62, 852, `400 21px ${sans}`, css.uiMuted);
    text(ctx, "Seattle store · today", 538, 852, `600 21px ${sans}`, css.uiText, "right");
    ctx.fillStyle = css.uiLine;
    ctx.fillRect(62, 884, 476, 2);
    text(ctx, "Left in stock", 62, 942, `400 21px ${sans}`, css.uiMuted);
    const left = `${STOCK_AFTER} left`;
    const leftFont = `700 28px ${sans}`;
    const leftW = textWidth(ctx, left, leftFont);
    ctx.fillStyle = css.uiAmber;
    ctx.beginPath();
    ctx.arc(538 - leftW - 16, 933, 6, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, left, 538, 943, leftFont, css.uiAmber, "right");

    fillRound(ctx, 36, 1018, 528, 76, 20, css.uiAccent);
    text(ctx, "View order", W / 2, 1066, `700 26px ${sans}`, "#ffffff", "center");
    text(ctx, "Keep shopping", W / 2, 1152, `600 21px ${sans}`, css.uiAccent, "center");
    homeIndicator(ctx);
  });
}

/** The Buy button after the tap, while the request is on its way. */
export function pressedButton(kit: TextureKit) {
  const w = Math.round(BUTTON.w);
  const h = Math.round(BUTTON.h);
  return kit.draw(w, h, (ctx) => {
    fillRound(ctx, 0, 0, w, h, 12 * S, "#075a99");
    text(ctx, "Placing order…", w / 2, h / 2 + 10, `700 ${19 * S}px ${kit.sans}`, "#e6f6ff", "center");
  });
}
