import { headers } from 'next/headers';
import { Icon } from '@repo/ui';
import {
  getMenu,
  isLibraryTenant,
  LIBRARY_TENANT,
  tenantForNetworkPath,
} from '@/lib/wordpress';
import type { MenuItemNode } from '@/lib/wordpress.types';

/**
 * Site footer, built from the two footer menu layers.
 *
 * Six grid items that reflow across the breakpoints. Mobile-first: the base
 * grid is a single column, so the six items stack as six rows. Each larger
 * breakpoint only widens the track count, and the last two items always span
 * the full width, which is what collapses the row count:
 *
 *   base   1 column  — 6 rows:  each item on its own row
 *   md     2 columns — 4 rows:  items 1-4 fill rows 1-2, items 5 and 6 each
 *                               span both columns (rows 3 and 4)
 *   lg     4 columns — 3 rows:  items 1-4 fill row 1, items 5 and 6 each span
 *                               all four columns (rows 2 and 3)
 *
 * Items 1-4 are the subsite's own ("local") footer menu, one column per
 * top-level group. Item 5 is the copyright. Item 6 is the global footer menu
 * from the default site, as a list that stacks on mobile and lays out
 * horizontally from `md` up.
 */

/** The two full-width items: span every column at `md` and `lg`. */
const FULL_WIDTH = 'md:col-span-2 lg:col-span-4';

/**
 * Grid tracks available to the local menu.
 *
 * The grid's row counts depend on there being exactly six items, so a local
 * menu with more top-level groups than this is truncated rather than allowed
 * to add cells and push the spanning rows out of place.
 */
const COLUMN_COUNT = 4;

/**
 * One menu item as a link.
 *
 * Honors the two menu-item options the CMS exposes: "Open in new tab"
 * (`target`) and "Use icon" (`useIcon`), the latter rendering the sprite icon
 * named after the lowercased label instead of the text, with the label kept as
 * the accessible name.
 */
function MenuLink({ item }: { item: MenuItemNode }) {
  const external = item.target === '_blank';
  const useIcon = item.useIcon === true;

  return (
    <a
      href={item.url ?? '#'}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
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
}

export async function Footer() {
  // Which subsite is being served. Set by middleware; `main` (the unbranded
  // default) is both the library and the fallback.
  const networkPath = (await headers()).get('x-network-path');
  const tenant = tenantForNetworkPath(networkPath);

  // Both menu layers. The default site's menu is the global layer; the current
  // subsite's is the local one. On the default site itself the two would be the
  // same menu, so the local layer is empty.
  const [globalItems, localItems] = await Promise.all([
    getMenu(LIBRARY_TENANT, 'FOOTER').catch(() => [] as MenuItemNode[]),
    isLibraryTenant(tenant)
      ? Promise.resolve<MenuItemNode[]>([])
      : getMenu(tenant, 'FOOTER').catch(() => [] as MenuItemNode[]),
  ]);

  const year = new Date().getFullYear();

  // Each top-level group of the local menu is one column: the group is the
  // heading, its children are that column's links.
  const localChildrenOf = (id: string | null) =>
    localItems.filter((item) => item.parentId === id);
  const columns = localChildrenOf(null).slice(0, COLUMN_COUNT);

  return (
    <footer className="bg-gray-900 text-gray-50 p-7">
      <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Items 1-4 — the local menu's groups, one track each. */}
        {columns.map((group) => {
          const groupItems = localChildrenOf(group.id);
          // An all-icon group (e.g. social) reads as a row; text items stack.
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
                  <li key={item.id}>
                    <MenuLink item={item} />
                  </li>
                ))}
              </ul>
            </li>
          );
        })}

        {/* Item 5 — copyright, full-width row (row 3 at `md`, row 2 at `lg`). */}
        <li className={FULL_WIDTH}>
          <p className="text-sm">
            © 2020-{year} AMC Global Media Inc. All rights reserved.
          </p>
        </li>

        {/* Item 6 — the global (default site) footer menu, full-width row
            (row 4 at `md`, row 3 at `lg`). The list itself stacks on mobile and
            becomes a wrapping horizontal row from `md` up. */}
        <li className={FULL_WIDTH}>
          <ul className="flex flex-col gap-3 md:flex-row md:flex-wrap md:gap-x-6 md:gap-y-2">
            {globalItems.map((item) => (
              <li key={item.id}>
                <MenuLink item={item} />
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </footer>
  );
}
