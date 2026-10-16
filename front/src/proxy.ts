import { NextResponse, type NextRequest } from 'next/server';
import { contentSecurityPolicy } from '@/lib/security-headers';

/**
 * A Content-Security-Policy with a fresh nonce for every page
 * (adrs/0029-security-headers.md). Next reads the nonce from the request's
 * header while rendering and adds it to its scripts and styles, which is why
 * every page renders per request (the root layout calls `connection()`).
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(16)),
  ).toString('base64');
  const policy = contentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV === 'development',
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: not the static files, which have no inline code.
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      // Prefetches return data, not documents.
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
