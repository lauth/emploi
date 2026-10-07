import type {
  CreateInterviewStepRequest,
  CreateOfferRequest,
  InterviewStep,
  ListOffersQuery,
  Offer,
  Page,
  ProblemDetails,
  UpdateInterviewStepRequest,
  UpdateOfferRequest,
} from '@emploi/shared';

/**
 * Error answered by the API: its RFC 9457 Problem Details
 * (adrs/0024-problem-details-errors.md), or `null` when the response wasn't
 * one (e.g. a proxy error page).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(status: number, problem: ProblemDetails | null) {
    super(problem?.detail ?? `HTTP ${String(status)}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

/**
 * Query string of the set values; the API applies its defaults to the others.
 * Arrays repeat the parameter (`status=a&status=b`).
 */
export function searchParams(query: ListOffersQuery): string {
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
  return params.toString();
}

/** The emploi REST API, as used by the MCP tools. */
export interface EmploiApi {
  listOffers(query: ListOffersQuery): Promise<Page<Offer>>;
  getOffer(offerId: string): Promise<Offer>;
  createOffer(body: CreateOfferRequest): Promise<Offer>;
  updateOffer(offerId: string, body: UpdateOfferRequest): Promise<Offer>;
  deleteOffer(offerId: string): Promise<void>;
  listInterviewSteps(offerId: string): Promise<InterviewStep[]>;
  createInterviewStep(
    offerId: string,
    body: CreateInterviewStepRequest,
  ): Promise<InterviewStep>;
  updateInterviewStep(
    offerId: string,
    stepId: string,
    body: UpdateInterviewStepRequest,
  ): Promise<InterviewStep>;
  reorderInterviewSteps(
    offerId: string,
    stepIds: string[],
  ): Promise<InterviewStep[]>;
  deleteInterviewStep(offerId: string, stepId: string): Promise<void>;
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

/** An `EmploiApi` over HTTP, using `fetch`. */
export function createHttpApi(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): EmploiApi {
  const offer = (offerId: string) => `/offers/${encodeURIComponent(offerId)}`;
  const steps = (offerId: string) => `${offer(offerId)}/steps`;
  const step = (offerId: string, stepId: string) =>
    `${steps(offerId)}/${encodeURIComponent(stepId)}`;

  async function send(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      throw new ApiError(response.status, await readProblem(response));
    }
    return response;
  }

  /** Responses are trusted to match the shared types: both sides compile against them. */
  async function json<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    return (await (await send(method, path, body)).json()) as T;
  }

  return {
    listOffers: (query) => json('GET', `/offers?${searchParams(query)}`),
    getOffer: (offerId) => json('GET', offer(offerId)),
    createOffer: (body) => json('POST', '/offers', body),
    updateOffer: (offerId, body) => json('PATCH', offer(offerId), body),
    deleteOffer: async (offerId) => {
      await send('DELETE', offer(offerId));
    },
    listInterviewSteps: (offerId) => json('GET', steps(offerId)),
    createInterviewStep: (offerId, body) => json('POST', steps(offerId), body),
    updateInterviewStep: (offerId, stepId, body) =>
      json('PATCH', step(offerId, stepId), body),
    reorderInterviewSteps: (offerId, stepIds) =>
      json('PUT', `${steps(offerId)}/order`, { stepIds }),
    deleteInterviewStep: async (offerId, stepId) => {
      await send('DELETE', step(offerId, stepId));
    },
  };
}
