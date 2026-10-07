import type { HealthStatus } from '@emploi/shared';
import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { ApiUnavailable } from '../common/api-docs.js';
import { ProblemException } from '../problems/problem.exception.js';
import { HealthService } from './health.service.js';

const DATABASE_UNREACHABLE = 'The database is unreachable. Try again later.';

/** Response shape, for the OpenAPI document. */
class HealthStatusDto implements HealthStatus {
  @ApiProperty({ enum: ['ok'] })
  status: 'ok';
}

/** Probes used by Kubernetes (k8s/back.yaml). */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** The process is up. */
  @Get('live')
  @ApiOperation({ summary: 'Liveness: the process is up' })
  @ApiOkResponse({ type: HealthStatusDto })
  live(): HealthStatus {
    return { status: 'ok' };
  }

  /** The API can serve requests: the database is reachable. */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness: the database is reachable' })
  @ApiOkResponse({ type: HealthStatusDto })
  @ApiUnavailable('The database is unreachable.', DATABASE_UNREACHABLE)
  async ready(): Promise<HealthStatus> {
    if (!(await this.health.isDatabaseReachable())) {
      throw new ProblemException('service-unavailable', DATABASE_UNREACHABLE);
    }
    return { status: 'ok' };
  }
}
