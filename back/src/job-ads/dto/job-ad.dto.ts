import type { JobAd } from '@emploi/shared';
import { ApiProperty } from '@nestjs/swagger';
import { OFFER_PROPERTIES } from '../../offers/offer-api-properties.js';

/** Response shape, for the OpenAPI document (adrs/0018-openapi-documentation.md). */
export class JobAdDto implements JobAd {
  @ApiProperty({
    format: 'uri',
    description: 'The page read, after redirects.',
  })
  url: string;

  @ApiProperty({ ...OFFER_PROPERTIES.title, type: String, nullable: true })
  title: string | null;

  @ApiProperty(OFFER_PROPERTIES.company)
  company: string | null;

  @ApiProperty(OFFER_PROPERTIES.location)
  location: string | null;

  @ApiProperty({
    ...OFFER_PROPERTIES.description,
    description:
      'Text of the ad: paragraphs separated by a blank line, list items starting with •.',
  })
  description: string | null;
}
