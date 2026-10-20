import type { OfferImage, OfferImageType } from '@emploi/shared';
import { ApiProperty } from '@nestjs/swagger';
import { OFFER_IMAGE_TYPES } from './offer-image-format.js';

/** Response shape, for the OpenAPI document (adrs/0018-openapi-documentation.md). */
export class OfferImageDto implements OfferImage {
  @ApiProperty({
    enum: OFFER_IMAGE_TYPES,
    enumName: 'OfferImageType',
    description: 'Format, detected from the bytes.',
  })
  contentType: OfferImageType;

  @ApiProperty({ type: 'integer', description: 'Size in bytes.' })
  byteSize: number;

  @ApiProperty({
    format: 'date-time',
    description: 'When the image was last set: changes when it is replaced.',
    example: '2026-10-02T09:45:00.000Z',
  })
  updatedAt: string;
}
