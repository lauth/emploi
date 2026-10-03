import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  Prisma,
  type InterviewStep as InterviewStepModel,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { InterviewStepsService } from './interview-steps.service.js';

const OFFER_ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';
const STEP_A = '0199a7a4-3c2e-7b6a-9c1d-00000000000a';
const STEP_B = '0199a7a4-3c2e-7b6a-9c1d-00000000000b';

function step(id: string, position: number): InterviewStepModel {
  return {
    id,
    offerId: OFFER_ID,
    position,
    title: `Step ${String(position)}`,
    description: null,
    date: null,
    status: 'planned',
    createdAt: new Date('2026-10-01T08:30:00.000Z'),
    updatedAt: new Date('2026-10-01T08:30:00.000Z'),
  };
}

function recordNotFound(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

describe('InterviewStepsService', () => {
  const prisma = {
    offer: { findUnique: vi.fn() },
    interviewStep: {
      aggregate: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Interactive transactions run against the same mock.
    $transaction: vi.fn((run: (tx: unknown) => Promise<unknown>) =>
      run(prisma),
    ),
  };
  let service: InterviewStepsService;

  beforeEach(async () => {
    // Reset implementations too, so one test's mocked results can't leak into the next.
    vi.resetAllMocks();
    prisma.offer.findUnique.mockResolvedValue({ id: OFFER_ID });
    const moduleRef = await Test.createTestingModule({
      providers: [
        InterviewStepsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(InterviewStepsService);
  });

  describe('list', () => {
    it('returns the steps in order', async () => {
      prisma.interviewStep.findMany.mockResolvedValue([
        step(STEP_A, 0),
        step(STEP_B, 1),
      ]);

      const steps = await service.list(OFFER_ID);

      expect(steps.map((s) => s.id)).toEqual([STEP_A, STEP_B]);
      expect(prisma.interviewStep.findMany).toHaveBeenCalledWith({
        where: { offerId: OFFER_ID },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });
    });

    it('throws NotFoundException for an unknown offer', async () => {
      prisma.offer.findUnique.mockResolvedValue(null);

      await expect(service.list(OFFER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('get', () => {
    it('only finds the step within its offer', async () => {
      prisma.interviewStep.findFirst.mockResolvedValue(null);

      await expect(service.get(OFFER_ID, STEP_A)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.interviewStep.findFirst).toHaveBeenCalledWith({
        where: { id: STEP_A, offerId: OFFER_ID },
      });
    });
  });

  describe('create', () => {
    it('adds the step last, planned by default', async () => {
      prisma.interviewStep.aggregate.mockResolvedValue({
        _max: { position: 4 },
      });
      prisma.interviewStep.create.mockResolvedValue(step(STEP_A, 5));

      await service.create(OFFER_ID, {
        title: 'Technical test',
        date: '2026-10-08',
      });

      expect(prisma.interviewStep.create).toHaveBeenCalledWith({
        data: {
          offerId: OFFER_ID,
          position: 5,
          title: 'Technical test',
          description: null,
          date: new Date('2026-10-08T00:00:00.000Z'),
          status: 'planned',
        },
      });
    });

    it('starts at position 0 for the first step', async () => {
      prisma.interviewStep.aggregate.mockResolvedValue({
        _max: { position: null },
      });
      prisma.interviewStep.create.mockResolvedValue(step(STEP_A, 0));

      await service.create(OFFER_ID, {
        title: 'Phone screen',
        status: 'passed',
      });

      expect(prisma.interviewStep.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          position: 0,
          status: 'passed',
        }) as unknown,
      });
    });

    it('throws NotFoundException for an unknown offer', async () => {
      prisma.offer.findUnique.mockResolvedValue(null);

      await expect(
        service.create(OFFER_ID, { title: 'Phone screen' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.interviewStep.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates the step within its offer', async () => {
      prisma.interviewStep.update.mockResolvedValue(step(STEP_A, 0));

      await service.update(OFFER_ID, STEP_A, { status: 'failed', date: null });

      expect(prisma.interviewStep.update).toHaveBeenCalledWith({
        where: { id: STEP_A, offerId: OFFER_ID },
        data: {
          title: undefined,
          description: undefined,
          date: null,
          status: 'failed',
        },
      });
    });

    it('throws NotFoundException for an unknown step', async () => {
      prisma.interviewStep.update.mockRejectedValue(recordNotFound());

      await expect(
        service.update(OFFER_ID, STEP_A, { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException for an unknown step', async () => {
      prisma.interviewStep.delete.mockRejectedValue(recordNotFound());

      await expect(service.remove(OFFER_ID, STEP_A)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('reorder', () => {
    beforeEach(() => {
      prisma.interviewStep.findMany
        .mockResolvedValueOnce([{ id: STEP_A }, { id: STEP_B }])
        .mockResolvedValueOnce([step(STEP_B, 0), step(STEP_A, 1)]);
    });

    it('rewrites the positions in the given order', async () => {
      const steps = await service.reorder(OFFER_ID, [STEP_B, STEP_A]);

      expect(prisma.interviewStep.update).toHaveBeenNthCalledWith(1, {
        where: { id: STEP_B },
        data: { position: 0 },
      });
      expect(prisma.interviewStep.update).toHaveBeenNthCalledWith(2, {
        where: { id: STEP_A },
        data: { position: 1 },
      });
      expect(steps.map((s) => s.id)).toEqual([STEP_B, STEP_A]);
    });

    it.each([
      ['a missing step', [STEP_A]],
      [
        'a step of another offer',
        [STEP_A, '0199a7a4-3c2e-7b6a-9c1d-0000000000ff'],
      ],
      ['a duplicated step', [STEP_A, STEP_A]],
      [
        'an extra step',
        [STEP_A, STEP_B, '0199a7a4-3c2e-7b6a-9c1d-0000000000ff'],
      ],
    ])('rejects %s', async (_case, stepIds) => {
      await expect(service.reorder(OFFER_ID, stepIds)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.interviewStep.update).not.toHaveBeenCalled();
    });
  });
});
