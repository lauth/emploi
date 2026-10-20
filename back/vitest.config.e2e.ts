import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Valid environment for ConfigModule; the database is mocked in e2e tests,
    // image files go to a fresh temporary directory.
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      CORS_ORIGINS: 'https://emploi.localhost',
      IMAGES_DIR: mkdtempSync(join(tmpdir(), 'emploi-e2e-images-')),
    },
  },
});
