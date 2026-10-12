import { describe, expect, it } from 'vitest';

import { compareChangelogEntries, compareVersions, releaseCategories } from '../changelog';

describe('compareVersions', () => {
  it('ranks a release above its prereleases', () => {
    expect(compareVersions('10.0.0', '10.0.0-rc.5')).toBe(1);
    expect(compareVersions('10.0.0-rc.5', '10.0.0')).toBe(-1);
  });

  it('compares numeric prerelease parts numerically', () => {
    expect(compareVersions('10.0.0-rc.2', '10.0.0-rc.10')).toBe(-1);
  });

  it('orders prerelease channels', () => {
    expect(compareVersions('10.0.0-beta.40', '10.0.0-rc.1')).toBe(-1);
  });

  it('compares core versions before prereleases', () => {
    expect(compareVersions('10.0.1', '10.0.0')).toBe(1);
    expect(compareVersions('10.1.0-rc.1', '10.0.9')).toBe(1);
  });

  it('treats equal versions as equal', () => {
    expect(compareVersions('10.0.0', '10.0.0')).toBe(0);
  });
});

describe('compareChangelogEntries', () => {
  it('sorts newest date first, then the release above its prereleases on the same day', () => {
    const day = new Date('2026-10-01');
    const entries = [
      { date: new Date('2026-09-25'), version: '10.0.0-rc.4' },
      { date: day, version: '10.0.0-rc.5' },
      { date: day, version: '10.0.0' },
    ];

    expect(entries.sort(compareChangelogEntries).map((entry) => entry.version)).toEqual([
      '10.0.0',
      '10.0.0-rc.5',
      '10.0.0-rc.4',
    ]);
  });
});

describe('releaseCategories', () => {
  it('tags stability', () => {
    expect(releaseCategories({ prerelease: false, breaking: false })).toEqual(['Stable']);
    expect(releaseCategories({ prerelease: true, breaking: false })).toEqual(['Prerelease']);
  });

  it('tags breaking releases', () => {
    expect(releaseCategories({ prerelease: false, breaking: true })).toEqual(['Stable', 'Breaking changes']);
  });
});
