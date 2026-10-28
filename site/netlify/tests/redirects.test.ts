// @vitest-environment node
import { readFileSync } from 'node:fs';

import { parse } from 'smol-toml';
import { describe, expect, it } from 'vite-plus/test';

import { ALIAS_HOSTS } from '../../src/utils/redirect-origin';

interface Redirect {
  from: string;
  to: string;
  status?: number;
  force?: boolean;
}

const { redirects } = parse(readFileSync(new URL('../../netlify.toml', import.meta.url), 'utf-8')) as unknown as {
  redirects: Redirect[];
};

const LEGACY_ORIGIN = 'https://legacy.videojs.org';
const PERMANENT = new Set([301, 308]);

/** Whether a literal path would match a rule's `from`, for the plain and trailing-splat forms Netlify matches. */
function matchesFrom(from: string, path: string): boolean {
  if (from.includes(':')) return false;

  if (from.endsWith('/*')) {
    const prefix = from.slice(0, -2);

    return path === prefix || path.startsWith(`${prefix}/`);
  }

  return from.replace(/\/$/, '') === path.replace(/\/$/, '');
}

describe('netlify.toml redirects', () => {
  it('lands legacy redirects on the URL legacy.videojs.org serves, with its trailing slash', () => {
    const legacy = redirects.filter((rule) => rule.to.startsWith(LEGACY_ORIGIN));
    const missingSlash = legacy.filter((rule) => !rule.to.endsWith('/')).map((rule) => rule.from);

    expect(legacy.length).toBeGreaterThan(0);
    expect(missingSlash).toEqual([]);
  });

  it('sends permanent redirects to their destination in one hop', () => {
    const chained = redirects
      .filter((rule) => PERMANENT.has(rule.status ?? 301) && rule.to.startsWith('/') && !rule.to.includes(':'))
      .flatMap((rule) => {
        const next = redirects.find(
          (other) => other !== rule && other.status !== 200 && other.status !== 404 && matchesFrom(other.from, rule.to)
        );

        return next ? [`${rule.from} -> ${rule.to} -> ${next.to}`] : [];
      });

    expect(chained).toEqual([]);
  });

  it('keeps the edge functions in step with the alias hosts', () => {
    const aliasHosts = redirects
      .filter((rule) => rule.from.startsWith('https://') && rule.to === 'https://videojs.org/:splat')
      .map((rule) => new URL(rule.from.replace(/\*$/, '')).hostname);

    expect(new Set(aliasHosts)).toEqual(ALIAS_HOSTS);
  });
});
