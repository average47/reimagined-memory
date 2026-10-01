import { cn } from "@repo/utils";
import type { ButtonProps, ButtonVariant } from "./Button.types";

/*
 * Button — recreated from the Figma "Button" component set (node 2:138).
 *
 * The design's Default/Hover columns become real CSS `:hover` states, and the
 * Desktop/Mobile "Breakpoint" variants on the primary type become responsive
 * sizing. Every color, size and spacing value resolves through the semantic
 * tokens in app/globals.css (action/*, hover/*, border/*, text/*, the type
 * ramp and the spacing scale), so each brand restyles via [data-brand] rather
 * than forking this component.
 *
 * The secondary variant's 28px design padding has no exact spacing token (it
 * sits between spacing-6/24px and spacing-7/32px), so it snaps to the nearest,
 * `px-7`.
 */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary text-text-primary hover:bg-hover-primary " +
    "px-8 py-3 text-4 sm:px-10 sm:py-4 sm:text-5",
  secondary:
    "gap-3 border border-border-default bg-action-secondary text-text-secondary " +
    "hover:border-hover-secondary hover:bg-hover-secondary px-7 py-4 text-4",
  tertiary:
    "border border-border-default bg-action-tertiary text-text-tertiary " +
    "hover:bg-hover-tertiary px-4 py-2 text-3",
};

export function Button({
  variant = "primary",
  icon,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-cta font-bold",
        "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
