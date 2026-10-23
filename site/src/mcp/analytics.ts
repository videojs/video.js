/**
 * Server-side PostHog events for the docs MCP server. Like the Markdown counters in `agent-analytics.ts`, they keep no
 * person: the distinct ID hashes the user agent, country, and UTC day, and the IP address is never read or sent. Tool
 * events carry argument summaries, never code an agent submits.
 */
import { CAPTURE_URL, classifyUserAgent, dailyClientId, USER_AGENT_LIMIT } from '../utils/agent-analytics';
import { POSTHOG_PROJECT_KEY } from '../utils/posthog-project';

export const MCP_EVENTS = ['mcp_initialized', 'mcp_tool_called', 'mcp_feedback'] as const;
export type McpEventName = (typeof MCP_EVENTS)[number];

export type McpEventProperties = Record<string, string | number | boolean>;

export interface McpEvent {
  name: McpEventName;
  properties: McpEventProperties;
}

export type McpRecorder = (event: McpEvent) => void;

/** The parts of Netlify's function `Context` this module uses. */
export interface McpRecordContext {
  deploy: { context: string };
  geo?: { country?: { code?: string } };
  waitUntil(promise: Promise<unknown>): void;
}

export interface McpCaptureBody {
  api_key: string;
  event: McpEventName;
  distinct_id: string;
  timestamp: string;
  properties: McpEventProperties;
}

/** Build the PostHog event for one MCP request or tool call. */
export async function mcpEventBody(
  event: McpEvent,
  request: Request,
  country = '',
  now = new Date()
): Promise<McpCaptureBody> {
  const url = new URL(request.url);
  const userAgent = (request.headers.get('user-agent') ?? '').slice(0, USER_AGENT_LIMIT);
  const properties: McpCaptureBody['properties'] = {
    $current_url: url.origin + url.pathname,
    $host: url.host,
    $pathname: url.pathname,
    $lib: 'videojs-site-mcp',
    $process_person_profile: false,
    // The function's own address would geolocate to a Netlify node; `country` comes from Netlify's geo lookup instead.
    $geoip_disable: true,
    user_agent: userAgent,
    ...classifyUserAgent(userAgent),
    ...event.properties,
  };

  if (country) properties.country = country;

  return {
    api_key: POSTHOG_PROJECT_KEY,
    event: event.name,
    distinct_id: await dailyClientId(userAgent, country, now.toISOString().slice(0, 10)),
    timestamp: now.toISOString(),
    properties,
  };
}

/**
 * Record MCP events in production only, after the response is on its way. Sending never delays or fails a tool call: it
 * runs in `waitUntil`, and any error is dropped.
 */
export function createMcpRecorder(
  request: Request,
  context: McpRecordContext | undefined,
  send: typeof fetch = fetch
): McpRecorder {
  if (context?.deploy.context !== 'production') return () => {};

  return (event) => {
    const delivery = mcpEventBody(event, request, context.geo?.country?.code).then((body) =>
      send(CAPTURE_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    );

    context.waitUntil(delivery.catch(() => undefined));
  };
}
