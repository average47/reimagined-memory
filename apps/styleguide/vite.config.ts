import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Storybook's react-vite builder merges this config, so the Tailwind v4 plugin
// here is what makes stories render with the same utilities/tokens as the app.
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    fs: {
      // Allow reading the shared token CSS (apps/web) and scanning packages/ui,
      // which live above this app in the monorepo.
      allow: [fileURLToPath(new URL('../..', import.meta.url))],
    },
  },
});
