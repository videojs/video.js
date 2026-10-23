import type { Config } from '@netlify/edge-functions';

/**
 * Caps traffic to the unauthenticated docs MCP endpoint per client before it reaches the SSR function. Netlify enforces
 * the limit from `config` and answers over-limit requests with a 429; the function itself passes every request
 * through.
 */
export default function mcpRateLimit(): void {}

export const config: Config = {
  method: ['POST', 'OPTIONS'],
  path: '/mcp',
  // An agent working on a task makes tens of calls a minute at most; this leaves headroom for parallel tool calls.
  rateLimit: { windowLimit: 120, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
