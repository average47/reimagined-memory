import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/styles.css';

/**
 * Brand switcher in the toolbar. Each brand's `[data-brand]` token overrides
 * (colors.css) re-theme the components live; the empty value is White Label.
 */
const BRANDS = [
  { value: '', title: 'White Label' },
  { value: 'amcplus', title: 'AMC+' },
  { value: 'shudder', title: 'Shudder' },
  { value: 'acorn', title: 'Acorn' },
  { value: 'sundancenow', title: 'Sundance Now' },
  { value: 'wetv', title: 'We TV' },
];

export const globalTypes = {
  brand: {
    description: 'Brand theme',
    defaultValue: '',
    toolbar: {
      title: 'Brand',
      icon: 'paintbrush',
      items: BRANDS,
      dynamicTitle: true,
    },
  },
};

// Wraps every story: applies the active brand + the base font/text token so
// components render in context.
const withBrand: Decorator = (Story, context) => (
  <div
    data-brand={context.globals.brand || undefined}
    className="font-body text-text-primary"
  >
    <Story />
  </div>
);

const preview: Preview = {
  decorators: [withBrand],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
