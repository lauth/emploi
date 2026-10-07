import { readFileSync } from 'node:fs';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import type { EmploiApi } from './api-client.ts';
import { createServer } from './server.ts';

// Keeps the MCP tools in step with the API. back/openapi.json is generated
// from the back and checked by its own tests (adrs/0018-openapi-documentation.md),
// so it always describes the current API. When the back adds an operation or
// a request field, this test fails until a tool covers it or it is excluded
// on purpose below.

interface OpenApiOperation {
  parameters?: { name: string; in: 'path' | 'query' | 'header' | 'cookie' }[];
  requestBody?: {
    content: Record<string, { schema: { $ref: string } }>;
  };
}

interface OpenApiDocument {
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: {
    schemas: Record<string, { properties?: Record<string, unknown> }>;
  };
}

const document = JSON.parse(
  readFileSync(new URL('../../back/openapi.json', import.meta.url), 'utf8'),
) as OpenApiDocument;

/** How each API operation is available to AI clients. */
const COVERAGE: Record<string, { tool: string } | { excluded: string }> = {
  'GET /offers': { tool: 'list_offers' },
  'GET /offers/{id}': { tool: 'get_offer' },
  'POST /offers': { tool: 'create_offer' },
  'PATCH /offers/{id}': { tool: 'update_offer' },
  'DELETE /offers/{id}': { tool: 'delete_offer' },
  'GET /offers/{offerId}/steps': { tool: 'get_offer' },
  'GET /offers/{offerId}/steps/{stepId}': { tool: 'get_offer' },
  'POST /offers/{offerId}/steps': { tool: 'add_interview_step' },
  'PATCH /offers/{offerId}/steps/{stepId}': { tool: 'update_interview_step' },
  'PUT /offers/{offerId}/steps/order': { tool: 'reorder_interview_steps' },
  'DELETE /offers/{offerId}/steps/{stepId}': {
    tool: 'delete_interview_step',
  },
  'GET /health/live': { excluded: 'Kubernetes probe, not a user operation' },
  'GET /health/ready': { excluded: 'Kubernetes probe, not a user operation' },
  'GET /problems': {
    excluded: 'error documentation: tool errors already include each problem',
  },
  'GET /problems/{type}': {
    excluded: 'error documentation: tool errors already include each problem',
  },
};

/** Path parameters, which tools take as arguments too but aren't body fields. */
const PATH_PARAMETERS = new Set(['offerId', 'stepId']);

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function apiOperations(): [string, OpenApiOperation][] {
  return Object.entries(document.paths).flatMap(([path, item]) =>
    Object.entries(item)
      .filter(([method]) => HTTP_METHODS.includes(method))
      .map(
        ([method, operation]) =>
          [`${method.toUpperCase()} ${path}`, operation] as [
            string,
            OpenApiOperation,
          ],
      ),
  );
}

function queryParameters(operation: OpenApiOperation): string[] {
  return (operation.parameters ?? [])
    .filter((parameter) => parameter.in === 'query')
    .map((parameter) => parameter.name);
}

function bodyFields(operation: OpenApiOperation): string[] {
  const ref = operation.requestBody?.content['application/json']?.schema.$ref;
  if (ref === undefined) {
    return [];
  }
  const name = ref.split('/').at(-1) ?? '';
  return Object.keys(document.components.schemas[name]?.properties ?? {});
}

async function toolInputFields(): Promise<Map<string, string[]>> {
  const server = createServer({} as EmploiApi);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'coverage', version: '0.0.0' });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  const { tools } = await client.listTools();
  await client.close();
  return new Map(
    tools.map((tool) => [
      tool.name,
      Object.keys(tool.inputSchema.properties ?? {}).filter(
        (field) => !PATH_PARAMETERS.has(field),
      ),
    ]),
  );
}

describe('MCP coverage of the API (back/openapi.json)', () => {
  it('covers every API operation, or excludes it on purpose', () => {
    const operations = apiOperations().map(([name]) => name);

    // A failure here means the API changed: add a tool in src/server.ts and
    // list it in COVERAGE, or exclude the operation with a reason.
    expect(operations.sort()).toEqual(Object.keys(COVERAGE).sort());
  });

  it('maps operations to tools that exist', async () => {
    const tools = await toolInputFields();

    for (const [operation, coverage] of Object.entries(COVERAGE)) {
      if ('tool' in coverage) {
        expect(tools.has(coverage.tool), operation).toBe(true);
      }
    }
  });

  it('lets each tool send every field its operation accepts', async () => {
    const tools = await toolInputFields();

    for (const [name, operation] of apiOperations()) {
      const coverage = COVERAGE[name];
      const fields = bodyFields(operation);
      if (coverage && 'tool' in coverage && fields.length > 0) {
        // A failure here means the API accepts a field the tool can't send:
        // add it to the tool's input schema in src/schemas.ts.
        expect(tools.get(coverage.tool)?.sort(), name).toEqual(fields.sort());
      }
    }
  });

  it('lets each tool use every query parameter of its operation', async () => {
    const tools = await toolInputFields();

    for (const [name, operation] of apiOperations()) {
      const coverage = COVERAGE[name];
      if (coverage && 'tool' in coverage) {
        // A failure here means the API takes a filter, sort or page parameter
        // the tool doesn't offer: add it to the tool's input schema.
        expect(tools.get(coverage.tool), name).toEqual(
          expect.arrayContaining(queryParameters(operation)),
        );
      }
    }
  });
});
