import type { AgentHarness } from '../agents.ts';

export interface TokenUsage {
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
  reasoningTokens: number;
}

/** A harness-neutral view of one agent run, normalized from Claude Code stream-json or Codex `--json` events. */
export interface TranscriptSummary {
  events: number;
  sessionId: string | null;
  model: string | null;
  cliVersion: string | null;
  /** Skills the CLI reported at startup. `null` when the CLI does not expose them. */
  availableSkills: string[] | null;
  turns: number | null;
  toolCalls: number;
  commands: string[];
  filesRead: string[];
  filesWritten: string[];
  webFetches: string[];
  webSearches: string[];
  /** Server-side searches and page opens, with the URLs they returned; these bypass the container's site routes. */
  searches: Array<{ query: string; action: string | null; urls: string[] }>;
  skillsInvoked: string[];
  finalMessage: string | null;
  usage: TokenUsage;
  /** Reported by Claude Code. Codex reports tokens only. */
  costUsd: number | null;
  errors: string[];
  /** API calls the CLI retried, such as rate limits or failed authentication. */
  apiRetries: string[];
  lastEventType: string | null;
}

export function parseTranscript(harness: AgentHarness, text: string): TranscriptSummary {
  if (harness === 'claude-code') return parseClaudeTranscript(text);

  if (harness === 'codex') return parseCodexTranscript(text);

  return emptySummary();
}

function emptySummary(): TranscriptSummary {
  return {
    events: 0,
    sessionId: null,
    model: null,
    cliVersion: null,
    availableSkills: null,
    turns: null,
    toolCalls: 0,
    commands: [],
    filesRead: [],
    filesWritten: [],
    webFetches: [],
    webSearches: [],
    searches: [],
    skillsInvoked: [],
    finalMessage: null,
    usage: { inputTokens: 0, cachedInputTokens: 0, cacheWriteTokens: 0, outputTokens: 0, reasoningTokens: 0 },
    costUsd: null,
    errors: [],
    apiRetries: [],
    lastEventType: null,
  };
}

type JsonObject = Record<string, unknown>;

function* jsonLines(text: string): Generator<JsonObject> {
  for (const line of text.split('\n')) {
    if (!line.startsWith('{')) continue;

    try {
      yield JSON.parse(line) as JsonObject;
    } catch {
      // Interleaved non-JSON output; the raw transcript keeps it for debugging.
    }
  }
}

function asObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function parseClaudeTranscript(text: string): TranscriptSummary {
  const summary = emptySummary();
  let turns = 0;
  let cost = 0;
  let sawResult = false;

  for (const event of jsonLines(text)) {
    summary.events += 1;
    summary.lastEventType = event.subtype === 'api_retry' ? 'api_retry' : (asString(event.type) ?? null);

    if (event.type === 'system' && event.subtype === 'api_retry') {
      summary.apiRetries.push(asString(event.error) ?? 'unknown');
      continue;
    }

    if (event.type === 'system' && event.subtype === 'init') {
      summary.sessionId = asString(event.session_id) ?? summary.sessionId;
      summary.model = asString(event.model) ?? summary.model;
      summary.cliVersion = asString(event.claude_code_version) ?? summary.cliVersion;

      if (Array.isArray(event.skills)) summary.availableSkills = event.skills.map(String);

      continue;
    }

    if (event.type === 'assistant') {
      const content = asObject(event.message)?.content;
      if (!Array.isArray(content)) continue;

      for (const block of content.map(asObject)) {
        if (block?.type !== 'tool_use') continue;

        summary.toolCalls += 1;
        recordClaudeTool(summary, asString(block.name) ?? '', asObject(block.input) ?? {});
      }

      continue;
    }

    if (event.type === 'result') {
      sawResult = true;
      turns += asNumber(event.num_turns);
      cost += asNumber(event.total_cost_usd);
      summary.finalMessage = asString(event.result) ?? summary.finalMessage;

      const usage = asObject(event.usage) ?? {};

      summary.usage.inputTokens += asNumber(usage.input_tokens);
      summary.usage.cachedInputTokens += asNumber(usage.cache_read_input_tokens);
      summary.usage.cacheWriteTokens += asNumber(usage.cache_creation_input_tokens);
      summary.usage.outputTokens += asNumber(usage.output_tokens);

      if (event.is_error === true)
        summary.errors.push(`${String(event.subtype)}: ${summary.finalMessage ?? ''}`.trim());
    }
  }

  if (sawResult) {
    summary.turns = turns;
    summary.costUsd = cost;
  }

  return summary;
}

function recordClaudeTool(summary: TranscriptSummary, name: string, input: JsonObject): void {
  const path = asString(input.file_path) ?? asString(input.path);

  if (name === 'Bash') {
    const command = asString(input.command);

    if (command) summary.commands.push(command);
  } else if (name === 'Read' && path) {
    summary.filesRead.push(path);
  } else if ((name === 'Write' || name === 'Edit' || name === 'MultiEdit') && path) {
    summary.filesWritten.push(path);
  } else if (name === 'WebFetch') {
    const url = asString(input.url);

    if (url) summary.webFetches.push(url);
  } else if (name === 'WebSearch') {
    const query = asString(input.query);

    if (query) {
      summary.webSearches.push(query);
      summary.searches.push({ query, action: 'search', urls: [] });
    }
  } else if (name === 'Skill') {
    const skill = asString(input.skill) ?? asString(input.command) ?? asString(input.name);

    if (skill) summary.skillsInvoked.push(skill);
  }
}

/** Codex runs each command as `/bin/bash -lc '<command>'`; signals match the command inside. */
export function unwrapShell(command: string): string {
  const match = /^\/bin\/(?:ba)?sh -lc (['"])([\s\S]*)\1$/.exec(command.trim());
  if (!match) return command;

  const [, quote, inner = ''] = match;

  return quote === "'" ? inner.replaceAll(`'"'"'`, "'") : inner.replace(/\\(["\\$`])/g, '$1');
}

export function parseCodexTranscript(text: string): TranscriptSummary {
  const summary = emptySummary();
  let turns = 0;

  for (const event of jsonLines(text)) {
    summary.events += 1;
    summary.lastEventType = asString(event.type);

    if (event.type === 'thread.started') {
      summary.sessionId = asString(event.thread_id) ?? summary.sessionId;
      continue;
    }

    if (event.type === 'turn.completed') {
      turns += 1;

      const usage = asObject(event.usage) ?? {};

      summary.usage.inputTokens += asNumber(usage.input_tokens);
      summary.usage.cachedInputTokens += asNumber(usage.cached_input_tokens);
      summary.usage.cacheWriteTokens += asNumber(usage.cache_write_input_tokens);
      summary.usage.outputTokens += asNumber(usage.output_tokens);
      summary.usage.reasoningTokens += asNumber(usage.reasoning_output_tokens);
      continue;
    }

    if (event.type === 'turn.failed' || event.type === 'error') {
      const message = asString(asObject(event.error)?.message) ?? asString(event.message) ?? JSON.stringify(event);

      if (message.startsWith('Reconnecting')) {
        summary.apiRetries.push(message);
        summary.lastEventType = 'api_retry';
      } else {
        summary.errors.push(message);
      }

      continue;
    }

    if (event.type !== 'item.completed') continue;

    const item = asObject(event.item) ?? {};

    if (item.type === 'agent_message') {
      summary.finalMessage = asString(item.text) ?? summary.finalMessage;
    } else if (item.type === 'command_execution') {
      summary.toolCalls += 1;

      const command = asString(item.command);

      if (command) summary.commands.push(unwrapShell(command));
    } else if (item.type === 'file_change') {
      summary.toolCalls += 1;

      for (const change of Array.isArray(item.changes) ? item.changes.map(asObject) : []) {
        const path = asString(change?.path);

        if (path) summary.filesWritten.push(path);
      }
    } else if (item.type === 'web_search') {
      summary.toolCalls += 1;

      const query = asString(item.query);
      const action = asObject(item.action);
      const urls = [
        asString(action?.url),
        ...(Array.isArray(item.results) ? item.results.map((result) => asString(asObject(result)?.url)) : []),
      ].filter((url): url is string => url !== null);

      if (query) summary.webSearches.push(query);

      summary.searches.push({ query: query ?? '', action: asString(action?.type), urls: [...new Set(urls)] });
    } else if (item.type === 'mcp_tool_call') {
      summary.toolCalls += 1;
    } else if (item.type === 'error') {
      summary.errors.push(asString(item.message) ?? 'unknown error');
    }
  }

  summary.turns = turns;

  return summary;
}

/** How the agent found its way: which docs it used, and which known dead ends it hit. */
export interface ActivitySignals {
  /** Ran `agents init`, which prints version-matched installation instructions. */
  ranAgentsInit: boolean;
  /** Ran the `docs` or `config` command of `@videojs/cli`, which releases before `agents init` shipped. */
  usedLegacyCli: boolean;
  readBundledDocs: boolean;
  readLlmsTxt: boolean;
  fetchedVideojsOrg: boolean;
  fetchedMainVideojsOrg: boolean;
  fetchedLegacyDocs: boolean;
  fetchedGithubSource: boolean;
  ranShadcn: boolean;
  /**
   * Tried to install the `video.js` npm package: Video.js 8, until a release publishes the Video.js 10 package that
   * only points to the framework packages.
   */
  installedVideojsPackage: boolean;
  loadedSkill: boolean;
  ranBuild: boolean;
  webSearches: number;
  webFetches: number;
}

const PATTERNS = {
  agentsInit: /\bagents\s+init\b/,
  legacyCli: /(?:@videojs\/cli(?:@\S+)?|(?<![\w./@-])videojs)\s+(?:docs|config)\b/,
  bundledDocs: /node_modules\/@videojs\/[\w-]+\/docs\b/,
  llmsTxt: /llms(?:-full)?\.txt/,
  videojsOrg: /(?<![\w.-])videojs\.org/,
  mainVideojsOrg: /\bmain\.videojs\.org/,
  // Video.js 8 lives on at legacy.videojs.org and videojs.com, which search engines still rank.
  legacyDocs: /\blegacy\.videojs\.org|(?<![\w-])(?:docs\.)?videojs\.com\b/,
  githubSource: /github\.com\/videojs\/v10|raw\.githubusercontent\.com\/videojs\/v10/,
  shadcn: /\bshadcn(?:@[\w.-]+)?\s+(?:add|init|registry|build|view)\b/,
  videojsPackage:
    /\b(?:npm|pnpm|yarn|bun)\b[^\n;&|]*?\b(?:i|install|add)\b[^\n;&|]*?(?:^|\s)video\.js(?:@[^\s'";&|)]+)?(?=[\s'";&|)]|$)/m,
  skill: /skills\/videojs\/SKILL\.md/,
  build: /\b(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?build|next\s+build|vite\s+build|astro\s+build|nuxt\s+build)\b/,
};

export function activitySignals(summary: TranscriptSummary): ActivitySignals {
  const commands = summary.commands.join('\n');
  const everything = [
    commands,
    ...summary.filesRead,
    ...summary.webFetches,
    ...summary.webSearches,
    ...summary.searches.flatMap(({ urls }) => urls),
  ].join('\n');
  const skillInvoked = summary.skillsInvoked.some((skill) => skill.includes('videojs'));

  return {
    ranAgentsInit: PATTERNS.agentsInit.test(commands),
    usedLegacyCli: PATTERNS.legacyCli.test(commands),
    readBundledDocs: PATTERNS.bundledDocs.test(everything),
    readLlmsTxt: PATTERNS.llmsTxt.test(everything),
    fetchedVideojsOrg: PATTERNS.videojsOrg.test(everything),
    fetchedMainVideojsOrg: PATTERNS.mainVideojsOrg.test(everything),
    fetchedLegacyDocs: PATTERNS.legacyDocs.test(everything),
    fetchedGithubSource: PATTERNS.githubSource.test(everything),
    ranShadcn: PATTERNS.shadcn.test(commands),
    installedVideojsPackage: PATTERNS.videojsPackage.test(commands),
    loadedSkill: skillInvoked || PATTERNS.skill.test(everything),
    ranBuild: PATTERNS.build.test(commands),
    webSearches: summary.webSearches.length,
    webFetches: summary.webFetches.length,
  };
}
