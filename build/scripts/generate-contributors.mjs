/**
 * Writes CONTRIBUTORS.md from every commit author and `Co-authored-by` trailer on the default branch, which carries the
 * full history from the first Video.js commit in 2010 through Video.js 10. Run via `pnpm contributors`; requires an
 * authenticated `gh`.
 *
 * GitHub resolves commit emails to accounts. Unlinked authors merge into an account that used the same email, whose
 * login matches their commit name, or that uniquely used the same full name; otherwise they are listed by name. Bots
 * and AI coding agents are excluded.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const repository = process.env.GITHUB_REPOSITORY || 'videojs/video.js';
const [owner, name] = repository.split('/');

/** Steve Heffernan created Video.js. The repository's first commit is only a README stub, so pin him first. */
const CREATOR_LOGIN = 'heff';
const EXCLUDED_LOGINS = new Set(['claude', 'copilot', 'cursoragent']);
const EXCLUDED_EMAILS = new Set(['cursoragent@cursor.com', 'noreply@anthropic.com', 'support@greenkeeper.io']);

const HISTORY_QUERY = `query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef {
      target {
        ... on Commit {
          history(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              authoredDate
              authors(first: 50) { nodes { name email user { login name } } }
            }
          }
        }
      }
    }
  }
}`;

function fetchAuthors() {
  const authors = [];
  let cursor;

  do {
    const args = ['api', 'graphql', '-f', `query=${HISTORY_QUERY}`, '-f', `owner=${owner}`, '-f', `name=${name}`];

    if (cursor) args.push('-f', `cursor=${cursor}`);

    const response = JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
    const history = response.data.repository.defaultBranchRef.target.history;

    for (const commit of history.nodes) {
      for (const author of commit.authors.nodes) {
        authors.push({
          date: commit.authoredDate,
          name: decodeEntities(author.name ?? '').trim(),
          email: (author.email ?? '').trim().toLowerCase(),
          login: author.user?.login ?? null,
          profileName: decodeEntities(author.user?.name ?? '').trim(),
        });
      }
    }

    cursor = history.pageInfo.hasNextPage ? history.pageInfo.endCursor : undefined;
  } while (cursor);

  return authors;
}

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function isExcluded({ name, email, login }) {
  if (/\[bot\]/i.test(`${login ?? ''} ${name} ${email}`)) return true;

  if (login && EXCLUDED_LOGINS.has(login.toLowerCase())) return true;

  return EXCLUDED_EMAILS.has(email);
}

/** Only full names are trusted to identify a person; single words like "alex" are too ambiguous. */
function fullNameKey(text) {
  const key = text.toLowerCase().replace(/\s+/g, ' ').trim();

  return key.includes(' ') ? key : undefined;
}

function collectContributors(authors) {
  const included = authors.filter((author) => !isExcluded(author));
  const loginByEmail = new Map();
  const loginByLowercase = new Map();
  const loginsByName = new Map();

  for (const { login, email, name, profileName } of included) {
    if (!login) continue;

    if (email) loginByEmail.set(email, login);

    loginByLowercase.set(login.toLowerCase(), login);

    for (const key of [fullNameKey(name), fullNameKey(profileName)]) {
      if (!key) continue;

      const logins = loginsByName.get(key) ?? new Set();

      logins.add(login);
      loginsByName.set(key, logins);
    }
  }

  const loginByIdentity = (author) => {
    const nameKey = fullNameKey(author.name);
    const namedLogins = nameKey ? loginsByName.get(nameKey) : undefined;

    return (
      loginByLowercase.get(author.name.toLowerCase()) ?? (namedLogins?.size === 1 ? [...namedLogins][0] : undefined)
    );
  };

  // An email matched to an account by name also claims that email's other commits, which may use a different name.
  for (const author of included) {
    if (author.login || !author.email || loginByEmail.has(author.email)) continue;

    const login = loginByIdentity(author);

    if (login) loginByEmail.set(author.email, login);
  }

  const contributors = new Map();
  const unlinkedKeyByEmail = new Map();

  for (const author of included) {
    const nameKey = fullNameKey(author.name);
    const login = author.login ?? loginByEmail.get(author.email) ?? loginByIdentity(author);

    let key = login && `login:${login.toLowerCase()}`;

    if (!key) {
      key = unlinkedKeyByEmail.get(author.email) ?? (nameKey ? `name:${nameKey}` : `email:${author.email}`);
      unlinkedKeyByEmail.set(author.email, key);
    }

    const contributor = contributors.get(key) ?? { login, profileName: '', names: new Map(), first: author.date };

    if (author.profileName) contributor.profileName = author.profileName;

    if (author.name) contributor.names.set(author.name, (contributor.names.get(author.name) ?? 0) + 1);

    if (author.date < contributor.first) contributor.first = author.date;

    contributors.set(key, contributor);
  }

  return [...contributors.values()]
    .map((contributor) => ({
      login: contributor.login,
      first: contributor.first,
      name: contributor.profileName || mostUsed(contributor.names) || contributor.login,
    }))
    .sort(
      (a, b) =>
        Number(b.login === CREATOR_LOGIN) - Number(a.login === CREATOR_LOGIN) ||
        a.first.localeCompare(b.first) ||
        a.name.localeCompare(b.name)
    );
}

function mostUsed(names) {
  return [...names].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function escapeMarkdown(text) {
  return text.replace(/[\\`*_[\]<>#|]/g, '\\$&');
}

function render(contributors) {
  const lines = [
    '# Contributors',
    '',
    `Video.js exists because of the ${contributors.length} people who have contributed code to it since 2010, from the`,
    'first release through Video.js 10. Thank you.',
    '',
    'Listed in order of first contribution, after creator Steve Heffernan. Generated from commit authors and',
    '`Co-authored-by` trailers by `pnpm contributors`; bots and AI coding agents are excluded. Missing or',
    'misattributed? Open a pull request that updates `build/scripts/generate-contributors.mjs` or link the commit',
    'email to your GitHub account.',
  ];
  let year;

  for (const contributor of contributors) {
    const contributorYear = contributor.first.slice(0, 4);

    if (contributorYear !== year) {
      year = contributorYear;
      lines.push('', `## ${year}`, '');
    }

    const label = escapeMarkdown(contributor.name);

    lines.push(contributor.login ? `- [${label}](https://github.com/${contributor.login})` : `- ${label}`);
  }

  return `${lines.join('\n')}\n`;
}

const contributors = collectContributors(fetchAuthors());

writeFileSync(join(root, 'CONTRIBUTORS.md'), render(contributors));
console.log(`Wrote CONTRIBUTORS.md with ${contributors.length} contributors.`);
