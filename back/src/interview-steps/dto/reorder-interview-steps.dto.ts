import type { ReorderInterviewStepsRequest } from '@emploi/shared';
import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReorderInterviewStepsDto implements ReorderInterviewStepsRequest {
  /** Every step id of the offer, in the new order (checked by the service). */
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  stepIds: string[];
}
