# 19. MCP server for AI clients

- Status: Accepted
- Date: 2026-10-04

## Context

The user wants AI assistants to use emploi: read the job search history, record new offers, follow interview processes. The Model Context Protocol (MCP) is the standard way to give AI clients (Claude Code, Claude Desktop, other MCP clients) tools.

## Decision

- A workspace package, **`mcp/`** (`@emploi/mcp`), implements an MCP server with the official **MCP TypeScript SDK v2**: `@modelcontextprotocol/server` (and `@modelcontextprotocol/client` in tests). v2 is the stable line since July 2026; the former single package `@modelcontextprotocol/sdk` (v1) only gets fixes for a limited time. Tool schemas are Zod objects (Standard Schema; v2 needs Zod ≥ 4.2), not the raw shapes v2 deprecates. The server speaks the 2025 protocol handshake, v2's default, which every current client supports; adopting the 2026-07-28 protocol revision is an explicit opt-in for later.
- It is a **client of the REST API** (`/offers`, `/offers/:offerId/steps`), not a second way into the database: the AI goes through the same validation and rules as the front, and the back doesn't change. Types come from `@emploi/shared` (ADR-0009).
- **Tools** map the API operations a user needs: `list_offers`, `get_offer` (with its interview steps), `create_offer`, `update_offer`, `delete_offer`, `add_interview_step`, `update_interview_step`, `reorder_interview_steps`, `delete_interview_step`.
  - Inputs are Zod schemas mirroring the API rules; field limits are declared with `satisfies` against the shared limit types, and step statuses come from a `Record<InterviewStepStatus, …>`, as in the front.
  - Results are returned as structured content (with an output schema) and as JSON text.
  - Annotations tell clients what each tool does: reads are `readOnlyHint`, deletions `destructiveHint`, updates `idempotentHint`, so clients can ask for confirmation.
  - API errors (400, 404) come back as tool errors with the API's message, so the model can correct its call; unexpected failures too, without crashing the server.
- **Transport: stdio only, on the developer's machine.** The AI client starts the server (`make mcp`); the repository's `.mcp.json` registers it for Claude Code. It calls the API at `MCP_API_URL` (default `https://api.emploi.localhost`), trusting the mkcert CA through `NODE_EXTRA_CA_CERTS`.
- **No network transport** (Streamable HTTP) for now: the API has no authentication, so a network MCP endpoint would let anyone who can reach it drive the API, deletions included. It needs authentication first, which gets its own ADR.
- **No build step**: Node 26 runs the TypeScript sources directly (type stripping). The package uses only erasable TypeScript (`erasableSyntaxOnly`) and `.ts` import extensions.
- Tested like the other packages (lint, type check, Vitest): an MCP client talks to the server in memory, with the API mocked.

## Consequences

- Any MCP client on the machine can use emploi once the cluster runs; Claude Code picks it up from `.mcp.json` (after approving the project server).
- The AI can change and delete data: clients ask for confirmation according to their own settings, helped by the annotations.
- New API features need matching tools to be usable by AI.
