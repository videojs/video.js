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
import type { UploadFailureReason } from '@/utils/analytics-events';
import { ANALYTICS_EVENTS, failureReason, trackEvent, uploadFailureReason } from '@/utils/analytics-events';
import { withMuxAttribution } from '@/utils/mux/attribution';
import { initiateAuthPopup } from '@/utils/mux/auth-flow';
import { ASSET_PROCESSING_FAILED, pollForPlaybackId, UPLOAD_PROCESSING_FAILED } from '@/utils/mux/polling';
import type { UploadFailureNotice } from '@/utils/mux/upload-failure';
import { uploadFailureNotice } from '@/utils/mux/upload-failure';

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
/** Polling passes Mux API error text through, which can name the upload or asset, so only its own failures are kept. */
function processingFailureReason(message: string): string {
  return message === UPLOAD_PROCESSING_FAILED || message === ASSET_PROCESSING_FAILED ? message : 'request_failed';
}

type CreateUploadResult = { uploadUrl: string; uploadId: string } | { reason: UploadFailureReason };

/** Asks the server for an upload URL. A request that never reaches the action, such as one sent offline, throws. */
async function createUpload(): Promise<CreateUploadResult> {
  try {
    const result = await actions.mux.createDirectUpload({ corsOrigin: window.location.origin });
    if (result.error) return { reason: uploadFailureReason(result.error) };

    return result.data;
  } catch {
    return { reason: 'network' };
  }
}

export default function MuxUploaderPanel() {
  // Local state for upload flow (not shared across islands)
  // 'idle' | 'needs_login' | 'create_error' | 'uploading' | 'preparing' | 'ready' | 'polling_error';
  const [state, setState] = useState<UploaderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<UploadFailureNotice | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);

  // Ref to store the promise resolver for login flow
  const loginResolverRef = useRef<((url: string) => void) | null>(null);
  // Ref to the MuxUploader element for dispatching reset events
  const uploaderRef = useRef<HTMLElement>(null);
  // MuxUploader also reports an error from `getEndpoint`, which records its own failure, so only a transfer that
  // actually started counts as an upload failure.
  const transferStartedRef = useRef(false);

  /** Records a failed upload request and shows the reader what happened instead of the uploader's raw error. */
  const failCreateUpload = useCallback((reason: UploadFailureReason) => {
    const notice = uploadFailureNotice(reason);

    trackEvent(ANALYTICS_EVENTS.muxUploadFailed, { stage: 'create_upload', reason });
    setFailure(notice);
    setState('create_error');
    return notice;
  }, []);

  /**
   * Endpoint function called by MuxUploader when file is selected. Returns a Promise that resolves with the upload URL.
   * The upload waits for this Promise before starting.
   */
  const getEndpoint = useCallback(async (): Promise<string> => {
    transferStartedRef.current = false;

    // Not signed in, or Mux rejected the session's token (the server then clears the session): fails as unauthorized
    const result = await createUpload();

    trackEvent(ANALYTICS_EVENTS.muxUploadRequested, {
      signed_in: !('reason' in result) || result.reason !== 'unauthorized',
    });

    if ('reason' in result) {
      if (result.reason === 'unauthorized') {
        // Not logged in - show login UI and wait for auth
        setState('needs_login');

        // Return a Promise that resolves when login completes
        return new Promise((resolve) => {
          loginResolverRef.current = resolve;
        });
      }

      // The overlay explains the failure; throwing stops MuxUploader from starting a transfer
      throw new Error(failCreateUpload(result.reason).message);
    }

    // Authenticated - store upload ID and proceed
    setUploadId(result.uploadId);
    setState('uploading');
    transferStartedRef.current = true;
    trackEvent(ANALYTICS_EVENTS.muxUploadStarted);
    return result.uploadUrl;
  }, [failCreateUpload]);

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

        // Now authenticated - fetch upload URL. Unauthorized here means Mux rejected a fresh sign-in.
        const uploadResult = await createUpload();

        if ('reason' in uploadResult) {
          failCreateUpload(uploadResult.reason);
          return;
        }

        // Store upload ID and resolve the pending Promise
        setUploadId(uploadResult.uploadId);
        setState('uploading');
        transferStartedRef.current = true;
        trackEvent(ANALYTICS_EVENTS.muxUploadStarted);
        loginResolverRef.current?.(uploadResult.uploadUrl);
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
  }, [failCreateUpload]);

  // The uploader's messages can name the upload URL, so only the step is recorded.
  const handleUploadError = useCallback(() => {
    if (!transferStartedRef.current) return;

    transferStartedRef.current = false;
    trackEvent(ANALYTICS_EVENTS.muxUploadFailed, { stage: 'upload', reason: 'transfer_failed' });
  }, []);

  /** Polls Mux API for playback ID after upload completes. Updates renderer to 'mux' and stores playback ID on success. */
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
    setPlaybackId(result.playbackId);
    setState('ready');
    trackEvent(ANALYTICS_EVENTS.muxUploadReady);
    media.set('hls');
    muxPlaybackId.set(result.playbackId);
    sourceUrl.set(`https://stream.mux.com/${result.playbackId}.m3u8`);
  }, [uploadId]);

  /** Returns the uploader to its idle state. */
  const handleDismiss = useCallback(() => {
    // Reset MuxUploader's internal state
    uploaderRef.current?.dispatchEvent(new CustomEvent('reset'));

    // Reset React state
    setState('idle');
    setError(null);
    setFailure(null);
    setUploadId(null);
    setPlaybackId(null);
  }, []);

  /** Resets uploader to try again after error */
  const handleRetry = useCallback(() => {
    trackEvent(ANALYTICS_EVENTS.muxUploadRetried);
    handleDismiss();
  }, [handleDismiss]);

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
        onUploadError={handleUploadError}
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
        failure={failure}
        playbackId={playbackId}
        onLogin={handleLogin}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
