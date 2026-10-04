import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';

/** Swagger UI path; the OpenAPI document is served at `/docs-json`. */
export const API_DOCS_PATH = 'docs';

/** The OpenAPI document of the API (adrs/0018-openapi-documentation.md). */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('emploi API')
    .setDescription(
      'Job search history: the job offers the user responded to and the ' +
        'steps of their interview processes. Validation errors answer 400 ' +
        'with the list of problems in `message`.',
    )
    .setVersion('1.0')
    .addTag('offers', 'Job offers the user responded to.')
    .addTag(
      'interview-steps',
      'Steps of the interview process of an offer, in the order chosen by the user.',
    )
    .addTag('health', 'Probes used by Kubernetes.')
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Serves Swagger UI at `/docs` and the document at `/docs-json`. */
export function setupOpenApi(app: INestApplication): void {
  SwaggerModule.setup(API_DOCS_PATH, app, () => createOpenApiDocument(app), {
    jsonDocumentUrl: `${API_DOCS_PATH}-json`,
    customSiteTitle: 'emploi API',
  });
}
