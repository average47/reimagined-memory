import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Visual treatment, mirroring the Figma Button "Type" variants:
 * - `primary`   — solid amber fill, inverts to white on hover (main CTA)
 * - `secondary` — bordered dark fill with a leading icon (e.g. "Watch Free Episode")
 * - `tertiary`  — compact bordered dark pill for low-emphasis actions ("Sign In")
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Optional leading glyph; the secondary CTA pairs an <Icon> with its label. */
  icon?: ReactNode;
}
