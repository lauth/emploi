import '@testing-library/jest-dom/vitest';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as a11yAnnotations from '@storybook/addon-a11y/preview';
import { cleanup } from '@testing-library/react';
import * as previewAnnotations from './.storybook/preview';

// Stories run as tests with the same configuration as in Storybook, including
// the accessibility checks (src/stories.test.tsx).
setProjectAnnotations([a11yAnnotations, previewAnnotations]);

afterEach(() => {
  cleanup();
});
