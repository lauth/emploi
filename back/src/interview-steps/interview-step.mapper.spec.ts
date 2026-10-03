import type { InterviewStep as InterviewStepModel } from '../generated/prisma/client.js';
import { toInterviewStep } from './interview-step.mapper.js';

describe('toInterviewStep', () => {
  const model: InterviewStepModel = {
    id: '0199a7a4-3c2e-7b6a-9c1d-000000000001',
    offerId: '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d',
    position: 3,
    title: 'Phone screen',
    description: 'With the HR manager',
    date: new Date('2026-10-06T00:00:00.000Z'),
    status: 'pending',
    createdAt: new Date('2026-10-01T08:30:00.000Z'),
    updatedAt: new Date('2026-10-02T09:45:00.000Z'),
  };

  it('formats dates and keeps the position internal', () => {
    expect(toInterviewStep(model)).toEqual({
      id: model.id,
      offerId: model.offerId,
      title: 'Phone screen',
      description: 'With the HR manager',
      date: '2026-10-06',
      status: 'pending',
      createdAt: '2026-10-01T08:30:00.000Z',
      updatedAt: '2026-10-02T09:45:00.000Z',
    });
  });

  it('keeps missing optional fields as null', () => {
    expect(
      toInterviewStep({ ...model, description: null, date: null }),
    ).toMatchObject({ description: null, date: null });
  });
});
