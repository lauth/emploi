import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import {
  Prisma,
  type Offer as OfferModel,
} from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';

const model: OfferModel = {
  id: ID,
  title: 'Backend developer',
  company: 'Acme',
  url: 'https://jobs.example.com/42',
  location: null,
  description: null,
  appliedAt: new Date('2026-09-28T00:00:00.000Z'),
  createdAt: new Date('2026-10-01T08:30:00.000Z'),
  updatedAt: new Date('2026-10-01T08:30:00.000Z'),
};

const recordNotFound = new Prisma.PrismaClientKnownRequestError(
  'Record not found',
  { code: 'P2025', clientVersion: 'test' },
);

describe('Offers (e2e)', () => {
  const prisma = {
    offer: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
    $disconnect: vi.fn(),
  };
  let app: INestApplication<App>;

  beforeEach(async () => {
    vi.clearAllMocks();
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

  describe('POST /offers', () => {
    it('creates an offer', async () => {
      prisma.offer.create.mockResolvedValue(model);

      const response = await request(app.getHttpServer())
        .post('/offers')
        .send({
          title: '  Backend developer ',
          company: 'Acme',
          url: 'https://jobs.example.com/42',
          location: '   ',
          appliedAt: '2026-09-28',
        })
        .expect(201);

      expect(response.body).toEqual({
        id: ID,
        title: 'Backend developer',
        company: 'Acme',
        url: 'https://jobs.example.com/42',
        location: null,
        description: null,
        appliedAt: '2026-09-28',
        createdAt: '2026-10-01T08:30:00.000Z',
        updatedAt: '2026-10-01T08:30:00.000Z',
      });
      // Input is trimmed and blank optional fields become null.
      expect(prisma.offer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Backend developer',
          location: null,
        }) as unknown,
      });
    });

    it.each([{ title: 'Dev' }, { title: 'Dev', company: '  ' }])(
      'creates an offer without a company: %j',
      async (body) => {
        prisma.offer.create.mockResolvedValue({ ...model, company: null });

        const response = await request(app.getHttpServer())
          .post('/offers')
          .send(body)
          .expect(201);

        expect(response.body).toMatchObject({ company: null });
        expect(prisma.offer.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ company: null }) as unknown,
        });
      },
    );

    it.each([
      ['a missing title', { company: 'Acme' }, 'title'],
      [
        'a company too long',
        { title: 'Dev', company: 'x'.repeat(201) },
        'company',
      ],
      [
        'a title too long',
        { title: 'x'.repeat(201), company: 'Acme' },
        'title',
      ],
      [
        'a URL without http(s)',
        { title: 'Dev', company: 'Acme', url: 'ftp://example.com' },
        'url',
      ],
      [
        'a date with a time',
        { title: 'Dev', company: 'Acme', appliedAt: '2026-09-28T10:00:00Z' },
        'appliedAt',
      ],
      [
        'an impossible date',
        { title: 'Dev', company: 'Acme', appliedAt: '2026-02-30' },
        'appliedAt',
      ],
      [
        'an unknown field',
        { title: 'Dev', company: 'Acme', salary: 50000 },
        'salary',
      ],
    ])('rejects %s', async (_case, body, field) => {
      const response = await request(app.getHttpServer())
        .post('/offers')
        .send(body)
        .expect(400);

      expect(JSON.stringify(response.body)).toContain(field);
      expect(prisma.offer.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /offers', () => {
    it('returns the first page by default', async () => {
      prisma.offer.findMany.mockResolvedValue([model]);
      prisma.offer.count.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get('/offers')
        .expect(200);

      expect(response.body).toMatchObject({ total: 1, limit: 20, offset: 0 });
      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 0 }),
      );
    });

    it('reads limit and offset from the query', async () => {
      prisma.offer.findMany.mockResolvedValue([]);
      prisma.offer.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/offers?limit=5&offset=10')
        .expect(200);

      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, skip: 10 }),
      );
    });

    it('filters and sorts from the query', async () => {
      prisma.offer.findMany.mockResolvedValue([]);
      prisma.offer.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get(
          '/offers?q=%20acme%20&appliedFrom=2026-09-01&appliedTo=2026-09-30&sort=title&order=desc',
        )
        .expect(200);

      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'acme', mode: 'insensitive' } },
              { company: { contains: 'acme', mode: 'insensitive' } },
              { location: { contains: 'acme', mode: 'insensitive' } },
            ],
            appliedAt: {
              gte: new Date('2026-09-01T00:00:00.000Z'),
              lte: new Date('2026-09-30T00:00:00.000Z'),
            },
          },
          orderBy: [{ title: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        }),
      );
    });

    it('sorts by most recent application by default, missing dates last', async () => {
      prisma.offer.findMany.mockResolvedValue([]);
      prisma.offer.count.mockResolvedValue(0);

      await request(app.getHttpServer()).get('/offers?q=').expect(200);

      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: [
            { appliedAt: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
        }),
      );
    });

    it.each([
      ['limit=0', 'limit'],
      ['limit=101', 'limit'],
      ['offset=-1', 'offset'],
      ['limit=abc', 'limit'],
      ['sort=salary', 'sort'],
      ['order=up', 'order'],
      ['appliedFrom=2026-02-30', 'appliedFrom'],
      ['appliedTo=28/09/2026', 'appliedTo'],
      [
        'appliedFrom=2026-09-30&appliedTo=2026-09-01',
        'appliedTo must not be before appliedFrom',
      ],
      [`q=${'x'.repeat(201)}`, 'q'],
      ['status=passed', 'status'],
    ])('rejects %s', async (query, message) => {
      const response = await request(app.getHttpServer())
        .get(`/offers?${query}`)
        .expect(400);

      expect(JSON.stringify(response.body)).toContain(message);
    });
  });

  describe('GET /offers/:id', () => {
    it('returns the offer', async () => {
      prisma.offer.findUnique.mockResolvedValue(model);

      const response = await request(app.getHttpServer())
        .get(`/offers/${ID}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: ID,
        title: 'Backend developer',
      });
    });

    it('answers 404 for an unknown id', async () => {
      prisma.offer.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer()).get(`/offers/${ID}`).expect(404);
    });

    it('answers 400 for a malformed id', async () => {
      await request(app.getHttpServer()).get('/offers/42').expect(400);
    });
  });

  describe('PATCH /offers/:id', () => {
    it('updates the given fields', async () => {
      prisma.offer.update.mockResolvedValue({ ...model, url: null });

      const response = await request(app.getHttpServer())
        .patch(`/offers/${ID}`)
        .send({ url: null })
        .expect(200);

      expect(response.body).toMatchObject({ url: null });
      expect(prisma.offer.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: expect.objectContaining({
          url: null,
          title: undefined,
        }) as unknown,
      });
    });

    it('clears the company with null', async () => {
      prisma.offer.update.mockResolvedValue({ ...model, company: null });

      await request(app.getHttpServer())
        .patch(`/offers/${ID}`)
        .send({ company: null })
        .expect(200);

      expect(prisma.offer.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: expect.objectContaining({ company: null }) as unknown,
      });
    });

    it('rejects null for a required field', async () => {
      await request(app.getHttpServer())
        .patch(`/offers/${ID}`)
        .send({ title: null })
        .expect(400);
    });

    it('answers 404 for an unknown id', async () => {
      prisma.offer.update.mockRejectedValue(recordNotFound);

      await request(app.getHttpServer())
        .patch(`/offers/${ID}`)
        .send({ title: 'Dev' })
        .expect(404);
    });
  });

  describe('DELETE /offers/:id', () => {
    it('deletes the offer', async () => {
      prisma.offer.delete.mockResolvedValue(model);

      await request(app.getHttpServer()).delete(`/offers/${ID}`).expect(204);
    });

    it('answers 404 for an unknown id', async () => {
      prisma.offer.delete.mockRejectedValue(recordNotFound);

      await request(app.getHttpServer()).delete(`/offers/${ID}`).expect(404);
    });
  });
});
