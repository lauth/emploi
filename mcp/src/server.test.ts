import type { InterviewStep, Offer } from '@emploi/shared';
// Both halves of an in-memory pair must come from the same package (SDK v2).
import {
  Client,
  InMemoryTransport,
  type CallToolResult,
} from '@modelcontextprotocol/client';
import { ApiError, type EmploiApi } from './api-client.ts';
import { createServer } from './server.ts';

const OFFER_ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';
const STEP_A = '0199a7a4-3c2e-7b6a-9c1d-00000000000a';
const STEP_B = '0199a7a4-3c2e-7b6a-9c1d-00000000000b';

const offer: Offer = {
  id: OFFER_ID,
  title: 'Développeur backend',
  company: 'Acme',
  url: null,
  location: 'Lyon',
  description: null,
  appliedAt: '2026-09-28',
  createdAt: '2026-10-01T08:30:00.000Z',
  updatedAt: '2026-10-01T08:30:00.000Z',
};

const step: InterviewStep = {
  id: STEP_A,
  offerId: OFFER_ID,
  title: 'Entretien RH',
  description: null,
  date: '2026-10-06',
  status: 'planned',
  createdAt: '2026-10-01T08:30:00.000Z',
  updatedAt: '2026-10-01T08:30:00.000Z',
};

/** A fake API: every method is a mock. */
function fakeApi() {
  return {
    listOffers: vi.fn<EmploiApi['listOffers']>(),
    getOffer: vi.fn<EmploiApi['getOffer']>(),
    createOffer: vi.fn<EmploiApi['createOffer']>(),
    updateOffer: vi.fn<EmploiApi['updateOffer']>(),
    deleteOffer: vi.fn<EmploiApi['deleteOffer']>(),
    listInterviewSteps: vi.fn<EmploiApi['listInterviewSteps']>(),
    createInterviewStep: vi.fn<EmploiApi['createInterviewStep']>(),
    updateInterviewStep: vi.fn<EmploiApi['updateInterviewStep']>(),
    reorderInterviewSteps: vi.fn<EmploiApi['reorderInterviewSteps']>(),
    deleteInterviewStep: vi.fn<EmploiApi['deleteInterviewStep']>(),
  } satisfies EmploiApi;
}

let api: ReturnType<typeof fakeApi>;
let client: Client;

beforeEach(async () => {
  api = fakeApi();
  const server = createServer(api);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
});

afterEach(async () => {
  await client.close();
});

async function call(
  name: string,
  args: Record<string, unknown> = {},
): Promise<CallToolResult> {
  return client.callTool({ name, arguments: args });
}

function text(result: CallToolResult): string {
  return result.content
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('');
}

describe('emploi MCP server', () => {
  it('describes itself to the model', () => {
    expect(client.getInstructions()).toContain('job offers');
  });

  it('lists the tools with their annotations', async () => {
    const { tools } = await client.listTools();
    const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

    expect(Object.keys(byName).sort()).toEqual([
      'add_interview_step',
      'create_offer',
      'delete_interview_step',
      'delete_offer',
      'get_offer',
      'list_offers',
      'reorder_interview_steps',
      'update_interview_step',
      'update_offer',
    ]);
    expect(byName.list_offers?.annotations?.readOnlyHint).toBe(true);
    expect(byName.get_offer?.annotations?.readOnlyHint).toBe(true);
    expect(byName.delete_offer?.annotations?.destructiveHint).toBe(true);
    expect(byName.delete_interview_step?.annotations?.destructiveHint).toBe(
      true,
    );
    for (const tool of tools) {
      expect(tool.description, tool.name).toBeTruthy();
      expect(tool.outputSchema, tool.name).toBeDefined();
    }
  });

  // SDK v2 converts Zod schemas to JSON Schema; with an unsupported Zod setup
  // it silently drops `.describe()` texts, which are what the model reads.
  it('keeps the field descriptions and constraints in the tool schemas', async () => {
    const { tools } = await client.listTools();
    const createOffer = tools.find((tool) => tool.name === 'create_offer');
    const addStep = tools.find((tool) => tool.name === 'add_interview_step');

    expect(createOffer?.inputSchema).toMatchObject({
      required: ['title'],
      properties: {
        title: { description: 'Job title.', maxLength: 200 },
        appliedAt: {
          description: expect.stringContaining('YYYY-MM-DD') as unknown,
        },
      },
    });
    expect(addStep?.inputSchema).toMatchObject({
      properties: {
        status: {
          enum: ['planned', 'pending', 'passed', 'failed', 'cancelled'],
          description: expect.stringContaining(
            'Defaults to planned',
          ) as unknown,
        },
      },
    });
  });

  it('lists offers with default paging', async () => {
    api.listOffers.mockResolvedValue({
      items: [offer],
      total: 1,
      limit: 20,
      offset: 0,
    });

    const result = await call('list_offers');

    expect(api.listOffers).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      offers: [offer],
      total: 1,
      limit: 20,
      offset: 0,
    });
    expect(text(result)).toContain('Développeur backend');
  });

  it('passes search, period and sort to the API', async () => {
    api.listOffers.mockResolvedValue({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });

    await call('list_offers', {
      limit: 10,
      q: ' backend ',
      appliedFrom: '2026-09-01',
      appliedTo: '2026-09-30',
      sort: 'title',
      order: 'desc',
    });

    expect(api.listOffers).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      q: 'backend',
      appliedFrom: '2026-09-01',
      appliedTo: '2026-09-30',
      sort: 'title',
      order: 'desc',
    });
  });

  it('gets an offer with its steps', async () => {
    api.getOffer.mockResolvedValue(offer);
    api.listInterviewSteps.mockResolvedValue([step]);

    const result = await call('get_offer', { offerId: OFFER_ID });

    expect(result.structuredContent).toEqual({ offer, steps: [step] });
  });

  it('creates an offer', async () => {
    api.createOffer.mockResolvedValue(offer);

    const result = await call('create_offer', {
      title: 'Développeur backend',
      company: 'Acme',
      appliedAt: '2026-09-28',
    });

    expect(api.createOffer).toHaveBeenCalledWith({
      title: 'Développeur backend',
      company: 'Acme',
      appliedAt: '2026-09-28',
    });
    expect(result.structuredContent).toEqual({ offer });
  });

  it('updates only the given fields, null clearing', async () => {
    api.updateOffer.mockResolvedValue({ ...offer, url: null });

    await call('update_offer', { offerId: OFFER_ID, url: null });

    expect(api.updateOffer).toHaveBeenCalledWith(OFFER_ID, { url: null });
  });

  it('deletes an offer', async () => {
    api.deleteOffer.mockResolvedValue();

    const result = await call('delete_offer', { offerId: OFFER_ID });

    expect(api.deleteOffer).toHaveBeenCalledWith(OFFER_ID);
    expect(result.structuredContent).toEqual({ deleted: true });
  });

  it('adds, updates, reorders and deletes interview steps', async () => {
    api.createInterviewStep.mockResolvedValue(step);
    api.updateInterviewStep.mockResolvedValue({ ...step, status: 'passed' });
    api.reorderInterviewSteps.mockResolvedValue([step]);
    api.deleteInterviewStep.mockResolvedValue();

    await call('add_interview_step', {
      offerId: OFFER_ID,
      title: 'Entretien RH',
      date: '2026-10-06',
    });
    await call('update_interview_step', {
      offerId: OFFER_ID,
      stepId: STEP_A,
      status: 'passed',
    });
    await call('reorder_interview_steps', {
      offerId: OFFER_ID,
      stepIds: [STEP_B, STEP_A],
    });
    await call('delete_interview_step', { offerId: OFFER_ID, stepId: STEP_A });

    expect(api.createInterviewStep).toHaveBeenCalledWith(OFFER_ID, {
      title: 'Entretien RH',
      date: '2026-10-06',
    });
    expect(api.updateInterviewStep).toHaveBeenCalledWith(OFFER_ID, STEP_A, {
      status: 'passed',
    });
    expect(api.reorderInterviewSteps).toHaveBeenCalledWith(OFFER_ID, [
      STEP_B,
      STEP_A,
    ]);
    expect(api.deleteInterviewStep).toHaveBeenCalledWith(OFFER_ID, STEP_A);
  });

  it.each([
    ['create_offer', { title: '' }],
    ['create_offer', { title: 'Dev', url: 'ftp://example.com' }],
    ['create_offer', { title: 'Dev', appliedAt: '28/09/2026' }],
    ['get_offer', { offerId: 'not-an-id' }],
    ['add_interview_step', { offerId: OFFER_ID, title: 'Call', status: 'won' }],
    ['list_offers', { limit: 500 }],
    ['list_offers', { sort: 'salary' }],
    ['list_offers', { appliedFrom: '01/09/2026' }],
  ])('rejects invalid input to %s: %j', async (name, args) => {
    const result = await call(name, args);

    expect(result.isError).toBe(true);
    expect(Object.values(api).every((fn) => fn.mock.calls.length === 0)).toBe(
      true,
    );
  });

  it('turns API errors into tool errors the model can read', async () => {
    api.getOffer.mockRejectedValue(
      new ApiError(404, [`Offer ${OFFER_ID} not found`]),
    );
    api.listInterviewSteps.mockResolvedValue([]);

    const result = await call('get_offer', { offerId: OFFER_ID });

    expect(result.isError).toBe(true);
    expect(text(result)).toBe(`Not found: Offer ${OFFER_ID} not found`);
  });

  it('only passes the documented fields to the model', async () => {
    // A field the back added but no tool describes yet.
    api.getOffer.mockResolvedValue({ ...offer, salary: '50k' } as Offer);
    api.listInterviewSteps.mockResolvedValue([]);

    const result = await call('get_offer', { offerId: OFFER_ID });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({ offer, steps: [] });
    expect(text(result)).not.toContain('salary');
  });

  it('reports an API response the tools no longer describe', async () => {
    // e.g. the back renamed a field.
    const { title, ...renamed } = offer;
    api.getOffer.mockResolvedValue({
      ...renamed,
      name: title,
    } as unknown as Offer);
    api.listInterviewSteps.mockResolvedValue([]);

    const result = await call('get_offer', { offerId: OFFER_ID });

    expect(result.isError).toBe(true);
    expect(text(result)).toContain('may need an update');
    expect(text(result)).toContain('offer.title');
  });

  it('reports an unreachable API with a hint', async () => {
    api.listOffers.mockRejectedValue(new TypeError('fetch failed'));

    const result = await call('list_offers');

    expect(result.isError).toBe(true);
    expect(text(result)).toContain('Could not reach the emploi API');
    expect(text(result)).toContain('make up');
  });
});
