// @vitest-environment node
import type { CallToolRequest, JSONRPCRequest } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { McpEvent } from '../analytics';
import { handleMcpRequest } from '../handler';
import type { DocsServerOptions } from '../server';

function options(overrides: Partial<DocsServerOptions> = {}) {
  const events: McpEvent[] = [];
  const fetch = vi.fn(async () =>
    Response.json({
      hits: [
        {
          url_without_anchor: 'https://videojs.org/docs/framework/react/guides/captions',
          anchor: 'add-a-track',
          content: 'Use a track element.',
          hierarchy: { lvl1: 'Captions' },
        },
      ],
    })
  );

  return {
    events,
    options: {
      origin: 'https://videojs.org',
      fetch,
      packageVersion: '10.2.0',
      referenceJson: async () => JSON.stringify({ components: [{ name: 'PlayButton' }] }),
      surface: undefined,
      record: (event: McpEvent) => events.push(event),
      ...overrides,
    } satisfies DocsServerOptions,
  };
}

const MCP_HEADERS = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };

function rpc(message: JSONRPCRequest): Request {
  return new Request('https://videojs.org/mcp', {
    method: 'POST',
    headers: MCP_HEADERS,
    body: JSON.stringify(message),
  });
}

function bodiless(method: 'GET' | 'OPTIONS'): Request {
  return new Request('https://videojs.org/mcp', { method, headers: MCP_HEADERS });
}

async function call(
  name: string,
  args: CallToolRequest['params']['arguments'],
  overrides: Partial<DocsServerOptions> = {}
) {
  const setup = options(overrides);
  const response = await handleMcpRequest(
    rpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
    setup.options
  );
  // SAFETY: a `tools/call` JSON response carries a CallToolResult; the tests read only these fields.
  const { result } = (await response.json()) as { result: { content: { text: string }[]; isError?: boolean } };

  return { text: result.content[0]!.text, isError: result.isError ?? false, events: setup.events };
}

describe('handleMcpRequest', () => {
  it('answers CORS preflight for browser-based clients', async () => {
    const response = await handleMcpRequest(bodiless('OPTIONS'), options().options);

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-headers')).toContain('mcp-protocol-version');
  });

  it('offers no server-sent event stream', async () => {
    const response = await handleMcpRequest(bodiless('GET'), options().options);

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST, OPTIONS');
  });

  it('rejects a body that is not JSON', async () => {
    const request = new Request('https://videojs.org/mcp', { method: 'POST', body: '{' });

    expect((await handleMcpRequest(request, options().options)).status).toBe(400);
  });

  it('initializes with the server instructions and records the client', async () => {
    const { events, options: serverOptions } = options();
    const response = await handleMcpRequest(
      rpc({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'claude-code', version: '2.1.0' },
        },
      }),
      serverOptions
    );
    // SAFETY: an `initialize` JSON response carries an InitializeResult; the test reads only these fields.
    const { result } = (await response.json()) as { result: { serverInfo: { name: string }; instructions: string } };

    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(result.serverInfo.name).toBe('videojs-docs');
    expect(result.instructions).toContain('Video.js 10 is a ground-up rewrite');
    expect(events).toEqual([
      {
        name: 'mcp_initialized',
        properties: { client_name: 'claude-code', client_version: '2.1.0', protocol_version: '2025-06-18' },
      },
    ]);
  });

  it('lists the tools, read-only except feedback', async () => {
    const response = await handleMcpRequest(rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' }), options().options);
    // SAFETY: a `tools/list` JSON response carries a ListToolsResult; the test reads only these fields.
    const { result } = (await response.json()) as {
      result: { tools: { name: string; annotations?: { readOnlyHint?: boolean } }[] };
    };

    expect(result.tools.map(({ name, annotations }) => [name, annotations?.readOnlyHint])).toEqual([
      ['search_docs', true],
      ['read_docs', true],
      ['plan_install', true],
      ['check_code', true],
      ['query_reference', true],
      ['send_feedback', false],
    ]);
  });

  it('searches and records the call', async () => {
    const { text, isError, events } = await call('search_docs', { query: 'captions', framework: 'react' });

    expect(isError).toBe(false);
    expect(text).toContain('https://videojs.org/docs/framework/react/guides/captions (section: `add-a-track`)');
    expect(events).toEqual([
      {
        name: 'mcp_tool_called',
        properties: expect.objectContaining({
          tool: 'search_docs',
          query: 'captions',
          docs_framework: 'react',
          is_error: false,
          result_count: 1,
        }),
      },
    ]);
  });

  it('turns an unexpected failure into a tool error', async () => {
    const { text, isError, events } = await call(
      'search_docs',
      { query: 'captions' },
      {
        fetch: vi.fn(async () => {
          throw new Error('offline');
        }),
      }
    );

    expect(isError).toBe(true);
    expect(text).toBe('search_docs failed unexpectedly. Try again.');
    expect(events[0]!.properties).toMatchObject({ is_error: true, failed: true });
  });

  it('queries the reference', async () => {
    expect(await call('query_reference', { code: 'ref => ref.components[0].name' })).toMatchObject({
      text: '"PlayButton"',
      isError: false,
    });
  });

  it('reports invalid installation choices as a tool error', async () => {
    const { text, isError } = await call('plan_install', { framework: 'vue', method: 'cdn' });

    expect(isError).toBe(true);
    expect(text).toContain('Invalid installation arguments:');
  });

  it('flags Video.js 8 code and never records it', async () => {
    const code = "import videojs from 'video.js';\nvideojs('player');";
    const { text, events } = await call('check_code', { code, framework: 'html', language: 'js' });

    expect(text).toContain('[videojs-8-api]');
    expect(JSON.stringify(events)).not.toContain('videojs(');
    expect(events[0]!.properties).toMatchObject({ tool: 'check_code', rules: 'videojs-8-api' });
  });

  it('records feedback separately from the call', async () => {
    const { text, events } = await call('send_feedback', { kind: 'missing', message: 'No DRM guide.' });

    expect(text).toContain('docs team reviews these reports');
    expect(events.map(({ name }) => name)).toEqual(['mcp_feedback', 'mcp_tool_called']);
    expect(events[0]!.properties).toMatchObject({ feedback_kind: 'missing', feedback_message: 'No DRM guide.' });
  });
});
