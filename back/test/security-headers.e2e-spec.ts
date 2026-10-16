import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupOpenApi } from '../src/openapi/openapi.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { applySecurityHeaders } from '../src/security/security-headers.js';

describe('Security headers (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $disconnect: vi.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    applySecurityHeaders(app);
    setupOpenApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(['/health/live', '/does-not-exist', '/docs'])(
    'GET %s carries the security headers',
    async (path) => {
      const response = await request(app.getHttpServer()).get(path);

      expect(response.headers).toMatchObject({
        'strict-transport-security': expect.stringContaining(
          'max-age=',
        ) as unknown,
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'content-security-policy': expect.stringContaining(
          "frame-ancestors 'self'",
        ) as unknown,
      });
      expect(response.headers).not.toHaveProperty('x-powered-by');
    },
  );
});
