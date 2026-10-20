import { NextRequest } from 'next/server';
import { getOfferImage } from '@/lib/api';
import { GET } from './route';

vi.mock('@/lib/api', () => ({ getOfferImage: vi.fn() }));

const ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';

function get(query = '') {
  return GET(
    new NextRequest(`https://emploi.localhost/offers/${ID}/image${query}`),
    { params: Promise.resolve({ id: ID }) },
  );
}

function body(text: string): ReadableStream<Uint8Array> {
  return new Response(text).body ?? new ReadableStream();
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('GET /offers/:id/image', () => {
  it('streams the image, cached for good when the URL is versioned', async () => {
    vi.mocked(getOfferImage).mockResolvedValue({
      contentType: 'image/png',
      body: body('png bytes'),
    });

    const response = await get('?v=2026-10-20T10%3A00%3A00.000Z');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('cache-control')).toBe(
      'private, max-age=31536000, immutable',
    );
    await expect(response.text()).resolves.toBe('png bytes');
    expect(getOfferImage).toHaveBeenCalledWith(ID);
  });

  it('asks the browser to check again without a version', async () => {
    vi.mocked(getOfferImage).mockResolvedValue({
      contentType: 'image/png',
      body: body('png bytes'),
    });

    const response = await get();

    expect(response.headers.get('cache-control')).toBe('private, no-cache');
  });

  it('answers 404 without an image', async () => {
    vi.mocked(getOfferImage).mockResolvedValue(null);

    expect((await get()).status).toBe(404);
  });

  it('never serves something else than an image from this origin', async () => {
    vi.mocked(getOfferImage).mockResolvedValue({
      contentType: 'text/html',
      body: body('<script>alert(1)</script>'),
    });

    const response = await get();

    expect(response.status).toBe(502);
    await expect(response.text()).resolves.toBe('');
  });
});
