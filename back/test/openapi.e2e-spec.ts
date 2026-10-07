import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupOpenApi } from '../src/openapi/openapi.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface Operation {
  summary?: string;
  tags?: string[];
  parameters?: unknown[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
}

/** Every operation of the document, as "METHOD /path". */
function operations(document: OpenAPIObject): [string, Operation][] {
  return Object.entries(document.paths).flatMap(([path, item]) =>
    HTTP_METHODS.flatMap((method) => {
      const operation = (item as Partial<Record<string, Operation>>)[method];
      return operation
        ? [
            [`${method.toUpperCase()} ${path}`, operation] as [
              string,
              Operation,
            ],
          ]
        : [];
    }),
  );
}

describe('OpenAPI documentation (e2e)', () => {
  let app: INestApplication<App>;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $disconnect: vi.fn() })
      .compile();
    app = moduleRef.createNestApplication();
    setupOpenApi(app);
    await app.init();

    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    document = response.body as OpenAPIObject;
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves Swagger UI', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('swagger-ui');
  });

  it('documents every route', () => {
    expect(
      operations(document)
        .map(([name]) => name)
        .sort(),
    ).toEqual([
      'DELETE /offers/{id}',
      'DELETE /offers/{offerId}/steps/{stepId}',
      'GET /health/live',
      'GET /health/ready',
      'GET /offers',
      'GET /offers/{id}',
      'GET /offers/{offerId}/steps',
      'GET /offers/{offerId}/steps/{stepId}',
      'GET /problems',
      'GET /problems/{type}',
      'PATCH /offers/{id}',
      'PATCH /offers/{offerId}/steps/{stepId}',
      'POST /offers',
      'POST /offers/{offerId}/steps',
      'PUT /offers/{offerId}/steps/order',
    ]);
  });

  it('gives every operation a summary, a tag and its responses', () => {
    for (const [name, operation] of operations(document)) {
      expect(operation.summary, name).toBeTruthy();
      expect(operation.tags, name).toHaveLength(1);
      expect(Object.keys(operation.responses).length, name).toBeGreaterThan(0);
    }
  });

  it('documents the validation errors of every route that takes input', () => {
    // Not validated: an unknown problem type is a missing page (404).
    const lookups = ['GET /problems/{type}'];
    for (const [name, operation] of operations(document)) {
      const takesInput =
        (operation.parameters?.length ?? 0) > 0 ||
        operation.requestBody !== undefined;
      if (takesInput && !lookups.includes(name)) {
        expect(operation.responses, name).toHaveProperty('400');
      }
    }
  });

  // adrs/0024-problem-details-errors.md
  it('documents every error response as Problem Details', () => {
    for (const [name, operation] of operations(document)) {
      for (const [status, response] of Object.entries(operation.responses)) {
        if (Number(status) >= 400) {
          expect(response, `${name} ${status}`).toMatchObject({
            content: {
              'application/problem+json': {
                schema: { $ref: '#/components/schemas/ProblemDetailsDto' },
              },
            },
          });
        }
      }
    }
  });

  // The committed document must match the code (adrs/0018-openapi-documentation.md).
  // After an API change, regenerate it with `make openapi`.
  it('matches back/openapi.json', async () => {
    await expect(`${JSON.stringify(document, null, 2)}\n`).toMatchFileSnapshot(
      '../openapi.json',
    );
  });
});
