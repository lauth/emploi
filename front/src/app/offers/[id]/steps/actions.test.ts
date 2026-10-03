import type { InterviewStep } from '@emploi/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  ApiError,
  createInterviewStep,
  deleteInterviewStep,
  listInterviewSteps,
  reorderInterviewSteps,
  updateInterviewStep,
} from '@/lib/api';
import {
  EMPTY_INTERVIEW_STEP_FORM,
  initialInterviewStepFormState,
} from '@/lib/interview-step-form';
import {
  createInterviewStepAction,
  deleteInterviewStepAction,
  moveInterviewStepAction,
  updateInterviewStepAction,
} from './actions';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  // The real `redirect` throws to stop the action; so does this one.
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  createInterviewStep: vi.fn(),
  updateInterviewStep: vi.fn(),
  deleteInterviewStep: vi.fn(),
  listInterviewSteps: vi.fn(),
  reorderInterviewSteps: vi.fn(),
}));

const OFFER_ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';
const initial = initialInterviewStepFormState(EMPTY_INTERVIEW_STEP_FORM);

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

const steps = ['a', 'b', 'c'].map((id) => ({ id }) as InterviewStep);

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('createInterviewStepAction', () => {
  it('returns field errors without calling the API', async () => {
    const state = await createInterviewStepAction(
      OFFER_ID,
      initial,
      form({ title: '', status: 'planned' }),
    );

    expect(state.fieldErrors).toHaveProperty('title');
    expect(createInterviewStep).not.toHaveBeenCalled();
  });

  it('creates the step and goes back to the offer', async () => {
    await expect(
      createInterviewStepAction(
        OFFER_ID,
        initial,
        form({ title: 'Phone screen', status: 'planned', date: '2026-10-06' }),
      ),
    ).rejects.toThrow(`redirect:/offers/${OFFER_ID}`);

    expect(createInterviewStep).toHaveBeenCalledWith(OFFER_ID, {
      title: 'Phone screen',
      date: '2026-10-06',
      status: 'planned',
      description: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/offers/${OFFER_ID}`);
  });

  it('reports an offer deleted in the meantime', async () => {
    vi.mocked(createInterviewStep).mockRejectedValue(
      new ApiError(404, ['Not found']),
    );

    const state = await createInterviewStepAction(
      OFFER_ID,
      initial,
      form({ title: 'Phone screen', status: 'planned' }),
    );

    expect(state.formErrors).toEqual([
      'Cette offre ou cette étape n’existe plus.',
    ]);
    expect(state.values.title).toBe('Phone screen');
  });
});

describe('updateInterviewStepAction', () => {
  it('sends every field and goes back to the offer', async () => {
    await expect(
      updateInterviewStepAction(
        OFFER_ID,
        'a',
        initial,
        form({ title: 'Call', status: 'passed' }),
      ),
    ).rejects.toThrow(`redirect:/offers/${OFFER_ID}`);

    expect(updateInterviewStep).toHaveBeenCalledWith(OFFER_ID, 'a', {
      title: 'Call',
      date: null,
      status: 'passed',
      description: null,
    });
  });

  it('translates field errors', async () => {
    const state = await updateInterviewStepAction(
      OFFER_ID,
      'a',
      initial,
      form({ title: 'Call', status: 'won' }),
    );

    expect(state.fieldErrors).toEqual({
      status: ['Choisissez une valeur de la liste'],
    });
    expect(updateInterviewStep).not.toHaveBeenCalled();
  });

  it('shows a translated message, not the API one, when the API rejects the data', async () => {
    vi.mocked(updateInterviewStep).mockRejectedValue(
      new ApiError(400, ['status must be one of the following values']),
    );

    const state = await updateInterviewStepAction(
      OFFER_ID,
      'a',
      initial,
      form({ title: 'Call', status: 'passed' }),
    );

    expect(state.formErrors).toEqual([
      'Le serveur a refusé ces données. Vérifiez les champs et réessayez.',
    ]);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('deleteInterviewStepAction', () => {
  it('deletes the step and refreshes the offer', async () => {
    await deleteInterviewStepAction(OFFER_ID, 'a');

    expect(deleteInterviewStep).toHaveBeenCalledWith(OFFER_ID, 'a');
    expect(revalidatePath).toHaveBeenCalledWith(`/offers/${OFFER_ID}`);
  });

  it('treats a step already deleted as success', async () => {
    vi.mocked(deleteInterviewStep).mockRejectedValue(
      new ApiError(404, ['Not found']),
    );

    await expect(deleteInterviewStepAction(OFFER_ID, 'a')).resolves.toBe(
      undefined,
    );
  });

  it('rethrows other errors', async () => {
    const failure = new ApiError(500, ['Internal server error']);
    vi.mocked(deleteInterviewStep).mockRejectedValue(failure);

    await expect(deleteInterviewStepAction(OFFER_ID, 'a')).rejects.toBe(
      failure,
    );
  });
});

describe('moveInterviewStepAction', () => {
  beforeEach(() => {
    vi.mocked(listInterviewSteps).mockResolvedValue(steps);
  });

  it('sends the new order', async () => {
    await moveInterviewStepAction(OFFER_ID, 'c', 'up');

    expect(reorderInterviewSteps).toHaveBeenCalledWith(OFFER_ID, [
      'a',
      'c',
      'b',
    ]);
    expect(revalidatePath).toHaveBeenCalledWith(`/offers/${OFFER_ID}`);
  });

  it('does nothing when the step is already first', async () => {
    await moveInterviewStepAction(OFFER_ID, 'a', 'up');

    expect(reorderInterviewSteps).not.toHaveBeenCalled();
  });

  it('refreshes the page when the steps changed in the meantime', async () => {
    vi.mocked(reorderInterviewSteps).mockRejectedValue(
      new ApiError(400, ['stepIds must list every step of the offer']),
    );

    await moveInterviewStepAction(OFFER_ID, 'b', 'down');

    expect(revalidatePath).toHaveBeenCalledWith(`/offers/${OFFER_ID}`);
  });

  it('rejects an invalid direction', async () => {
    await expect(
      moveInterviewStepAction(OFFER_ID, 'b', 'left' as 'up'),
    ).rejects.toThrow('Invalid direction');
    expect(listInterviewSteps).not.toHaveBeenCalled();
  });
});
