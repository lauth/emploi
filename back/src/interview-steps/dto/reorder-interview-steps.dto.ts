import type { ReorderInterviewStepsRequest } from '@emploi/shared';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReorderInterviewStepsDto implements ReorderInterviewStepsRequest {
  /** Every step id of the offer, in the new order (checked by the service). */
  @ApiProperty({
    description:
      'Every step id of the offer, exactly once, in the new order. ' +
      'Any other list is rejected with 400.',
    type: [String],
    format: 'uuid',
    uniqueItems: true,
    maxItems: 500,
  })
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  stepIds: string[];
}
