import type {
  ListOffersQuery,
  OfferSortField,
  OfferStatus,
  SortOrder,
} from '@emploi/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DATE_ONLY_PATTERN } from '../../common/date-only.js';
import { ToArray, TrimToNull } from '../../common/transforms.js';
import { IsNotBefore } from '../../common/validators.js';
import { OFFER_STATUSES } from '../offer-limits.js';
import {
  DEFAULT_SORT,
  OFFER_SORT_FIELDS,
  SORT_ORDERS,
} from '../offer-list-options.js';

/** Query of `GET /offers` (adrs/0020-offer-list-filters-sorting-and-pagination.md). */
export class ListOffersQueryDto implements ListOffersQuery {
  @ApiPropertyOptional({
    // Explicit: properties without a type annotation carry no type metadata.
    type: 'integer',
    description: 'Number of offers per page.',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    type: 'integer',
    description: 'Number of offers to skip.',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;

  @ApiPropertyOptional({
    type: String,
    description:
      'Text contained in the title, company or location, ignoring case. Blank is ignored.',
    maxLength: 200,
    example: 'backend',
  })
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Only offers applied on or after this day, `YYYY-MM-DD`.',
    example: '2026-09-01',
  })
  @TrimToNull()
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'appliedFrom must be a YYYY-MM-DD date',
  })
  @IsDateString({ strict: true })
  appliedFrom?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description:
      'Only offers applied on or before this day, `YYYY-MM-DD`. Not before `appliedFrom`.',
    example: '2026-09-30',
  })
  @TrimToNull()
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'appliedTo must be a YYYY-MM-DD date',
  })
  @IsDateString({ strict: true })
  @IsNotBefore('appliedFrom')
  appliedTo?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', enum: OFFER_STATUSES },
    description:
      'Only offers with one of these statuses; repeat the parameter for several (`?status=applied&status=interviewing`). All when absent.',
    example: ['applied', 'interviewing'],
  })
  @ToArray()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(OFFER_STATUSES.length)
  @IsIn(OFFER_STATUSES, { each: true })
  status?: OfferStatus[];

  @ApiPropertyOptional({
    enum: OFFER_SORT_FIELDS,
    enumName: 'OfferSortField',
    default: DEFAULT_SORT,
    description:
      'Sort field. Offers with no value for it (no application date, no company) come last. Statuses sort in the order of a search, `applied` first.',
  })
  @IsOptional()
  @IsIn(OFFER_SORT_FIELDS)
  sort: OfferSortField = DEFAULT_SORT;

  @ApiPropertyOptional({
    enum: SORT_ORDERS,
    enumName: 'SortOrder',
    description:
      'Sort direction. Default: `desc` for dates (most recent first), `asc` for text.',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  order?: SortOrder;
}
