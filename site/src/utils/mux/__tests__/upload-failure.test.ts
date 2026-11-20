import { describe, expect, it } from 'vite-plus/test';

import type { UploadFailureReason } from '@/utils/analytics-events';

import { uploadFailureNotice } from '../upload-failure';

describe('uploadFailureNotice', () => {
  it('does not invite a retry for failures that repeat deterministically', () => {
    const deterministic: UploadFailureReason[] = ['unauthorized', 'forbidden', 'bad_request'];

    for (const reason of deterministic) {
      expect(uploadFailureNotice(reason).retryable).toBe(false);
      expect(uploadFailureNotice(reason).message).toContain('Mux dashboard');
    }
  });

  it('invites a retry for transient failures', () => {
    const transient: UploadFailureReason[] = ['rate_limited', 'mux_error', 'network'];

    for (const reason of transient) {
      expect(uploadFailureNotice(reason).retryable).toBe(true);
    }

    expect(uploadFailureNotice('rate_limited').message).toMatch(/wait/i);
  });
});
