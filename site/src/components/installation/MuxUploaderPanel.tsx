import MuxUploader, {
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
  MuxUploaderRetry,
  MuxUploaderStatus,
} from '@mux/mux-uploader-react';
import { resolveRenderer } from '@videojs/installation';
import { actions } from 'astro:actions';
import { useCallback, useId, useRef, useState } from 'react';

import CloudUpload from '@/assets/icons/cloud-upload.svg?react';
import MuxLogo from '@/assets/logos/mux-small.svg?react';
import { MUX_URL } from '@/consts';
import { muxPlaybackId, media, sourceUrl, useCase } from '@/stores/installation';
import { ANALYTICS_EVENTS, failureReason, trackEvent } from '@/utils/analytics-events';
import { withMuxAttribution } from '@/utils/mux/attribution';
import { initiateAuthPopup } from '@/utils/mux/auth-flow';
import { ASSET_PROCESSING_FAILED, pollForPlaybackId, UPLOAD_PROCESSING_FAILED } from '@/utils/mux/polling';

import type { UploaderState } from './UploaderOverlay';
import UploaderOverlay from './UploaderOverlay';

// import './MuxUploaderPanel.module.css';

/**
 * Mux video uploader with auth-gated flow.
 *
 * Flow: 1. User drops/selects file → endpoint() called 2. Try to create upload URL (requires auth) 3. If 401: show
 * login overlay, wait for auth, retry 4. Upload begins with returned URL 5. On success: poll for playback ID 6. When
 * ready: store the playback ID and stream URL, and select the Mux media source for the preset
 */
/** Polling passes Mux API error text through, which can name the upload or asset, so only its own failures are kept. */
function processingFailureReason(message: string): string {
  return message === UPLOAD_PROCESSING_FAILED || message === ASSET_PROCESSING_FAILED ? message : 'request_failed';
}

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
  // MuxUploader also reports an error from `getEndpoint`, which records its own failure, so only a transfer that
  // actually started counts as an upload failure.
  const transferStartedRef = useRef(false);
  // The drop zone and file picker find their uploader by id, and a page can show more than one panel.
  const uploaderId = `mux-uploader-${useId().replace(/[^a-z0-9]/gi, '')}`;

  /**
   * Endpoint function called by MuxUploader when file is selected. Returns a Promise that resolves with the upload URL.
   * The upload waits for this Promise before starting.
   */
  const getEndpoint = useCallback(async (): Promise<string> => {
    transferStartedRef.current = false;

    // Try to create upload - will fail with 401 if not authenticated
    const result = await actions.mux.createDirectUpload({
      corsOrigin: window.location.origin,
    });

    trackEvent(ANALYTICS_EVENTS.muxUploadRequested, {
      signed_in: !result.error || result.error.code !== 'UNAUTHORIZED',
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
      trackEvent(ANALYTICS_EVENTS.muxUploadFailed, { stage: 'create_upload', reason: failureReason(result.error) });
      throw new Error(result.error.message);
    }

    // Authenticated - store upload ID and proceed
    setUploadId(result.data.uploadId);
    setState('uploading');
    transferStartedRef.current = true;
    trackEvent(ANALYTICS_EVENTS.muxUploadStarted);
    return result.data.uploadUrl;
  }, []);

  /** Handles OAuth login via popup. On success: fetches upload URL and resolves the pending Promise. */
  const handleLogin = useCallback(async () => {
    trackEvent(ANALYTICS_EVENTS.muxLoginClicked);

    const result = await actions.auth.initiateLogin();

    if (result.error) {
      trackEvent(ANALYTICS_EVENTS.muxAuthFailed, { stage: 'initiate', reason: failureReason(result.error) });
      setError(result.error.message);
      setState('polling_error');
      return;
    }

    initiateAuthPopup({
      authorizationUrl: result.data.authorizationUrl,
      onSuccess: async () => {
        trackEvent(ANALYTICS_EVENTS.muxAuthSucceeded);

        // Now authenticated - fetch upload URL
        const uploadResult = await actions.mux.createDirectUpload({
          corsOrigin: window.location.origin,
        });

        if (uploadResult.error) {
          trackEvent(ANALYTICS_EVENTS.muxUploadFailed, {
            stage: 'create_upload',
            reason: failureReason(uploadResult.error),
          });
          setError(uploadResult.error.message);
          setState('polling_error');
          return;
        }

        // Store upload ID and resolve the pending Promise
        setUploadId(uploadResult.data.uploadId);
        setState('uploading');
        transferStartedRef.current = true;
        trackEvent(ANALYTICS_EVENTS.muxUploadStarted);
        loginResolverRef.current?.(uploadResult.data.uploadUrl);
      },
      onError: (errorMessage) => {
        trackEvent(ANALYTICS_EVENTS.muxAuthFailed, {
          stage: 'popup',
          reason: failureReason({ message: errorMessage }),
        });
        setError(errorMessage);
        setState('polling_error');
      },
    });
  }, []);

  // The uploader's messages can name the upload URL, so only the step is recorded.
  const handleUploadError = useCallback(() => {
    if (!transferStartedRef.current) return;

    transferStartedRef.current = false;
    trackEvent(ANALYTICS_EVENTS.muxUploadFailed, { stage: 'upload', reason: 'transfer_failed' });
  }, []);

  /** Polls Mux API for playback ID after upload completes, then points the installation at the new stream. */
  const handleUploadSuccess = useCallback(async () => {
    if (!uploadId) return;

    setState('preparing');
    trackEvent(ANALYTICS_EVENTS.muxUploadCompleted);

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
      trackEvent(ANALYTICS_EVENTS.muxUploadFailed, {
        stage: 'processing',
        reason: processingFailureReason(result.message),
      });
      setError(result.message);
      setState('polling_error');
      return;
    }

    // Success! Update local state and nanostores (for cross-island use)
    const streamUrl = `https://stream.mux.com/${result.playbackId}.m3u8`;
    const detected = resolveRenderer(streamUrl, useCase.get());

    setPlaybackId(result.playbackId);
    setState('ready');
    trackEvent(ANALYTICS_EVENTS.muxUploadReady);

    if (detected) media.set(detected);

    muxPlaybackId.set(result.playbackId);
    sourceUrl.set(streamUrl);
  }, [uploadId]);

  /** Resets uploader to try again after error */
  const handleRetry = useCallback(() => {
    trackEvent(ANALYTICS_EVENTS.muxUploadRetried);

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
      data-mux-uploader-panel
    >
      <MuxUploader
        // @ts-expect-error — MuxUploaderElement type not hoisted by pnpm; only used for dispatchEvent
        ref={uploaderRef}
        id={uploaderId}
        className="hidden"
        noDrop
        noProgress
        noStatus
        noRetry
        endpoint={getEndpoint}
        onSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />
      {/* Custom Mux Uploader UI */}
      <MuxUploaderDrop
        muxUploader={uploaderId}
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
        <MuxUploaderFileSelect muxUploader={uploaderId}>
          <button
            type="button"
            data-ph-capture-attribute-cta="mux-select-file"
            className="bg-faded-black text-manila-light dark:bg-manila-light dark:text-faded-black text-p3 intent:bg-accent intent:text-faded-black corner-squircle inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-5 font-semibold shadow-sm transition select-none"
          >
            Select a file
          </button>
        </MuxUploaderFileSelect>
        <MuxUploaderStatus muxUploader={uploaderId} className="text-p3" />
        <MuxUploaderRetry muxUploader={uploaderId} className="text-p3" />
        <MuxUploaderProgress type="percentage" muxUploader={uploaderId} className="text-p3 font-mono" />
        <span className="text-p4 dark:text-muted mt-2 inline-flex items-center gap-1.5">
          Powered by{' '}
          <a
            href={withMuxAttribution(MUX_URL, 'mux-uploader')}
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
