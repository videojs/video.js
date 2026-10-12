import { describe, expect, it } from 'vitest';

import { previewOrigins, releasePullRequestFromSubject, resolveSiteRoutes } from '../routes.ts';

const site = 'https://deploy-preview-2948--vjs10-site.netlify.app';
const registry = 'https://deploy-preview-2948--vjs-registry.netlify.app';

describe('previewOrigins', () => {
  it('derives both Netlify deploy previews from a pull request number', () => {
    expect(previewOrigins(2948)).toEqual({ site, registry });
  });
});

describe('resolveSiteRoutes', () => {
  it('routes both hosts to deployed previews', async () => {
    const { routes, notes } = await resolveSiteRoutes({ preview: 2948 }, async () => true);

    expect(routes).toEqual({ 'videojs.org': site, 'www.videojs.org': site, 'shadcn.videojs.org': registry });
    expect(notes).toEqual([]);
  });

  it('keeps a host on production when its preview was not deployed', async () => {
    const { routes, notes } = await resolveSiteRoutes({ preview: 2948 }, async (url) => url.startsWith(site));

    expect(routes).toEqual({ 'videojs.org': site, 'www.videojs.org': site });
    expect(notes).toEqual(['No registry deploy preview for #2948; shadcn.videojs.org stays on production.']);
  });

  it('prefers explicit origins and requires them to respond', async () => {
    const permalink = 'https://abc123--vjs10-site.netlify.app/';
    const { routes } = await resolveSiteRoutes({ site: permalink, preview: 2948 }, async () => true);

    expect(routes['videojs.org']).toBe('https://abc123--vjs10-site.netlify.app');
    expect(routes['shadcn.videojs.org']).toBe(registry);
    await expect(resolveSiteRoutes({ site: permalink }, async () => false)).rejects.toThrow('did not respond');
  });

  it('routes nothing without origins', async () => {
    expect(await resolveSiteRoutes({}, async () => true)).toEqual({ routes: {}, notes: [] });
  });
});

describe('releasePullRequestFromSubject', () => {
  it('reads the pull request of a release commit', () => {
    expect(releasePullRequestFromSubject('chore: release main (#2670)\n')).toBe(2670);
  });

  it('ignores other commits', () => {
    expect(releasePullRequestFromSubject('docs(site): add changelog prose for 10.0.0-rc.3 (#2977)')).toBeNull();
  });
});
