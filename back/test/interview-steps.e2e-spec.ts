import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import {
  Prisma,
  type InterviewStep as InterviewStepModel,
} from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const OFFER_ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';
const STEP_ID = '0199a7a4-3c2e-7b6a-9c1d-00000000000a';
const OTHER_STEP_ID = '0199a7a4-3c2e-7b6a-9c1d-00000000000b';
const BASE = `/offers/${OFFER_ID}/steps`;

const model: InterviewStepModel = {
  id: STEP_ID,
  offerId: OFFER_ID,
  position: 0,
  title: 'Phone screen',
  description: null,
  date: new Date('2026-10-06T00:00:00.000Z'),
  status: 'planned',
  createdAt: new Date('2026-10-01T08:30:00.000Z'),
  updatedAt: new Date('2026-10-01T08:30:00.000Z'),
};

const recordNotFound = new Prisma.PrismaClientKnownRequestError(
  'Record not found',
  { code: 'P2025', clientVersion: 'test' },
);

describe('Interview steps (e2e)', () => {
  const prisma = {
    offer: { findUnique: vi.fn() },
    interviewStep: {
      aggregate: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((run: (tx: unknown) => Promise<unknown>) =>
      run(prisma),
    ),
    $disconnect: vi.fn(),
  };
  let app: INestApplication<App>;

  beforeEach(async () => {
    // Reset implementations too, so one test's mocked results can't leak into the next.
    vi.resetAllMocks();
    prisma.offer.findUnique.mockResolvedValue({ id: OFFER_ID });
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

  describe('GET /offers/:offerId/steps', () => {
    it('returns the steps', async () => {
      prisma.interviewStep.findMany.mockResolvedValue([model]);

      const response = await request(app.getHttpServer()).get(BASE).expect(200);

      expect(response.body).toEqual([
        {
          id: STEP_ID,
          offerId: OFFER_ID,
          title: 'Phone screen',
          description: null,
          date: '2026-10-06',
          status: 'planned',
          createdAt: '2026-10-01T08:30:00.000Z',
          updatedAt: '2026-10-01T08:30:00.000Z',
        },
      ]);
    });

    it('answers 404 for an unknown offer', async () => {
      prisma.offer.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer()).get(BASE).expect(404);
    });

    it('answers 400 for a malformed offer id', async () => {
      await request(app.getHttpServer()).get('/offers/42/steps').expect(400);
    });
  });

  describe('POST /offers/:offerId/steps', () => {
    it('creates a step', async () => {
      prisma.interviewStep.aggregate.mockResolvedValue({
        _max: { position: null },
      });
      prisma.interviewStep.create.mockResolvedValue(model);

      await request(app.getHttpServer())
        .post(BASE)
        .send({
          title: '  Phone screen ',
          description: ' ',
          date: '2026-10-06',
        })
        .expect(201);

      expect(prisma.interviewStep.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Phone screen',
          description: null,
          status: 'planned',
        }) as unknown,
      });
    });

    it.each([
      ['a missing title', { status: 'planned' }, 'title'],
      ['an unknown status', { title: 'Call', status: 'won' }, 'status'],
      ['a null status', { title: 'Call', status: null }, 'status'],
      [
        'a date with a time',
        { title: 'Call', date: '2026-10-06T10:00' },
        'date',
      ],
      [
        'a description too long',
        { title: 'Call', description: 'x'.repeat(20001) },
        'description',
      ],
      ['an unknown field', { title: 'Call', position: 3 }, 'position'],
    ])('rejects %s', async (_case, body, field) => {
      const response = await request(app.getHttpServer())
        .post(BASE)
        .send(body)
        .expect(400);

      expect(JSON.stringify(response.body)).toContain(field);
      expect(prisma.interviewStep.create).not.toHaveBeenCalled();
    });

    it('answers 404 for an unknown offer', async () => {
      prisma.offer.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post(BASE)
        .send({ title: 'Call' })
        .expect(404);
    });
  });

  describe('GET /offers/:offerId/steps/:stepId', () => {
    it('returns the step', async () => {
      prisma.interviewStep.findFirst.mockResolvedValue(model);

      await request(app.getHttpServer())
        .get(`${BASE}/${STEP_ID}`)
        .expect(200)
        .expect((response) => {
          expect(response.body).toMatchObject({ id: STEP_ID });
        });
    });

    it('answers 404 for a step of another offer', async () => {
      prisma.interviewStep.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer()).get(`${BASE}/${STEP_ID}`).expect(404);
    });
  });

  describe('PATCH /offers/:offerId/steps/:stepId', () => {
    it('updates the status', async () => {
      prisma.interviewStep.update.mockResolvedValue({
        ...model,
        status: 'passed',
      });

      const response = await request(app.getHttpServer())
        .patch(`${BASE}/${STEP_ID}`)
        .send({ status: 'passed' })
        .expect(200);

      expect(response.body).toMatchObject({ status: 'passed' });
    });

    it.each([{ title: null }, { status: null }])(
      'rejects clearing a required field: %j',
      async (body) => {
        await request(app.getHttpServer())
          .patch(`${BASE}/${STEP_ID}`)
          .send(body)
          .expect(400);
      },
    );

    it('answers 404 for an unknown step', async () => {
      prisma.interviewStep.update.mockRejectedValue(recordNotFound);

      await request(app.getHttpServer())
        .patch(`${BASE}/${STEP_ID}`)
        .send({ status: 'passed' })
        .expect(404);
    });
  });

  describe('DELETE /offers/:offerId/steps/:stepId', () => {
    it('deletes the step', async () => {
      prisma.interviewStep.delete.mockResolvedValue(model);

      await request(app.getHttpServer())
        .delete(`${BASE}/${STEP_ID}`)
        .expect(204);
    });

    it('answers 404 for an unknown step', async () => {
      prisma.interviewStep.delete.mockRejectedValue(recordNotFound);

      await request(app.getHttpServer())
        .delete(`${BASE}/${STEP_ID}`)
        .expect(404);
    });
  });

  describe('PUT /offers/:offerId/steps/order', () => {
    it('reorders the steps', async () => {
      prisma.interviewStep.findMany
        .mockResolvedValueOnce([{ id: STEP_ID }, { id: OTHER_STEP_ID }])
        .mockResolvedValueOnce([{ ...model, id: OTHER_STEP_ID }, model]);

      const response = await request(app.getHttpServer())
        .put(`${BASE}/order`)
        .send({ stepIds: [OTHER_STEP_ID, STEP_ID] })
        .expect(200);

      expect(
        (response.body as { id: string }[]).map((step) => step.id),
      ).toEqual([OTHER_STEP_ID, STEP_ID]);
    });

    it('rejects a list that is not every step of the offer', async () => {
      prisma.interviewStep.findMany.mockResolvedValueOnce([
        { id: STEP_ID },
        { id: OTHER_STEP_ID },
      ]);

      await request(app.getHttpServer())
        .put(`${BASE}/order`)
        .send({ stepIds: [STEP_ID] })
        .expect(400);
    });

    it.each([
      { stepIds: 'not-an-array' },
      { stepIds: ['42'] },
      { stepIds: [STEP_ID, STEP_ID] },
    ])('rejects a malformed body: %j', async (body) => {
      await request(app.getHttpServer())
        .put(`${BASE}/order`)
        .send(body)
        .expect(400);
    });
  });
});
