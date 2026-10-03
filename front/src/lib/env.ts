import 'server-only';
import { z } from 'zod';

const schema = z.object({
  /** Base URL of the API, read at runtime (adrs/0012-front-calls-api-from-server.md). */
  API_URL: z
    .url({ protocol: /^https?$/ })
    .transform((url) => url.replace(/\/+$/, '')),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

/** Validated server environment; throws a readable error when invalid. */
export function serverEnv(): ServerEnv {
  if (cached === undefined) {
    const result = schema.safeParse(process.env);
    if (!result.success) {
      throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
    }
    cached = result.data;
  }
  return cached;
}
