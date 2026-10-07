# ladle — component testing

[Ladle](https://ladle.dev/) workbench for developing and visually testing the
`@repo/ui` components in isolation (a lightweight, Vite-based Storybook
alternative).

## Commands

Run from this directory (or `pnpm --filter ladle <script>` from the repo root):

| Command                     | Description                                  |
| --------------------------- | -------------------------------------------- |
| `pnpm --filter ladle dev`   | Serve the workbench (http://localhost:61000/styleguide/) |
| `pnpm --filter ladle build` | Build a static workbench into `build/`       |
| `pnpm --filter ladle preview` | Preview the built workbench                 |

## Serving under the brand sites (`/styleguide`)

This app is mounted at base `/styleguide/` (`.ladle/config.mjs`) so the dev
proxy (`apps/proxy`) can route `http://<brand>.localhost:3001/styleguide` to it
while everything else goes to Next. `pnpm dev` at the repo root starts Next, the
proxy, and this app together.

Branding follows the domain: the global Provider (`.ladle/components.tsx`)
derives the brand from the `*.localhost` subdomain (overridable with
`?brand=<brand>`) and sets `data-brand`, so stories pick up that brand's token
overrides. Standalone, open http://localhost:61000/styleguide/ (append
`?brand=amcplus` to theme). Note: HMR over the proxy is limited (the proxy
doesn't upgrade WebSockets) — develop at `:61000` directly for live reload.

## Writing stories

Add `*.stories.tsx` files under `src/`. Import components from `@repo/ui` and use
the design-token utility classes — Tailwind and the theme tokens are wired up via
`src/styles.css`, which reuses the web app's token entrypoint so stories render
exactly as the app does.

```tsx
import type { Story } from '@ladle/react';
import { Icon } from '@repo/ui';

export default { title: 'Icon' };

export const Default: Story = () => <Icon name="playArrow" size="lg" />;
```

Styling is wired in `.ladle/components.tsx` (global Provider + `styles.css`) and
`vite.config.ts` (the `@tailwindcss/vite` plugin).
