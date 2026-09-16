/**
 * Design tokens resolved from Figma via `get_variable_defs`
 * (Marketing Platform | Design System — AMC+ Hero, node 61:4453).
 *
 * Only real design tokens are included here; Figma content strings
 * (headline/body copy) were intentionally dropped. Keys are named toward
 * Tailwind theme keys so they can be spread into the theme config.
 */
export const tokens = {
  colors: {
    "on-surface": "#ffffff",
    "action-primary": "#fdb517",
    "text-primary": "#000000",
    "text-secondary": "#ffffff",
    "text-tertiary": "#e6e6e6",
  },
  spacing: {
    4: "16px",
    5: "20px",
    6: "24px",
    7: "32px",
    9: "48px",
    10: "64px",
    13: "128px",
  },
  fontSize: {
    2: "12px",
    5: "18px",
    6: "20px",
    11: "48px",
  },
  lineHeight: {
    1: "14px",
    6: "24px",
    7: "25px",
    11: "48px",
  },
  fontFamily: {
    headline: "Inter",
    body: "Inter",
    cta: "Inter",
  },
  fontWeight: {
    regular: 400,
    bold: 700,
  },
} as const;

export type Tokens = typeof tokens;
