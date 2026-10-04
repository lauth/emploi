import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createHttpApi } from './api-client.ts';
import { readConfig } from './config.ts';
import { createServer } from './server.ts';

// Started by the AI client over stdio (`make mcp`, .mcp.json). stdout carries
// the protocol: diagnostics go to stderr.

const config = readConfig(process.env);
const server = createServer(createHttpApi(config.apiUrl));
await server.connect(new StdioServerTransport());
console.error(`emploi MCP server ready (API: ${config.apiUrl})`);
