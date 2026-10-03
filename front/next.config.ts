import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Self-contained server for the Docker image (front/Dockerfile).
  output: 'standalone',
  // Trace from the workspace root so workspace dependencies end up in the standalone output.
  outputFileTracingRoot: path.join(import.meta.dirname, '..'),
};

export default nextConfig;
