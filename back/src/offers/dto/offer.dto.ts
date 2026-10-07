import type { Offer, OfferStatus, Page } from '@emploi/shared';
import { ApiProperty } from '@nestjs/swagger';
import { OFFER_PROPERTIES } from '../offer-api-properties.js';

// Response shapes, for the OpenAPI document only: they implement the shared
// types, so the documentation can't drift from what the API returns
// (adrs/0018-openapi-documentation.md).

export class OfferDto implements Offer {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty(OFFER_PROPERTIES.title)
  title: string;

  @ApiProperty(OFFER_PROPERTIES.company)
  company: string | null;

  @ApiProperty(OFFER_PROPERTIES.url)
  url: string | null;

  @ApiProperty(OFFER_PROPERTIES.location)
  location: string | null;

  @ApiProperty(OFFER_PROPERTIES.description)
  description: string | null;

  @ApiProperty(OFFER_PROPERTIES.appliedAt)
  appliedAt: string | null;

  @ApiProperty(OFFER_PROPERTIES.status)
  status: OfferStatus;

  @ApiProperty({ format: 'date-time', example: '2026-10-01T08:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-02T09:45:00.000Z' })
  updatedAt: string;
}

export class OfferPageDto implements Page<Offer> {
  @ApiProperty({ type: [OfferDto], description: 'Newest first.' })
  items: OfferDto[];

  @ApiProperty({ description: 'Number of offers across all pages.' })
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}
