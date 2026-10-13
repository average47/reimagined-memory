import type { StorybookConfig } from '@storybook/react-vite';

// The Vite config next to this folder (tailwind plugin + monorepo `fs.allow`)
// is picked up and merged by the react-vite builder, so it stays the single
// place where bundling concerns live.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    // Generate prop tables from the components' own `<Name>.types.ts` props.
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
