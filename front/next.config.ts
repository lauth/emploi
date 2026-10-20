import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { STATIC_SECURITY_HEADERS } from './src/lib/security-headers';

// Translations (adrs/0016-internationalized-interface.md).
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Self-contained server for the Docker image (front/Dockerfile).
  output: 'standalone',
  // Trace from the workspace root so workspace dependencies end up in the standalone output.
  outputFileTracingRoot: path.join(import.meta.dirname, '..'),
  // The design system ships TypeScript and CSS modules, compiled by Next
  // (adrs/0017-design-system-package-with-storybook.md).
  transpilePackages: ['@emploi/design-system'],
  // Security headers (adrs/0029-security-headers.md); the Content-Security-Policy,
  // which needs a nonce per request, is set by src/proxy.ts.
  poweredByHeader: false,
  experimental: {
    // Offer forms carry an image of up to 10 MiB, plus the text fields and the
    // multipart overhead (adrs/0031-offer-image.md). The proxy buffers request
    // bodies too, up to its own limit.
    serverActions: { bodySizeLimit: '11mb' },
    proxyClientMaxBodySize: '11mb',
  },
  headers() {
    return Promise.resolve([
      { source: '/:path*', headers: STATIC_SECURITY_HEADERS },
    ]);
  },
};

export default withNextIntl(nextConfig);
