import type { OfferImage } from '@emploi/shared';
import type { OfferImage as OfferImageModel } from '../generated/prisma/client.js';
import { toOfferImageType } from './offer-image-format.js';

/** The columns of an image that offers show. */
export type OfferImageInfo = Pick<
  OfferImageModel,
  'contentType' | 'byteSize' | 'updatedAt'
>;

/** Maps an image row (without its bytes) to the API representation. */
export function toOfferImage(model: OfferImageInfo): OfferImage {
  return {
    contentType: toOfferImageType(model.contentType),
    byteSize: model.byteSize,
    updatedAt: model.updatedAt.toISOString(),
  };
}
