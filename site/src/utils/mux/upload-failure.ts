import type { UploadFailureReason } from '@/utils/analytics-events';

export interface UploadFailureNotice {
  message: string;
  /** False when the same request would fail the same way, so the reader is not invited to repeat it. */
  retryable: boolean;
}

const NOTICES = {
  // Reached only right after a fresh sign-in; a stale session goes back through sign-in instead.
  unauthorized: {
    message: "Mux didn't accept your sign-in. Check that your Mux account is active in the Mux dashboard.",
    retryable: false,
  },
  forbidden: {
    message: "Your Mux account isn't allowed to create uploads. Check its access and plan in the Mux dashboard.",
    retryable: false,
  },
  rate_limited: {
    message: 'Mux is limiting requests from your account right now. Wait a minute, then try again.',
    retryable: true,
  },
  bad_request: {
    message: "Mux couldn't create an upload for your account. Check your account in the Mux dashboard.",
    retryable: false,
  },
  mux_error: {
    message: "Mux couldn't create the upload. Try again in a moment.",
    retryable: true,
  },
  network: {
    message: "Couldn't reach videojs.org. Check your connection, then try again.",
    retryable: true,
  },
} satisfies Record<UploadFailureReason, UploadFailureNotice>;

/** What to tell the reader when creating an upload fails, and whether trying again could help. */
export function uploadFailureNotice(reason: UploadFailureReason): UploadFailureNotice {
  return NOTICES[reason];
}
