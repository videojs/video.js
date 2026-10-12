// Packs a checkout for `pnpm evals --videojs <dir>`:
// pnpm evals:pack [--root <checkout>] [--out <dir>] [--name <label>] [--preview <pull request>] [--skip-build]
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';

import { packWorkspace, REPO_ROOT } from '../pack.ts';
import { EVALS_ROOT, fromInvocation } from '../tasks.ts';

const { values } = parseArgs({
  options: {
    root: { type: 'string', default: REPO_ROOT },
    out: { type: 'string', default: join(EVALS_ROOT, 'results', 'packages') },
    name: { type: 'string' },
    preview: { type: 'string' },
    'skip-build': { type: 'boolean', default: false },
  },
});
const out = fromInvocation(values.out);
const root = fromInvocation(values.root);
const tarballs = packWorkspace({ root, out, build: !values['skip-build'] });
const commit = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();

const source = {
  name: values.name ?? `packs-${commit}`,
  commit,
  ...(values.preview ? { preview: Number(values.preview) } : {}),
};

// `pnpm evals --videojs <dir>` labels the run with the name and serves the sites from the pull request's previews.
writeFileSync(join(out, 'source.json'), `${JSON.stringify(source, null, 2)}\n`);

console.log(`Packed ${tarballs.length} packages into ${relative(process.cwd(), out)}`);
