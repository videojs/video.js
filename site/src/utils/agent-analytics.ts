/**
 * Server-side counting of Markdown reads. Agents fetch the Markdown twins and `llms.txt` without running JavaScript, so
 * the browser analytics in `analytics.ts` never sees them. The `agent-markdown-*` edge functions call
 * `recordMarkdownFetch` for each one.
 *
 * Like the browser setup, this keeps no person. The distinct ID hashes the user agent, country, and UTC day, so it
 * counts distinct clients within a day and nothing longer. The IP address is never read or sent.
 */

import { PRIVATE_INSTALLATION_QUERY_PARAMETERS } from '@videojs/installation';

import { installationContextForUrl } from './installation/analytics-context.ts';
import { POSTHOG_PROJECT_KEY } from './posthog-project.ts';

const CAPTURE_URL = 'https://us.i.posthog.com/i/v0/e/';
const USER_AGENT_LIMIT = 256;

export const MARKDOWN_FETCH_EVENT = 'markdown_fetched';

/** How a Markdown read arrived: a `.md` twin URL, an `Accept: text/markdown` page request, or `llms.txt`. */
export type MarkdownVia = 'twin' | 'accept' | 'llms';

export type AgentKind = 'ai' | 'search' | 'http-client' | 'browser' | 'unknown';

export interface AgentClassification {
  agent: string;
  agent_kind: AgentKind;
}

// First match wins. AI and search crawlers come before the browser rule because many of them send a Mozilla prefix.
const AGENT_RULES: readonly [pattern: RegExp, agent: string, kind: AgentKind][] = [
  [/claude|anthropic/i, 'anthropic', 'ai'],
  [/GPTBot|ChatGPT|OAI-SearchBot|OpenAI/i, 'openai', 'ai'],
  [/Perplexity/i, 'perplexity', 'ai'],
  [/Gemini|Google-CloudVertexBot|GoogleAgent/i, 'google-ai', 'ai'],
  [/GitHub-Copilot|Copilot/i, 'github-copilot', 'ai'],
  [/Cursor/i, 'cursor', 'ai'],
  [/Codeium|Windsurf/i, 'windsurf', 'ai'],
  [/MistralAI/i, 'mistral', 'ai'],
  [/cohere/i, 'cohere', 'ai'],
  [/meta-external|FacebookBot/i, 'meta', 'ai'],
  [/Amazonbot/i, 'amazon', 'ai'],
  [/Bytespider/i, 'bytedance', 'ai'],
  [/DuckAssistBot/i, 'duckduckgo-ai', 'ai'],
  [/YouBot/i, 'you', 'ai'],
  [/CCBot/i, 'common-crawl', 'ai'],
  [/Googlebot|GoogleOther/i, 'google', 'search'],
  [/bingbot|BingPreview/i, 'bing', 'search'],
  [/Applebot/i, 'apple', 'search'],
  [/DuckDuckBot/i, 'duckduckgo', 'search'],
  [/YandexBot/i, 'yandex', 'search'],
  [/Baiduspider/i, 'baidu', 'search'],
  [/^curl\//i, 'curl', 'http-client'],
  [/^Wget\//i, 'wget', 'http-client'],
  [/python|aiohttp/i, 'python', 'http-client'],
  [/node-fetch|undici|axios|^node\b|Deno\/|Bun\//i, 'javascript', 'http-client'],
  [/Go-http-client/i, 'go', 'http-client'],
  [/okhttp|Java\//i, 'java', 'http-client'],
  [/Ruby|Faraday/i, 'ruby', 'http-client'],
  [/Mozilla\/5\.0/, 'browser', 'browser'],
];

/** Name the client behind a user agent, coarsely enough to chart. The raw string is sent too, for re-bucketing. */
export function classifyUserAgent(userAgent: string): AgentClassification {
  const rule = AGENT_RULES.find(([pattern]) => pattern.test(userAgent));

  return rule
    ? { agent: rule[1], agent_kind: rule[2] }
    : { agent: userAgent ? 'other' : 'none', agent_kind: 'unknown' };
}

export interface MarkdownFetch {
  request: Request;
  response: Response;
  via: MarkdownVia;
  country?: string;
  now?: Date;
}

export interface CaptureBody {
  api_key: string;
  event: typeof MARKDOWN_FETCH_EVENT;
  distinct_id: string;
  timestamp: string;
  properties: Record<string, string | number | boolean>;
}

async function dailyClientId(userAgent: string, country: string, day: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${userAgent}\n${country}\n${day}`));

  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Build the PostHog event for one Markdown read. Private installation input never reaches it. */
export async function markdownFetchEvent({
  request,
  response,
  via,
  country = '',
  now = new Date(),
}: MarkdownFetch): Promise<CaptureBody> {
  const url = new URL(request.url);
  const userAgent = (request.headers.get('user-agent') ?? '').slice(0, USER_AGENT_LIMIT);
  const hasPrivateInput = PRIVATE_INSTALLATION_QUERY_PARAMETERS.some((parameter) => url.searchParams.has(parameter));

  // The same picks the browser stamps on a reader's events, so agent and human install plans line up. Read before the
  // private input is dropped, so `installation_custom_source` still says whether one was given.
  const installation = installationContextForUrl(url.pathname, url.search);

  for (const parameter of PRIVATE_INSTALLATION_QUERY_PARAMETERS) url.searchParams.delete(parameter);

  const properties: CaptureBody['properties'] = {
    $current_url: url.href,
    $host: url.host,
    $pathname: url.pathname,
    $lib: 'videojs-site-edge',
    $process_person_profile: false,
    // The edge's own address would geolocate to a Netlify node; `country` comes from Netlify's geo lookup instead.
    $geoip_disable: true,
    markdown_via: via,
    status: response.status,
    user_agent: userAgent,
    has_private_input: hasPrivateInput,
    ...classifyUserAgent(userAgent),
  };

  if (country) properties.country = country;

  const framework = /^\/docs\/framework\/([^/]+)\//.exec(url.pathname)?.[1];

  if (framework) properties.docs_framework = framework;

  Object.assign(properties, installation);

  return {
    api_key: POSTHOG_PROJECT_KEY,
    event: MARKDOWN_FETCH_EVENT,
    distinct_id: await dailyClientId(userAgent, country, now.toISOString().slice(0, 10)),
    timestamp: now.toISOString(),
    properties,
  };
}

/** The parts of Netlify's edge `Context` this module uses. */
export interface RecordContext {
  deploy: { context: string };
  geo?: { country?: { code?: string } };
  waitUntil(promise: Promise<unknown>): void;
}

/** What the counting edge functions need from Netlify's `Context`. */
export interface CounterContext extends RecordContext {
  next(): Promise<Response>;
}

/** Whether a response carries Markdown, so a negotiated request that fell back to HTML isn't counted. */
export function isMarkdownResponse(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').toLowerCase().startsWith('text/markdown');
}

/**
 * Count one Markdown read in production, after the response is on its way. Sending never delays or fails the response:
 * it runs in `waitUntil`, and any error is dropped.
 */
export function recordMarkdownFetch(
  request: Request,
  response: Response,
  context: RecordContext,
  via: MarkdownVia,
  send: typeof fetch = fetch
): void {
  if (context.deploy.context !== 'production') return;

  const delivery = markdownFetchEvent({ request, response, via, country: context.geo?.country?.code }).then((body) =>
    send(CAPTURE_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  );

  context.waitUntil(delivery.catch(() => undefined));
}
