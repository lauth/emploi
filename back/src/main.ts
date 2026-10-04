import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import type { EnvironmentVariables } from './config/env.validation.js';
import { setupOpenApi } from './openapi/openapi.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.disable('x-powered-by');
  const config: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);

  app.enableCors({
    origin: config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
  });
  app.enableShutdownHooks();

  if (config.get('API_DOCS_ENABLED', { infer: true })) {
    setupOpenApi(app);
  }

  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
}

await bootstrap();
