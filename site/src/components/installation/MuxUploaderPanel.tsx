import MuxUploader, {
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
  MuxUploaderRetry,
  MuxUploaderStatus,
} from '@mux/mux-uploader-react';
import { actions } from 'astro:actions';
import { useCallback, useRef, useState } from 'react';

import CloudUpload from '@/assets/icons/cloud-upload.svg?react';
import MuxLogo from '@/assets/logos/mux-small.svg?react';
import { MUX_URL } from '@/consts';
import { muxPlaybackId, media, sourceUrl } from '@/stores/installation';
import { initiateAuthPopup } from '@/utils/mux/auth-flow';
import { pollForPlaybackId } from '@/utils/mux/polling';

import type { UploaderState } from './UploaderOverlay';
import UploaderOverlay from './UploaderOverlay';

// import './MuxUploaderPanel.module.css';

/**
 * Mux video uploader with auth-gated flow.
 *
 * Flow: 1. User drops/selects file → endpoint() called 2. Try to create upload URL (requires auth) 3. If 401: show
 * login overlay, wait for auth, retry 4. Upload begins with returned URL 5. On success: poll for playback ID 6. When
 * ready: update renderer to 'hls', store playback ID in nanostore
 */
export default function MuxUploaderPanel() {
  // Local state for upload flow (not shared across islands)
  // 'idle' | 'needs_login' | 'uploading' | 'preparing' | 'ready' | 'polling_error';
  const [state, setState] = useState<UploaderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);

  // Ref to store the promise resolver for login flow
  const loginResolverRef = useRef<((url: string) => void) | null>(null);
  // Ref to the MuxUploader element for dispatching reset events
  const uploaderRef = useRef<HTMLElement>(null);

  /**
   * Endpoint function called by MuxUploader when file is selected. Returns a Promise that resolves with the upload URL.
   * The upload waits for this Promise before starting.
   */
  const getEndpoint = useCallback(async (): Promise<string> => {
    // Try to create upload - will fail with 401 if not authenticated
    const result = await actions.mux.createDirectUpload({
      corsOrigin: window.location.origin,
    });

    if (result.error) {
      if (result.error.code === 'UNAUTHORIZED') {
        // Not logged in - show login UI and wait for auth
        setState('needs_login');

        // Return a Promise that resolves when login completes
        return new Promise((resolve) => {
          loginResolverRef.current = resolve;
        });
      }

      // Other error - throw and let MuxUploader display its native error UI
      throw new Error(result.error.message);
    }

    // Authenticated - store upload ID and proceed
    setUploadId(result.data.uploadId);
    setState('uploading');
    return result.data.uploadUrl;
  }, []);

  /** Handles OAuth login via popup. On success: fetches upload URL and resolves the pending Promise. */
  const handleLogin = useCallback(async () => {
    const result = await actions.auth.initiateLogin();

    if (result.error) {
      setError(result.error.message);
      setState('polling_error');
      return;
    }

    initiateAuthPopup({
      authorizationUrl: result.data.authorizationUrl,
      onSuccess: async () => {
        // Now authenticated - fetch upload URL
        const uploadResult = await actions.mux.createDirectUpload({
          corsOrigin: window.location.origin,
        });

        if (uploadResult.error) {
          setError(uploadResult.error.message);
          setState('polling_error');
          return;
        }

        // Store upload ID and resolve the pending Promise
        setUploadId(uploadResult.data.uploadId);
        setState('uploading');
        loginResolverRef.current?.(uploadResult.data.uploadUrl);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setState('polling_error');
      },
    });
  }, []);

  /** Polls Mux API for playback ID after upload completes. Updates renderer to 'mux' and stores playback ID on success. */
  const handleUploadSuccess = useCallback(async () => {
    if (!uploadId) return;

    setState('preparing');

    const result = await pollForPlaybackId({
      uploadId,
      getUploadStatus: async (id) => {
        const response = await actions.mux.getUploadStatus({ uploadId: id });
        if (response.error) return { error: { message: response.error.message } };

        return {
          data: {
            status: response.data.status as 'waiting' | 'asset_created' | 'errored' | 'cancelled' | 'timed_out',
            assetId: response.data.assetId,
          },
        };
      },
      getAssetStatus: async (assetId) => {
        const response = await actions.mux.getAssetStatus({ assetId });
        if (response.error) return { error: { message: response.error.message } };

        return {
          data: {
            status: response.data.status as 'preparing' | 'ready' | 'errored',
            playbackId: response.data.playbackId,
          },
        };
      },
    });

    if (result.status === 'error') {
      setError(result.message);
      setState('polling_error');
      return;
    }

    // Success! Update local state and nanostores (for cross-island use)
    setPlaybackId(result.playbackId);
    setState('ready');
    media.set('hls');
    muxPlaybackId.set(result.playbackId);
    sourceUrl.set(`https://stream.mux.com/${result.playbackId}.m3u8`);
  }, [uploadId]);

  /** Resets uploader to try again after error */
  const handleRetry = useCallback(() => {
    // Reset MuxUploader's internal state
    uploaderRef.current?.dispatchEvent(new CustomEvent('reset'));

    // Reset React state
    setState('idle');
    setError(null);
    setUploadId(null);
    setPlaybackId(null);
  }, []);

  return (
    <div
      className="corner-squircle border-line-strong bg-surface relative isolate w-full overflow-hidden rounded-xl border border-dashed"
      data-ph-capture-attribute-location="mux-uploader"
    >
      <MuxUploader
        // @ts-expect-error — MuxUploaderElement type not hoisted by pnpm; only used for dispatchEvent
        ref={uploaderRef}
        id="mux-uploader"
        className="hidden"
        noDrop
        noProgress
        noStatus
        noRetry
        endpoint={getEndpoint}
        onSuccess={handleUploadSuccess}
      />
      {/* Custom Mux Uploader UI */}
      <MuxUploaderDrop
        muxUploader="mux-uploader"
        className="flex w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center"
        overlay
        overlayText="Let it go"
      >
        <span slot="heading" className="flex flex-col items-center gap-4">
          <span className="corner-squircle border-accent/25 bg-accent/10 text-accent flex size-14 items-center justify-center rounded-2xl border">
            <CloudUpload className="size-6" aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-p15 font-semibold text-balance">Drop a video to host it for free on Mux</span>
            <span className="text-p3 dark:text-muted text-balance">
              We transcode it into an HLS stream and set it as your source above.
            </span>
          </span>
        </span>
        <span slot="separator" className="sr-only">
          or
        </span>
        <MuxUploaderFileSelect muxUploader="mux-uploader">
          <button
            type="button"
            data-ph-capture-attribute-cta="mux-select-file"
            className="bg-faded-black text-manila-light dark:bg-manila-light dark:text-faded-black text-p3 intent:bg-accent intent:text-faded-black corner-squircle inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-5 font-semibold shadow-sm transition select-none"
          >
            Select a file
          </button>
        </MuxUploaderFileSelect>
        <MuxUploaderStatus muxUploader="mux-uploader" className="text-p3" />
        <MuxUploaderRetry muxUploader="mux-uploader" className="text-p3" />
        <MuxUploaderProgress type="percentage" muxUploader="mux-uploader" className="text-p3 font-mono" />
        <span className="text-p4 dark:text-muted mt-2 inline-flex items-center gap-1.5">
          Powered by{' '}
          <a
            href={MUX_URL}
            data-ph-capture-attribute-destination="mux"
            target="_blank"
            rel="noopener"
            aria-label="Mux"
            className="text-faded-black intent:text-accent dark:text-manila-light"
          >
            <MuxLogo className="h-3.5 w-auto" />
          </a>
        </span>
      </MuxUploaderDrop>

      {/* TODO add a pre-hydration loading state */}
      <UploaderOverlay
        state={state}
        error={error}
        playbackId={playbackId}
        onLogin={handleLogin}
        onRetry={handleRetry}
      />
    </div>
  );
}
