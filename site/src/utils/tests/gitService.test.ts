import { describe, expect, it, type Mock, vi } from 'vite-plus/test';

import { createGitService, type GitClient, parseLastModifiedDates } from '../gitService';

// ASCII record separator, matching the marker the service puts in front of each commit date.
const MARKER = String.fromCharCode(0x1e);

const LOG = [
  `${MARKER}2026-09-03T16:22:59-07:00`,
  'site/src/content/docs/how-to/installation.mdx',
  'site/src/content/docs/concepts/overview.mdx',
  '',
  `${MARKER}2026-08-01T10:00:00+00:00`,
  'site/src/content/docs/concepts/overview.mdx',
  'site/src/content/blog/2026-07-01-hello.mdx',
  '',
].join('\n');

interface FakeGitClient extends GitClient {
  raw: Mock<GitClient['raw']>;
  revparse: Mock<GitClient['revparse']>;
}

function createClient(root = '/repo'): FakeGitClient {
  return {
    raw: vi.fn<GitClient['raw']>(async () => LOG),
    revparse: vi.fn<GitClient['revparse']>(async () => `${root}\n`),
  };
}

describe('parseLastModifiedDates', () => {
  it('keeps the newest date for a path touched by several commits', () => {
    const dates = parseLastModifiedDates(LOG);

    expect(dates.get('site/src/content/docs/concepts/overview.mdx')).toEqual(new Date('2026-09-03T16:22:59-07:00'));
    expect(dates.get('site/src/content/blog/2026-07-01-hello.mdx')).toEqual(new Date('2026-08-01T10:00:00+00:00'));
    expect(dates.size).toBe(3);
  });

  it('ignores blank lines and paths before any commit marker', () => {
    expect(parseLastModifiedDates('\nsite/orphan.mdx\n')).toEqual(new Map());
  });
});

describe('createGitService', () => {
  it('resolves absolute paths against the repository root reported by git', async () => {
    const service = createGitService('/repo/site/src/content', createClient('/repo'));

    await expect(service.getLastModifiedDate('/repo/site/src/content/docs/how-to/installation.mdx')).resolves.toEqual(
      new Date('2026-09-03T16:22:59-07:00')
    );
    await expect(service.getLastModifiedDate('/repo/site/src/content/docs/missing.mdx')).resolves.toBeNull();
  });

  it('walks the history once for every lookup', async () => {
    const client = createClient();
    const service = createGitService('/repo/site/src/content', client);

    await Promise.all([
      service.getLastModifiedDate('/repo/site/src/content/docs/how-to/installation.mdx'),
      service.getLastModifiedDate('/repo/site/src/content/docs/concepts/overview.mdx'),
      service.getLastModifiedDate('/repo/site/src/content/blog/2026-07-01-hello.mdx'),
    ]);

    expect(client.raw).toHaveBeenCalledTimes(1);
    expect(client.raw).toHaveBeenCalledWith([
      '-c',
      'core.quotePath=false',
      'log',
      `--format=${MARKER}%aI`,
      '--name-only',
      '--',
      '/repo/site/src/content',
    ]);
    expect(client.revparse).toHaveBeenCalledTimes(1);
  });

  it('normalizes the queried path before matching', async () => {
    const service = createGitService('/repo/site/src/content', createClient());

    await expect(
      service.getLastModifiedDate('/repo/site/src/content/docs/how-to/../how-to/installation.mdx')
    ).resolves.toEqual(new Date('2026-09-03T16:22:59-07:00'));
  });

  it('returns null and retries later when git fails', async () => {
    const client = createClient();

    client.raw.mockRejectedValueOnce(new Error('not a git repository'));
    const service = createGitService('/repo/site/src/content', client);
    const file = '/repo/site/src/content/docs/how-to/installation.mdx';

    await expect(service.getLastModifiedDate(file)).resolves.toBeNull();
    await expect(service.getLastModifiedDate(file)).resolves.toEqual(new Date('2026-09-03T16:22:59-07:00'));
    expect(client.raw).toHaveBeenCalledTimes(2);
  });
});
