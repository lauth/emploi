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
      sort: 'title',
      order: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/offers?limit=20&offset=0&q=d%C3%A9v&sort=title`,
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

  it('exposes the API messages of an error', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          statusCode: 400,
          message: ['title should not be empty'],
          error: 'Bad Request',
        },
        400,
      ),
    );

    const error: unknown = await api
      .createOffer({ title: '' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      messages: ['title should not be empty'],
    });
  });

  it('falls back to the status when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('upstream down', { status: 502, statusText: 'Bad Gateway' }),
    );

    await expect(api.getOffer(OFFER_ID)).rejects.toMatchObject({
      status: 502,
      messages: ['502 Bad Gateway'],
    });
  });
});
