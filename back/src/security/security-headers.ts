import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Security headers on every response, with helmet's defaults
 * (adrs/0029-security-headers.md): HSTS, `nosniff`, no framing, a CSP that
 * Swagger UI works with (its scripts are files, its styles inline), and no
 * `X-Powered-By`.
 */
export function applySecurityHeaders(app: INestApplication): void {
  app.use(helmet());
}
