import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    env: {
      // Tells the accessibility addon it runs in plain Vitest, so violations
      // fail the story tests instead of only being reported.
      VITEST_STORYBOOK: 'false',
    },
    // The addon reads that flag from `import.meta.env`, which only exists in
    // modules transformed by Vite: process it instead of loading it as is.
    server: { deps: { inline: [/@storybook\/addon-a11y/] } },
  },
});
