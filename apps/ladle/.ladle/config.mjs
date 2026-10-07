/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: 'src/**/*.stories.{js,jsx,ts,tsx}',
  defaultStory: '',
  // Mounted under /styleguide so the brand sites can proxy the path to this
  // app with correct asset URLs (see apps/proxy). Standalone access is
  // http://localhost:61000/styleguide/.
  base: '/styleguide/',
};
