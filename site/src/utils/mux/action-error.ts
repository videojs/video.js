import { APIError } from '@mux/mux-node';
import * as Sentry from '@sentry/astro';
import type { ActionErrorCode } from 'astro:actions';
import { ActionError } from 'astro:actions';

/** The action error code for a Mux API HTTP status, so the client can tell a fixable failure from a Mux outage. */
export function muxStatusToActionCode(status: number | undefined): ActionErrorCode {
  if (status === 401) return 'UNAUTHORIZED';

  if (status === 403) return 'FORBIDDEN';

  if (status === 429) return 'TOO_MANY_REQUESTS';

  if (status !== undefined && status >= 400 && status < 500) return 'BAD_REQUEST';

  return 'INTERNAL_SERVER_ERROR';
}

/**
 * Reports a failed Mux call to Sentry and converts it to an `ActionError` that keeps Mux's message and maps its HTTP
 * status to a fitting code. An `ActionError` thrown before the call, such as the missing-session `UNAUTHORIZED`, is an
 * expected outcome and passes through unreported.
 */
export function toMuxActionError(error: unknown, action: string, fallbackMessage: string): ActionError {
  if (error instanceof ActionError) return error;

  const status = error instanceof APIError ? error.status : undefined;

  Sentry.captureException(error, {
    tags: { mux_action: action, mux_status: status === undefined ? 'none' : String(status) },
  });

  return new ActionError({
    code: muxStatusToActionCode(status),
    message: error instanceof Error ? error.message : fallbackMessage,
  });
}
