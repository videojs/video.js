// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';

import { createMcpRecorder, mcpEventBody } from '../analytics';

function request() {
  return new Request('https://videojs.org/mcp?x=1', { method: 'POST', headers: { 'user-agent': 'claude-code/2.1.0' } });
}

describe('mcpEventBody', () => {
  it('describes the client without keeping a person', async () => {
    const body = await mcpEventBody(
      { name: 'mcp_tool_called', properties: { tool: 'search_docs' } },
      request(),
      'CA',
      new Date('2026-10-23T12:00:00Z')
    );

    expect(body).toMatchObject({
      event: 'mcp_tool_called',
      timestamp: '2026-10-23T12:00:00.000Z',
      properties: {
        $current_url: 'https://videojs.org/mcp',
        $process_person_profile: false,
        $geoip_disable: true,
        agent: 'anthropic',
        agent_kind: 'ai',
        country: 'CA',
        tool: 'search_docs',
      },
    });
    expect(body.distinct_id).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('createMcpRecorder', () => {
  it('sends nothing outside production', () => {
    const send = vi.fn();
    const record = createMcpRecorder(request(), { deploy: { context: 'deploy-preview' }, waitUntil: vi.fn() }, send);

    record({ name: 'mcp_initialized', properties: {} });

    expect(send).not.toHaveBeenCalled();
    expect(() =>
      createMcpRecorder(request(), undefined, send)({ name: 'mcp_initialized', properties: {} })
    ).not.toThrow();
  });

  it('sends in production after the response, dropping failures', async () => {
    const pending: Promise<unknown>[] = [];
    const send = vi.fn(async () => {
      throw new Error('offline');
    });
    const record = createMcpRecorder(
      request(),
      { deploy: { context: 'production' }, waitUntil: (promise) => pending.push(promise) },
      send
    );

    record({ name: 'mcp_feedback', properties: { feedback_kind: 'missing' } });
    await Promise.all(pending);

    expect(send).toHaveBeenCalledOnce();
  });
});
