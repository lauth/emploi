import type { Offer, OfferImageMaxBytes, OfferImageType } from '@emploi/shared';
import type { ValidationMessage } from './forms';

// The image of an offer (adrs/0031-offer-image.md): checked here for
// immediate feedback, and again by the API (from the bytes).

/** `satisfies` makes the compiler reject any drift from the API limit. */
export const OFFER_IMAGE_MAX_BYTES =
  10_485_760 as const satisfies OfferImageMaxBytes;

/** The limit in MiB, for messages. */
export const OFFER_IMAGE_MAX_MB = OFFER_IMAGE_MAX_BYTES / 1024 / 1024;

/** A Record lists every format: one added to the shared type breaks the build. */
const IMAGE_TYPES: Record<OfferImageType, true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
  'image/gif': true,
};

/** `accept` attribute of the file input. */
export const OFFER_IMAGE_ACCEPT = Object.keys(IMAGE_TYPES).join(',');

export function isOfferImageType(value: string): value is OfferImageType {
  return Object.hasOwn(IMAGE_TYPES, value);
}

export type OfferImageResult =
  | { success: true; image: File | null }
  | { success: false; error: ValidationMessage };

/** The image chosen in a form, if any: an empty file input gives `null`. */
export function readOfferImage(
  formData: FormData,
  field = 'image',
): OfferImageResult {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) {
    return { success: true, image: null };
  }
  if (!isOfferImageType(file.type)) {
    return { success: false, error: 'imageType' };
  }
  if (file.size > OFFER_IMAGE_MAX_BYTES) {
    return { success: false, error: 'imageTooLarge' };
  }
  return { success: true, image: file };
}

/**
 * Where the browser gets the image of an offer (the front's route handler),
 * `null` without one. The version changes when the image is replaced, so the
 * browser can cache each one for good.
 */
export function offerImageUrl(
  offer: Pick<Offer, 'id' | 'image'>,
): string | null {
  if (offer.image === null) {
    return null;
  }
  const version = encodeURIComponent(offer.image.updatedAt);
  return `/offers/${offer.id}/image?v=${version}`;
}
