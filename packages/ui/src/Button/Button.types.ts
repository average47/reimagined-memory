import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';

/** Visual treatment, from most to least prominent. */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface ButtonBaseProps {
  /** Visual treatment. Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Visible label, e.g. "Start Free Trial". */
  label: ReactNode;
  /** Optional leading glyph — an `Icon` sprite name, e.g. `play`. */
  icon?: string;
  className?: string;
}

/** Renders a native `<button>` for in-page actions. */
export interface ButtonAsButtonProps
  extends ButtonBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  href?: undefined;
}

/** Renders an `<a>` styled as a button when an `href` is given (CTAs that navigate). */
export interface ButtonAsLinkProps
  extends ButtonBaseProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> {
  href: string;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;
