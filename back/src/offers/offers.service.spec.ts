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
        company: 'Acme',
        appliedAt: '2026-09-28',
      });

      expect(prisma.offer.create).toHaveBeenCalledWith({
        data: {
          title: 'Backend developer',
          company: 'Acme',
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
    it('returns a page, newest first', async () => {
      prisma.offer.findMany.mockResolvedValue([model]);
      prisma.offer.count.mockResolvedValue(21);

      const page = await service.list(20, 0);

      expect(prisma.offer.findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 20,
        skip: 0,
      });
      expect(page).toMatchObject({ total: 21, limit: 20, offset: 0 });
      expect(page.items).toHaveLength(1);
    });
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
