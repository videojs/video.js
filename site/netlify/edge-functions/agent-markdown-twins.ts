import type { Config } from '@netlify/edge-functions';

import { type CounterContext, recordMarkdownFetch } from '../../src/utils/agent-analytics.ts';

const LLMS_FILE = /\/llms(?:-full)?\.txt$/;

/**
 * Counts reads of the `.md` twins and every `llms.txt` and `llms-full.txt` index. It sets no `cache`, unlike the
 * Markdown functions, so it runs on every request, including the ones Netlify's cache answers for them. It only
 * observes: the response passes through as is.
 */
export default async function agentMarkdownTwins(request: Request, context: CounterContext) {
  const response = await context.next();

  recordMarkdownFetch(request, response, context, LLMS_FILE.test(new URL(request.url).pathname) ? 'llms' : 'twin');

  return response;
}

export const config: Config = {
  method: 'GET',
  onError: 'bypass',
  // Keep in step with `llmsIndexPaths` in `integrations/llms-sections.ts`; a test checks it.
  path: ['/*.md', '/llms.txt', '/*/llms.txt', '/*/llms-full.txt'],
};
