import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { type InitializeRequest, InitializeRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import type { McpEvent } from './analytics';
import { createDocsServer, type DocsServerOptions } from './server';

/** Requests larger than this are not MCP traffic this server needs; `check_code` input caps well below it. */
export const MCP_REQUEST_LIMIT = 1024 * 1024;

// Public and unauthenticated, so any origin may call it; a browser-based MCP client needs these headers.
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id',
  'access-control-expose-headers': 'mcp-session-id',
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(CORS_HEADERS)) headers.set(name, value);

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function jsonRpcError(status: number, code: number, message: string, headers: Record<string, string> = {}): Response {
  return withCors(Response.json({ jsonrpc: '2.0', error: { code, message }, id: null }, { status, headers }));
}

/** Which client connected, from an `initialize` request's `clientInfo`. */
function initializeEvent({ clientInfo, protocolVersion }: InitializeRequest['params']): McpEvent {
  return {
    name: 'mcp_initialized',
    properties: {
      client_name: clientInfo.name.slice(0, 100),
      client_version: clientInfo.version.slice(0, 50),
      protocol_version: protocolVersion.slice(0, 20),
    },
  };
}

/**
 * Serve one MCP request statelessly: each POST gets a fresh server and transport and a JSON response, so the endpoint
 * runs on a serverless function without sessions. Server-sent event streams (GET) are not offered.
 */
export async function handleMcpRequest(request: Request, options: DocsServerOptions): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  if (request.method !== 'POST') {
    return jsonRpcError(405, -32000, 'Method not allowed. Send MCP requests as POST.', { allow: 'POST, OPTIONS' });
  }

  if (Number(request.headers.get('content-length') ?? 0) > MCP_REQUEST_LIMIT) {
    return jsonRpcError(413, -32000, 'Request too large.');
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonRpcError(400, -32700, 'Parse error: the body must be JSON.');
  }

  for (const message of Array.isArray(body) ? body : [body]) {
    const initialize = InitializeRequestSchema.safeParse(message);

    if (initialize.success) options.record(initializeEvent(initialize.data.params));
  }

  const server = createDocsServer(options);
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });

  await server.connect(transport);

  try {
    return withCors(await transport.handleRequest(request, { parsedBody: body }));
  } finally {
    await server.close();
  }
}
