import type { Offer } from '@emploi/shared';
import { toDateOnly } from '../common/date-only.js';
import type { Offer as OfferModel } from '../generated/prisma/client.js';
import {
  toOfferImage,
  type OfferImageInfo,
} from '../offer-images/offer-image.mapper.js';

/** An offer row with what it shows of its image (`OFFER_INCLUDE`). */
export type OfferWithImage = OfferModel & { image: OfferImageInfo | null };

/** Maps a database row to the API representation. */
export function toOffer(model: OfferWithImage): Offer {
  return {
    id: model.id,
    title: model.title,
    company: model.company,
    url: model.url,
    location: model.location,
    description: model.description,
    appliedAt: model.appliedAt === null ? null : toDateOnly(model.appliedAt),
    status: model.status,
    image: model.image === null ? null : toOfferImage(model.image),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}
