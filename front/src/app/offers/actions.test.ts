import type { Offer } from '@emploi/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createOffer, deleteOffer, updateOffer } from '@/lib/api';
import { EMPTY_OFFER_FORM, initialOfferFormState } from '@/lib/offer-form';
import { problemError, validationError } from '@/test/problems';
import {
  createOfferAction,
  deleteOfferAction,
  updateOfferAction,
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
  createOffer: vi.fn(),
  updateOffer: vi.fn(),
  deleteOffer: vi.fn(),
}));

const ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';
const initial = initialOfferFormState(EMPTY_OFFER_FORM);

/** Form data as the browser sends it: the status select always has a value. */
function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries({
    status: 'applied',
    ...fields,
  })) {
    formData.set(name, value);
  }
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('createOfferAction', () => {
  it('returns field errors without calling the API', async () => {
    const state = await createOfferAction(initial, form({ company: 'Acme' }));

    expect(state.fieldErrors).toHaveProperty('title');
    expect(state.values.company).toBe('Acme');
    expect(createOffer).not.toHaveBeenCalled();
  });

  it('creates the offer and redirects to it', async () => {
    vi.mocked(createOffer).mockResolvedValue({ id: ID } as Offer);

    await expect(
      createOfferAction(initial, form({ title: 'Dev', company: 'Acme' })),
    ).rejects.toThrow(`redirect:/offers/${ID}`);

    expect(createOffer).toHaveBeenCalledWith({
      title: 'Dev',
      company: 'Acme',
      url: null,
      location: null,
      description: null,
      appliedAt: null,
      status: 'applied',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/offers');
  });

  it('translates field errors', async () => {
    const state = await createOfferAction(initial, form({ title: ' ' }));

    expect(state.fieldErrors).toEqual({ title: ['Champ obligatoire'] });
  });

  it('shows a translated message, not the API one, when the API rejects the data', async () => {
    const rejection = validationError({
      in: 'body',
      name: '/title',
      code: 'maxLength',
      detail: 'title must be shorter than or equal to 200 characters',
      maxLength: 200,
    });
    vi.mocked(createOffer).mockRejectedValue(rejection);

    const state = await createOfferAction(
      initial,
      form({ title: 'Dev', company: 'Acme' }),
    );

    expect(state.formErrors).toEqual([
      'Le serveur a refusé ces données. Vérifiez les champs et réessayez.',
    ]);
    expect(console.error).toHaveBeenCalledWith(rejection);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('shows a generic message when the API fails', async () => {
    vi.mocked(createOffer).mockRejectedValue(new TypeError('fetch failed'));

    const state = await createOfferAction(
      initial,
      form({ title: 'Dev', company: 'Acme' }),
    );

    expect(state.formErrors).toEqual([
      'L’offre n’a pas pu être enregistrée. Veuillez réessayer.',
    ]);
    expect(state.values.title).toBe('Dev');
  });
});

describe('updateOfferAction', () => {
  it('sends every field, clearing empty ones', async () => {
    vi.mocked(updateOffer).mockResolvedValue({ id: ID } as Offer);

    await expect(
      updateOfferAction(
        ID,
        initial,
        form({ title: 'Dev', company: 'Acme', url: '', status: 'offered' }),
      ),
    ).rejects.toThrow(`redirect:/offers/${ID}`);

    expect(updateOffer).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({ url: null, status: 'offered' }),
    );
  });

  it('reports an offer deleted in the meantime', async () => {
    vi.mocked(updateOffer).mockRejectedValue(
      problemError('resource-not-found', { resource: 'offer' }),
    );

    const state = await updateOfferAction(
      ID,
      initial,
      form({ title: 'Dev', company: 'Acme' }),
    );

    expect(state.formErrors).toEqual(['Cette offre n’existe plus.']);
  });
});

describe('deleteOfferAction', () => {
  it('deletes and redirects to the list', async () => {
    vi.mocked(deleteOffer).mockResolvedValue();

    await expect(deleteOfferAction(ID)).rejects.toThrow('redirect:/offers');
    expect(deleteOffer).toHaveBeenCalledWith(ID);
  });

  it('treats an offer already deleted as success', async () => {
    vi.mocked(deleteOffer).mockRejectedValue(
      problemError('resource-not-found', { resource: 'offer' }),
    );

    await expect(deleteOfferAction(ID)).rejects.toThrow('redirect:/offers');
  });

  it('rethrows other errors', async () => {
    const failure = problemError('internal-error');
    vi.mocked(deleteOffer).mockRejectedValue(failure);

    await expect(deleteOfferAction(ID)).rejects.toBe(failure);
  });
});
