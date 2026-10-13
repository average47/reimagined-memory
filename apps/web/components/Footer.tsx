import type { JSX } from 'react';
import { Icon } from '@repo/ui';
import type { MenuItemNode } from '@/lib/wordpress.types';

/**
 * Site footer. Mobile-first: a single column. At the `md` breakpoint it becomes
 * a 4-column grid where row 1 is the four columns and rows 2 and 3 each span all
 * four columns.
 *
 * Row 1   — the first top-level menu group's children, each a column (heading +
 *           its links).
 * Row 2   — copyright (dynamic end year).
 * Row 3   — the last top-level group's items (legal/links bar), column on mobile
 *           / row at `md`.
 */
export function Footer({ items }: { items: MenuItemNode[] }) {
  const year = new Date().getFullYear();

  const childrenOf = (id: string | null) =>
    items.filter((item) => item.parentId === id);

  const topLevel = childrenOf(null);
  const firstGroup = topLevel.at(0);
  const lastGroup = topLevel.at(-1);
  const columnGroups = firstGroup ? childrenOf(firstGroup.id) : [];
  const lastItems = lastGroup ? childrenOf(lastGroup.id) : [];

  // Anchor that honors "Open in new tab" (target `_blank`) and "Use icon"
  // (render the Icon named after the lowercased label instead of the text).
  const link = (item: MenuItemNode): JSX.Element => {
    const useIcon = item.useIcon === true;
    return (
      <a
        href={item.url ?? '#'}
        target={item.target === '_blank' ? '_blank' : undefined}
        rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
        aria-label={useIcon ? (item.label ?? undefined) : undefined}
        className="inline-flex items-center text-sm hover:underline"
      >
        {useIcon ? (
          <Icon name={(item.label ?? '').toLowerCase()} size="md" />
        ) : (
          item.label
        )}
      </a>
    );
  };

  return (
    <footer className="bg-gray-900 text-gray-50 p-7">
      <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Row 1 — one column per child of the first menu group: the header,
            then its items below. Icon items lay out in a row; text items stack. */}
        {columnGroups.map((group) => {
          const groupItems = childrenOf(group.id);
          const iconRow =
            groupItems.length > 0 && groupItems.every((item) => item.useIcon);
          return (
            <li key={group.id}>
              <p className="font-bold uppercase">{group.label}</p>
              <ul
                className={`mt-2 flex ${
                  iconRow ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'
                }`}
              >
                {groupItems.map((item) => (
                  <li key={item.id}>{link(item)}</li>
                ))}
              </ul>
            </li>
          );
        })}

        {/* Row 2 — full width: copyright. */}
        <li className="md:col-span-2 lg:col-span-4">
          <p className="text-sm">
            © 2020-{year} AMC Global Media Inc. All rights reserved.
          </p>
        </li>

        {/* Row 3 — full width: last menu group, column on mobile / row at md. */}
        <li className="md:col-span-2 lg:col-span-4">
          <ul className="flex flex-col gap-3 md:flex-row md:flex-wrap md:gap-x-6 md:gap-y-2">
            {lastItems.map((item) => (
              <li key={item.id}>{link(item)}</li>
            ))}
          </ul>
        </li>
      </ul>
    </footer>
  );
}
