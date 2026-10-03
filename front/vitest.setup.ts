import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Server components and server actions read translations through
// `next-intl/server`, which needs a Next.js request. In tests, serve the real
// French catalogue instead (src/test/intl.tsx).
vi.mock('next-intl/server', async () => {
  const { DEFAULT_LOCALE } = await import('./src/i18n/config');
  const { testFormatter, testTranslator } = await import('./src/test/intl');
  // The namespaced key is only known at runtime here: loosen the typed translator.
  const translate = testTranslator as unknown as (
    key: string,
    values?: Record<string, unknown>,
  ) => string;
  return {
    getLocale: () => Promise.resolve(DEFAULT_LOCALE),
    getFormatter: () => Promise.resolve(testFormatter),
    getTranslations: (namespace?: string) =>
      Promise.resolve((key: string, values?: Record<string, unknown>) =>
        translate(namespace ? `${namespace}.${key}` : key, values),
      ),
  };
});
