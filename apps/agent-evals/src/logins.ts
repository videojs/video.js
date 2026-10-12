import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Reuses the Claude Code and Codex logins already on this machine, so a subscription can run evals without API keys.
 * Containers only ever get a current access token: refresh tokens stay on the host, so a trial can neither renew nor
 * rotate the login and sign the host CLI out. The host CLIs renew their own tokens as you use them.
 */
export interface BorrowedLogin {
  /** Where the login came from, for the run log. */
  source: string;
  expiresAt: Date | null;
}

/** Expands a leading `~`, which `.env` values do not get from a shell. */
export function expandHome(path: string): string {
  return path.replace(/^~(?=\/|$)/, homedir());
}

/** Claude Code keeps one Keychain entry per config directory, suffixed with a hash of the directory's path. */
export function claudeKeychainService(configDir: string | undefined): string {
  if (!configDir) return 'Claude Code-credentials';

  return `Claude Code-credentials-${createHash('sha256').update(expandHome(configDir)).digest('hex').slice(0, 8)}`;
}

interface ClaudeOauth {
  accessToken?: string;
  expiresAt?: number;
}

/**
 * Sets CLAUDE_CODE_OAUTH_TOKEN to Claude Code's current access token. Returns `null` when there is no login. A token
 * that expires within `renewWithinMs` is renewed first, so long runs outlast one token.
 */
export function borrowClaudeLogin(env: NodeJS.ProcessEnv = process.env, renewWithinMs = 0): BorrowedLogin | null {
  let login = readClaudeLogin(env.CLAUDE_CONFIG_DIR);

  if (login?.expiresAt && login.expiresAt.getTime() - Date.now() < renewWithinMs) {
    renewClaudeLogin(env);
    login = readClaudeLogin(env.CLAUDE_CONFIG_DIR);
  }

  if (!login) return null;

  if (login.expiresAt && login.expiresAt.getTime() < Date.now()) {
    throw new Error(
      `Your Claude Code login token expired at ${login.expiresAt.toISOString()}. Run any claude command to renew it.`
    );
  }

  env.CLAUDE_CODE_OAUTH_TOKEN = login.accessToken;

  return { source: login.source, expiresAt: login.expiresAt };
}

/**
 * Makes one tiny request with the host CLI, which renews its own token when it is about to expire. The borrowed token
 * stays out of that request, or the CLI would use it instead of its login.
 */
function renewClaudeLogin(env: NodeJS.ProcessEnv): void {
  const childEnv = { ...env };

  delete childEnv.CLAUDE_CODE_OAUTH_TOKEN;
  delete childEnv.ANTHROPIC_API_KEY;

  spawnSync('claude', ['-p', '--model', 'haiku', '--strict-mcp-config', '--no-session-persistence', 'Reply with OK.'], {
    cwd: tmpdir(),
    env: childEnv,
    stdio: 'ignore',
    timeout: 120_000,
  });
}

function readClaudeLogin(configDir: string | undefined): (BorrowedLogin & { accessToken: string }) | null {
  let oauth: ClaudeOauth | undefined;
  let source: string;

  if (process.platform === 'darwin') {
    const service = claudeKeychainService(configDir);
    const secret = spawnSync('security', ['find-generic-password', '-s', service, '-w'], { encoding: 'utf8' });

    source = `Keychain "${service}"`;

    if (secret.status === 0) oauth = (JSON.parse(secret.stdout) as { claudeAiOauth?: ClaudeOauth }).claudeAiOauth;
  } else {
    const file = join(expandHome(configDir ?? '~/.claude'), '.credentials.json');

    source = file;

    if (existsSync(file))
      oauth = (JSON.parse(readFileSync(file, 'utf8')) as { claudeAiOauth?: ClaudeOauth }).claudeAiOauth;
  }

  if (!oauth?.accessToken) return null;

  return { source, expiresAt: oauth.expiresAt ? new Date(oauth.expiresAt) : null, accessToken: oauth.accessToken };
}

interface CodexAuth {
  auth_mode?: string;
  tokens?: { id_token?: string; access_token?: string; refresh_token?: string; account_id?: string };
}

/** Reads a JWT's expiry without verifying it; the provider verifies the token itself. */
export function jwtExpiry(token: string): Date | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as {
      exp?: number;
    };

    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch {
    return null;
  }
}

/**
 * A copy of a ChatGPT login for a container. Codex requires the refresh token field, so it is present but empty, and
 * `last_refresh` is now so Codex does not try to renew a token it cannot.
 */
export function codexLoginForContainer(auth: CodexAuth, now = new Date()): string {
  const { id_token, access_token, account_id } = auth.tokens ?? {};

  return JSON.stringify({
    auth_mode: auth.auth_mode ?? 'chatgpt',
    OPENAI_API_KEY: null,
    tokens: { id_token, access_token, refresh_token: '', account_id },
    last_refresh: now.toISOString(),
  });
}

/** Sets CODEX_LOGIN from CODEX_AUTH_JSON, or `$CODEX_HOME/auth.json`. Returns `null` when there is no ChatGPT login. */
export function borrowCodexLogin(env: NodeJS.ProcessEnv = process.env): BorrowedLogin | null {
  const file = expandHome(env.CODEX_AUTH_JSON ?? join(env.CODEX_HOME ?? '~/.codex', 'auth.json'));
  if (!existsSync(file)) return null;

  const auth = JSON.parse(readFileSync(file, 'utf8')) as CodexAuth;
  if (!auth.tokens?.access_token) return null;

  const expiresAt = jwtExpiry(auth.tokens.access_token);

  if (expiresAt && expiresAt.getTime() < Date.now()) {
    throw new Error(
      `The Codex login in ${file} expired at ${expiresAt.toISOString()}. Run any codex command with it to renew it.`
    );
  }

  env.CODEX_LOGIN = codexLoginForContainer(auth);

  return { source: file, expiresAt };
}
