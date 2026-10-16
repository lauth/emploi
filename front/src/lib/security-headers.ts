// Security headers of the pages (adrs/0029-security-headers.md).

/**
 * Content-Security-Policy of a page. Scripts and style elements need the
 * request's nonce, which Next adds to its own tags; `'strict-dynamic'` lets the
 * scripts it loads load others. Style attributes stay allowed: the design
 * system's `Popover` sets its CSS anchor through `style`.
 */
export function contentSecurityPolicy(
  nonce: string,
  { development }: { development: boolean },
): string {
  return [
    "default-src 'self'",
    // React rebuilds server error stacks with `eval` in development only.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`,
    // The dev server injects style elements without the nonce.
    `style-src 'self' ${development ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/** Headers that don't change from one request to the next, for every path. */
export const STATIC_SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Older browsers ignore `frame-ancestors`.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
];
