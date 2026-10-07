import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  const health = { isDatabaseReachable: vi.fn<() => Promise<boolean>>() };
  let controller: HealthController;

  beforeEach(async () => {
    health.isDatabaseReachable.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: health }],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('is live', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('is ready when the database is reachable', async () => {
    health.isDatabaseReachable.mockResolvedValue(true);

    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
  });

  it('is not ready when the database is unreachable', async () => {
    health.isDatabaseReachable.mockResolvedValue(false);

    await expect(controller.ready()).rejects.toMatchObject({
      problemType: 'service-unavailable',
    });
  });
});
