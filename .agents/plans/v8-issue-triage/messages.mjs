// Comment and PR-body templates, shared by execute.mjs (posts them) and verify.mjs (checks every
// rendered comment). The final wording is Heff's, from the Notion review doc.

export const REPO = 'videojs/video.js';
export const V8_REPO = 'videojs/videojs-v8';

export const V8_URL = `https://github.com/${V8_REPO}`;
const POLICY_URL = `${V8_URL}/security/policy`;
const REPORT_URL = `${V8_URL}/security/advisories/new`;
const GUIDE_URL = (framework, anchor = '') =>
  `https://videojs.org/docs/framework/${framework}/guides/migrate-from-video-js-8?utm_source=videojs-v8${anchor}`;

// --- Messages --------------------------------------------------------------
// Final wording from the Notion review doc (Heff, 2026-10-07), copied verbatim. The only additions
// are links on "new issue", "discussion", "pull request", and repo mentions, pointing at v10
// (videojs/video.js) or v8 (videojs/videojs-v8) to match the sentence. Post exactly as written: no
// signature, footer, or attribution line of any kind.

const V10_ISSUE = `https://github.com/${REPO}/issues/new/choose`;
const V10_DISCUSSION = `https://github.com/${REPO}/discussions/new/choose`;
const V10_IDEA = `https://github.com/${REPO}/discussions/new?category=ideas`;
const V10_PR = `https://github.com/${REPO}/compare`;
const V8_LINK = `[${V8_REPO}](${V8_URL})`;
const POLICY = `(see its [security policy](${POLICY_URL}))`;

const ISSUE_INTRO =
  'Thanks for opening this and for building with Video.js. For the last year we’ve been hard at work re-building the player from the ground up for the modern web. It’s now available as v10 and we’d love for you to join us by upgrading.';
const ISSUE_V8 = `Video.js v8 will now live at ${V8_LINK} and continue to be maintained as best as we can with security fixes until October 1, 2028 ${POLICY}.`;
const PR_REPLACED = 'Video.js 10 is a complete redesign and ground-up rebuild of the player, and it’s replaced the Video.js 8 source on `main`.';
const PR_V8 = `${PR_REPLACED} Video.js 8 will now be maintained in ${V8_LINK} and get security fixes until October 1, 2028 ${POLICY}.`;
const PR_THANKS = 'Thank you for this pull request, and for the time you put into Video.js!';
const V10_ISSUE_OR_PR = `an [issue](${V10_ISSUE}) or a [pull request](${V10_PR}) against the current \`main\``;

const MIGRATION = [
  `**Moving to Video.js 10?** Use a migration guide: [HTML](${GUIDE_URL('html')}) · [React](${GUIDE_URL('react')}).`,
  `**Migrating with a coding agent?** Paste the prompt from the guide's AI Quickstart section into your agent: [HTML](${GUIDE_URL('html', '#ai-quickstart')}) · [React](${GUIDE_URL('react', '#ai-quickstart')}).`,
];
const REPORT = `If this is a security vulnerability, don't add details here. Report it privately through [private vulnerability reporting](${REPORT_URL}).`;

const monthYear = (iso) => new Date(iso).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const fullDate = (iso) => new Date(iso).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const paragraphs = (...blocks) => blocks.flat().join('\n\n').replace(/\n{3,}/g, '\n\n');

const ISSUE_CLOSE = {
  feature: () => [
    `${ISSUE_INTRO} If you still have this request for version 10, please open a [new issue](${V10_ISSUE}) or [discussion](${V10_IDEA}) and link back here.`,
    `Otherwise, Video.js v8 will continue to be maintained in ${V8_LINK} as best as we can and will get security fixes until October 1, 2028 ${POLICY}. It will no longer get new features, and we're closing v8 feature requests.`,
  ],
  stale: (item) => [
    ISSUE_INTRO,
    ISSUE_V8,
    `This issue hasn’t had activity since ${monthYear(item.last_activity)}, so we're closing it rather than moving it to ${V8_LINK}. If it still applies to Video.js 10, open a [new issue](${V10_ISSUE}) or [discussion](${V10_DISCUSSION}) and link back here so we keep the context.`,
  ],
  message: (item) => [ISSUE_INTRO, item.message, ISSUE_V8],
};

const PR_CLOSE = {
  feature: () => [
    'Thanks for this pull request, and for the time you put into Video.js!',
    `${PR_REPLACED} Video.js 8 is now maintained in ${V8_LINK} and will get security fixes until October 1, 2028 ${POLICY}. We won't be taking new features, and this pull request won't be merged.`,
    `If you'd still like this in Video.js 10, open ${V10_ISSUE_OR_PR} and link back here.`,
  ],
  stale: (item) => [
    PR_THANKS,
    PR_V8,
    `This pull request hasn’t had activity since ${monthYear(item.last_activity)}, so we're closing it rather than moving it to ${V8_LINK}. If the change still matters for Video.js 10, open ${V10_ISSUE_OR_PR} and link back here.`,
  ],
  // Not in the review doc: the stale PR wording with the item's own line in place of the stale one.
  message: (item) => [PR_THANKS, PR_V8, item.message],
};

export const closeComment = (item) =>
  item.kind === 'pr'
    ? paragraphs(PR_CLOSE[item.variant](item), MIGRATION)
    : paragraphs(ISSUE_CLOSE[item.variant](item), MIGRATION, REPORT);

export const movedComment = (item, url) =>
  paragraphs(
    PR_THANKS,
    PR_V8,
    `Pull requests can't be moved between repositories, so we've opened ${url} there with your commits, which keep you as their author. Follow the review there. To push changes, [fork ${V8_REPO}](${V8_URL}/fork) and open a pull request from your fork, and we'll close our copy in favor of yours.`,
    `If the change also applies to Video.js 10, please open ${V10_ISSUE_OR_PR}.`,
    MIGRATION
  );

// Bare #123 references would resolve against the v8 repo once the body lives there.
export const qualifyReferences = (text) => text.replace(/(^|[\s([])#(\d+)\b/g, `$1${REPO}#$2`);

export const movedBody = (item, body) =>
  paragraphs(
    `Moved from ${REPO}#${item.number}, opened by @${item.author} on ${fullDate(item.created_at)}. Pull requests can't be transferred between repositories, so this one carries the original commits with their authorship unchanged. The earlier discussion and reviews stay on the original.`,
    '---',
    qualifyReferences(body ?? '').trim() || '_No description._'
  );

export const movedBranch = (item) => `moved/video.js-${item.number}`;
