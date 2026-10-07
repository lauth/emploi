import type { Offer } from '@emploi/shared';
import {
  ApiError,
  createOffer,
  getInterviewStep,
  getOffer,
  listInterviewSteps,
  listOffers,
  reorderInterviewSteps,
} from './api';

vi.mock('next/server', () => ({ connection: vi.fn(() => Promise.resolve()) }));

const offer: Offer = {
  id: '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d',
  title: 'Backend developer',
  company: 'Acme',
  url: null,
  location: null,
  description: null,
  appliedAt: null,
  status: 'applied',
  createdAt: '2026-10-01T08:30:00.000Z',
  updatedAt: '2026-10-01T08:30:00.000Z',
};

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.stubEnv('API_URL', 'http://back/');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('listOffers', () => {
  it('calls the API without caching', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [offer], total: 1, limit: 20, offset: 40 }),
    );

    const page = await listOffers({ limit: 20, offset: 40 });

    expect(page.items).toEqual([offer]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://back/offers?limit=20&offset=40',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('repeats the status parameter for each status', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [], total: 0, limit: 20, offset: 0 }),
    );

    await listOffers({
      limit: 20,
      offset: 0,
      status: ['applied', 'interviewing'],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://back/offers?limit=20&offset=0&status=applied&status=interviewing',
      expect.anything(),
    );
  });
});

describe('getOffer', () => {
  it('returns the offer', async () => {
    fetchMock.mockResolvedValue(jsonResponse(offer));

    await expect(getOffer(offer.id)).resolves.toEqual(offer);
  });

  it.each([404, 400])(
    'returns null when the API answers %i',
    async (status) => {
      fetchMock.mockResolvedValue(
        jsonResponse({ message: 'Not found', statusCode: status }, status),
      );

      await expect(getOffer('unknown')).resolves.toBeNull();
    },
  );

  it('throws on other errors', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));

    await expect(getOffer(offer.id)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('createOffer', () => {
  it('posts JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(offer, 201));

    await createOffer({ title: 'Backend developer', company: 'Acme' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://back/offers',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Backend developer', company: 'Acme' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }) as unknown,
      }),
    );
  });

  it('exposes the validation messages of the API', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          message: ['title should not be empty', 'url must be a URL address'],
          error: 'Bad Request',
          statusCode: 400,
        },
        400,
      ),
    );

    const error: unknown = await createOffer({
      title: '',
      company: 'Acme',
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      messages: ['title should not be empty', 'url must be a URL address'],
    });
  });
});

describe('interview steps', () => {
  it('lists the steps of an offer', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await listInterviewSteps(offer.id);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://back/offers/${offer.id}/steps`,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('returns null for a step of another offer', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Not found', statusCode: 404 }, 404),
    );

    await expect(getInterviewStep(offer.id, 'step')).resolves.toBeNull();
  });

  it('sends the new order', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await reorderInterviewSteps(offer.id, ['b', 'a']);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://back/offers/${offer.id}/steps/order`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ stepIds: ['b', 'a'] }),
      }),
    );
  });
});
