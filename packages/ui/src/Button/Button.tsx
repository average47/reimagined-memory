import type { JSX } from 'react';
import { cn } from '@repo/utils';
import { Icon } from '../Icon';
import type { ButtonProps, ButtonVariant } from './Button.types';

// Strokes are `inset-ring`s, not borders: Figma draws them inside the box, so
// they must not add to the padded height (e.g. secondary is 16 + 22 + 16 = 54).
const variantClasses: Record<ButtonVariant, string> = {
  // 36px (mobile x-padding) and 54px (desktop height) have no spacing token.
  primary: cn(
    'bg-action-primary text-text-primary hover:bg-hover-primary',
    'px-[36px] py-3 text-4 leading-(--text-5--line-height)',
    'lg:h-[54px] lg:px-10 lg:py-4 lg:text-5 lg:leading-(--text-7--line-height)',
  ),
  // 28px x-padding has no spacing token.
  secondary: cn(
    'bg-action-secondary text-text-secondary inset-ring inset-ring-border-default',
    'hover:bg-hover-secondary hover:inset-ring-hover-secondary',
    'gap-3 px-[28px] py-4 text-4 leading-(--text-5--line-height)',
  ),
  tertiary: cn(
    'bg-action-tertiary text-text-tertiary inset-ring inset-ring-border-default',
    'hover:bg-hover-tertiary',
    'gap-2 px-4 py-2 text-3 leading-(--text-4--line-height)',
  ),
};

export default function Button(props: ButtonProps): JSX.Element {
  const classes = cn(
    'inline-flex cursor-pointer items-center justify-center rounded-xl text-center font-cta font-bold whitespace-nowrap transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hover',
    variantClasses[props.variant ?? 'primary'],
    props.className,
  );

  const content = (
    <>
      {props.icon && (
        <span aria-hidden="true" className="flex shrink-0">
          <Icon name={props.icon} size="md" />
        </span>
      )}
      {props.label}
    </>
  );

  if (props.href !== undefined) {
    const { variant: _variant, label: _label, icon: _icon, className: _className, ...rest } = props;
    return (
      <a data-component="Button" {...rest} className={classes}>
        {content}
      </a>
    );
  }

  const { variant: _variant, label: _label, icon: _icon, className: _className, type = 'button', ...rest } = props;
  return (
    <button data-component="Button" type={type} {...rest} className={classes}>
      {content}
    </button>
  );
}
