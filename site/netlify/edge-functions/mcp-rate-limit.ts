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
  // One agent makes tens of calls a minute at most, but hosted clients such as claude.ai or ChatGPT connectors send
  // every user's calls from shared addresses, so the per-address cap leaves room for many agents at once.
  rateLimit: { windowLimit: 600, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
