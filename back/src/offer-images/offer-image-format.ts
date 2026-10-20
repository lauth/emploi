import type { OfferImageMaxBytes, OfferImageType } from '@emploi/shared';

// Accepted image formats and size (adrs/0031-offer-image.md).

/** `satisfies` makes the compiler reject any drift from the shared limit. */
export const OFFER_IMAGE_MAX_BYTES =
  10_485_760 as const satisfies OfferImageMaxBytes;

/**
 * How each format starts (its magic number), `null` for any byte. A Record
 * lists every format: one added to the shared type breaks the build until
 * described here.
 */
const SIGNATURES: Record<OfferImageType, (number | null)[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  // "RIFF", the file size, then "WEBP".
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50],
  ],
  // "GIF87a" or "GIF89a".
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
};

export const OFFER_IMAGE_TYPES = Object.keys(SIGNATURES) as OfferImageType[];

/** The format of an image from its first bytes, `null` when it isn't an accepted one. */
export function detectImageType(bytes: Uint8Array): OfferImageType | null {
  for (const type of OFFER_IMAGE_TYPES) {
    const matches = SIGNATURES[type].some(
      (signature) =>
        bytes.length >= signature.length &&
        signature.every(
          (byte, index) => byte === null || bytes[index] === byte,
        ),
    );
    if (matches) {
      return type;
    }
  }
  return null;
}

/** A content type read back from the database, checked. */
export function toOfferImageType(value: string): OfferImageType {
  if (!(OFFER_IMAGE_TYPES as string[]).includes(value)) {
    throw new Error(`Unknown offer image type in the database: ${value}`);
  }
  return value as OfferImageType;
}
