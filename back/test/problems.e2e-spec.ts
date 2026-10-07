import type { ProblemDetails } from '@emploi/shared';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Every error is RFC 9457 Problem Details (adrs/0024-problem-details-errors.md).

const OFFER_ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';
const STEP_ID = '0199a7a4-3c2e-7b6a-9c1d-00000000000a';

describe('Problem Details (e2e)', () => {
  const prisma = {
    offer: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    interviewStep: { delete: vi.fn() },
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
  };
  let app: INestApplication<App>;

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
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

  /** Sends a request and checks the Problem Details envelope. */
  async function problem(
    test: request.Test,
    status: number,
  ): Promise<ProblemDetails> {
    const response = await test.expect(status);
    expect(response.headers['content-type']).toMatch(
      /^application\/problem\+json/,
    );
    const body = JSON.parse(response.text) as ProblemDetails;
    expect(body).toMatchObject({
      type: expect.any(String) as unknown,
      title: expect.any(String) as unknown,
      status,
      detail: expect.any(String) as unknown,
      instance: expect.any(String) as unknown,
    });
    return body;
  }

  it('lists every invalid body value, with the accepted values and limits', async () => {
    const body = await problem(
      request(app.getHttpServer())
        .post('/offers')
        .send({ title: 'x'.repeat(201), status: 'hired', salary: 1 }),
      400,
    );

    expect(body).toMatchObject({
      type: '/problems/validation-error',
      title: 'Invalid request',
      instance: '/offers',
    });
    expect(body.detail).toContain('3 values are invalid');
    expect(body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'body',
          name: '/salary',
          code: 'whitelistValidation',
        }),
        expect.objectContaining({
          in: 'body',
          name: '/title',
          code: 'maxLength',
          maxLength: 200,
        }),
        expect.objectContaining({
          in: 'body',
          name: '/status',
          code: 'isIn',
          allowed: [
            'applied',
            'interviewing',
            'offered',
            'accepted',
            'rejected',
            'ghosted',
            'withdrawn',
          ],
        }),
      ]),
    );
  });

  it('names invalid query parameters', async () => {
    const body = await problem(
      request(app.getHttpServer()).get('/offers?limit=0&sort=salary'),
      400,
    );

    expect(body.instance).toBe('/offers');
    expect(body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'query', name: 'limit', code: 'min' }),
        expect.objectContaining({ in: 'query', name: 'sort', code: 'isIn' }),
      ]),
    );
  });

  it('names an invalid id in the path', async () => {
    const body = await problem(
      request(app.getHttpServer()).get(`/offers/${OFFER_ID}/steps/42`),
      400,
    );

    expect(body.errors).toEqual([
      {
        in: 'path',
        name: 'stepId',
        code: 'isUuid',
        detail: 'stepId must be a UUID, as returned by the API',
      },
    ]);
  });

  it('says a body that is not JSON is malformed', async () => {
    const body = await problem(
      request(app.getHttpServer())
        .post('/offers')
        .set('Content-Type', 'application/json')
        .send('{oops'),
      400,
    );

    expect(body.type).toBe('/problems/malformed-request');
  });

  it('says which resource is missing and how to find valid ids', async () => {
    prisma.offer.findUnique.mockResolvedValue(null);

    const offer = await problem(
      request(app.getHttpServer()).get(`/offers/${OFFER_ID}`),
      404,
    );
    expect(offer).toMatchObject({
      type: '/problems/resource-not-found',
      resource: 'offer',
      instance: `/offers/${OFFER_ID}`,
    });
    expect(offer.detail).toContain('GET /offers');

    prisma.interviewStep.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    const step = await problem(
      request(app.getHttpServer()).delete(
        `/offers/${OFFER_ID}/steps/${STEP_ID}`,
      ),
      404,
    );
    expect(step).toMatchObject({ resource: 'interview-step' });
    expect(step.detail).toContain(`GET /offers/${OFFER_ID}/steps`);
  });

  it('says when no endpoint matches', async () => {
    const body = await problem(
      request(app.getHttpServer()).put('/offers?x=1'),
      404,
    );

    expect(body).toMatchObject({
      type: '/problems/route-not-found',
      instance: '/offers',
    });
    expect(body.detail).toContain('PUT /offers');
  });

  it('hides unexpected failures behind an internal error', async () => {
    prisma.offer.findMany.mockRejectedValue(
      new Error('secret connection string'),
    );
    prisma.offer.count.mockResolvedValue(0);

    const body = await problem(
      request(app.getHttpServer()).get('/offers'),
      500,
    );

    expect(body.type).toBe('/problems/internal-error');
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('answers service-unavailable when the database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('down'));

    const body = await problem(
      request(app.getHttpServer()).get('/health/ready'),
      503,
    );

    expect(body.type).toBe('/problems/service-unavailable');
  });

  describe('GET /problems', () => {
    it('describes every kind of problem', async () => {
      const response = await request(app.getHttpServer())
        .get('/problems')
        .expect(200);

      expect(response.body).toContainEqual(
        expect.objectContaining({
          type: '/problems/validation-error',
          status: 400,
        }),
      );
    });

    it('describes the type URI of a problem', async () => {
      const response = await request(app.getHttpServer())
        .get('/problems/resource-not-found')
        .expect(200);

      expect(response.body).toMatchObject({
        type: '/problems/resource-not-found',
        title: 'Resource not found',
        status: 404,
        description: expect.stringContaining('GET /offers') as unknown,
      });
    });

    it('lists the kinds when asked an unknown one', async () => {
      const body = await problem(
        request(app.getHttpServer()).get('/problems/oops'),
        404,
      );

      expect(body.detail).toContain('validation-error');
    });
  });
});
