import type {
  CreateInterviewStepRequest,
  InterviewStep,
  UpdateInterviewStepRequest,
} from '@emploi/shared';
import { Injectable } from '@nestjs/common';
import { fromDateOnly } from '../common/date-only.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  interviewStepNotFound,
  offerNotFound,
  validationProblem,
} from '../problems/problem.exception.js';
import { toInterviewStep } from './interview-step.mapper.js';

/** Prisma error code: the record to update or delete does not exist. */
const RECORD_NOT_FOUND = 'P2025';

/** Order of the steps of an offer (adrs/0015-interview-step-data-model-and-api.md). */
const STEP_ORDER: Prisma.InterviewStepOrderByWithRelationInput[] = [
  { position: 'asc' },
  { createdAt: 'asc' },
  { id: 'asc' },
];

type Transaction = Prisma.TransactionClient;

@Injectable()
export class InterviewStepsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(offerId: string): Promise<InterviewStep[]> {
    await assertOfferExists(this.prisma, offerId);
    return listSteps(this.prisma, offerId);
  }

  async get(offerId: string, stepId: string): Promise<InterviewStep> {
    const model = await this.prisma.interviewStep.findFirst({
      where: { id: stepId, offerId },
    });
    if (model === null) {
      throw interviewStepNotFound(offerId, stepId);
    }
    return toInterviewStep(model);
  }

  /** Adds the step after the existing ones. */
  async create(
    offerId: string,
    input: CreateInterviewStepRequest,
  ): Promise<InterviewStep> {
    return this.prisma.$transaction(async (tx) => {
      await assertOfferExists(tx, offerId);
      const { _max } = await tx.interviewStep.aggregate({
        where: { offerId },
        _max: { position: true },
      });
      const created = await tx.interviewStep.create({
        data: {
          offerId,
          position: (_max.position ?? -1) + 1,
          title: input.title,
          description: input.description ?? null,
          date: input.date ? fromDateOnly(input.date) : null,
          status: input.status ?? 'planned',
        },
      });
      return toInterviewStep(created);
    });
  }

  async update(
    offerId: string,
    stepId: string,
    input: UpdateInterviewStepRequest,
  ): Promise<InterviewStep> {
    try {
      const updated = await this.prisma.interviewStep.update({
        where: { id: stepId, offerId },
        data: {
          title: input.title,
          description: input.description,
          date:
            input.date === undefined || input.date === null
              ? input.date
              : fromDateOnly(input.date),
          status: input.status,
        },
      });
      return toInterviewStep(updated);
    } catch (error) {
      throw isRecordNotFound(error)
        ? interviewStepNotFound(offerId, stepId)
        : error;
    }
  }

  async remove(offerId: string, stepId: string): Promise<void> {
    try {
      await this.prisma.interviewStep.delete({
        where: { id: stepId, offerId },
      });
    } catch (error) {
      throw isRecordNotFound(error)
        ? interviewStepNotFound(offerId, stepId)
        : error;
    }
  }

  /** `stepIds` must list every step of the offer exactly once. */
  async reorder(offerId: string, stepIds: string[]): Promise<InterviewStep[]> {
    return this.prisma.$transaction(async (tx) => {
      await assertOfferExists(tx, offerId);
      const current = await tx.interviewStep.findMany({
        where: { offerId },
        select: { id: true },
      });
      const currentIds = new Set(current.map((step) => step.id));
      const isSameSet =
        stepIds.length === currentIds.size &&
        new Set(stepIds).size === stepIds.length &&
        stepIds.every((id) => currentIds.has(id));
      if (!isSameSet) {
        throw validationProblem([
          {
            in: 'body',
            name: '/stepIds',
            code: 'everyStepOnce',
            detail: `stepIds must list every step of the offer exactly once (it has ${String(currentIds.size)}). Get them with GET /offers/${offerId}/steps.`,
          },
        ]);
      }

      for (const [position, id] of stepIds.entries()) {
        await tx.interviewStep.update({ where: { id }, data: { position } });
      }
      return listSteps(tx, offerId);
    });
  }
}

async function listSteps(
  db: Transaction,
  offerId: string,
): Promise<InterviewStep[]> {
  const models = await db.interviewStep.findMany({
    where: { offerId },
    orderBy: STEP_ORDER,
  });
  return models.map(toInterviewStep);
}

async function assertOfferExists(
  db: Transaction,
  offerId: string,
): Promise<void> {
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    select: { id: true },
  });
  if (offer === null) {
    throw offerNotFound(offerId);
  }
}

function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === RECORD_NOT_FOUND
  );
}
