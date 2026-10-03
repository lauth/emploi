import type { UpdateOfferRequest } from '@emploi/shared';
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
import { IfPresent } from '../../common/validators.js';
import { OFFER_LIMITS } from '../offer-limits.js';

/**
 * Partial update: absent fields are left unchanged, `null` clears an optional
 * field. Written out rather than derived from CreateOfferDto because required
 * fields must not accept `null`.
 */
export class UpdateOfferDto implements UpdateOfferRequest {
  @Trim()
  @IfPresent()
  @IsString()
  @IsNotEmpty()
  @MaxLength(OFFER_LIMITS.title)
  title?: string;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(OFFER_LIMITS.company)
  company?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(OFFER_LIMITS.url)
  url?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(OFFER_LIMITS.location)
  location?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(OFFER_LIMITS.description)
  description?: string | null;

  @TrimToNull()
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'appliedAt must be a YYYY-MM-DD date',
  })
  @IsDateString({ strict: true })
  appliedAt?: string | null;
}
