# styleguide — component workbench

[Storybook](https://storybook.js.org/) workbench for developing and visually
testing the `@repo/ui` components in isolation, under every brand.

The package is named `styleguide` rather than `storybook` because a workspace
package can't depend on a package of its own name, and Storybook ships its core
as the `storybook` dependency.

## Commands

Run from this directory (or `pnpm --filter styleguide <script>` from the repo root):

| Command                            | Description                                      |
| ---------------------------------- | ------------------------------------------------ |
| `pnpm --filter styleguide dev`     | Serve the workbench (http://localhost:61000/)    |
| `pnpm --filter styleguide build`   | Build a static workbench into `storybook-static/` |
| `pnpm --filter styleguide preview` | Serve the built static workbench                 |

`dev` passes `--exact-port`, so it fails loudly instead of drifting to another
port — the dev proxy routes to `:61000` by hostname and port, and a silent
change would break `/styleguide`.

## Serving under the brand sites (`/styleguide`)

Storybook's dev server has no `base` option and ignores Vite's, so it always
serves from the root of `:61000`. The dev proxy (`apps/proxy`) bridges
the gap: it strips the `/styleguide` prefix before forwarding, and routes the
root-absolute URLs the preview iframe requests (`/@vite/client`, `/sb-manager/*`,
…) to Storybook by matching their `Referer` against the mount point. `pnpm dev`
at the repo root starts Next, the proxy, and this app together.

A **static build** needs none of that — `storybook build` emits entirely
relative asset paths, so `storybook-static/` can be served from any subpath.

Branding follows the domain: the global decorator (`.storybook/preview.tsx`)
derives the brand from the `*.localhost` subdomain (overridable with
`?brand=<brand>`) and sets `data-brand`, so stories pick up that brand's token
overrides. The **Brand** toolbar switches it per story; leaving it on
`Auto (from domain)` defers to the URL. Standalone, open
http://localhost:61000/ (append `?brand=amcplus` to theme).

Two caveats, both pre-existing:

- HMR over the proxy is limited (the proxy doesn't upgrade WebSockets) —
  develop at `:61000` directly for live reload.
- The brand fonts are loaded by the Next.js app via `next/font`
  (`apps/web/app/layout.tsx`), so the workbench falls back to a default sans.
  Brand **colors** theme correctly; the typeface won't match the real site.

## Writing stories

Add `*.stories.tsx` files under `src/`. Import components from `@repo/ui` and use
the design-token utility classes — Tailwind and the theme tokens are wired up via
`src/styles.css`, which reuses the web app's token entrypoint so stories render
exactly as the app does.

Stories use [CSF 3](https://storybook.js.org/docs/api/csf): a default-exported
`meta` plus one object per story, so props come through `args` and get controls
and generated prop tables for free.

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '@repo/ui';

const meta = {
  title: 'Icon',
  component: Icon,
  args: { name: 'playArrow', size: 'lg' },
} satisfies Meta<typeof Icon>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
```

Styling and theming are wired in `.storybook/preview.tsx` (global decorator +
`styles.css`) and `vite.config.ts` (the `@tailwindcss/vite` plugin, merged in by
the react-vite builder).
