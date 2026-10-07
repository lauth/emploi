import type { ProblemDetails } from '@emploi/shared';
import { ApiError, createHttpApi } from './api-client.ts';

const BASE = 'https://api.example.test';
const OFFER_ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createHttpApi', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const api = createHttpApi(BASE, fetchMock);

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('lists offers with paging', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [], total: 0, limit: 5, offset: 10 }),
    );

    await api.listOffers({ limit: 5, offset: 10 });

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/offers?limit=5&offset=10`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends only the set list parameters', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [], total: 0, limit: 20, offset: 0 }),
    );

    await api.listOffers({
      limit: 20,
      offset: 0,
      q: 'dév',
      status: ['applied', 'interviewing'],
      sort: 'title',
      order: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/offers?limit=20&offset=0&q=d%C3%A9v&status=applied&status=interviewing&sort=title`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends JSON bodies', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 201));

    await api.createInterviewStep(OFFER_ID, { title: 'Call' });

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/offers/${OFFER_ID}/steps`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Call' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }) as unknown,
      }),
    );
  });

  it('reorders with PUT …/steps/order', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await api.reorderInterviewSteps(OFFER_ID, ['b', 'a']);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/offers/${OFFER_ID}/steps/order`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ stepIds: ['b', 'a'] }),
      }),
    );
  });

  it('accepts empty responses to deletions', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(api.deleteOffer(OFFER_ID)).resolves.toBeUndefined();
  });

  it('exposes the problem details of an error', async () => {
    const problem: ProblemDetails = {
      type: '/problems/validation-error',
      title: 'Invalid request',
      status: 400,
      detail: '1 value is invalid',
      instance: '/offers',
      errors: [
        {
          in: 'body',
          name: '/title',
          code: 'isNotEmpty',
          detail: 'title should not be empty',
        },
      ],
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(problem), {
        status: 400,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    const error: unknown = await api
      .createOffer({ title: '' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, problem });
  });

  it('has no problem details when the error body is not one', async () => {
    fetchMock.mockResolvedValue(
      new Response('upstream down', { status: 502, statusText: 'Bad Gateway' }),
    );

    await expect(api.getOffer(OFFER_ID)).rejects.toMatchObject({
      status: 502,
      problem: null,
    });
  });
});
