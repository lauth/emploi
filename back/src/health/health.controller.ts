import type { HealthStatus } from '@emploi/shared';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../common/api-docs.js';
import { HealthService } from './health.service.js';

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
  @ApiServiceUnavailableResponse({
    type: ApiErrorDto,
    description: 'The database is unreachable.',
    example: {
      statusCode: 503,
      message: 'Database unreachable',
      error: 'Service Unavailable',
    } satisfies ApiErrorDto,
  })
  async ready(): Promise<HealthStatus> {
    if (!(await this.health.isDatabaseReachable())) {
      throw new ServiceUnavailableException('Database unreachable');
    }
    return { status: 'ok' };
  }
}
