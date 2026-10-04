import { z } from 'zod';

const schema = z.object({
  /** Base URL of the emploi API. */
  MCP_API_URL: z
    .url({ protocol: /^https?$/ })
    .default('https://api.emploi.localhost')
    .transform((url) => url.replace(/\/+$/, '')),
});

export interface Config {
  apiUrl: string;
}

/** Reads and validates the environment; throws a readable error when invalid. */
export function readConfig(env: Record<string, string | undefined>): Config {
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return { apiUrl: result.data.MCP_API_URL };
}
