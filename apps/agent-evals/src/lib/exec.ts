import { type ChildProcess, spawn } from 'node:child_process';
import { appendFileSync, createWriteStream } from 'node:fs';

export interface ExecOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  /** Appends stdout and stderr to this file. */
  logFile?: string;
  /** Writes stdout to this file instead of the log, for agent transcripts. */
  stdoutFile?: string;
  input?: string;
}

export interface ExecResult {
  code: number | null;
  timedOut: boolean;
  durationMs: number;
  /** The end of stdout and stderr, for error messages. */
  tail: string;
}

const TAIL_BYTES = 16_000;

/**
 * Runs a command as the leader of its own process group, so a timeout also kills whatever the command started (dev
 * servers, watchers, package manager children).
 */
export function exec(command: string, args: readonly string[], options: ExecOptions): Promise<ExecResult> {
  const startedAt = Date.now();
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    detached: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const stdoutFile = options.stdoutFile ? createWriteStream(options.stdoutFile, { flags: 'a' }) : null;
  let tail = '';
  let timedOut = false;

  const record = (chunk: Buffer) => {
    tail = (tail + chunk.toString('utf8')).slice(-TAIL_BYTES);

    if (options.logFile) appendFileSync(options.logFile, chunk);
  };

  child.stdout?.on('data', (chunk: Buffer) => {
    if (stdoutFile) stdoutFile.write(chunk);
    else record(chunk);
  });
  child.stderr?.on('data', record);
  // A command that exits before reading its input, such as `kill -1` taking itself down, closes the pipe early.
  child.stdin?.on('error', () => {});
  child.stdin?.end(options.input ?? '');

  const timer = options.timeoutMs
    ? setTimeout(() => {
        timedOut = true;
        killGroup(child);
      }, options.timeoutMs)
    : null;

  return new Promise((resolve) => {
    child.on('close', (code) => {
      if (timer) clearTimeout(timer);

      stdoutFile?.end();
      resolve({ code, timedOut, durationMs: Date.now() - startedAt, tail });
    });
    child.on('error', (error) => {
      if (timer) clearTimeout(timer);

      stdoutFile?.end();
      resolve({ code: null, timedOut, durationMs: Date.now() - startedAt, tail: `${tail}\n${error.message}` });
    });
  });
}

/** Runs a shell command line through bash. */
export function sh(commandLine: string, options: ExecOptions): Promise<ExecResult> {
  return exec('bash', ['-c', commandLine], options);
}

export interface BackgroundProcess {
  child: ChildProcess;
  exited: () => boolean;
  stop: () => void;
}

/** Starts a long-running shell command, such as a preview server, in its own process group. */
export function startBackground(commandLine: string, options: Omit<ExecOptions, 'timeoutMs'>): BackgroundProcess {
  const child = spawn('bash', ['-c', commandLine], {
    cwd: options.cwd,
    env: options.env ?? process.env,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let exited = false;

  child.on('exit', () => {
    exited = true;
  });

  const log = (chunk: Buffer) => {
    if (options.logFile) appendFileSync(options.logFile, chunk);
  };

  child.stdout?.on('data', log);
  child.stderr?.on('data', log);

  return { child, exited: () => exited, stop: () => killGroup(child) };
}

function killGroup(child: ChildProcess): void {
  if (child.pid === undefined) return;

  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    child.kill('SIGKILL');
  }
}
