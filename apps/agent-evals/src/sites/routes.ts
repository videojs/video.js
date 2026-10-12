import { spawnSync } from 'node:child_process';

import type { SiteRoutes } from './forwarder.ts';

/** Netlify deploy previews for a pull request: the docs site and the shadcn registry behind shadcn.videojs.org. */
export function previewOrigins(pullRequest: number): { site: string; registry: string } {
  return {
    site: `https://deploy-preview-${pullRequest}--vjs10-site.netlify.app`,
    registry: `https://deploy-preview-${pullRequest}--vjs-registry.netlify.app`,
  };
}

/** A path each origin must serve, so a missing or skipped deploy never answers for the real site. */
const PROBES = { site: '/llms.txt', registry: '/r/react/video.json' };

export interface RouteOptions {
  /** Explicit docs-site origin, such as a deploy permalink. Must respond. */
  site?: string | undefined;
  /** Explicit registry origin. Must respond. */
  registry?: string | undefined;
  /** Pull request whose deploy previews fill in origins not given explicitly, when they are deployed. */
  preview?: number | undefined;
}

export interface ResolvedRoutes {
  routes: SiteRoutes;
  /** Why a host stayed on production, for the run log. */
  notes: string[];
}

export async function resolveSiteRoutes(options: RouteOptions, probe = respondsOk): Promise<ResolvedRoutes> {
  const previews = options.preview ? previewOrigins(options.preview) : null;
  const routes: SiteRoutes = {};
  const notes: string[] = [];

  for (const kind of ['site', 'registry'] as const) {
    const explicit = options[kind]?.replace(/\/$/, '');
    const origin = explicit ?? previews?.[kind];
    if (!origin) continue;

    if (!(await probe(`${origin}${PROBES[kind]}`))) {
      if (explicit) throw new Error(`${origin}${PROBES[kind]} did not respond.`);

      // Netlify skips the registry preview when a pull request leaves the skins alone; production is then accurate.
      notes.push(
        `No ${kind} deploy preview for #${options.preview}; ${kind === 'site' ? 'videojs.org' : 'shadcn.videojs.org'} stays on production.`
      );
      continue;
    }

    if (kind === 'site') {
      routes['videojs.org'] = origin;
      routes['www.videojs.org'] = origin;
    } else {
      routes['shadcn.videojs.org'] = origin;
    }
  }

  return { routes, notes };
}

/** The pull request number in a release commit's subject, such as `chore: release main (#2670)`. */
export function releasePullRequestFromSubject(subject: string): number | null {
  const match = /^chore: release\b.*\(#(\d+)\)$/.exec(subject.trim());

  return match ? Number(match[1]) : null;
}

/**
 * The pull request that released a version. Its deploy previews are the docs site and registry as they stood at that
 * release: the production sites deploy every merge to main, so they describe the newest release only. Reads the release
 * tag from the checkout, or from GitHub when the checkout has no tags.
 */
export async function releasePullRequest(version: string, repoRoot: string): Promise<number | null> {
  const tag = `@videojs/react@${version}`;
  const local = spawnSync('git', ['log', '-1', '--format=%s', `refs/tags/${tag}`], { cwd: repoRoot, encoding: 'utf8' });
  if (local.status === 0) return releasePullRequestFromSubject(local.stdout);

  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  const response = await fetch(`https://api.github.com/repos/videojs/v10/commits/${encodeURIComponent(tag)}`, {
    headers: { accept: 'application/vnd.github+json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!response?.ok) return null;

  const { commit } = (await response.json()) as { commit: { message: string } };

  return releasePullRequestFromSubject(commit.message.split('\n')[0] ?? '');
}

async function respondsOk(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(15_000) });

    return response.ok;
  } catch {
    return false;
  }
}
