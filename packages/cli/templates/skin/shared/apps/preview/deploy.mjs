// Deploy the workbench to a static host: `<package manager> run deploy`, or `deploy vercel` to skip the question.
// Each host's own CLI signs you in and creates the project on the first run, then prints the URL.
import { spawnSync } from 'node:child_process';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const HOSTS = [
  { id: 'vercel', label: 'Vercel' },
  { id: 'netlify', label: 'Netlify' },
  { id: 'cloudflare', label: 'Cloudflare Pages' },
];

// The package manager that ran this script, so its scripts run the same way.
const packageManager = process.env.npm_config_user_agent?.split('/')[0] || 'npm';

async function chooseHost() {
  const requested = process.argv[2];
  const named = HOSTS.find(({ id }) => id === requested);
  if (named) return named;

  if (requested || !stdin.isTTY) {
    console.error(
      `Choose a host: ${HOSTS.map(({ id }) => id).join(', ')}. For example: ${packageManager} run deploy vercel`
    );
    process.exit(1);
  }

  const prompt = createInterface({ input: stdin, output: stdout });

  console.log('Where do you want to deploy?\n');
  HOSTS.forEach(({ label }, index) => console.log(`  ${index + 1}. ${label}`));

  try {
    for (;;) {
      const answer = (await prompt.question(`\nNumber (1-${HOSTS.length}): `)).trim();
      const host = HOSTS[Number(answer) - 1];
      if (host) return host;

      console.log(`Enter a number from 1 to ${HOSTS.length}.`);
    }
  } finally {
    prompt.close();
  }
}

const host = await chooseHost();

console.log(`\nDeploying to ${host.label}…\n`);

const { status } = spawnSync(packageManager, ['run', `deploy:${host.id}`], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(status ?? 1);
