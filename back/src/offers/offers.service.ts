import type {
  CreateOfferRequest,
  Offer,
  Page,
  UpdateOfferRequest,
} from '@emploi/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { fromDateOnly } from '../common/date-only.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toOffer } from './offer.mapper.js';

/** Prisma error code: the record to update or delete does not exist. */
const RECORD_NOT_FOUND = 'P2025';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOfferRequest): Promise<Offer> {
    const created = await this.prisma.offer.create({
      data: {
        title: input.title,
        company: input.company,
        url: input.url ?? null,
        location: input.location ?? null,
        description: input.description ?? null,
        appliedAt: input.appliedAt ? fromDateOnly(input.appliedAt) : null,
      },
    });
    return toOffer(created);
  }

  /** Newest first. */
  async list(limit: number, offset: number): Promise<Page<Offer>> {
    const [models, total] = await this.prisma.$transaction([
      this.prisma.offer.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.offer.count(),
    ]);
    return { items: models.map(toOffer), total, limit, offset };
  }

  async get(id: string): Promise<Offer> {
    const model = await this.prisma.offer.findUnique({ where: { id } });
    if (model === null) {
      throw offerNotFound(id);
    }
    return toOffer(model);
  }

  async update(id: string, input: UpdateOfferRequest): Promise<Offer> {
    try {
      const updated = await this.prisma.offer.update({
        where: { id },
        data: {
          title: input.title,
          company: input.company,
          url: input.url,
          location: input.location,
          description: input.description,
          appliedAt:
            input.appliedAt === undefined || input.appliedAt === null
              ? input.appliedAt
              : fromDateOnly(input.appliedAt),
        },
      });
      return toOffer(updated);
    } catch (error) {
      throw isRecordNotFound(error) ? offerNotFound(id) : error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.offer.delete({ where: { id } });
    } catch (error) {
      throw isRecordNotFound(error) ? offerNotFound(id) : error;
    }
  }
}

function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === RECORD_NOT_FOUND
  );
}

function offerNotFound(id: string): NotFoundException {
  return new NotFoundException(`Offer ${id} not found`);
}
