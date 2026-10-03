import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  const prisma = { $queryRaw: vi.fn() };
  let service: HealthService;

  beforeEach(async () => {
    prisma.$queryRaw.mockReset();
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(HealthService);
  });

  it('reports the database as reachable when the query succeeds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.isDatabaseReachable()).resolves.toBe(true);
  });

  it('reports the database as unreachable when the query fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(service.isDatabaseReachable()).resolves.toBe(false);
  });
});
