import type { Offer, ProblemDetails } from '@emploi/shared';
import { problem } from '@/test/problems';
import {
  ApiError,
  createOffer,
  getInterviewStep,
  getOffer,
  getOfferImage,
  isProblem,
  listInterviewSteps,
  listOffers,
  putOfferImage,
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
  image: null,
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

function problemResponse(body: ProblemDetails): Response {
  return new Response(JSON.stringify(body), {
    status: body.status,
    headers: { 'Content-Type': 'application/problem+json' },
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

  it.each([
    ['the offer does not exist', problem('resource-not-found')],
    [
      'the id is not one',
      problem('validation-error', {
        errors: [{ in: 'path', name: 'id', code: 'isUuid', detail: 'x' }],
      }),
    ],
  ])('returns null when %s', async (_case, body) => {
    fetchMock.mockResolvedValue(problemResponse(body));

    await expect(getOffer('unknown')).resolves.toBeNull();
  });

  it('throws on a route-not-found: the client is wrong, not the id', async () => {
    fetchMock.mockResolvedValue(problemResponse(problem('route-not-found')));

    await expect(getOffer(offer.id)).rejects.toBeInstanceOf(ApiError);
  });

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

  it('exposes the problem details of the API', async () => {
    const body = problem('validation-error', {
      errors: [
        {
          in: 'body',
          name: '/title',
          code: 'isNotEmpty',
          detail: 'title should not be empty',
        },
      ],
    });
    fetchMock.mockResolvedValue(problemResponse(body));

    const error: unknown = await createOffer({
      title: '',
      company: 'Acme',
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, problem: body });
    expect(isProblem(error, 'validation-error')).toBe(true);
    expect(String(error)).toContain('/title: isNotEmpty');
  });

  it('has no problem details when the response is not one', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Bad Gateway</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    await expect(createOffer({ title: 'Dev' })).rejects.toMatchObject({
      status: 502,
      problem: null,
    });
  });
});

describe('offer image', () => {
  it('sends the image as the raw body, with its type', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        contentType: 'image/png',
        byteSize: 3,
        updatedAt: '2026-10-20T10:00:00.000Z',
      }),
    );
    const image = new File([new Uint8Array(3)], 'a.png', {
      type: 'image/png',
    });

    await putOfferImage(offer.id, image);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://back/offers/${offer.id}/image`,
      expect.objectContaining({
        method: 'PUT',
        body: image,
        headers: { Accept: 'application/json', 'Content-Type': 'image/png' },
      }),
    );
  });

  it('gives the bytes and type of the image, or null without one', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('png', { headers: { 'Content-Type': 'image/png' } }),
    );
    const image = await getOfferImage(offer.id);
    expect(image?.contentType).toBe('image/png');
    await expect(new Response(image?.body).text()).resolves.toBe('png');

    fetchMock.mockResolvedValueOnce(
      problemResponse(
        problem('resource-not-found', { resource: 'offer-image' }),
      ),
    );
    await expect(getOfferImage(offer.id)).resolves.toBeNull();
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
      problemResponse(
        problem('resource-not-found', { resource: 'interview-step' }),
      ),
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
