import { describe, expect, it, vi } from 'vite-plus/test';

import type { AssetStatusResult, UploadStatusResult } from '../polling';
import { pollForPlaybackId } from '../polling';

describe('pollForPlaybackId', () => {
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
    it('returns error when upload status is errored', async () => {
      const getUploadStatus = vi
        .fn<(id: string) => Promise<UploadStatusResult>>()
        .mockResolvedValue({ data: { status: 'errored' } });

      const result = await pollForPlaybackId({
        uploadId: 'upload-1',
        getUploadStatus,
        getAssetStatus: vi.fn(),
        interval: 0,
      });

      expect(result).toEqual({ status: 'error', message: 'Upload processing failed' });
    });

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
