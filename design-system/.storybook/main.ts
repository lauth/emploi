import type { StorybookConfig } from '@storybook/react-vite';

// Storybook of the design system (adrs/0017-design-system-package-with-storybook.md).
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  core: { disableTelemetry: true },
};

export default config;
