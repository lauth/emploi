import 'server-only';
import type {
  CreateInterviewStepRequest,
  CreateOfferRequest,
  InterviewStep,
  ListOffersQuery,
  Offer,
  Page,
  UpdateInterviewStepRequest,
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

/** Filtered, sorted and paginated offers; unset parameters use the API defaults. */
export async function listOffers(query: ListOffersQuery): Promise<Page<Offer>> {
  await connection();
  // Arrays repeat the parameter (`status=a&status=b`).
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query) as [
    string,
    string | number | string[] | undefined,
  ][]) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== '') {
        params.append(name, String(item));
      }
    }
  }
  return json(await send(`/offers?${params.toString()}`));
}

/** True when the API says the resource doesn't exist (400: not a valid id). */
export function isNotFound(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 404 || error.status === 400)
  );
}

async function nullIfNotFound<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

const offerPath = (id: string) => `/offers/${encodeURIComponent(id)}`;

/** `null` when the offer doesn't exist. */
export async function getOffer(id: string): Promise<Offer | null> {
  await connection();
  return nullIfNotFound(send(offerPath(id)).then((r) => json<Offer>(r)));
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

// Interview steps (adrs/0015-interview-step-data-model-and-api.md)

const stepsPath = (offerId: string) => `${offerPath(offerId)}/steps`;
const stepPath = (offerId: string, stepId: string) =>
  `${stepsPath(offerId)}/${encodeURIComponent(stepId)}`;

/** The steps of an offer, in order. */
export async function listInterviewSteps(
  offerId: string,
): Promise<InterviewStep[]> {
  await connection();
  return json(await send(stepsPath(offerId)));
}

/** `null` when the step doesn't exist or belongs to another offer. */
export async function getInterviewStep(
  offerId: string,
  stepId: string,
): Promise<InterviewStep | null> {
  await connection();
  return nullIfNotFound(
    send(stepPath(offerId, stepId)).then((r) => json<InterviewStep>(r)),
  );
}

/** Adds the step after the existing ones. */
export async function createInterviewStep(
  offerId: string,
  body: CreateInterviewStepRequest,
): Promise<InterviewStep> {
  return json(
    await send(stepsPath(offerId), {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}

export async function updateInterviewStep(
  offerId: string,
  stepId: string,
  body: UpdateInterviewStepRequest,
): Promise<InterviewStep> {
  return json(
    await send(stepPath(offerId, stepId), {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  );
}

export async function deleteInterviewStep(
  offerId: string,
  stepId: string,
): Promise<void> {
  await send(stepPath(offerId, stepId), { method: 'DELETE' });
}

/** `stepIds` must list every step of the offer, in the new order. */
export async function reorderInterviewSteps(
  offerId: string,
  stepIds: string[],
): Promise<InterviewStep[]> {
  return json(
    await send(`${stepsPath(offerId)}/order`, {
      method: 'PUT',
      body: JSON.stringify({ stepIds }),
    }),
  );
}
