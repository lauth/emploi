import type { InterviewStep } from '@emploi/shared';
import { toDateOnly } from '../common/date-only.js';
import type { InterviewStep as InterviewStepModel } from '../generated/prisma/client.js';

/** Maps a database row to the API representation (`position` stays internal). */
export function toInterviewStep(model: InterviewStepModel): InterviewStep {
  return {
    id: model.id,
    offerId: model.offerId,
    title: model.title,
    description: model.description,
    date: model.date === null ? null : toDateOnly(model.date),
    status: model.status,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}
