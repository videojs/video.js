import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { AssetStatusResult, PollResult, UploadStatusResult } from '../polling';
import { pollForPlaybackId } from '../polling';

describe('pollForPlaybackId', () => {
  afterEach(() => vi.useRealTimers());

  describe('successful flow', () => {
    it('polls until assetId is available, then polls until playbackId', async () => {
      const getUploadStatus = vi
        .fn<(id: string) => Promise<UploadStatusResult>>()
        .mockResolvedValueOnce({ data: { status: 'waiting' } })
        .mockResolvedValueOnce({ data: { status: 'asset_created', assetId: 'asset-1' } });

      const getAssetStatus = vi
        .fn<(id: string) => Promise<AssetStatusResult>>()
        .mockResolvedValueOnce({ data: { status: 'preparing' } })
        .mockResolvedValueOnce({ data: { status: 'ready', playbackId: 'playback-1' } });

      const result = await pollForPlaybackId({
        uploadId: 'upload-1',
        getUploadStatus,
        getAssetStatus,
        interval: 0,
      });

      expect(result).toEqual({ status: 'ready', playbackId: 'playback-1' });
      expect(getUploadStatus).toHaveBeenCalledTimes(2);
      expect(getUploadStatus).toHaveBeenCalledWith('upload-1');
      expect(getAssetStatus).toHaveBeenCalledTimes(2);
      expect(getAssetStatus).toHaveBeenCalledWith('asset-1');
    });

    it('returns immediately when assetId is available on first poll', async () => {
      const getUploadStatus = vi
        .fn<(id: string) => Promise<UploadStatusResult>>()
        .mockResolvedValue({ data: { status: 'asset_created', assetId: 'asset-1' } });

      const getAssetStatus = vi
        .fn<(id: string) => Promise<AssetStatusResult>>()
        .mockResolvedValue({ data: { status: 'ready', playbackId: 'playback-1' } });

      const result = await pollForPlaybackId({
        uploadId: 'upload-1',
        getUploadStatus,
        getAssetStatus,
        interval: 0,
      });

      expect(result).toEqual({ status: 'ready', playbackId: 'playback-1' });
      expect(getUploadStatus).toHaveBeenCalledTimes(1);
      expect(getAssetStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it.each(['errored', 'cancelled', 'timed_out'] as const)(
      'stops upload polling for terminal status %s',
      async (status) => {
        vi.useFakeTimers();

        const controller = new AbortController();
        const getUploadStatus = vi
          .fn<(id: string) => Promise<UploadStatusResult>>()
          .mockResolvedValue({ data: { status } });
        const getAssetStatus = vi.fn<(id: string) => Promise<AssetStatusResult>>();
        let result: PollResult | undefined;

        const pending = pollForPlaybackId({
          uploadId: 'upload-1',
          getUploadStatus,
          getAssetStatus,
          interval: 100,
          signal: controller.signal,
        }).then(
          (value) => {
            result = value;
          },
          () => {}
        );

        try {
          await vi.advanceTimersByTimeAsync(1000);

          expect.soft(result).toEqual({ status: 'error', message: 'Upload processing failed' });
          expect.soft(getUploadStatus).toHaveBeenCalledTimes(1);
          expect(getAssetStatus).not.toHaveBeenCalled();
        } finally {
          controller.abort();
          await vi.advanceTimersByTimeAsync(100);
          await pending;
        }
      }
    );

    it('returns error when asset status is errored', async () => {
      const getUploadStatus = vi
        .fn<(id: string) => Promise<UploadStatusResult>>()
        .mockResolvedValue({ data: { status: 'asset_created', assetId: 'asset-1' } });

      const getAssetStatus = vi
        .fn<(id: string) => Promise<AssetStatusResult>>()
        .mockResolvedValue({ data: { status: 'errored' } });

      const result = await pollForPlaybackId({
        uploadId: 'upload-1',
        getUploadStatus,
        getAssetStatus,
        interval: 0,
      });

      expect(result).toEqual({ status: 'error', message: 'Asset processing failed' });
    });

    it('returns error when getUploadStatus API call fails', async () => {
      const getUploadStatus = vi
        .fn<(id: string) => Promise<UploadStatusResult>>()
        .mockResolvedValue({ error: { message: 'Network error' } });

      const result = await pollForPlaybackId({
        uploadId: 'upload-1',
        getUploadStatus,
        getAssetStatus: vi.fn(),
        interval: 0,
      });

      expect(result).toEqual({ status: 'error', message: 'Network error' });
    });

    it('returns error when getAssetStatus API call fails', async () => {
      const getUploadStatus = vi
        .fn<(id: string) => Promise<UploadStatusResult>>()
        .mockResolvedValue({ data: { status: 'asset_created', assetId: 'asset-1' } });

      const getAssetStatus = vi
        .fn<(id: string) => Promise<AssetStatusResult>>()
        .mockResolvedValue({ error: { message: 'Asset not found' } });

      const result = await pollForPlaybackId({
        uploadId: 'upload-1',
        getUploadStatus,
        getAssetStatus,
        interval: 0,
      });

      expect(result).toEqual({ status: 'error', message: 'Asset not found' });
    });
  });

  describe('abort signal', () => {
    it('throws when signal is aborted before first poll', async () => {
      const controller = new AbortController();

      controller.abort();

      await expect(
        pollForPlaybackId({
          uploadId: 'upload-1',
          getUploadStatus: vi.fn(),
          getAssetStatus: vi.fn(),
          signal: controller.signal,
          interval: 0,
        })
      ).rejects.toMatchObject({ message: 'Aborted' });
    });

    it('throws when signal is aborted during upload status polling', async () => {
      const controller = new AbortController();
      const getUploadStatus = vi.fn<(id: string) => Promise<UploadStatusResult>>().mockImplementation(async () => {
        controller.abort();
        return { data: { status: 'waiting' } };
      });

      await expect(
        pollForPlaybackId({
          uploadId: 'upload-1',
          getUploadStatus,
          getAssetStatus: vi.fn(),
          signal: controller.signal,
          interval: 0,
        })
      ).rejects.toMatchObject({ message: 'Aborted' });
    });

    it('throws when signal is aborted during asset status polling', async () => {
      const controller = new AbortController();
      const getUploadStatus = vi
        .fn<(id: string) => Promise<UploadStatusResult>>()
        .mockResolvedValue({ data: { status: 'asset_created', assetId: 'asset-1' } });

      const getAssetStatus = vi.fn<(id: string) => Promise<AssetStatusResult>>().mockImplementation(async () => {
        controller.abort();
        return { data: { status: 'preparing' } };
      });

      await expect(
        pollForPlaybackId({
          uploadId: 'upload-1',
          getUploadStatus,
          getAssetStatus,
          signal: controller.signal,
          interval: 0,
        })
      ).rejects.toMatchObject({ message: 'Aborted' });
    });
  });
});
