import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  type Texture,
} from "three";
import { css, type CssColor } from "./palette";

export const MONO =
  'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export type Ctx = CanvasRenderingContext2D;
export type Tok = [text: string, color: CssColor];

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export interface LabelStyle {
  color?: CssColor;
  /** Second, smaller line. */
  sub?: string;
  subColor?: CssColor;
  /** Dark rounded backing with a hairline border. */
  pill?: boolean;
  mono?: boolean;
  align?: "left" | "center" | "right";
}

export interface CodePanel {
  texture: CanvasTexture;
  /** Width divided by height. */
  aspect: number;
  /** Vertical centre of a line, 0 at the top of the panel and 1 at the bottom. */
  lineV(index: number): number;
  /** Right end of a line's text, 0 at the left edge and 1 at the right. */
  lineEndU(index: number): number;
  /** Left edge of every line's text, as a fraction of the width. */
  startU: number;
  /** Height of one line, as a fraction of the panel's height. */
  lineHeightV: number;
  /** Width of one character, as a fraction of the panel's width. */
  charU: number;
}

/**
 * Creates and tracks every canvas-backed texture so they can be uploaded ahead
 * of first use and released together.
 */
export class TextureKit {
  readonly all: Texture[] = [];
  private glowTexture?: CanvasTexture;

  constructor(
    private readonly anisotropy: number,
    /** Sans-serif stack copied from the page so canvas text matches it. */
    readonly sans: string,
    /** Resolution multiplier; below 1 on constrained devices. */
    readonly res: number,
  ) {}

  canvas(width: number, height: number): [HTMLCanvasElement, Ctx] {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(width * this.res));
    canvas.height = Math.max(2, Math.round(height * this.res));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas is unavailable");
    ctx.scale(this.res, this.res);
    return [canvas, ctx];
  }

  texture(canvas: HTMLCanvasElement) {
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = this.anisotropy;
    texture.generateMipmaps = true;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    this.all.push(texture);
    return texture;
  }

  /** Draw at a logical size and get the texture back. */
  draw(width: number, height: number, paint: (ctx: Ctx) => void) {
    const [canvas, ctx] = this.canvas(width, height);
    paint(ctx);
    return this.texture(canvas);
  }

  /** Soft radial falloff used for halos and light pools. */
  glow() {
    if (!this.glowTexture) {
      this.glowTexture = this.draw(128, 128, (ctx) => {
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.25, "rgba(255,255,255,0.55)");
        gradient.addColorStop(0.6, "rgba(255,255,255,0.12)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
      });
    }
    return this.glowTexture;
  }

  /**
   * A camera-facing text tag. `height` is the world-space height of a
   * single-line label; a label with a sub line is proportionally taller.
   */
  label(text: string, height: number, style: LabelStyle = {}) {
    const mono = style.mono ?? true;
    const family = mono ? MONO : this.sans;
    const mainFont = `600 44px ${family}`;
    const subFont = `500 30px ${family}`;
    const padX = style.pill ? 28 : 6;
    const padY = style.pill ? 18 : 8;
    const mainH = 54;
    const subH = style.sub ? 44 : 0;

    const [probe, probeCtx] = this.canvas(8, 8);
    probeCtx.font = mainFont;
    let textW = probeCtx.measureText(text).width;
    if (style.sub) {
      probeCtx.font = subFont;
      textW = Math.max(textW, probeCtx.measureText(style.sub).width);
    }
    probe.width = probe.height = 0;

    const width = Math.ceil(textW + padX * 2);
    const totalH = mainH + subH + padY * 2;
    const align = style.align ?? "left";
    const texture = this.draw(width, totalH, (ctx) => {
      if (style.pill) {
        roundRect(ctx, 1.5, 1.5, width - 3, totalH - 3, 16);
        ctx.fillStyle = "rgba(4,8,12,0.82)";
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = css[style.color ?? "sky"];
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const x = align === "left" ? padX : align === "right" ? width - padX : width / 2;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.font = mainFont;
      ctx.fillStyle = css[style.color ?? "sky"];
      ctx.fillText(text, x, padY + mainH / 2 + 1);
      if (style.sub) {
        ctx.font = subFont;
        ctx.fillStyle = css[style.subColor ?? "dim"];
        ctx.fillText(style.sub, x, padY + mainH + subH / 2);
      }
    });

    const material = new SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const sprite = new Sprite(material);
    const worldH = height * (totalH / (mainH + padY * 2));
    sprite.scale.set(worldH * (width / totalH), worldH, 1);
    sprite.center.set(align === "left" ? 0 : align === "right" ? 1 : 0.5, 0.5);
    sprite.renderOrder = 20;
    return sprite;
  }

  /** Syntax-coloured monospace text on a dark card. */
  code(
    lines: Tok[][],
    options: { fontPx?: number; title?: string; titleColor?: CssColor; minCols?: number } = {},
  ): CodePanel {
    const fontPx = options.fontPx ?? 30;
    const lineH = Math.round(fontPx * 1.5);
    const padX = Math.round(fontPx * 1.1);
    const padY = Math.round(fontPx * 0.95);
    const titleH = options.title ? Math.round(fontPx * 1.7) : 0;
    const font = `500 ${fontPx}px ${MONO}`;

    const [probe, probeCtx] = this.canvas(8, 8);
    probeCtx.font = font;
    const charW = probeCtx.measureText("M").width;
    probe.width = probe.height = 0;

    const lengths = lines.map((line) => line.reduce((n, [text]) => n + text.length, 0));
    const cols = Math.max(options.minCols ?? 0, ...lengths);
    const width = Math.ceil(cols * charW + padX * 2);
    const height = titleH + lines.length * lineH + padY * 2;

    const texture = this.draw(width, height, (ctx) => {
      ctx.fillStyle = "rgba(6,11,17,0.9)";
      ctx.fillRect(0, 0, width, height);
      ctx.textBaseline = "middle";
      if (options.title) {
        ctx.font = `600 ${Math.round(fontPx * 0.72)}px ${MONO}`;
        ctx.fillStyle = css[options.titleColor ?? "dim"];
        ctx.fillText(options.title.toUpperCase(), padX, padY + titleH * 0.36);
        ctx.fillStyle = "rgba(125,211,252,0.16)";
        ctx.fillRect(padX, padY + titleH * 0.78, width - padX * 2, 1.5);
      }
      ctx.font = font;
      lines.forEach((line, row) => {
        let x = padX;
        const y = padY + titleH + row * lineH + lineH / 2;
        for (const [text, color] of line) {
          ctx.fillStyle = css[color];
          ctx.fillText(text, x, y);
          x += text.length * charW;
        }
      });
    });

    return {
      texture,
      aspect: width / height,
      lineV: (index) => (padY + titleH + index * lineH + lineH / 2) / height,
      lineEndU: (index) => (padX + lengths[index] * charW) / width,
      startU: padX / width,
      lineHeightV: lineH / height,
      charU: charW / width,
    };
  }

  dispose() {
    for (const texture of this.all) texture.dispose();
    this.all.length = 0;
  }
}
