import type { NextRequest } from 'next/server';
import { getOfferImage } from '@/lib/api';
import { isOfferImageType } from '@/lib/offer-image';

/**
 * The image of an offer, streamed from the API: the browser never calls the
 * API (adrs/0012-front-calls-api-from-server.md), and the page's
 * Content-Security-Policy only allows images from this origin
 * (adrs/0031-offer-image.md).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/offers/[id]/image'>,
): Promise<Response> {
  const image = await getOfferImage((await params).id);
  if (image === null) {
    return new Response(null, { status: 404 });
  }
  // Only images leave this origin, whatever the API says.
  if (!isOfferImageType(image.contentType)) {
    await image.body.cancel();
    return new Response(null, { status: 502 });
  }
  // `?v=` changes with the image (offerImageUrl): a versioned URL never changes.
  const versioned = request.nextUrl.searchParams.has('v');
  return new Response(image.body, {
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': versioned
        ? 'private, max-age=31536000, immutable'
        : 'private, no-cache',
    },
  });
}
