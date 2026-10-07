import type { CreateOfferRequest, OfferStatus } from '@emploi/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { DATE_ONLY_PATTERN } from '../../common/date-only.js';
import { Trim, TrimToNull } from '../../common/transforms.js';
import { IfPresent } from '../../common/validators.js';
import { OFFER_PROPERTIES } from '../offer-api-properties.js';
import {
  DEFAULT_OFFER_STATUS,
  OFFER_LIMITS,
  OFFER_STATUSES,
} from '../offer-limits.js';

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

  /** Absent means `applied`; `null` is rejected. */
  @ApiPropertyOptional({
    ...OFFER_PROPERTIES.status,
    default: DEFAULT_OFFER_STATUS,
  })
  @IfPresent()
  @IsIn(OFFER_STATUSES)
  status?: OfferStatus;
}
