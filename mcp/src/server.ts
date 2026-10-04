import { McpServer, type CallToolResult } from '@modelcontextprotocol/server';
import { ApiError, type EmploiApi } from './api-client.ts';
import {
  addStepInput,
  createOfferInput,
  deletedOutput,
  listOffersInput,
  offerIdInput,
  offerOutput,
  offerPageOutput,
  offerWithStepsOutput,
  reorderStepsInput,
  stepIdInput,
  stepOutput,
  stepsOutput,
  updateOfferInput,
  updateStepInput,
} from './schemas.ts';

/** Given to the model when it connects: what emploi is and how the tools fit together. */
const INSTRUCTIONS = `emploi records the user's job search: the job offers they responded to, and for each offer the steps of its interview process.

- Offers: list_offers (newest first, paginated) gives their ids; get_offer returns an offer with its interview steps.
- Only the title of an offer is required; company, link, location, description and the day the user applied (appliedAt) are optional.
- Interview steps are an ordered, free-form list per offer (phone screen, technical test, onsite…), each with a title, an optional date, a status and notes. New steps are added last; reorder_interview_steps sets the whole order.
- Dates are days in YYYY-MM-DD format. Updates are partial: omitted fields are left unchanged, null clears an optional field.
- Deleting an offer also deletes its interview steps. Deletions cannot be undone: confirm with the user first.`;

/** A successful tool result: structured content, and the same as JSON text for clients without structured output. */
function result(data: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

/** API errors become tool errors the model can read and act on. */
function failure(error: unknown): CallToolResult {
  let text: string;
  if (error instanceof ApiError) {
    const reason =
      error.status === 404
        ? 'Not found'
        : error.status === 400
          ? 'Rejected by the emploi API'
          : `emploi API error ${String(error.status)}`;
    text = `${reason}: ${error.messages.join('; ')}`;
  } else {
    const cause = error instanceof Error ? error.message : String(error);
    text = `Could not reach the emploi API (${cause}). Is the local cluster running? (make up)`;
  }
  return { isError: true, content: [{ type: 'text', text }] };
}

async function run(
  action: () => Promise<Record<string, unknown>>,
): Promise<CallToolResult> {
  try {
    return result(await action());
  } catch (error) {
    return failure(error);
  }
}

/** The emploi MCP server (adrs/0019-mcp-server-for-ai-clients.md). */
export function createServer(api: EmploiApi): McpServer {
  const server = new McpServer(
    { name: 'emploi', title: 'emploi job search', version: '0.0.1' },
    { instructions: INSTRUCTIONS },
  );

  // Offers

  server.registerTool(
    'list_offers',
    {
      title: 'List job offers',
      description:
        'Lists the job offers the user responded to, newest first, one page at a time.',
      inputSchema: listOffersInput,
      outputSchema: offerPageOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ limit, offset }) =>
      run(async () => {
        const page = await api.listOffers({ limit, offset });
        return {
          offers: page.items,
          total: page.total,
          limit: page.limit,
          offset: page.offset,
        };
      }),
  );

  server.registerTool(
    'get_offer',
    {
      title: 'Get a job offer',
      description:
        'Returns a job offer with all its details and its interview steps, in order.',
      inputSchema: offerIdInput,
      outputSchema: offerWithStepsOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ offerId }) =>
      run(async () => {
        const [offer, steps] = await Promise.all([
          api.getOffer(offerId),
          api.listInterviewSteps(offerId),
        ]);
        return { offer, steps };
      }),
  );

  server.registerTool(
    'create_offer',
    {
      title: 'Record a job offer',
      description:
        'Records a job offer the user responded to. Only the title is required.',
      inputSchema: createOfferInput,
      outputSchema: offerOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    (input) => run(async () => ({ offer: await api.createOffer(input) })),
  );

  server.registerTool(
    'update_offer',
    {
      title: 'Update a job offer',
      description:
        'Changes some fields of an offer. Omitted fields are left unchanged; null clears an optional field. The title can be changed but not cleared.',
      inputSchema: updateOfferInput,
      outputSchema: offerOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ offerId, ...changes }) =>
      run(async () => ({ offer: await api.updateOffer(offerId, changes) })),
  );

  server.registerTool(
    'delete_offer',
    {
      title: 'Delete a job offer',
      description:
        'Deletes an offer and all its interview steps. Cannot be undone: confirm with the user first.',
      inputSchema: offerIdInput,
      outputSchema: deletedOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ offerId }) =>
      run(async () => {
        await api.deleteOffer(offerId);
        return { deleted: true };
      }),
  );

  // Interview steps

  server.registerTool(
    'add_interview_step',
    {
      title: 'Add an interview step',
      description:
        'Adds a step at the end of the interview process of an offer (e.g. "Phone screen with HR"). New steps are planned unless a status is given.',
      inputSchema: addStepInput,
      outputSchema: stepOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ offerId, ...step }) =>
      run(async () => ({
        step: await api.createInterviewStep(offerId, step),
      })),
  );

  server.registerTool(
    'update_interview_step',
    {
      title: 'Update an interview step',
      description:
        'Changes some fields of an interview step, e.g. its status after an interview. Omitted fields are left unchanged; null clears the date or the notes.',
      inputSchema: updateStepInput,
      outputSchema: stepOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ offerId, stepId, ...changes }) =>
      run(async () => ({
        step: await api.updateInterviewStep(offerId, stepId, changes),
      })),
  );

  server.registerTool(
    'reorder_interview_steps',
    {
      title: 'Reorder interview steps',
      description:
        'Sets the order of the interview steps of an offer. Give every step id of the offer exactly once, in the new order.',
      inputSchema: reorderStepsInput,
      outputSchema: stepsOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ offerId, stepIds }) =>
      run(async () => ({
        steps: await api.reorderInterviewSteps(offerId, stepIds),
      })),
  );

  server.registerTool(
    'delete_interview_step',
    {
      title: 'Delete an interview step',
      description:
        'Deletes one interview step of an offer. Cannot be undone: confirm with the user first.',
      inputSchema: stepIdInput,
      outputSchema: deletedOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ offerId, stepId }) =>
      run(async () => {
        await api.deleteInterviewStep(offerId, stepId);
        return { deleted: true };
      }),
  );

  return server;
}
