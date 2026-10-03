import 'server-only';
import type {
  CreateOfferRequest,
  Offer,
  Page,
  UpdateOfferRequest,
} from '@emploi/shared';
import { connection } from 'next/server';
import { serverEnv } from './env';

/** Error answered by the API, with its validation messages when there are some. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly messages: string[],
  ) {
    super(`API error ${String(status)}: ${messages.join('; ')}`);
    this.name = 'ApiError';
  }
}

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${serverEnv().API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(init.body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
    },
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readMessages(response));
  }
  return response;
}

/**
 * Responses are trusted to match the shared types: the API is ours and both
 * sides compile against `@emploi/shared`.
 */
async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

/** NestJS error bodies: `{ message: string | string[], error, statusCode }`. */
async function readMessages(response: Response): Promise<string[]> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const { message } = body;
      if (typeof message === 'string') {
        return [message];
      }
      if (Array.isArray(message)) {
        return message.filter((item) => typeof item === 'string');
      }
    }
  } catch {
    // Not JSON: fall through to the status text.
  }
  return [response.statusText];
}

// Reads are used while rendering: `connection()` makes the page render at
// request time instead of being prerendered at build time without an API.

export async function listOffers(query: {
  limit: number;
  offset: number;
}): Promise<Page<Offer>> {
  await connection();
  const params = new URLSearchParams({
    limit: String(query.limit),
    offset: String(query.offset),
  });
  return json(await send(`/offers?${params.toString()}`));
}

/** `null` when the offer doesn't exist. */
export async function getOffer(id: string): Promise<Offer | null> {
  await connection();
  try {
    return await json<Offer>(await send(`/offers/${encodeURIComponent(id)}`));
  } catch (error) {
    // 400: not a valid id, so no such offer either.
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      return null;
    }
    throw error;
  }
}

export async function createOffer(body: CreateOfferRequest): Promise<Offer> {
  return json(
    await send('/offers', { method: 'POST', body: JSON.stringify(body) }),
  );
}

export async function updateOffer(
  id: string,
  body: UpdateOfferRequest,
): Promise<Offer> {
  return json(
    await send(`/offers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  );
}

export async function deleteOffer(id: string): Promise<void> {
  await send(`/offers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
