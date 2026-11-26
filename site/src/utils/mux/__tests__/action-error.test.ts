// @vitest-environment node

import { APIConnectionError, APIError } from '@mux/mux-node';
import * as Sentry from '@sentry/astro';
import { ActionError } from 'astro:actions';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { muxStatusToActionCode, toMuxActionError } from '../action-error';

vi.mock('@sentry/astro', () => ({
  captureException: vi.fn(),
}));

function muxError(status: number, message: string) {
  return APIError.generate(status, { error: { messages: [message] } }, message, new Headers());
}

describe('muxStatusToActionCode', () => {
  it('maps Mux HTTP statuses to action error codes', () => {
    expect(muxStatusToActionCode(401)).toBe('UNAUTHORIZED');
    expect(muxStatusToActionCode(403)).toBe('FORBIDDEN');
    expect(muxStatusToActionCode(429)).toBe('TOO_MANY_REQUESTS');
    expect(muxStatusToActionCode(400)).toBe('BAD_REQUEST');
    expect(muxStatusToActionCode(404)).toBe('BAD_REQUEST');
    expect(muxStatusToActionCode(422)).toBe('BAD_REQUEST');
    expect(muxStatusToActionCode(500)).toBe('INTERNAL_SERVER_ERROR');
    expect(muxStatusToActionCode(503)).toBe('INTERNAL_SERVER_ERROR');
    expect(muxStatusToActionCode(undefined)).toBe('INTERNAL_SERVER_ERROR');
  });
});

describe('toMuxActionError', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [429, 'TOO_MANY_REQUESTS'],
    [400, 'BAD_REQUEST'],
    [502, 'INTERNAL_SERVER_ERROR'],
  ] as const)('converts a Mux %i to %s and keeps the Mux message', (status, code) => {
    const error = muxError(status, 'Upload limit reached');

    const actionError = toMuxActionError(error, 'mux.createDirectUpload', 'Failed to create upload');

    expect(actionError).toBeInstanceOf(ActionError);
    expect(actionError.code).toBe(code);
    expect(actionError.message).toBe(error.message);
    expect(actionError.message).toContain('Upload limit reached');
  });

  it('reports the original error to Sentry, tagged with the action and Mux status', () => {
    const error = muxError(403, 'Forbidden');

    toMuxActionError(error, 'mux.createDirectUpload', 'Failed to create upload');

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { mux_action: 'mux.createDirectUpload', mux_status: '403' },
    });
  });

  it('reports a connection failure without a status as an internal error', () => {
    const error = new APIConnectionError({ message: 'Connection error.' });

    const actionError = toMuxActionError(error, 'mux.getAssetStatus', 'Failed to get asset status');

    expect(actionError.code).toBe('INTERNAL_SERVER_ERROR');
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { mux_action: 'mux.getAssetStatus', mux_status: 'none' },
    });
  });

  it('uses the fallback message for a thrown non-error', () => {
    const actionError = toMuxActionError('boom', 'mux.listAssets', 'Failed to fetch assets');

    expect(actionError.code).toBe('INTERNAL_SERVER_ERROR');
    expect(actionError.message).toBe('Failed to fetch assets');
  });

  it('passes an action error through without reporting it', () => {
    const error = new ActionError({ code: 'UNAUTHORIZED' });

    expect(toMuxActionError(error, 'mux.createDirectUpload', 'Failed to create upload')).toBe(error);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
