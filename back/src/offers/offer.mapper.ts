import type { Offer } from '@emploi/shared';
import { toDateOnly } from '../common/date-only.js';
import type { Offer as OfferModel } from '../generated/prisma/client.js';

/** Maps a database row to the API representation. */
export function toOffer(model: OfferModel): Offer {
  return {
    id: model.id,
    title: model.title,
    company: model.company,
    url: model.url,
    location: model.location,
    description: model.description,
    appliedAt: model.appliedAt === null ? null : toDateOnly(model.appliedAt),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}
