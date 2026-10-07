// Sorts the frozen v8 backlog into buckets. categories.json supplies each item's category (a
// one-time model pass over issues; PRs by hand), maintainer `enhancement`/`bug` labels beat it for
// issues, and overrides.json always wins.
//
//   node .agents/plans/v8-issue-triage/classify.mjs
//
// Buckets:
//   close      close here with a comment; `variant` picks the wording:
//                feature  issue or PR asking for something new
//                stale    no human activity since STALE_BEFORE
//                message  manual close; the override's `message` explains why
//   migrate    issue transferred to videojs/videojs-v8 as is, without a comment
//   move-pr    fix PR recreated in videojs/videojs-v8 with the author's commits; the original is
//              closed with a comment pointing at the copy
//   merge-here easy PR that passed review; retargeted to 8.x and squash-merged in place by hand
//              (squash merges credit the PR author), so execute.mjs leaves it alone
//   keep-v10   still relevant to Video.js 10; stays open here
//
// Flags are review hints, not decisions:
//   security   security keyword in the title       security?  security keyword in the body
//   check      closing a feature, model not sure   v10?       closing, and has a v10-relevant label
//   refit      would have closed as a feature, but the wording doesn't fit (feature-check.json)
//   manual     decided in overrides.json

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const read = (file) => JSON.parse(readFileSync(join(dir, file), 'utf8'));

const snapshot = read('snapshot.json');
const categories = read('categories.json');
const overrides = existsSync(join(dir, 'overrides.json')) ? read('overrides.json') : {};
// A second model pass that read each would-be feature close against the feature-request comment.
const featureCheck = Object.fromEntries(read('feature-check.json').map((entry) => [entry.number, entry]));

// Three years before the plan date (decided 2026-10-07): no human comment, review, or commit since.
const STALE_BEFORE = '2023-10-07T00:00:00Z';
const PR_CLOSE_CATEGORIES = new Set(['feature']);

const BUCKETS = new Set(['close', 'migrate', 'move-pr', 'merge-here', 'keep-v10']);
const SECURITY =
  /\b(security|vulnerab\w*|CVE-\d+|XSS|cross[- ]site|CSP|content[- ]security|sanitiz\w*|inject\w*|prototype pollution|ReDoS|supply[- ]chain|dependency confusion|subresource integrity|SRI|npm audit|malicious|exploit\w*)\b/i;
const V10_LABELS = new Set(['a11y', 'screen reader', 'enhancement', 'planned', 'i18n', 'perf']);

for (const [number, override] of Object.entries(overrides)) {
  if (!BUCKETS.has(override.bucket)) throw new Error(`overrides.json #${number}: unknown bucket "${override.bucket}"`);
  if (override.message && override.bucket !== 'close') throw new Error(`overrides.json #${number}: only close takes a message`);
}

function classify(item) {
  const security = SECURITY.test(item.title) ? 'security' : SECURITY.test(item.body) ? 'security?' : '';
  const stale = item.last_activity < STALE_BEFORE;

  const category = categories[item.number];
  if (!category) throw new Error(`#${item.number} has no entry in categories.json`);

  if (item.kind === 'pr') {
    if (PR_CLOSE_CATEGORIES.has(category.category)) return { category, bucket: 'close', variant: 'feature', flags: [security], reason: category.reason };
    if (stale) return { category, bucket: 'close', variant: 'stale', flags: [security], reason: category.reason };
    return { category, bucket: 'move-pr', flags: [security], reason: category.reason };
  }

  if (security === 'security') return { category, bucket: 'migrate', flags: [security], reason: 'security keyword in title' };

  // Maintainer labels beat the model: `enhancement` closes, `bug` migrates.
  const labeledFeature = item.labels.includes('enhancement');
  const labeledBug = item.labels.includes('bug');
  const isFeature = labeledFeature || (category.category === 'feature' && !labeledBug);

  // The feature-request comment has to read naturally on the item; otherwise use the normal path.
  const check = featureCheck[item.number];
  const featureFits = !check || check.verdict === 'fits';

  if (isFeature && featureFits) {
    // Closing a feature request is the costly mistake, so these rows get review flags.
    const v10Labels = item.labels.filter((label) => V10_LABELS.has(label));
    const confident = category.category === 'feature' && category.confidence === 'high';
    const reason = category.category === 'feature' ? category.reason : `labeled enhancement; model says ${category.category}: ${category.reason}`;
    return { category, bucket: 'close', variant: 'feature', flags: [security, confident ? '' : 'check', v10Labels.length ? 'v10?' : ''], reason };
  }

  const reason = !featureFits
    ? `feature wording doesn't fit (${check.verdict}: ${check.why})`
    : category.category === 'feature'
      ? `labeled bug; model says feature: ${category.reason}`
      : category.reason;
  const flags = [security, featureFits ? '' : 'refit'];
  if (stale && !security) return { category, bucket: 'close', variant: 'stale', flags, reason };
  return { category, bucket: 'migrate', flags, reason };
}

const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const header = ['number', 'kind', 'bucket', 'variant', 'category', 'confidence', 'flag', 'reason', 'title', 'labels', 'created', 'last_activity', 'comments', 'reactions', 'url'];

const decisions = [];
const rows = snapshot.map((item) => {
  const manual = overrides[item.number];
  const auto = manual ? { category: categories[item.number] } : classify(item);
  const result = manual
    ? { ...auto, ...manual, variant: manual.bucket === 'close' ? (manual.message ? 'message' : (manual.variant ?? 'feature')) : undefined, flags: ['manual'] }
    : auto;

  decisions.push({
    number: item.number,
    kind: item.kind,
    bucket: result.bucket,
    ...(result.variant ? { variant: result.variant } : {}),
    reason: result.reason,
    ...(result.message ? { message: result.message } : {}),
    author: item.author,
    created_at: item.created_at,
    last_activity: item.last_activity,
    updated_at: item.updated_at,
  });

  return [
    item.number,
    item.kind,
    result.bucket,
    result.variant,
    auto.category?.category,
    auto.category?.confidence,
    result.flags.filter(Boolean).join(' '),
    result.reason,
    item.title,
    item.labels.join('; '),
    item.created_at.slice(0, 10),
    item.last_activity.slice(0, 10),
    item.comments,
    item.reactions,
    `https://github.com/videojs/video.js/${item.kind === 'pr' ? 'pull' : 'issues'}/${item.number}`,
  ];
});

writeFileSync(join(dir, 'triage.csv'), [header, ...rows].map((r) => r.map(csv).join(',')).join('\n') + '\n');
writeFileSync(join(dir, 'triage.json'), JSON.stringify(decisions, null, 2) + '\n');

const tally = {};
for (const row of rows) {
  const key = `${row[1]} ${row[2]}${row[3] ? `/${row[3]}` : ''}`;
  tally[key] = (tally[key] ?? 0) + 1;
}
console.table(tally);
