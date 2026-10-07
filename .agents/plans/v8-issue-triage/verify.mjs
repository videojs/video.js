// Renders every comment and PR body execute.mjs would post, and checks that each fits its item and
// that nothing item-specific leaked into a shared template. Read-only; --links also requests every
// distinct URL. Writes messages-rendered.md: one copy of each template, to compare with Notion.
//
//   node .agents/plans/v8-issue-triage/verify.mjs
//   node .agents/plans/v8-issue-triage/verify.mjs --links

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { REPO, V8_REPO, closeComment, movedBody, movedComment } from './messages.mjs';

const dir = dirname(fileURLToPath(import.meta.url));
const read = (file) => JSON.parse(readFileSync(join(dir, file), 'utf8'));

const triage = read('triage.json');
const snapshot = Object.fromEntries(read('snapshot.json').map((item) => [item.number, item]));
const categories = read('categories.json');
const featureCheck = Object.fromEntries(read('feature-check.json').map((entry) => [entry.number, entry]));
const classifySource = readFileSync(join(dir, 'classify.mjs'), 'utf8');
const STALE_BEFORE = classifySource.match(/STALE_BEFORE = '([^']+)'/)[1];

const NEW_PR = 'https://github.com/videojs/videojs-v8/pull/NEW';
const ALLOWED_URL = [
  /^https:\/\/github\.com\/videojs\/video\.js\/(issues\/new\/choose|discussions\/new(\/choose|\?category=ideas)|compare)$/,
  /^https:\/\/github\.com\/videojs\/videojs-v8(\/fork|\/security\/policy|\/security\/advisories\/new|\/pull\/NEW)?$/,
  /^https:\/\/videojs\.org\/docs\/framework\/(html|react)\/guides\/migrate-from-video-js-8\?utm_source=videojs-v8(#ai-quickstart)?$/,
];

const monthYear = (iso) => new Date(iso).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const problems = [];
const fail = (item, message) => problems.push(`#${item.number} [${item.kind} ${item.bucket}${item.variant ? `/${item.variant}` : ''}] ${message}`);

const rendered = [];
for (const item of triage) {
  if (item.bucket === 'close') rendered.push({ item, kind: `${item.kind} close/${item.variant}`, text: closeComment(item) });
  if (item.bucket === 'move-pr') {
    rendered.push({ item, kind: 'pr move-pr: original', text: movedComment(item, NEW_PR) });
    rendered.push({ item, kind: 'pr move-pr: new copy', text: movedBody(item, snapshot[item.number].body) });
  }
}

const messages = triage.filter((item) => item.message);
const templates = new Map();

for (const { item, kind, text } of rendered) {
  // Shared template: strip the parts that are supposed to vary, and every group must collapse to one.
  let template = text.replaceAll(NEW_PR, '<new PR>');
  if (item.variant === 'stale') template = template.replace(monthYear(item.last_activity), '<month year>');
  if (item.message) template = template.replace(item.message, '<item line>');
  if (kind.endsWith('new copy')) template = template.split('\n\n---\n\n')[0].replace(`#${item.number},`, '#<n>,').replace(`@${item.author} on `, '@<author> on ').replace(/on [A-Z][a-z]+ \d{1,2}, \d{4}\./, 'on <date>.');
  if (!templates.has(kind)) templates.set(kind, new Map());
  templates.get(kind).set(template, (templates.get(kind).get(template) ?? 0) + 1);

  // Nothing unfilled or broken.
  if (/\b(undefined|null|NaN|Invalid Date)\b|\$\{|<[a-z]/.test(kind.endsWith('new copy') ? text.split('\n\n---\n\n')[0] : text)) fail(item, 'unfilled or broken text');
  for (const [, url] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (!ALLOWED_URL.some((pattern) => pattern.test(url)) && !kind.endsWith('new copy')) fail(item, `unexpected link ${url}`);
  }

  // Wording matches the item.
  const isIssue = item.kind === 'issue';
  if (!kind.endsWith('new copy')) {
    if (isIssue !== text.startsWith('Thanks for opening this')) fail(item, 'issue/PR opener mismatch');
    if (isIssue !== text.includes('private vulnerability reporting')) fail(item, 'security line on the wrong kind');
    if (!isIssue && /\bthis issue\b/i.test(text)) fail(item, 'PR comment says "this issue"');
    if (isIssue && /\bthis pull request\b/i.test(text)) fail(item, 'issue comment says "this pull request"');
    if (/feature requests?/.test(text) !== (isIssue && item.variant === 'feature')) fail(item, 'feature-request wording on a non-feature close');
  }
  if (item.variant === 'stale') {
    if (!(item.last_activity < STALE_BEFORE)) fail(item, `stale wording but last activity ${item.last_activity}`);
    if (!text.includes(`since ${monthYear(item.last_activity)}`)) fail(item, 'stale month missing');
  }
  if (item.variant === 'feature' && isIssue && featureCheck[item.number] && featureCheck[item.number].verdict !== 'fits') fail(item, 'feature wording on a misfit');
  if (item.variant === 'feature' && !isIssue && categories[item.number]?.category !== 'feature') fail(item, 'feature wording on a non-feature PR');
  if (kind.endsWith('new copy')) {
    const description = text.split('\n\n---\n\n').slice(1).join('\n\n---\n\n');
    if (/(^|[\s([])#\d+\b/.test(description)) fail(item, 'bare #123 reference left in the moved description');
    if (!text.includes(`@${item.author}`)) fail(item, 'author credit missing');
  }
}

// Each item's own line appears on that item only, matched by 5-word fragments (case-insensitive) so a
// paraphrased leak still shows. Fragments shared by several item lines are format, not content.
const words = (text) => text.toLowerCase().replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').match(/[a-z0-9`'’.-]+/g) ?? [];
const fragments = (text) => {
  const list = words(text);
  return new Set(list.slice(0, Math.max(0, list.length - 4)).map((_, i) => list.slice(i, i + 5).join(' ')));
};
const fragmentOwners = new Map();
for (const owner of messages) for (const fragment of fragments(owner.message)) fragmentOwners.set(fragment, [...(fragmentOwners.get(fragment) ?? []), owner.number]);
for (const { item, text } of rendered) {
  const own = fragments(text);
  for (const [fragment, owners] of fragmentOwners) {
    if (owners.length === 1 && owners[0] !== item.number && own.has(fragment)) {
      fail(item, `contains #${owners[0]}'s line ("${fragment}")`);
      break;
    }
  }
}

for (const [kind, variants] of templates) {
  if (kind.endsWith('/message')) continue;
  if (variants.size !== 1) problems.push(`${kind}: ${variants.size} different templates (expected 1)`);
}

if (process.argv.includes('--links')) {
  const urls = new Set();
  for (const { kind, text } of rendered) if (!kind.endsWith('new copy')) for (const [, url] of text.matchAll(/\]\(([^)\s]+)\)/g)) urls.add(url);
  for (const url of urls) {
    const response = await fetch(url, { redirect: 'manual' });
    const ok = response.status === 200 || (response.status === 302 && /\/login/.test(response.headers.get('location') ?? ''));
    console.log(`${ok ? 'ok ' : 'BAD'} ${response.status} ${url}`);
    if (!ok) problems.push(`link ${url} returned ${response.status}`);
  }
}

const doc = [`# Rendered templates (${new Date().toISOString().slice(0, 10)})`, '', `Generated by verify.mjs from messages.mjs and triage.json. ${REPO} → ${V8_REPO}.`];
for (const [kind, variants] of templates) {
  for (const [template, count] of variants) doc.push('', `## ${kind} (${count})`, '', template.split('\n').map((line) => `> ${line}`).join('\n'));
}
writeFileSync(join(dir, 'messages-rendered.md'), doc.join('\n') + '\n');

const counts = {};
for (const { kind } of rendered) counts[kind] = (counts[kind] ?? 0) + 1;
console.table(counts);
console.log(problems.length ? `\n${problems.length} problem(s):\n- ${problems.join('\n- ')}` : '\nAll rendered comments passed.');
process.exitCode = problems.length ? 1 : 0;
