import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  Prisma,
  type Offer as OfferModel,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { OffersService } from './offers.service.js';

const ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';

const model: OfferModel = {
  id: ID,
  title: 'Backend developer',
  company: 'Acme',
  url: null,
  location: null,
  description: null,
  appliedAt: null,
  createdAt: new Date('2026-10-01T08:30:00.000Z'),
  updatedAt: new Date('2026-10-01T08:30:00.000Z'),
};

function recordNotFound(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

describe('OffersService', () => {
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
  };
  let service: OffersService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [OffersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(OffersService);
  });

  describe('create', () => {
    it('stores missing optional fields as null and parses appliedAt', async () => {
      prisma.offer.create.mockResolvedValue(model);

      await service.create({
        title: 'Backend developer',
        appliedAt: '2026-09-28',
      });

      expect(prisma.offer.create).toHaveBeenCalledWith({
        data: {
          title: 'Backend developer',
          company: null,
          url: null,
          location: null,
          description: null,
          appliedAt: new Date('2026-09-28T00:00:00.000Z'),
        },
      });
    });

    it('returns the API representation', async () => {
      prisma.offer.create.mockResolvedValue(model);

      await expect(
        service.create({ title: 'Backend developer', company: 'Acme' }),
      ).resolves.toMatchObject({
        id: ID,
        createdAt: '2026-10-01T08:30:00.000Z',
      });
    });
  });

  describe('list', () => {
    const defaults = { sort: 'appliedAt', limit: 20, offset: 0 } as const;

    beforeEach(() => {
      prisma.offer.findMany.mockResolvedValue([model]);
      prisma.offer.count.mockResolvedValue(21);
    });

    it('returns a page by most recent application, missing dates last', async () => {
      const page = await service.list(defaults);

      expect(prisma.offer.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { appliedAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        take: 20,
        skip: 0,
      });
      expect(prisma.offer.count).toHaveBeenCalledWith({ where: {} });
      expect(page).toMatchObject({ total: 21, limit: 20, offset: 0 });
      expect(page.items).toHaveLength(1);
    });

    it('searches the title, company and location, ignoring case', async () => {
      await service.list({ ...defaults, q: 'acme' });

      const where = {
        OR: [
          { title: { contains: 'acme', mode: 'insensitive' } },
          { company: { contains: 'acme', mode: 'insensitive' } },
          { location: { contains: 'acme', mode: 'insensitive' } },
        ],
      };
      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      // The total counts the filtered offers, not all of them.
      expect(prisma.offer.count).toHaveBeenCalledWith({ where });
    });

    it('filters by application period, inclusive', async () => {
      await service.list({
        ...defaults,
        appliedFrom: '2026-09-01',
        appliedTo: '2026-09-30',
      });

      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            appliedAt: {
              gte: new Date('2026-09-01T00:00:00.000Z'),
              lte: new Date('2026-09-30T00:00:00.000Z'),
            },
          },
        }),
      );
    });

    it('ignores blank filters', async () => {
      await service.list({
        ...defaults,
        q: null,
        appliedFrom: null,
      } as unknown as typeof defaults);

      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it.each([
      ['title', undefined, { title: 'asc' }],
      ['title', 'desc', { title: 'desc' }],
      ['company', undefined, { company: { sort: 'asc', nulls: 'last' } }],
      ['createdAt', undefined, { createdAt: 'desc' }],
      ['appliedAt', 'asc', { appliedAt: { sort: 'asc', nulls: 'last' } }],
    ] as const)(
      'sorts by %s %s (default order per field)',
      async (sort, order, first) => {
        await service.list({ ...defaults, sort, order });

        expect(prisma.offer.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [first, { createdAt: 'desc' }, { id: 'desc' }],
          }),
        );
      },
    );
  });

  describe('get', () => {
    it('returns the offer', async () => {
      prisma.offer.findUnique.mockResolvedValue(model);

      await expect(service.get(ID)).resolves.toMatchObject({ id: ID });
    });

    it('throws NotFoundException for an unknown id', async () => {
      prisma.offer.findUnique.mockResolvedValue(null);

      await expect(service.get(ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('leaves absent fields unchanged and clears null ones', async () => {
      prisma.offer.update.mockResolvedValue(model);

      await service.update(ID, { title: 'Senior developer', url: null });

      expect(prisma.offer.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: {
          title: 'Senior developer',
          company: undefined,
          url: null,
          location: undefined,
          description: undefined,
          appliedAt: undefined,
        },
      });
    });

    it('parses appliedAt', async () => {
      prisma.offer.update.mockResolvedValue(model);

      await service.update(ID, { appliedAt: '2026-09-28' });

      expect(prisma.offer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appliedAt: new Date('2026-09-28T00:00:00.000Z'),
          }) as unknown,
        }),
      );
    });

    it('throws NotFoundException for an unknown id', async () => {
      prisma.offer.update.mockRejectedValue(recordNotFound());

      await expect(service.update(ID, { title: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rethrows other errors', async () => {
      const failure = new Error('connection lost');
      prisma.offer.update.mockRejectedValue(failure);

      await expect(service.update(ID, { title: 'x' })).rejects.toBe(failure);
    });
  });

  describe('remove', () => {
    it('deletes the offer', async () => {
      prisma.offer.delete.mockResolvedValue(model);

      await service.remove(ID);

      expect(prisma.offer.delete).toHaveBeenCalledWith({ where: { id: ID } });
    });

    it('throws NotFoundException for an unknown id', async () => {
      prisma.offer.delete.mockRejectedValue(recordNotFound());

      await expect(service.remove(ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
