import type {
  CreateOfferRequest,
  ListOffersQuery,
  Offer,
  OfferSortField,
  Page,
  SortOrder,
  UpdateOfferRequest,
} from '@emploi/shared';
import { Injectable } from '@nestjs/common';
import { fromDateOnly } from '../common/date-only.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { offerNotFound } from '../problems/problem.exception.js';
import { DEFAULT_ORDERS } from './offer-list-options.js';
import { toOffer } from './offer.mapper.js';

/** Prisma error code: the record to update or delete does not exist. */
const RECORD_NOT_FOUND = 'P2025';

/** A list query with its defaults applied (sort, limit and offset are always set). */
export type OfferListQuery = ListOffersQuery &
  Required<Pick<ListOffersQuery, 'sort' | 'limit' | 'offset'>>;

/** Text fields searched by `q`. */
const SEARCHED_FIELDS = ['title', 'company', 'location'] as const;

function offerFilter(query: OfferListQuery): Prisma.OfferWhereInput {
  const { q, appliedFrom, appliedTo, status } = query;
  return {
    ...(status?.length ? { status: { in: status } } : {}),
    ...(q
      ? {
          OR: SEARCHED_FIELDS.map((field) => ({
            [field]: { contains: q, mode: 'insensitive' },
          })),
        }
      : {}),
    // Blank query values arrive as null (TrimToNull): test truthiness.
    ...(appliedFrom || appliedTo
      ? {
          appliedAt: {
            ...(appliedFrom ? { gte: fromDateOnly(appliedFrom) } : {}),
            ...(appliedTo ? { lte: fromDateOnly(appliedTo) } : {}),
          },
        }
      : {}),
  };
}

/** Sort field first (missing values last), then newest records, so pages are stable. */
function offerOrder(
  sort: OfferSortField,
  order: SortOrder,
): Prisma.OfferOrderByWithRelationInput[] {
  const nullable: Record<OfferSortField, boolean> = {
    appliedAt: true,
    company: true,
    createdAt: false,
    title: false,
    status: false,
  };
  return [
    { [sort]: nullable[sort] ? { sort: order, nulls: 'last' } : order },
    { createdAt: 'desc' },
    { id: 'desc' },
  ];
}

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOfferRequest): Promise<Offer> {
    const created = await this.prisma.offer.create({
      data: {
        title: input.title,
        company: input.company ?? null,
        url: input.url ?? null,
        location: input.location ?? null,
        description: input.description ?? null,
        appliedAt: input.appliedAt ? fromDateOnly(input.appliedAt) : null,
        // Absent: the database default (`applied`).
        status: input.status,
      },
    });
    return toOffer(created);
  }

  /** Filtered, sorted and paginated (adrs/0020-offer-list-filters-sorting-and-pagination.md). */
  async list(query: OfferListQuery): Promise<Page<Offer>> {
    const where = offerFilter(query);
    const [models, total] = await this.prisma.$transaction([
      this.prisma.offer.findMany({
        where,
        orderBy: offerOrder(
          query.sort,
          query.order ?? DEFAULT_ORDERS[query.sort],
        ),
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.offer.count({ where }),
    ]);
    return {
      items: models.map(toOffer),
      total,
      limit: query.limit,
      offset: query.offset,
    };
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
          status: input.status,
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
