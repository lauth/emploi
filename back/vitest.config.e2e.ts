import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Valid environment for ConfigModule; the database is mocked in e2e tests.
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      CORS_ORIGINS: 'https://emploi.localhost',
    },
  },
});
