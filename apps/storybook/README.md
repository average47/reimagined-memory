# storybook — component workbench

[Storybook](https://storybook.js.org/) (React + Vite) for developing and
visually testing the `@repo/ui` components in isolation, under every brand. The
package is named `workbench` to avoid a clash with the `storybook` dependency.

## Commands

Run from this directory (or `pnpm --filter workbench <script>` from the repo root):

| Command                         | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `pnpm --filter workbench dev`   | Serve Storybook (http://localhost:6006)       |
| `pnpm --filter workbench build` | Build a static Storybook into `storybook-static/` |
| `pnpm --filter workbench typecheck` | Type-check                                |

`pnpm dev` at the repo root starts this alongside Next and the proxy.

## Writing stories

Add `*.stories.tsx` files under `src/`. Import components from `@repo/ui` and use
the design-token utility classes — Tailwind and the theme tokens are wired up via
`src/styles.css`, which reuses the web app's token entrypoint so stories render
exactly as the app does.

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '@repo/ui';

const meta = { title: 'Icon' } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => <Icon name="playArrow" size="lg" /> };
```

- **Brand theming** is a toolbar switcher ("Brand"), wired in
  `.storybook/preview.tsx` — it sets `data-brand` so the components pick up that
  brand's token overrides. Switch brands there instead of writing per-brand stories.
- Styling/tokens are configured in `.storybook/main.ts` (the `@tailwindcss/vite`
  plugin + `src/styles.css`).

## Served at `/styleguide`

The dev proxy (`apps/proxy`) mounts Storybook under
`http://<brand>.localhost:3001/styleguide`. Storybook's Vite base is set to
`/styleguide/` so the preview's asset URLs sit under that path. Live reload
(WebSockets) doesn't survive the HTTP-only proxy, so for active development open
Storybook directly at http://localhost:6006.
