import type { JSX } from 'react';
import type { IconProps } from './Icon.types';
//@ts-expect-error –- IGNORE error from import ---
import sprite from './sprite.svg?url';

export default function Icon({ ...props }: IconProps): JSX.Element {
  const sizes = () => {
    switch (props.size) {
      case 'sm':
        return '12px';
      case 'md':
        return '16px';
      case 'lg':
        return '24px';
      case 'xl':
        return '36px';
      default:
        return '24px';
    }
  };
  return (
    <svg
      width={sizes()}
      height={sizes()}
      viewBox="0 0 24 24"
      className={props.className}
      fill="currentColor"
    >
      <use href={`${sprite.src}#${props.name}`} />
    </svg>
  );
}
