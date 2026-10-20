import type { FetchJobAdRequest } from '@emploi/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, MaxLength } from 'class-validator';
import { Trim } from '../../common/transforms.js';
import { OFFER_LIMITS } from '../../offers/offer-limits.js';

export class FetchJobAdDto implements FetchJobAdRequest {
  @ApiProperty({
    format: 'uri',
    description:
      'Link of the job ad, `http` or `https`. Private and local addresses are refused.',
    maxLength: OFFER_LIMITS.url,
    example: 'https://jobs.example.com/42',
  })
  @Trim()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(OFFER_LIMITS.url)
  url: string;
}
