// First-pass triage of the frozen v8 backlog. Heuristics only flag candidates;
// manual decisions live in overrides.json and always win.
//
//   node .agents/plans/v8-issue-triage/classify.mjs
//
// Buckets:
//   keep-v8       security issue -> keep open, label `security` + `8.x` (fixed on the 8.x branch)
//   keep-v10      still relevant to v10 -> keep open
//   close         close as not planned with the v8 template
//   close-pr      PR: close with the v8 template

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const snapshot = JSON.parse(readFileSync(join(dir, 'snapshot.json'), 'utf8'));
const overridesPath = join(dir, 'overrides.json');
const overrides = existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, 'utf8')) : {};

const SECURITY =
  /\b(security|vulnerab\w*|CVE-\d+|XSS|cross[- ]site|CSP|content[- ]security|sanitiz\w*|inject\w*|prototype pollution|ReDoS|supply[- ]chain|dependency confusion|subresource integrity|SRI|npm audit|malicious|exploit\w*)\b/i;
const V10_LABELS = new Set(['a11y', 'screen reader', 'enhancement', 'planned', 'i18n', 'perf']);

function classify(item) {
  const text = `${item.title}\n${item.body}`;
  const titleSecurity = SECURITY.test(item.title);
  const bodySecurity = SECURITY.test(item.body);
  const v10Labels = item.labels.filter((l) => V10_LABELS.has(l));

  if (item.kind === 'pr') {
    return {
      bucket: 'close-pr',
      flag: titleSecurity || bodySecurity ? 'security?' : '',
      reason: titleSecurity ? 'security keyword in title' : bodySecurity ? 'security keyword in body' : '',
    };
  }

  if (titleSecurity) return { bucket: 'keep-v8', flag: 'review', reason: 'security keyword in title' };
  if (bodySecurity) return { bucket: 'close', flag: 'security?', reason: `security keyword in body: ${text.match(SECURITY)[0]}` };
  if (v10Labels.length) return { bucket: 'close', flag: 'v10?', reason: `labels: ${v10Labels.join(', ')}` };
  if (item.labels.includes('pinned')) return { bucket: 'close', flag: 'v10?', reason: 'pinned' };

  return { bucket: 'close', flag: '', reason: '' };
}

const csv = (value) => `"${String(value).replaceAll('"', '""')}"`;
const header = ['number', 'kind', 'bucket', 'flag', 'reason', 'title', 'labels', 'created', 'updated', 'comments', 'reactions', 'url'];

const decisions = [];
const rows = snapshot.map((item) => {
  const auto = classify(item);
  const manual = overrides[item.number];
  const result = manual ? { bucket: manual.bucket, flag: 'manual', reason: manual.reason } : auto;

  decisions.push({ number: item.number, kind: item.kind, bucket: result.bucket, reason: result.reason, updated_at: item.updated_at });

  return [
    item.number,
    item.kind,
    result.bucket,
    result.flag,
    result.reason,
    item.title,
    item.labels.join('; '),
    item.created_at.slice(0, 10),
    item.updated_at.slice(0, 10),
    item.comments,
    item.reactions,
    `https://github.com/videojs/video.js/${item.kind === 'pr' ? 'pull' : 'issues'}/${item.number}`,
  ];
});

writeFileSync(join(dir, 'triage.csv'), [header, ...rows].map((r) => r.map(csv).join(',')).join('\n') + '\n');
writeFileSync(join(dir, 'triage.json'), JSON.stringify(decisions, null, 2) + '\n');

const tally = {};
for (const r of rows) {
  const key = `${r[2]}${r[3] ? ` (${r[3]})` : ''}`;
  tally[key] = (tally[key] ?? 0) + 1;
}
console.table(tally);
