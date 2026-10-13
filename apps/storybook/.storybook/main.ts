import { dirname } from "node:path";
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [getAbsolutePath("@storybook/addon-mcp"), getAbsolutePath("@storybook/addon-docs")],
  framework: { name: getAbsolutePath("@storybook/react-vite"), options: {} },
  core: { disableTelemetry: true },
  viteFinal: async (vite) => {
    // Served under /styleguide (via apps/proxy), so the Vite-built preview must
    // emit its asset/module URLs under that base. The Storybook manager already
    // uses relative paths, so it rides the same prefix.
    vite.base = '/styleguide/';
    // Tailwind v4 so stories render with the same utilities/tokens as the app.
    vite.plugins = vite.plugins ?? [];
    vite.plugins.push(tailwindcss());
    // Allow reading the shared token CSS (apps/web) and scanning packages/ui,
    // which live above this app in the monorepo.
    vite.server = vite.server ?? {};
    vite.server.fs = { allow: [repoRoot], ...(vite.server.fs ?? {}) };
    return vite;
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
