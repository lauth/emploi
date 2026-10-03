import type { HealthStatus } from '@emploi/shared';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service.js';

/** Probes used by Kubernetes (k8s/back.yaml). */
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** The process is up. */
  @Get('live')
  live(): HealthStatus {
    return { status: 'ok' };
  }

  /** The API can serve requests: the database is reachable. */
  @Get('ready')
  async ready(): Promise<HealthStatus> {
    if (!(await this.health.isDatabaseReachable())) {
      throw new ServiceUnavailableException('Database unreachable');
    }
    return { status: 'ok' };
  }
}
