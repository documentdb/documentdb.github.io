// Colour roles: emerald is the document API side, sky is the
// PostgreSQL side, violet is vector search, amber marks superseded data.

export const hex = {
  bg: 0x05070a,
  sky: 0x7dd3fc,
  skyDeep: 0x38bdf8,
  emerald: 0x6ee7b7,
  emeraldDeep: 0x34d399,
  amber: 0xfbbf24,
  violet: 0xc4b5fd,
  violetDeep: 0xa78bfa,
  ink: 0xe6f1ff,
  dim: 0x4b6477,
} as const;

export const css = {
  sky: "#7dd3fc",
  skyDeep: "#38bdf8",
  emerald: "#6ee7b7",
  amber: "#fbbf24",
  violet: "#c4b5fd",
  ink: "#e6f1ff",
  dim: "#8aa2b6",
  faint: "#5b7186",
  // code tokens
  key: "#7dd3fc",
  string: "#a7f3d0",
  number: "#fde68a",
  punct: "#7388a0",
  fn: "#c4b5fd",
  // mock application chrome: a light, ordinary shopping app
  uiBg: "#f1f4f8",
  uiSurface: "#ffffff",
  uiSurface2: "#eef2f7",
  uiLine: "#dde4ec",
  uiText: "#0f172a",
  uiMuted: "#64748b",
  uiAccent: "#0b74c4",
  uiGreen: "#059669",
  uiGreenSoft: "#dcfce7",
  uiAmber: "#b45309",
  uiAmberSoft: "#fef3c7",
} as const;

export type CssColor = keyof typeof css;
