// Freezes the v8 backlog: every open issue and PR at or below MAX_NUMBER, the last item opened
// before the v10 cutover. Read-only. Run once; after that the snapshot stays fixed so execute.mjs
// can skip items with activity since it was taken.
//
//   node .agents/plans/v8-issue-triage/snapshot.mjs           # refuses to overwrite
//   node .agents/plans/v8-issue-triage/snapshot.mjs --force   # rebuild (resets the activity baseline)
//
// `last_activity` is the latest human comment, review, or commit. `updated_at` can't stand in for
// it: stalebot label passes touched over 100 items on 2018-07-02 and 2022-04-28 alone.

import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'videojs/video.js';
const MAX_NUMBER = 9247;

const path = join(dirname(fileURLToPath(import.meta.url)), 'snapshot.json');
if (existsSync(path) && !process.argv.includes('--force')) {
  throw new Error('snapshot.json exists; pass --force to rebuild it');
}

const gh = (argv) => execFileSync('gh', argv, { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });

const jq = `.[] | select(.number <= ${MAX_NUMBER}) | {
  number,
  kind: (if .pull_request then "pr" else "issue" end),
  title,
  body: (.body // ""),
  author: .user.login,
  labels: [.labels[].name],
  created_at,
  updated_at,
  comments,
  reactions: .reactions.total_count
}`;
const items = gh(['api', '--paginate', `repos/${REPO}/issues?state=open&per_page=100`, '--jq', jq])
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .sort((a, b) => a.number - b.number);

const isBot = (actor) => !actor || actor.__typename === 'Bot' || /\[bot\]$|-bot$|^stale/i.test(actor.login);
const activity = `comments(last: 20) { nodes { createdAt author { login __typename } } }`;
const fragment = (n) => `n${n}: issueOrPullRequest(number: ${n}) {
  ... on Issue { createdAt ${activity} }
  ... on PullRequest {
    createdAt ${activity}
    commits(last: 1) { nodes { commit { committedDate pushedDate } } }
    reviews(last: 5) { nodes { submittedAt author { login __typename } } }
  }
}`;

for (let i = 0; i < items.length; i += 40) {
  const batch = items.slice(i, i + 40);
  const [owner, name] = REPO.split('/');
  const query = `{ repository(owner: "${owner}", name: "${name}") { ${batch.map((item) => fragment(item.number)).join('\n')} } }`;
  const { repository } = JSON.parse(gh(['api', 'graphql', '-f', `query=${query}`])).data;

  for (const item of batch) {
    const node = repository[`n${item.number}`];
    const dates = [
      node.createdAt,
      ...node.comments.nodes.filter((c) => !isBot(c.author)).map((c) => c.createdAt),
      ...(node.commits?.nodes ?? []).map((c) => c.commit.pushedDate ?? c.commit.committedDate),
      ...(node.reviews?.nodes ?? []).filter((r) => !isBot(r.author)).map((r) => r.submittedAt),
    ];
    item.last_activity = dates.filter(Boolean).sort().at(-1);
  }
}

writeFileSync(path, JSON.stringify(items, null, 2) + '\n');
console.log(`snapshot.json: ${items.length} open items at or below #${MAX_NUMBER}`);
