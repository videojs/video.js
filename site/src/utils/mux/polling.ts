/**
 * Mux upload polling utilities.
 *
 * Handles the 2-phase polling flow after upload completes:
 *
 * 1. Poll upload status until asset_id is available
 * 2. Poll asset status until playback_id is ready
 */

export interface UploadStatusResult {
  data?: {
    status: 'waiting' | 'asset_created' | 'errored' | 'cancelled' | 'timed_out';
    assetId?: string;
  };
  error?: { message: string };
}

export interface AssetStatusResult {
  data?: {
    status: 'preparing' | 'ready' | 'errored';
    playbackId?: string;
  };
  error?: { message: string };
}

export interface PollOptions {
  uploadId: string;
  getUploadStatus: (uploadId: string) => Promise<UploadStatusResult>;
  getAssetStatus: (assetId: string) => Promise<AssetStatusResult>;
  interval?: number;
  signal?: AbortSignal;
}

export const UPLOAD_PROCESSING_FAILED = 'Upload processing failed';
export const ASSET_PROCESSING_FAILED = 'Asset processing failed';

export type PollResult = { status: 'ready'; playbackId: string } | { status: 'error'; message: string };

/**
 * Polls Mux API for playback ID after upload completes.
 *
 * Phase 1: Poll getUploadStatus until assetId is available Phase 2: Poll getAssetStatus until playbackId is ready
 */
export async function pollForPlaybackId(options: PollOptions): Promise<PollResult> {
  const { uploadId, getUploadStatus, getAssetStatus, interval = 2000, signal } = options;

  // Phase 1: Poll until asset_id is available
  let assetId: string | undefined;

  while (!assetId) {
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    await sleep(interval);

    const result = await getUploadStatus(uploadId);
    if (result.error) return { status: 'error', message: result.error.message };

    if (result.data?.status === 'errored') {
      return { status: 'error', message: UPLOAD_PROCESSING_FAILED };
    }

    assetId = result.data?.assetId;
  }

  // Phase 2: Poll until playback_id is available
  while (true) {
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    await sleep(interval);

    const result = await getAssetStatus(assetId);
    if (result.error) return { status: 'error', message: result.error.message };

    if (result.data?.status === 'errored') {
      return { status: 'error', message: ASSET_PROCESSING_FAILED };
    }

    if (result.data?.status === 'ready' && result.data.playbackId) {
      return { status: 'ready', playbackId: result.data.playbackId };
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
