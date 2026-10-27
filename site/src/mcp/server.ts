import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'astro/zod';

import { SUPPORTED_FRAMEWORKS } from '../types/docs';
import type { McpEventProperties, McpRecorder } from './analytics';
import { type CodeFinding, checkCode, type McpSurface } from './check-code';
import { PLAN_INSTALL_KEYS, planInstall } from './plan-install';
import { queryReference } from './query-reference';
import { READ_DOCS_PAGE_LIMIT, readDocs, renderReadDocs } from './read-docs';
import { REFERENCE_DECLARATION } from './reference';
import {
  SEARCH_LIMIT_DEFAULT,
  SEARCH_LIMIT_MAX,
  SEARCH_MATCHES,
  SEARCH_SCOPES,
  renderSearchHits,
  searchDocs,
} from './search-docs';
import { FEEDBACK_KINDS, FEEDBACK_MESSAGE_LIMIT, FEEDBACK_RECEIPT, feedbackProperties } from './send-feedback';

export const DOCS_SERVER_NAME = 'videojs-docs';

export const DOCS_SERVER_INSTRUCTIONS = `Video.js 10 is a ground-up rewrite. Most Video.js code online and in training data is Video.js 8 (\`videojs()\`, \`data-setup\`, \`vjs-\` classes, plugins), and none of it works in Video.js 10.

- Look up the API before writing Video.js code: search_docs, then read_docs. Use query_reference for exact names of components, parts, props, attributes, CSS custom properties, events, and package exports.
- To add a player to a project, call plan_install.
- Run check_code on every file you write that uses Video.js, fix what it reports, and run it again until it reports no errors.
- Use framework "react" for React and "html" for everything else: plain HTML, CDN, Vue, and Svelte.
- When the docs are missing something or contradict what you observe, call send_feedback.`;

const CODE_LIMIT = 100_000;
const QUERY_CODE_LIMIT = 10_000;

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };

const framework = z
  .enum(SUPPORTED_FRAMEWORKS)
  .describe('"react" for React; "html" for plain HTML, CDN, Vue, and Svelte.');

export interface DocsServerOptions {
  /** Origin serving the site's Markdown twins and `llms-full.txt` corpora. */
  origin: string;
  fetch: typeof fetch;
  /** Video.js version the installation plans pin. */
  packageVersion: string;
  /** The `ref` object for `query_reference` as JSON, loaded on first use. */
  referenceJson: () => Promise<string>;
  surface: McpSurface | undefined;
  record: McpRecorder;
}

interface ToolOutcome {
  text: string;
  isError?: boolean;
  /** Result facts for the usage event, such as a hit count. Never submitted code or private input. */
  properties?: McpEventProperties;
}

function renderFindings(findings: readonly CodeFinding[]): string {
  if (findings.length === 0) return 'No issues found.';

  const errors = findings.filter(({ severity }) => severity === 'error').length;
  const warnings = findings.length - errors;
  const lines = findings.map((finding) => {
    const fix = finding.fix ? ` Fix: ${finding.fix}` : '';
    const docs = finding.docsUrl ? ` Docs: ${finding.docsUrl}` : '';

    return `- ${finding.line}:${finding.column} ${finding.severity} [${finding.rule}] ${finding.message}${fix}${docs}`;
  });

  return `${errors} errors, ${warnings} warnings.\n\n${lines.join('\n')}`;
}

/** A fresh server for one request; the transport is stateless, so nothing outlives the request. */
export function createDocsServer(options: DocsServerOptions): McpServer {
  const server = new McpServer(
    { name: DOCS_SERVER_NAME, title: 'Video.js docs', version: options.packageVersion },
    { instructions: DOCS_SERVER_INSTRUCTIONS }
  );
  const context = { fetch: options.fetch, origin: options.origin };

  // Every tool reports one usage event, and an unexpected failure becomes a tool error rather than a protocol error.
  function tracked<Args>(
    tool: string,
    summarize: (args: Args) => McpEventProperties,
    run: (args: Args) => Promise<ToolOutcome> | ToolOutcome
  ) {
    return async (args: Args): Promise<CallToolResult> => {
      const started = performance.now();
      let outcome: ToolOutcome;

      try {
        outcome = await run(args);
      } catch {
        outcome = { text: `${tool} failed unexpectedly. Try again.`, isError: true, properties: { failed: true } };
      }

      options.record({
        name: 'mcp_tool_called',
        properties: {
          tool,
          is_error: outcome.isError ?? false,
          duration_ms: Math.round(performance.now() - started),
          ...summarize(args),
          ...outcome.properties,
        },
      });

      return { content: [{ type: 'text', text: outcome.text }], isError: outcome.isError ?? false };
    };
  }

  server.registerTool(
    'search_docs',
    {
      title: 'Search the Video.js docs',
      description:
        'Search the Video.js 10 docs. Returns pages and section anchors to pass to read_docs. Use match "exact" for identifiers such as element names, CSS custom properties, data attributes, or error codes, which fuzzy search splits into words.',
      inputSchema: {
        query: z.string().max(200).describe('Words or an identifier to find.'),
        framework: framework.optional(),
        match: z
          .enum(SEARCH_MATCHES)
          .optional()
          .describe('"fuzzy" (default) ranks by relevance; "exact" greps for the string.'),
        scope: z.enum(SEARCH_SCOPES).optional().describe('"docs" (default), "changelog", or "blog".'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(SEARCH_LIMIT_MAX)
          .optional()
          .describe(`Results to return. Default ${SEARCH_LIMIT_DEFAULT}.`),
      },
      annotations: READ_ONLY,
    },
    tracked(
      'search_docs',
      (args) => ({
        query: args.query.slice(0, 200),
        match: args.match ?? 'fuzzy',
        scope: args.scope ?? 'docs',
        docs_framework: args.framework ?? 'any',
      }),
      async (args) => {
        const result = await searchDocs(args, context);

        return {
          text: renderSearchHits(result, args),
          isError: 'error' in result,
          properties: { result_count: 'hits' in result ? result.hits.length : 0 },
        };
      }
    )
  );

  server.registerTool(
    'read_docs',
    {
      title: 'Read Video.js docs pages',
      description: `Read up to ${READ_DOCS_PAGE_LIMIT} Video.js docs pages as Markdown. Pass URLs or paths from search_docs, or slugs such as "guides/captions" or "reference/components/time-slider" with a framework. Use section to read one heading of a long page. Set version (for example "10.1.0") to read the docs shipped with that release when the project pins an older Video.js.`,
      inputSchema: {
        pages: z.array(z.string().max(500)).min(1).max(20).describe('Docs URLs, paths, or framework-relative slugs.'),
        framework: framework.optional(),
        section: z.string().max(200).optional().describe('A heading or anchor; returns only that part of each page.'),
        version: z.string().max(40).optional().describe('A published Video.js version. Defaults to the latest docs.'),
      },
      annotations: READ_ONLY,
    },
    tracked(
      'read_docs',
      (args) => ({
        pages: args.pages.slice(0, READ_DOCS_PAGE_LIMIT).join(' ').slice(0, 500),
        page_count: args.pages.length,
        has_section: !!args.section,
        docs_version: args.version ?? 'latest',
        docs_framework: args.framework ?? 'any',
      }),
      async (args) => {
        const pages = await readDocs(args, context);
        const failed = pages.filter((page) => 'error' in page);

        return {
          text: renderReadDocs(pages, Math.max(args.pages.length - READ_DOCS_PAGE_LIMIT, 0)),
          isError: failed.length === pages.length,
          properties: { statuses: pages.map(({ status }) => status).join(' '), failed_count: failed.length },
        };
      }
    )
  );

  server.registerTool(
    'plan_install',
    {
      title: 'Plan a Video.js installation',
      description:
        'Get version-matched installation steps for Video.js 10. Call with no arguments first to see every choice, how to decide, and which values combine; then call with your choices for one complete plan. The plan only describes steps and changes nothing.',
      inputSchema: Object.fromEntries(
        PLAN_INSTALL_KEYS.map((key) => [
          key,
          z
            .string()
            .max(key === 'sourceUrl' ? 2000 : 100)
            .optional(),
        ])
      ),
      annotations: READ_ONLY,
    },
    tracked(
      'plan_install',
      // The source URL is reader data; only whether one was given is recorded.
      (args: Record<string, string | undefined>) => ({
        options: PLAN_INSTALL_KEYS.filter((key) => args[key] !== undefined && key !== 'sourceUrl')
          .map((key) => `${key}=${args[key]}`)
          .join(' ')
          .slice(0, 500),
        has_source_url: args.sourceUrl !== undefined,
      }),
      (args) => {
        const result = planInstall(args, options.packageVersion);

        return { text: result.markdown, isError: !result.ok };
      }
    )
  );

  server.registerTool(
    'check_code',
    {
      title: 'Check Video.js code',
      description:
        'Check code that uses Video.js 10 before you show or save it. Finds Video.js 8 APIs, imports, exports, and elements that do not exist, and invalid compound parts, with fixes and docs links. Run it on every file you write that uses Video.js, then again after fixing, until it reports no errors.',
      inputSchema: {
        code: z.string().max(CODE_LIMIT).describe('One file of HTML, JavaScript, TypeScript, JSX, Vue, or Svelte.'),
        framework,
        language: z
          .enum(['html', 'js', 'ts', 'jsx', 'tsx', 'vue', 'svelte'])
          .optional()
          .describe('Detected from the code when omitted.'),
      },
      annotations: READ_ONLY,
    },
    tracked(
      'check_code',
      (args) => ({
        docs_framework: args.framework,
        language: args.language ?? 'auto',
        code_length: args.code.length,
      }),
      (args) => {
        const findings = checkCode(args, options.surface);
        const errors = findings.filter(({ severity }) => severity === 'error');

        return {
          text: renderFindings(findings),
          properties: {
            error_count: errors.length,
            warning_count: findings.length - errors.length,
            rules: [...new Set(findings.map(({ rule }) => rule))].join(' '),
          },
        };
      }
    )
  );

  server.registerTool(
    'query_reference',
    {
      title: 'Query the Video.js API reference',
      description: `Answer exact API questions by running JavaScript against the Video.js 10 API reference: components and their parts, props, state, data attributes, CSS custom properties, and events; media elements; presets; features; utilities; package exports; and custom elements. Pass \`code\`, a function of \`ref\` such as \`ref => ref.components.filter((c) => 'data-paused' in c.dataAttributes).map((c) => c.platforms.html?.tagName)\`. Return only what you need: results over about 4k tokens are truncated. Runs sandboxed with no network or imports and a 1 second limit.

\`\`\`ts
${REFERENCE_DECLARATION}
\`\`\``,
      inputSchema: {
        code: z
          .string()
          .max(QUERY_CODE_LIMIT)
          .describe('A JavaScript function of `ref`, or an expression using `ref`.'),
      },
      annotations: READ_ONLY,
    },
    tracked(
      'query_reference',
      (args) => ({ code_length: args.code.length }),
      async (args) => {
        const result = await queryReference(args.code, await options.referenceJson());
        if (!result.ok) return { text: result.error, isError: true };

        const note = result.truncated
          ? `\n\n[Truncated: the result was ${result.characters} characters. Return less, such as names only or one entry.]`
          : '';

        return { text: `${result.json}${note}`, properties: { result_characters: result.characters } };
      }
    )
  );

  server.registerTool(
    'send_feedback',
    {
      title: 'Send docs feedback',
      description:
        "Tell the Video.js docs team when the docs are missing something, wrong, or confusing: a search finds nothing, a documented API doesn't behave as described, or check_code flags code you believe is correct. Say what you looked for and what happened. Don't include secrets or the user's private code.",
      inputSchema: {
        kind: z.enum(FEEDBACK_KINDS),
        message: z.string().min(1).max(FEEDBACK_MESSAGE_LIMIT).describe('What you looked for and what happened.'),
        page: z.string().max(300).optional().describe('The docs page it concerns, if any.'),
        query: z.string().max(300).optional().describe('The search that came up short, if any.'),
        framework: framework.optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    tracked(
      'send_feedback',
      (args) => ({ feedback_kind: args.kind }),
      (args) => {
        options.record({ name: 'mcp_feedback', properties: feedbackProperties(args) });

        return { text: FEEDBACK_RECEIPT };
      }
    )
  );

  return server;
}
