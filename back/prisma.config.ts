import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Not `env()`: commands like `prisma generate` must work without a database URL.
    url: process.env.DATABASE_URL ?? '',
  },
});
