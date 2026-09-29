import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { extensions, media, muxPlaybackId, sourceUrl, useCase } from '@/stores/installation';

interface UploaderProps {
  endpoint: () => Promise<string>;
  onSuccess: () => Promise<void>;
}

/** What the mocked uploader components saw: the uploader's props and each drop zone's target id. */
interface UploaderMocks {
  uploader?: UploaderProps;
  dropTargets: string[];
}

const mocks = vi.hoisted(() => {
  const state: UploaderMocks = { dropTargets: [] };

  return state;
});

vi.mock('@mux/mux-uploader-react', () => ({
  default: (props: UploaderProps) => {
    mocks.uploader = props;

    return null;
  },
  MuxUploaderDrop: ({ muxUploader, children }: { muxUploader: string; children: React.ReactNode }) => {
    mocks.dropTargets.push(muxUploader);

    return <div>{children}</div>;
  },
  MuxUploaderFileSelect: ({ children }: { children: React.ReactNode }) => children,
  MuxUploaderProgress: () => null,
  MuxUploaderRetry: () => null,
  MuxUploaderStatus: () => null,
}));
vi.mock('astro:actions', () => ({
  actions: {
    mux: { createDirectUpload: vi.fn(async () => ({ data: { uploadId: 'upload-1', uploadUrl: 'https://upload' } })) },
  },
}));
vi.mock('@/utils/mux/polling', () => ({
  pollForPlaybackId: vi.fn(async () => ({ status: 'ready', playbackId: 'abc123' })),
}));

import MuxUploaderPanel from '../MuxUploaderPanel';

function renderedUploader(): UploaderProps {
  if (!mocks.uploader) throw new Error('MuxUploader did not render.');

  return mocks.uploader;
}

async function upload(): Promise<void> {
  await act(async () => {
    await renderedUploader().endpoint();
  });
  // The success handler reads the upload id the endpoint stored, so it comes from the render after it.
  await act(async () => {
    await renderedUploader().onSuccess();
  });
}

describe('MuxUploaderPanel', () => {
  afterEach(() => {
    cleanup();
    useCase.set('default-video');
    media.set('html5-video');
    extensions.set([]);
    sourceUrl.set('');
    muxPlaybackId.set(null);
    mocks.dropTargets = [];
  });

  it('points the installation at the uploaded stream with the Mux media source for the preset', async () => {
    render(<MuxUploaderPanel />);
    await upload();

    expect(sourceUrl.get()).toBe('https://stream.mux.com/abc123.m3u8');
    expect(muxPlaybackId.get()).toBe('abc123');
    expect(media.get()).toBe('mux-video');
    expect(extensions.get()).toEqual(['mux-data']);
  });

  it('selects Mux audio for an audio player', async () => {
    useCase.set('default-audio');
    render(<MuxUploaderPanel />);
    await upload();

    expect(media.get()).toBe('mux-audio');
  });

  it('gives each panel its own uploader so two on one page do not share one', () => {
    render(
      <>
        <MuxUploaderPanel />
        <MuxUploaderPanel />
      </>
    );

    expect(new Set(mocks.dropTargets).size).toBe(2);
  });
});
