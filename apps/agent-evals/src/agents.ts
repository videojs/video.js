export type AgentHarness = 'claude-code' | 'codex' | 'oracle' | 'noop' | 'mutant';

/**
 * One agent configuration under test. Keep `id` stable across releases: reports join runs on it. CLI versions are
 * pinned in the Docker image, so `effort` left unset means the pinned CLI's default for that model.
 */
export interface AgentConfig {
  id: string;
  harness: AgentHarness;
  model?: string;
  effort?: string;
  /** Environment variables the agent needs; the first one present authenticates the run. */
  credentials: readonly string[];
}

const CREDENTIALS: Record<AgentHarness, readonly string[]> = {
  'claude-code': ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN'],
  codex: ['OPENAI_API_KEY', 'CODEX_LOGIN'],
  oracle: [],
  noop: [],
  mutant: [],
};

export const AGENTS: readonly AgentConfig[] = [
  { id: 'claude-opus-5.5', harness: 'claude-code', model: 'claude-opus-5-5', credentials: CREDENTIALS['claude-code'] },
  { id: 'codex-gpt-6-sol', harness: 'codex', model: 'gpt-6-sol', credentials: CREDENTIALS.codex },
  { id: 'codex-gpt-5.6-sol', harness: 'codex', model: 'gpt-5.6-sol', credentials: CREDENTIALS.codex },
  // Smaller models as canaries: they reason around fewer gaps in the docs, so a regression shows up in them first.
  { id: 'claude-sonnet-5', harness: 'claude-code', model: 'claude-sonnet-5', credentials: CREDENTIALS['claude-code'] },
  {
    id: 'claude-haiku-4.5',
    harness: 'claude-code',
    model: 'claude-haiku-4-5-20251001',
    credentials: CREDENTIALS['claude-code'],
  },
  // Applies each task's reference solution. Validates fixtures and graders without spending tokens.
  { id: 'oracle', harness: 'oracle', credentials: CREDENTIALS.oracle },
  // Changes nothing. Never on spec where the grader works, so it shows a task's checks fail without the change.
  { id: 'noop', harness: 'noop', credentials: CREDENTIALS.noop },
  // Applies the reference solution, then one of the task's deliberate mistakes, which the grader has to catch.
  { id: 'mutant', harness: 'mutant', credentials: CREDENTIALS.mutant },
];

/** The latest Claude and Codex models. */
export const DEFAULT_AGENT_IDS = ['claude-opus-5.5', 'codex-gpt-6-sol'];

/**
 * Resolves `id`, `id:effort`, or an ad hoc `harness/model[:effort]` such as `claude-code/claude-sonnet-5:low`. The
 * effort becomes part of the id, so reports keep different efforts apart.
 */
export function findAgent(spec: string): AgentConfig {
  const [name = '', effort] = spec.split(':');
  const known = AGENTS.find((candidate) => candidate.id === name);
  const [harness, model] = name.split('/');
  const agent =
    known ??
    (model && (harness === 'claude-code' || harness === 'codex')
      ? { id: name, harness, model, credentials: CREDENTIALS[harness] }
      : null);

  if (!agent) {
    throw new Error(
      `Unknown agent "${spec}". Use one of ${AGENTS.map(({ id }) => id).join(', ')}, or claude-code/<model> or codex/<model>.`
    );
  }

  return effort ? { ...agent, id: `${agent.id}:${effort}`, effort } : agent;
}
