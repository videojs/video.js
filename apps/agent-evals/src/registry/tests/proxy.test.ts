import { describe, expect, it } from 'vitest';

import { compareVersions, pinToRelease, type PreviewPackage, withPreviewVersion, withProxyTarballs } from '../proxy.ts';

const preview: PreviewPackage = {
  name: '@videojs/react',
  version: '10.0.0',
  file: 'videojs-react-10.0.0.tgz',
  integrity: 'sha512-preview',
  shasum: 'abc',
  manifest: { name: '@videojs/react', version: '10.0.0', dependencies: { '@videojs/core': '10.0.0' } },
};
const now = Date.parse('2026-09-25T00:00:00.000Z');

describe('withPreviewVersion', () => {
  it('adds the build as latest, old enough for pnpm, and keeps published versions', () => {
    const packument = withPreviewVersion(
      {
        name: '@videojs/react',
        versions: { '10.0.0-rc.2': { version: '10.0.0-rc.2' } },
        'dist-tags': { latest: '10.0.0-rc.2', beta: '10.0.0-beta.1' },
        time: { '10.0.0-rc.2': '2026-09-09T23:10:18.000Z' },
      },
      preview,
      'http://127.0.0.1:4873/',
      now
    );

    expect(packument['dist-tags']).toEqual({ latest: '10.0.0', next: '10.0.0', beta: '10.0.0-beta.1' });
    expect(Object.keys(packument.versions as object)).toEqual(['10.0.0-rc.2', '10.0.0']);
    expect((packument.versions as Record<string, unknown>)['10.0.0']).toMatchObject({
      _id: '@videojs/react@10.0.0',
      dependencies: { '@videojs/core': '10.0.0' },
      dist: {
        tarball: 'http://127.0.0.1:4873/-/videojs-preview/videojs-react-10.0.0.tgz',
        integrity: 'sha512-preview',
        shasum: 'abc',
      },
    });
    expect((packument.time as Record<string, string>)['10.0.0']).toBe('2026-09-22T00:00:00.000Z');
  });

  it('replaces a published version the build reuses', () => {
    const packument = withPreviewVersion(
      { name: '@videojs/react', versions: { '10.0.0': { dist: { integrity: 'sha512-published' } } } },
      preview,
      'http://127.0.0.1:4873/',
      now
    );

    expect((packument.versions as Record<string, { dist: { integrity: string } }>)['10.0.0']!.dist.integrity).toBe(
      'sha512-preview'
    );
  });

  it('creates a packument for a package npm does not have yet', () => {
    const packument = withPreviewVersion(null, preview, 'http://127.0.0.1:4873/', now);

    expect(packument).toMatchObject({ name: '@videojs/react', 'dist-tags': { latest: '10.0.0' } });
  });
});

describe('compareVersions', () => {
  it('orders prereleases numerically and before their release', () => {
    const versions = ['10.0.0', '10.0.0-rc.10', '9.9.9', '10.0.0-rc.2', '10.0.0-beta.1', '10.0.1'];

    expect(versions.sort(compareVersions)).toEqual([
      '9.9.9',
      '10.0.0-beta.1',
      '10.0.0-rc.2',
      '10.0.0-rc.10',
      '10.0.0',
      '10.0.1',
    ]);
  });
});

describe('pinToRelease', () => {
  const packument = {
    name: '@videojs/react',
    versions: { '10.0.0-rc.1': {}, '10.0.0-rc.2': {}, '10.0.0-rc.3': {} },
    'dist-tags': { latest: '10.0.0-rc.3', next: '10.0.0-rc.3' },
    time: {
      created: '2026-01-01T00:00:00.000Z',
      '10.0.0-rc.1': '2026-08-01T00:00:00.000Z',
      '10.0.0-rc.2': '2026-09-09T00:00:00.000Z',
      '10.0.0-rc.3': '2026-09-24T12:00:00.000Z',
    },
  };

  it('hides later versions and makes the release latest', () => {
    const pinned = pinToRelease(packument, '10.0.0-rc.2', now)!;

    expect(Object.keys(pinned.versions as object)).toEqual(['10.0.0-rc.1', '10.0.0-rc.2']);
    expect(pinned['dist-tags']).toEqual({ latest: '10.0.0-rc.2', next: '10.0.0-rc.2' });
    expect((pinned.time as Record<string, string>)['10.0.0-rc.2']).toBe('2026-09-09T00:00:00.000Z');
  });

  it('backdates a fresh release so pnpm installs it', () => {
    const pinned = pinToRelease(packument, '10.0.0-rc.3', now)!;

    expect((pinned.time as Record<string, string>)['10.0.0-rc.3']).toBe('2026-09-22T00:00:00.000Z');
  });

  it('falls back to the newest earlier version, or nothing for a package that did not exist', () => {
    expect(pinToRelease(packument, '10.0.0-rc.2.5', now)!['dist-tags']).toEqual({
      latest: '10.0.0-rc.2',
      next: '10.0.0-rc.2',
    });
    expect(pinToRelease(packument, '9.0.0', now)).toBeNull();
  });

  it('keeps video.js on Video.js 8 for releases before it published Video.js 10', () => {
    const videojs = {
      name: 'video.js',
      versions: { '8.24.1': {}, '8.24.2': {}, '10.1.0': {} },
      'dist-tags': { latest: '10.1.0', 'latest-8': '8.24.1', 'next-8': '8.24.2' },
      time: { '8.24.1': '2026-09-10T00:00:00.000Z', '8.24.2': '2026-10-06T00:00:00.000Z' },
    };

    expect(pinToRelease(videojs, '10.0.1', now)!['dist-tags']).toEqual({
      latest: '8.24.2',
      next: '8.24.2',
      'latest-8': '8.24.1',
      'next-8': '8.24.2',
    });
    expect(pinToRelease(videojs, '10.1.0', now)!['dist-tags']).toMatchObject({
      latest: '10.1.0',
      'latest-8': '8.24.1',
    });
  });
});

describe('withProxyTarballs', () => {
  it('serves npm tarballs from the proxy in the standard layout', () => {
    const packument = {
      name: '@videojs/core',
      versions: {
        '10.0.0-rc.3': {
          dist: { tarball: 'https://registry.npmjs.org/@videojs/core/-/core-10.0.0-rc.3.tgz', integrity: 'x' },
        },
        preview: { dist: { tarball: 'http://127.0.0.1:4873/-/videojs-preview/core.tgz' } },
      },
    };
    const versions = withProxyTarballs(packument, 'http://127.0.0.1:4873/').versions as typeof packument.versions;

    expect(versions['10.0.0-rc.3'].dist).toEqual({
      tarball: 'http://127.0.0.1:4873/@videojs/core/-/core-10.0.0-rc.3.tgz',
      integrity: 'x',
    });
    expect(versions.preview.dist.tarball).toBe('http://127.0.0.1:4873/-/videojs-preview/core.tgz');
  });
});
