import 'server-only';
import type {
  CreateInterviewStepRequest,
  CreateOfferRequest,
  InterviewStep,
  ListOffersQuery,
  Offer,
  Page,
  ProblemDetails,
  ProblemType,
  UpdateInterviewStepRequest,
  UpdateOfferRequest,
} from '@emploi/shared';
import { connection } from 'next/server';
import { serverEnv } from './env';

/**
 * Error answered by the API: its RFC 9457 Problem Details
 * (adrs/0024-problem-details-errors.md), or `null` when the response wasn't
 * one (e.g. a proxy error page). Logged, never shown to the user.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails | null = null,
  ) {
    super(`API error ${String(status)}: ${describeProblem(problem)}`);
    this.name = 'ApiError';
  }
}

/** "detail (/title: isNotEmpty; …)" for logs. */
function describeProblem(problem: ProblemDetails | null): string {
  if (problem === null) {
    return 'no details';
  }
  const errors = (problem.errors ?? [])
    .map(({ name, code }) => `${name}: ${code}`)
    .join('; ');
  return errors ? `${problem.detail} (${errors})` : problem.detail;
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
    throw new ApiError(response.status, await readProblem(response));
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

/** The Problem Details of an error response, or `null` when it isn't one. */
async function readProblem(response: Response): Promise<ProblemDetails | null> {
  if (
    !response.headers
      .get('content-type')
      ?.startsWith('application/problem+json')
  ) {
    return null;
  }
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return null;
  }
}

const PROBLEM_TYPES: Record<ProblemType, string> = {
  'validation-error': '/problems/validation-error',
  'malformed-request': '/problems/malformed-request',
  'resource-not-found': '/problems/resource-not-found',
  'route-not-found': '/problems/route-not-found',
  'service-unavailable': '/problems/service-unavailable',
  'internal-error': '/problems/internal-error',
};

/** True when the API answered this kind of problem. */
export function isProblem(error: unknown, type: ProblemType): boolean {
  return (
    error instanceof ApiError && error.problem?.type === PROBLEM_TYPES[type]
  );
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

/**
 * True when the API says the resource doesn't exist, or that an id in the
 * path isn't one at all (an id from a URL typed by hand).
 */
export function isNotFound(error: unknown): boolean {
  if (isProblem(error, 'resource-not-found')) {
    return true;
  }
  const errors =
    error instanceof ApiError && isProblem(error, 'validation-error')
      ? (error.problem?.errors ?? [])
      : [];
  return errors.length > 0 && errors.every((invalid) => invalid.in === 'path');
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
