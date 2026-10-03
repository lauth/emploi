import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Health (e2e)', () => {
  const prisma = { $queryRaw: vi.fn(), $disconnect: vi.fn() };
  let app: INestApplication<App>;

  beforeEach(async () => {
    prisma.$queryRaw.mockReset();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health/live', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /health/ready when the database is reachable', () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /health/ready when the database is unreachable', () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    return request(app.getHttpServer()).get('/health/ready').expect(503);
  });
});
