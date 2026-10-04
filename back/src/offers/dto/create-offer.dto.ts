import type { CreateOfferRequest } from '@emploi/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { DATE_ONLY_PATTERN } from '../../common/date-only.js';
import { Trim, TrimToNull } from '../../common/transforms.js';
import { OFFER_PROPERTIES } from '../offer-api-properties.js';
import { OFFER_LIMITS } from '../offer-limits.js';

export class CreateOfferDto implements CreateOfferRequest {
  @ApiProperty(OFFER_PROPERTIES.title)
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(OFFER_LIMITS.title)
  title: string;

  @ApiPropertyOptional(OFFER_PROPERTIES.company)
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(OFFER_LIMITS.company)
  company?: string | null;

  @ApiPropertyOptional(OFFER_PROPERTIES.url)
  @TrimToNull()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(OFFER_LIMITS.url)
  url?: string | null;

  @ApiPropertyOptional(OFFER_PROPERTIES.location)
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(OFFER_LIMITS.location)
  location?: string | null;

  @ApiPropertyOptional(OFFER_PROPERTIES.description)
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(OFFER_LIMITS.description)
  description?: string | null;

  @ApiPropertyOptional(OFFER_PROPERTIES.appliedAt)
  @TrimToNull()
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'appliedAt must be a YYYY-MM-DD date',
  })
  @IsDateString({ strict: true })
  appliedAt?: string | null;
}
