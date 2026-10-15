import { runAgentsCli } from '@videojs/installation/node';

import packageJson from '../package.json' with { type: 'json' };
import { runSkinCommand } from './skin/command';
import { HELP as SKIN_HELP } from './skin/options';

// Earlier releases of this package read docs and saved preferences. Keep those commands answering so scripts that
// still call them learn where the replacement lives instead of failing on an unknown command.
const DEPRECATED_COMMANDS = new Set(['docs', 'config']);
const [command, subcommand, ...rest] = process.argv.slice(2);

if (command && DEPRECATED_COMMANDS.has(command)) {
  process.stderr.write(
    `\`videojs ${command}\` is deprecated and no longer does anything. Run \`npx @videojs/cli agents init\` for version-matched installation instructions, \`npx @videojs/cli agents skills\` to install the Video.js skill in your coding agent, or read the docs at https://videojs.org/docs.\n`
  );
} else if (command === 'skin') {
  if (subcommand === 'create') {
    process.exitCode = await runSkinCommand(rest);
  } else {
    process.stdout.write(SKIN_HELP);

    // A bare `skin` or `skin --help` asks for help; anything else is a mistyped command.
    if (subcommand && !['--help', '-h'].includes(subcommand)) process.exitCode = 1;
  }
} else {
  runAgentsCli(packageJson.version);
}
