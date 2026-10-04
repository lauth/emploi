import type { PageQuery } from '@emploi/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListOffersQueryDto implements PageQuery {
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
}
