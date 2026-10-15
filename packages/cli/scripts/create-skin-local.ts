/**
 * Run `videojs skin create` against this checkout instead of npm and the hosted registry: it builds the CLI, packs the
 * Video.js packages a skin needs into tarballs, and points the CLI at the local registry build. The built CLI already
 * reads the templates in this checkout, beside its bundle. Every argument is passed through, so prompts and flags work
 * as they will after publishing. Relative paths resolve from where you ran the command. From the repository root: `pnpm
 * create:skin ~/skins/neon --name Neon --framework html`.
 */
import { spawn } from 'node:child_process';

import { prepareLocalCli } from './local-cli.ts';

/** Run the CLI in this terminal and resolve with its exit code, so its prompts and output are the only thing shown. */
function interactive(command: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });

    child.on('error', reject);
    child.on('exit', (code) => resolvePromise(code ?? 1));
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  const cli = await prepareLocalCli();

  // The CLI reports its own errors; pass its exit code on without adding to them.
  process.exitCode = await interactive(
    process.execPath,
    [cli.entry, 'skin', 'create', ...args, '--package-manager', 'pnpm', ...cli.args],
    // pnpm runs scripts from the package directory; resolve relative paths from where the command was typed.
    process.env.INIT_CWD ?? process.cwd()
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
