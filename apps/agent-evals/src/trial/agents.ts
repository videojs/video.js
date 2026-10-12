import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { AgentConfig } from '../agents.ts';
import { exec, type ExecOptions, type ExecResult, sh } from '../lib/exec.ts';
import { parseTranscript } from './transcript.ts';

/** Sent once when the first turn ends without changing the project, as a user would answer a clarifying question. */
export const FOLLOW_UP_PROMPT = 'Yes, go ahead with what you recommend. Please make the changes now.';

/**
 * The account agents run as in the container. It cannot read the harness's tasks, solutions, answer cards, or grader,
 * which the harness's own account keeps to itself. Unset outside the container, where agents run as you.
 */
export const AGENT_USER = process.env.EVAL_AGENT_USER || null;
const AGENT_HOME = AGENT_USER ? `/home/${AGENT_USER}` : homedir();

export interface AgentRunOptions {
  workspace: string;
  transcriptFile: string;
  logFile: string;
  timeoutMs: number;
}

/**
 * Whether agents may search the web from the provider's servers. Those searches never pass through the container's site
 * routes, so a comparison between releases turns them off and agents fetch docs from inside the container instead.
 */
export type WebSearch = 'disabled' | 'live';

export function webSearchMode(): WebSearch {
  return process.env.EVAL_WEB_SEARCH === 'live' ? 'live' : 'disabled';
}

/** Where each harness discovers user-level skills. */
export function skillDirectory(agent: AgentConfig): string | null {
  if (agent.harness === 'claude-code') return join(AGENT_HOME, '.claude', 'skills');

  if (agent.harness === 'codex') return join(AGENT_HOME, '.agents', 'skills');

  return null;
}

/** Runs a command as the agent's account, with its home and global npm prefix, keeping the trial's environment. */
export function execAsAgent(command: string, args: readonly string[], options: ExecOptions): Promise<ExecResult> {
  if (!AGENT_USER) return exec(command, args, options);

  const env = options.env ?? process.env;
  const npmPrefix = join(AGENT_HOME, '.npm-global');
  const path = [join(npmPrefix, 'bin'), ...(env.PATH ?? '').split(':').filter((dir) => !dir.includes('/home/'))];

  return exec(
    'sudo',
    [
      '--non-interactive',
      '--preserve-env',
      '--set-home',
      '--user',
      AGENT_USER,
      '--',
      'env',
      `HOME=${AGENT_HOME}`,
      `USER=${AGENT_USER}`,
      `NPM_CONFIG_PREFIX=${npmPrefix}`,
      `PATH=${path.join(':')}`,
      // Group-writable files, so the harness's account can reuse the shared pnpm store after the agent's turn.
      'bash',
      '-c',
      'umask 002 && exec "$@"',
      'agent',
      command,
      ...args,
    ],
    { ...options, env }
  );
}

/** Copies a directory into the agent's home, as the agent, so it owns what it finds there. */
export async function copyToAgentHome(source: string, target: string): Promise<void> {
  const result = await execAsAgent('bash', ['-c', 'mkdir -p "$1" && cp -R "$2" "$1/"', 'copy', target, source], {
    cwd: '/',
  });
  if (result.code !== 0) throw new Error(`Copying ${source} for the agent failed: ${result.tail}`);
}

/**
 * Hands the workspace to the agent's account for its turn, and back to the harness for grading. Package managers write
 * files the other account could not change otherwise.
 */
export async function handOverWorkspace(to: 'agent' | 'harness'): Promise<void> {
  if (!AGENT_USER) return;

  const result = await exec('sudo', ['--non-interactive', '/usr/local/bin/eval-own', to], { cwd: '/' });
  if (result.code !== 0) throw new Error(`Handing the workspace to the ${to} failed: ${result.tail}`);
}

/** Stops everything the agent left running, such as dev servers and watchers. */
export async function stopAgentProcesses(): Promise<void> {
  if (!AGENT_USER) return;

  await exec('sudo', ['--non-interactive', '--user', AGENT_USER, 'kill', '-9', '-1'], { cwd: '/' });
}

export async function prepareAgent(agent: AgentConfig, logFile: string): Promise<void> {
  if (agent.harness !== 'codex') return;

  // A ChatGPT login from the host, without its refresh token. The container has no keyring, so Codex reads a file.
  if (process.env.CODEX_LOGIN) {
    const write = await execAsAgent(
      'bash',
      [
        '-c',
        'umask 077 && mkdir -p ~/.codex && cat > ~/.codex/auth.json && printf \'cli_auth_credentials_store = "file"\\n\' > ~/.codex/config.toml',
      ],
      { cwd: '/', input: process.env.CODEX_LOGIN, logFile }
    );
    if (write.code !== 0) throw new Error(`Writing the Codex login failed: ${write.tail}`);

    return;
  }

  const key = process.env.OPENAI_API_KEY ?? process.env.CODEX_API_KEY;
  if (!key) throw new Error('Codex needs OPENAI_API_KEY or a ChatGPT login.');

  const login = await execAsAgent('codex', ['login', '--with-api-key'], { cwd: '/', input: key, logFile });
  if (login.code !== 0) throw new Error(`codex login failed: ${login.tail}`);
}

export function startTurn(agent: AgentConfig, prompt: string, options: AgentRunOptions): Promise<ExecResult> {
  if (agent.harness === 'claude-code') {
    return execAsAgent('claude', claudeArgs(agent, prompt), runOptions(options));
  }

  if (agent.harness === 'codex') {
    return execAsAgent('codex', ['exec', ...codexArgs(agent), '-C', options.workspace, prompt], runOptions(options));
  }

  throw new Error(`${agent.harness} does not take prompts.`);
}

/** Applies a task's reference solution in place of an agent. */
export function runSolution(solution: string, options: AgentRunOptions): Promise<ExecResult> {
  return sh(`bash ${JSON.stringify(solution)}`, {
    cwd: options.workspace,
    logFile: options.logFile,
    timeoutMs: options.timeoutMs,
  });
}

/** Sends the user's next message in the same session: the canned follow-up, or the simulated user's answer. */
export function continueTurn(
  agent: AgentConfig,
  options: AgentRunOptions,
  message: string = FOLLOW_UP_PROMPT
): Promise<ExecResult> | null {
  if (agent.harness === 'claude-code') {
    const sessionId = parseTranscript('claude-code', readFileSync(options.transcriptFile, 'utf8')).sessionId;
    if (!sessionId) return null;

    return execAsAgent('claude', ['--resume', sessionId, ...claudeArgs(agent, message)], runOptions(options));
  }

  if (agent.harness === 'codex') {
    return execAsAgent('codex', ['exec', 'resume', '--last', ...codexArgs(agent), message], runOptions(options));
  }

  return null;
}

function claudeArgs(agent: AgentConfig, prompt: string): string[] {
  const args = ['--print', '--output-format', 'stream-json', '--verbose', '--dangerously-skip-permissions'];

  if (agent.model) args.push('--model', agent.model);

  if (agent.effort) args.push('--effort', agent.effort);

  // `=` keeps the variadic flag from swallowing the prompt.
  if (webSearchMode() === 'disabled') args.push('--disallowedTools=WebSearch');

  // Cost caps from the host. Codex has neither, so the trial timeout is its only limit.
  if (process.env.EVAL_BUDGET_USD) args.push('--max-budget-usd', process.env.EVAL_BUDGET_USD);

  if (process.env.EVAL_MAX_TURNS) args.push('--max-turns', process.env.EVAL_MAX_TURNS);

  return [...args, prompt];
}

function codexArgs(agent: AgentConfig): string[] {
  // The container is the sandbox, so Codex's own sandbox would only block package installs and network access.
  const args = ['--json', '--dangerously-bypass-approvals-and-sandbox', '--skip-git-repo-check'];

  if (agent.model) args.push('--model', agent.model);

  if (agent.effort) args.push('-c', `model_reasoning_effort="${agent.effort}"`);

  args.push('-c', `web_search="${webSearchMode()}"`);

  return args;
}

function runOptions(options: AgentRunOptions) {
  return {
    cwd: options.workspace,
    stdoutFile: options.transcriptFile,
    logFile: options.logFile,
    timeoutMs: options.timeoutMs,
    env: agentEnv(),
  };
}

/**
 * Codex has logged in by now, so its credentials stay out of the agent's shell, where a stray `env` would print them.
 * The simulated user's credentials stay out of a Codex agent's shell for the same reason.
 */
function agentEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, DISABLE_AUTOUPDATER: '1' };
  const hidden = ['CODEX_LOGIN', 'OPENAI_API_KEY', 'CODEX_API_KEY', 'EVAL_SIMULATOR_CREDENTIALS'];

  for (const name of hidden) delete env[name];

  if (process.env.EVAL_SIMULATOR_CREDENTIALS === '1') {
    delete env.ANTHROPIC_API_KEY;
    delete env.CLAUDE_CODE_OAUTH_TOKEN;
  }

  return env;
}
