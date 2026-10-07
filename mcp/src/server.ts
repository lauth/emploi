import { McpServer, type CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod';
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

- Offers: list_offers gives their ids, most recent application first by default; it can search (q), filter by application period and by status, and sort, one page at a time. get_offer returns an offer with its interview steps.
- Only the title of an offer is required; company, link, location, description and the day the user applied (appliedAt) are optional.
- Each offer has a status the user sets (applied by default, then interviewing, offered, accepted, rejected, ghosted or withdrawn). It is not derived from the steps: when the user reports news (an interview, an offer, a refusal), update it with update_offer.
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

/**
 * An API error for the model: a summary, one line per invalid value (with the
 * accepted values), then the RFC 9457 Problem Details as JSON
 * (adrs/0024-problem-details-errors.md). Body fields have the names of the
 * tool's arguments.
 */
function describeApiError(error: ApiError): string {
  const { problem } = error;
  if (problem === null) {
    return `The emploi API failed with HTTP ${String(error.status)} and no details. Is the local cluster running? (make up)`;
  }
  const invalid = (problem.errors ?? []).map((param) => {
    const argument = param.in === 'body' ? param.name.slice(1) : param.name;
    const hints = [
      param.allowed ? `allowed values: ${param.allowed.join(', ')}` : null,
      param.maxLength === undefined
        ? null
        : `at most ${String(param.maxLength)} characters`,
    ].filter((hint) => hint !== null);
    return `- ${argument} (${param.code}): ${param.detail}${hints.length > 0 ? ` (${hints.join('; ')})` : ''}`;
  });
  return [
    `${problem.title} (HTTP ${String(problem.status)}): ${problem.detail}`,
    ...invalid,
    '',
    'Problem details (RFC 9457):',
    JSON.stringify(problem, null, 2),
  ].join('\n');
}

/** API errors become tool errors the model can read and act on. */
function failure(error: unknown): CallToolResult {
  let text: string;
  if (error instanceof z.ZodError) {
    // The API answered something the tool's output schema doesn't describe:
    // the back changed and this server wasn't updated.
    text = `The emploi API returned an unexpected response; the MCP server may need an update.\n${z.prettifyError(error)}`;
  } else if (error instanceof ApiError) {
    text = describeApiError(error);
  } else {
    const cause = error instanceof Error ? error.message : String(error);
    text = `Could not reach the emploi API (${cause}). Is the local cluster running? (make up)`;
  }
  return { isError: true, content: [{ type: 'text', text }] };
}

/**
 * Runs a tool and shapes its result with the tool's output schema: only the
 * documented fields reach the model, so the result always matches the schema
 * the server advertises, and an unexpected API response is reported.
 */
async function run<Output extends Record<string, unknown>>(
  outputSchema: z.ZodType<Output>,
  action: () => Promise<unknown>,
): Promise<CallToolResult> {
  try {
    return result(outputSchema.parse(await action()));
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
        'Lists the job offers the user responded to, one page at a time. By default the most recent application comes first; offers without an application date come last. Can search text in the title, company and location (q), keep an application period (appliedFrom, appliedTo), keep some statuses (status, e.g. ["applied", "interviewing"] for the applications still open) and sort by application date, date recorded, title, company or status. The result gives the total, to page through with offset.',
      inputSchema: listOffersInput,
      outputSchema: offerPageOutput,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    (query) =>
      run(offerPageOutput, async () => {
        const page = await api.listOffers(query);
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
      run(offerWithStepsOutput, async () => {
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
    (input) =>
      run(offerOutput, async () => ({ offer: await api.createOffer(input) })),
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
      run(offerOutput, async () => ({
        offer: await api.updateOffer(offerId, changes),
      })),
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
      run(deletedOutput, async () => {
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
      run(stepOutput, async () => ({
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
      run(stepOutput, async () => ({
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
      run(stepsOutput, async () => ({
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
      run(deletedOutput, async () => {
        await api.deleteInterviewStep(offerId, stepId);
        return { deleted: true };
      }),
  );

  return server;
}
