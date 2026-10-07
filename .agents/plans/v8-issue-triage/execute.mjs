// Applies triage.json to GitHub. Dry run by default. Don't pass --execute without sign-off.
//
//   node .agents/plans/v8-issue-triage/execute.mjs                          # dry run, every bucket
//   node .agents/plans/v8-issue-triage/execute.mjs --check                  # dry run + live state checks
//   node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=close --numbers=8961
//   node .agents/plans/v8-issue-triage/execute.mjs --execute --bucket=close --limit=150
//
// Flags:
//   --execute          perform writes (otherwise print the plan); needs an explicit --bucket
//   --check            in dry run, fetch each item's live state too
//   --bucket=a,b       close | migrate | move-pr (default: all three)
//   --numbers=1,2      restrict to these issue/PR numbers
//   --limit=N          stop after N acted-on items
//   --delay=MS         pause between items in execute mode (default 8000)
//   --include-updated  act on items with activity after the snapshot
//
// close    comment, then close with the v8-maintenance label (issues as not planned)
// migrate  transfer the issue to videojs/videojs-v8 as is, without a comment; the old URL redirects
// move-pr  push the PR's commits to a videojs-v8 branch, open a PR there crediting the author,
//          then comment on the original with the new link and close it
//
// Resumable: every completed step is appended to run-log.jsonl and skipped on rerun.
// GitHub caps content-creating requests (~80/min, ~500/hour), so run in --limit batches.

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { REPO, V8_REPO, V8_URL, closeComment, movedBody, movedBranch, movedComment } from './messages.mjs';

const LABEL = { name: 'v8-maintenance', color: '777777', description: 'Closed in the move to Video.js 10; v8 receives security fixes only' };
const BUCKETS = ['close', 'migrate', 'move-pr'];
const FINAL_STEP = { close: 'close', migrate: 'transfer', 'move-pr': 'close' };

// --- Arguments -------------------------------------------------------------

const dir = dirname(fileURLToPath(import.meta.url));
const logPath = join(dir, 'run-log.jsonl');

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? true];
  })
);
const execute = args.execute === true;
const buckets = args.bucket ? String(args.bucket).split(',') : BUCKETS;
const numbers = args.numbers ? new Set(String(args.numbers).split(',').map(Number)) : null;
const limit = args.limit ? Number(args.limit) : Infinity;
const delay = args.delay ? Number(args.delay) : 8000;

const unknownBuckets = buckets.filter((b) => !BUCKETS.includes(b));
if (unknownBuckets.length) throw new Error(`Unknown bucket(s): ${unknownBuckets.join(', ')}`);
if (execute && !args.bucket) throw new Error('--execute needs an explicit --bucket');

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

async function graphql(query, variables) {
  const argv = ['api', 'graphql', '-f', `query=${query}`];
  for (const [key, value] of Object.entries(variables)) argv.push('-f', `${key}=${value}`);
  return JSON.parse(await gh(argv)).data;
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

const git = (...argv) => execFileSync('git', argv, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

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

async function commentAndClose(item, live, body) {
  if (!isDone(item.number, 'comment')) {
    await api('POST', `repos/${REPO}/issues/${item.number}/comments`, { body });
    record(item.number, 'comment');
  }

  if (!isDone(item.number, 'close')) {
    const labels = [...new Set([...live.labels.map((l) => l.name), LABEL.name])];
    await api('PATCH', `repos/${REPO}/issues/${item.number}`, {
      labels,
      state: 'closed',
      ...(item.kind === 'pr' ? {} : { state_reason: 'not_planned' }),
    });
    record(item.number, 'close');
  }
}

// createLabelsIfMissing keeps labels the v8 repo doesn't have yet; GitHub drops them otherwise.
async function transferIssue(item, live, v8Repo) {
  if (isDone(item.number, 'transfer')) return;

  const data = await graphql(
    'mutation($issue: ID!, $repo: ID!) { transferIssue(input: { issueId: $issue, repositoryId: $repo, createLabelsIfMissing: true }) { issue { url } } }',
    { issue: live.node_id, repo: v8Repo.node_id }
  );
  record(item.number, 'transfer', { url: data.transferIssue.issue.url });
}

// The PR's commits share history with the v8 repo, so pushing its head gives a clean diff there.
async function movePullRequest(item, live, v8Repo) {
  if (!isDone(item.number, 'push')) {
    git('fetch', '--quiet', `https://github.com/${REPO}.git`, `refs/pull/${item.number}/head`);
    const sha = git('rev-parse', 'FETCH_HEAD');
    if (sha !== live.head.sha) throw new Error(`fetched ${sha}, but the PR head is ${live.head.sha}`);

    git('push', '--quiet', `https://github.com/${V8_REPO}.git`, `${sha}:refs/heads/${movedBranch(item)}`);
    record(item.number, 'push', { sha, branch: movedBranch(item) });
  }

  if (!isDone(item.number, 'pr')) {
    const pr = await api('POST', `repos/${V8_REPO}/pulls`, {
      title: live.title,
      head: movedBranch(item),
      base: v8Repo.default_branch,
      body: movedBody(item, live.body),
      draft: live.draft,
    });
    record(item.number, 'pr', { url: pr.html_url });
  }

  await commentAndClose(item, live, movedComment(item, done.get(`${item.number}:pr`).url));
}

// Returns a skip reason, or null when the item should be acted on.
function skipReason(item, live) {
  if (!live.html_url.startsWith(`https://github.com/${REPO}/`)) return `moved to ${live.html_url}`;
  if (live.state === 'closed') return 'already closed';
  if (!args['include-updated'] && !touched(item.number) && live.updated_at > item.updated_at) {
    return `activity since snapshot (${live.updated_at})`;
  }
  return null;
}

// The v8 repo must be set up (README step 1) before anything points people at it. Comments link its
// security policy, the policy here must send v8 there, and moving anything needs push access.
async function assertReady(v8Repo) {
  const problems = [];
  if (!(await exists(`repos/${V8_REPO}/contents/SECURITY.md`))) problems.push(`${V8_REPO} has no SECURITY.md`);

  if (buckets.some((b) => b !== 'migrate')) {
    const policy = await api('GET', `repos/${REPO}/contents/SECURITY.md`);
    if (!Buffer.from(policy.content, 'base64').toString('utf8').includes(V8_REPO)) {
      problems.push(`${REPO}'s SECURITY.md doesn't point Video.js 8 at ${V8_REPO} yet`);
    }
  }

  if (buckets.some((b) => b !== 'close') && !v8Repo.permissions?.push) problems.push(`no push access to ${V8_REPO}`);

  if (problems.length) throw new Error(`Not ready:\n- ${problems.join('\n- ')}`);
}

// --- Main ------------------------------------------------------------------

const triage = JSON.parse(readFileSync(join(dir, 'triage.json'), 'utf8'));
const snapshotNumbers = new Set(JSON.parse(readFileSync(join(dir, 'snapshot.json'), 'utf8')).map((i) => i.number));

const strays = triage.filter((item) => !snapshotNumbers.has(item.number));
if (strays.length) throw new Error(`triage.json has numbers outside the snapshot: ${strays.map((i) => i.number).join(', ')}`);

const queue = triage.filter(
  (item) =>
    buckets.includes(item.bucket) &&
    (!numbers || numbers.has(item.number)) &&
    !isDone(item.number, FINAL_STEP[item.bucket])
);

const counts = {};
for (const item of queue) {
  const key = `${item.kind} ${item.bucket}${item.variant ? `/${item.variant}` : ''}`;
  counts[key] = (counts[key] ?? 0) + 1;
}
console.log(`${execute ? 'EXECUTE' : 'DRY RUN'} — ${REPO}`);
console.table(counts);

if (!execute) {
  const shown = new Set();
  for (const item of queue) {
    const key = `${item.kind} ${item.bucket}${item.variant ? `/${item.variant}` : ''}`;
    if (shown.has(key) || item.bucket === 'migrate') continue;
    shown.add(key);

    if (item.bucket === 'close') console.log(`\n--- ${key} comment (e.g. #${item.number}) ---\n${closeComment(item)}`);
    if (item.bucket === 'move-pr') {
      console.log(`\n--- move-pr: comment on the original (e.g. #${item.number}) ---\n${movedComment(item, `${V8_URL}/pull/<new>`)}`);
      console.log(`\n--- move-pr: new PR body in ${V8_REPO}, branch ${movedBranch(item)} ---\n${movedBody(item, '<original description>')}`);
    }
  }
  if (buckets.includes('migrate')) console.log(`\n--- migrate: transfer to ${V8_REPO}, no comment ---`);
}

let v8Repo;
if (execute) {
  v8Repo = await api('GET', `repos/${V8_REPO}`);
  await assertReady(v8Repo);

  if (buckets.some((b) => b !== 'migrate') && !(await exists(`repos/${REPO}/labels/${encodeURIComponent(LABEL.name)}`))) {
    await api('POST', `repos/${REPO}/labels`, LABEL);
    console.log(`created label "${LABEL.name}"`);
  }
}

const skipped = [];
const failed = [];
let acted = 0;

for (const item of queue) {
  if (acted >= limit) break;

  if (!execute && !args.check) {
    console.log(`#${item.number} [${item.kind}] ${item.bucket}${item.variant ? `/${item.variant}` : ''}${item.reason ? ` — ${item.reason}` : ''}`);
    continue;
  }

  const live = await api('GET', `repos/${REPO}/${item.kind === 'pr' ? 'pulls' : 'issues'}/${item.number}`);
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
    if (item.bucket === 'migrate') {
      await transferIssue(item, live, v8Repo);
      console.log(`#${item.number} transferred to ${done.get(`${item.number}:transfer`).url}`);
    } else if (item.bucket === 'move-pr') {
      await movePullRequest(item, live, v8Repo);
      console.log(`#${item.number} moved to ${done.get(`${item.number}:pr`).url}`);
    } else {
      await commentAndClose(item, live, closeComment(item));
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
