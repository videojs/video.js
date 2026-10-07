// Applies triage.json to GitHub. Dry run by default.
//
//   node .agents/plans/v8-issue-triage/execute.mjs                       # dry run, all buckets
//   node .agents/plans/v8-issue-triage/execute.mjs --check               # dry run + live state checks
//   node .agents/plans/v8-issue-triage/execute.mjs --execute --numbers=8302
//   node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=keep-v8
//   node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=close --limit=50
//
// Flags:
//   --execute               perform writes (otherwise print the plan)
//   --check                 in dry run, fetch each item's live state too
//   --bucket=a,b            keep-v8 | close | close-pr (default: all three)
//   --numbers=1,2           restrict to these issue/PR numbers
//   --limit=N               stop after N acted-on items
//   --delay=MS              pause between items in execute mode (default 8000)
//   --allow-missing-policy  run even if SECURITY.md is not on the default branch yet
//   --include-updated       act on items with activity after the snapshot
//
// Resumable: every completed step is appended to run-log.jsonl and skipped on rerun.
// GitHub caps content-creating requests (~80/min, ~500/hour), so a full run takes hours.

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'videojs/video.js';
const LABELS = {
  closed: { name: 'v8-maintenance', color: '777777', description: 'Closed in the move to Video.js 10; v8 receives security fixes only' },
  security: { name: 'security', color: 'B60205', description: 'Security vulnerability or hardening' },
  v8: { name: '8.x', color: 'c5def5', description: '' },
};
const ACTIONABLE = ['keep-v8', 'close', 'close-pr'];

const BRANCH_URL = `https://github.com/${REPO}/tree/8.x`;
const POLICY_URL = `https://github.com/${REPO}/security/policy`;
const REPORT_URL = `https://github.com/${REPO}/security/advisories/new`;

const COMMENTS = {
  close: (item) =>
    [
      item.reason.startsWith('addressed in v10') ? 'This is addressed in Video.js 10.\n' : null,
      `Video.js 10 is now the current version. Video.js 8 is maintained on the [\`8.x\` branch](${BRANCH_URL}) and receives security fixes only — see the [security policy](${POLICY_URL}).`,
      '',
      `We're closing v8 issues that aren't security-related. If this still applies to Video.js 10, please open a new issue with a reproduction. To report a vulnerability in any version, use [private vulnerability reporting](${REPORT_URL}).`,
      '',
      'Thank you for helping improve Video.js.',
    ]
      .filter((line) => line !== null)
      .join('\n'),
  'close-pr': () =>
    [
      'Thank you for this contribution. Video.js 10 has replaced the v8 source on `main`, so this pull request no longer applies here.',
      '',
      `Video.js 8 is maintained on the [\`8.x\` branch](${BRANCH_URL}) and receives security fixes only — see the [security policy](${POLICY_URL}). If this fixes a security issue in v8, leave a comment and we'll retarget it to \`8.x\`. If the change still matters for Video.js 10, please open an issue or a new pull request against the current \`main\`.`,
    ].join('\n'),
};

const dir = dirname(fileURLToPath(import.meta.url));
const logPath = join(dir, 'run-log.jsonl');

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? true];
  })
);
const execute = args.execute === true;
const buckets = args.bucket ? String(args.bucket).split(',') : ACTIONABLE;
const numbers = args.numbers ? new Set(String(args.numbers).split(',').map(Number)) : null;
const limit = args.limit ? Number(args.limit) : Infinity;
const delay = args.delay ? Number(args.delay) : 8000;

const unknownBuckets = buckets.filter((b) => !ACTIONABLE.includes(b));
if (unknownBuckets.length) throw new Error(`Unknown bucket(s): ${unknownBuckets.join(', ')}`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- GitHub ----------------------------------------------------------------

async function gh(argv, input) {
  for (let attempt = 0; ; attempt++) {
    try {
      return execFileSync('gh', argv, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (error) {
      const message = `${error.stderr ?? ''}${error.stdout ?? ''}`;
      if (!/rate limit|HTTP 429|abuse/i.test(message) || attempt >= 5) {
        error.message = `gh ${argv.join(' ')}\n${message}`;
        throw error;
      }
      const wait = 60_000 * 2 ** attempt;
      console.warn(`  rate limited; retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
}

async function api(method, path, body) {
  const argv = ['api', '-X', method, path, ...(body ? ['--input', '-'] : [])];
  const output = await gh(argv, body ? JSON.stringify(body) : undefined);
  return output.trim() ? JSON.parse(output) : null;
}

async function exists(path) {
  try {
    await api('GET', path);
    return true;
  } catch (error) {
    if (/HTTP 404/.test(error.message)) return false;
    throw error;
  }
}

// --- Run log ---------------------------------------------------------------

const done = new Map();
if (existsSync(logPath)) {
  for (const line of readFileSync(logPath, 'utf8').split('\n').filter(Boolean)) {
    const entry = JSON.parse(line);
    done.set(`${entry.number}:${entry.step}`, entry);
  }
}

const isDone = (number, step) => done.has(`${number}:${step}`);

function record(number, step, extra = {}) {
  const entry = { number, step, at: new Date().toISOString(), ...extra };
  done.set(`${number}:${step}`, entry);
  appendFileSync(logPath, JSON.stringify(entry) + '\n');
}

const touched = (number) => [...done.keys()].some((key) => key.startsWith(`${number}:`));

// --- Actions ---------------------------------------------------------------

async function closeItem(item, live) {
  const isPr = item.kind === 'pr';

  if (!isDone(item.number, 'comment')) {
    await api('POST', `repos/${REPO}/issues/${item.number}/comments`, { body: COMMENTS[item.bucket](item) });
    record(item.number, 'comment');
  }

  if (!isDone(item.number, 'close')) {
    const labels = [...new Set([...live.labels.map((l) => l.name), LABELS.closed.name])];
    await api('PATCH', `repos/${REPO}/issues/${item.number}`, {
      labels,
      state: 'closed',
      ...(isPr ? {} : { state_reason: 'not_planned' }),
    });
    record(item.number, 'close');
  }
}

async function labelV8Security(item) {
  if (!isDone(item.number, 'label')) {
    await api('POST', `repos/${REPO}/issues/${item.number}/labels`, { labels: [LABELS.security.name, LABELS.v8.name] });
    record(item.number, 'label');
  }
}

const isComplete = (item) => isDone(item.number, item.bucket === 'keep-v8' ? 'label' : 'close');

// Returns a skip reason, or null when the item should be acted on.
function skipReason(item, live) {
  if (!live.html_url.startsWith(`https://github.com/${REPO}/`)) return `moved to ${live.html_url}`;
  if (live.state === 'closed') return 'already closed';
  if (!args['include-updated'] && !touched(item.number) && live.updated_at > item.updated_at) {
    return `activity since snapshot (${live.updated_at})`;
  }
  return null;
}

// --- Main ------------------------------------------------------------------

const triage = JSON.parse(readFileSync(join(dir, 'triage.json'), 'utf8'));
const snapshotNumbers = new Set(JSON.parse(readFileSync(join(dir, 'snapshot.json'), 'utf8')).map((i) => i.number));

const strays = triage.filter((item) => !snapshotNumbers.has(item.number));
if (strays.length) throw new Error(`triage.json has numbers outside the snapshot: ${strays.map((i) => i.number).join(', ')}`);

const queue = triage.filter(
  (item) => buckets.includes(item.bucket) && (!numbers || numbers.has(item.number)) && !isComplete(item)
);

const counts = Object.fromEntries(buckets.map((b) => [b, queue.filter((i) => i.bucket === b).length]));
console.log(`${execute ? 'EXECUTE' : 'DRY RUN'} — ${REPO}`);
console.table(counts);

if (!execute) {
  for (const bucket of buckets) {
    const sample = queue.find((i) => i.bucket === bucket);
    if (!sample || !COMMENTS[bucket]) continue;
    console.log(`\n--- ${bucket} comment (e.g. #${sample.number}) ---\n${COMMENTS[bucket](sample)}`);
  }
  const addressed = queue.find((i) => i.bucket === 'close' && i.reason.startsWith('addressed in v10'));
  if (addressed) console.log(`\n--- close comment, addressed variant (#${addressed.number}) ---\n${COMMENTS.close(addressed)}`);
}

if (execute) {
  let hasPolicy = false;
  for (const path of ['SECURITY.md', '.github/SECURITY.md', 'docs/SECURITY.md']) {
    if (await exists(`repos/${REPO}/contents/${path}`)) hasPolicy = true;
  }
  if (!hasPolicy && !args['allow-missing-policy']) {
    throw new Error(`${REPO} has no SECURITY.md on its default branch; comments link to it. Merge it or pass --allow-missing-policy.`);
  }

  for (const label of Object.values(LABELS)) {
    if (await exists(`repos/${REPO}/labels/${encodeURIComponent(label.name)}`)) continue;
    await api('POST', `repos/${REPO}/labels`, label);
    console.log(`created label "${label.name}"`);
  }
}

const skipped = [];
const failed = [];
let acted = 0;

for (const item of queue) {
  if (acted >= limit) break;

  if (!execute && !args.check) {
    console.log(`#${item.number} [${item.kind}] ${item.bucket}${item.reason ? ` — ${item.reason}` : ''}`);
    continue;
  }

  const live = await api('GET', `repos/${REPO}/issues/${item.number}`);
  const skip = skipReason(item, live);
  if (skip) {
    skipped.push({ number: item.number, skip });
    console.log(`#${item.number} skip: ${skip}`);
    continue;
  }

  if (!execute) {
    console.log(`#${item.number} [${item.kind}] ${item.bucket} — ok`);
    continue;
  }

  try {
    if (item.bucket === 'keep-v8') {
      await labelV8Security(item);
      console.log(`#${item.number} labeled security, 8.x`);
    } else {
      await closeItem(item, live);
      console.log(`#${item.number} closed`);
    }
    acted++;
  } catch (error) {
    failed.push({ number: item.number, error: error.message.split('\n').slice(0, 3).join(' ') });
    console.error(`#${item.number} FAILED: ${error.message}`);
  }

  await sleep(delay);
}

console.log(`\nacted: ${acted}, skipped: ${skipped.length}, failed: ${failed.length}`);
if (failed.length) console.log(failed);
