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

/** Error answered by the API, with its messages (validation problems, not found…). */
export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join('; '));
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
  }
}

/** Query string of the set values; the API applies its defaults to the others. */
function searchParams(query: ListOffersQuery): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(name, String(value));
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
  return [`${String(response.status)} ${response.statusText}`.trim()];
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
      throw new ApiError(response.status, await readMessages(response));
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
