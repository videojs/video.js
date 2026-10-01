import clsx from 'clsx';

import CheckCircle from '@/assets/icons/check-circle.svg?react';
import { MUX_URL } from '@/consts';
import { withMuxAttribution } from '@/utils/mux/attribution';

export type UploaderState = 'idle' | 'needs_login' | 'uploading' | 'preparing' | 'ready' | 'polling_error';

interface UploaderOverlayProps {
  state: UploaderState;
  error: string | null;
  playbackId: string | null;
  onLogin: () => void;
  onRetry: () => void;
}

/** Shared overlay container matching drop zone styling */
function OverlayWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl corner-squircle px-6 text-center',
        'bg-manila-light/95 backdrop-blur-sm dark:bg-faded-black/95',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Renders state-based overlays on top of MuxUploader.
 *
 * - Needs_login: Login prompt
 * - Preparing: Spinner while polling for playback ID
 * - Ready: Success message with playback ID
 * - Polling_error: Error during post-upload processing (MuxUploader handles upload errors natively)
 */
export default function UploaderOverlay({ state, error, playbackId, onLogin, onRetry }: UploaderOverlayProps) {
  // No overlay needed for idle or uploading (MuxUploader handles its own UI)
  if (state === 'idle' || state === 'uploading') {
    return null;
  }

  if (state === 'needs_login') {
    return (
      <OverlayWrapper>
        <p className="text-p3 font-semibold">
          To upload this video to{' '}
          <a
            href={withMuxAttribution(MUX_URL, 'mux-uploader')}
            data-ph-capture-attribute-destination="mux"
            target="_blank"
            rel="noopener"
            className="intent:decoration-gold underline"
          >
            Mux
          </a>
          &hellip;
        </p>
        <button
          type="button"
          onClick={onLogin}
          data-ph-capture-attribute-cta="mux-login"
          className="bg-faded-black text-manila-light dark:bg-manila-light dark:text-faded-black text-p3 intent:bg-accent intent:text-faded-black corner-squircle inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-5 font-semibold shadow-sm transition select-none"
        >
          Sign up or log in
        </button>
      </OverlayWrapper>
    );
  }

  if (state === 'preparing') {
    return (
      <OverlayWrapper>
        <div className="border-accent h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-p3">Preparing video...</p>
      </OverlayWrapper>
    );
  }

  if (state === 'ready' && playbackId) {
    return (
      <OverlayWrapper>
        <div className="flex items-center gap-2">
          <CheckCircle className="text-accent size-4" aria-hidden="true" />
          <p className="font-semibold">Ready to play</p>
        </div>
        <p className="text-p3 text-center">
          See code below, or{' '}
          <a
            href={withMuxAttribution('https://dashboard.mux.com/my/video/assets', 'mux-uploader')}
            data-ph-capture-attribute-cta="mux-dashboard"
            data-ph-capture-attribute-destination="mux"
            target="_blank"
            className="intent:decoration-gold underline"
            rel="noopener"
          >
            manage on Mux
          </a>
          .
        </p>
      </OverlayWrapper>
    );
  }

  if (state === 'polling_error') {
    return (
      <OverlayWrapper>
        <p className="text-p3 text-red">
          Error preparing video:
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          data-ph-capture-attribute-cta="mux-retry"
          className="text-p3 intent:decoration-gold underline"
        >
          Try again
        </button>
      </OverlayWrapper>
    );
  }

  return null;
}
