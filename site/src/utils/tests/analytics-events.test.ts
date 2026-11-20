import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PostHogClient } from '../analytics';
import {
  ANALYTICS_EVENTS,
  currentInstallationContext,
  failureReason,
  isAgentHandoffMethod,
  reportableSearchQuery,
  trackEvent,
  uploadFailureReason,
} from '../analytics-events';

function stubPostHog(): PostHogClient {
  const posthog = { init: vi.fn(), capture: vi.fn() } satisfies PostHogClient;

  window.posthog = posthog;

  return posthog;
}

afterEach(() => {
  delete window.posthog;
});

describe('trackEvent', () => {
  it('sends the event and its properties to PostHog', () => {
    const posthog = stubPostHog();

    trackEvent(ANALYTICS_EVENTS.codeCopied, { block: 'cdn-scripts', tab: 'pnpm' });
    trackEvent(ANALYTICS_EVENTS.muxLoginClicked);

    expect(posthog.capture).toHaveBeenCalledWith('code_copied', { block: 'cdn-scripts', tab: 'pnpm' });
    expect(posthog.capture).toHaveBeenCalledWith('mux_login_clicked', undefined);
  });

  it('does nothing without PostHog, as in development builds', () => {
    expect(() => trackEvent(ANALYTICS_EVENTS.agentHandoff, { method: 'copy-markdown' })).not.toThrow();
  });

  it('never throws when PostHog does', () => {
    const posthog = stubPostHog();

    vi.mocked(posthog.capture).mockImplementation(() => {
      throw new Error('broken');
    });

    expect(() => trackEvent(ANALYTICS_EVENTS.muxUploadReady)).not.toThrow();
  });
});

describe('isAgentHandoffMethod', () => {
  it('accepts handoff CTAs and rejects the rest', () => {
    expect(isAgentHandoffMethod('install-agent-skill')).toBe(true);
    expect(isAgentHandoffMethod('copy-code')).toBe(false);
    expect(isAgentHandoffMethod(undefined)).toBe(false);
  });
});

describe('reportableSearchQuery', () => {
  it('trims and caps an ordinary query', () => {
    expect(reportableSearchQuery('  picture in picture ')).toBe('picture in picture');
    expect(reportableSearchQuery('requestPictureInPictureWindow')).toBe('requestPictureInPictureWindow');
    expect(reportableSearchQuery('x '.repeat(80))).toHaveLength(100);
  });

  it('drops a query that looks like a URL, an address, or a token', () => {
    expect(reportableSearchQuery('https://cdn.example.com/v.m3u8')).toBeUndefined();
    expect(reportableSearchQuery('www.example.com')).toBeUndefined();
    expect(reportableSearchQuery('me@example.com')).toBeUndefined();
    expect(reportableSearchQuery('a4nOgmxGWg6gULfcBbAa00gXyfcwPnAF')).toBeUndefined();
    expect(reportableSearchQuery('   ')).toBeUndefined();
  });
});

describe('failureReason', () => {
  it('prefers the error code and trims a bare message', () => {
    expect(failureReason({ code: 'UNAUTHORIZED', message: 'Not signed in' })).toBe('UNAUTHORIZED');
    expect(failureReason({ message: 'x'.repeat(300) })).toHaveLength(100);
  });
});

describe('uploadFailureReason', () => {
  it('maps action error codes to fixed categories', () => {
    expect(uploadFailureReason({ code: 'UNAUTHORIZED' })).toBe('unauthorized');
    expect(uploadFailureReason({ code: 'FORBIDDEN' })).toBe('forbidden');
    expect(uploadFailureReason({ code: 'TOO_MANY_REQUESTS' })).toBe('rate_limited');
    expect(uploadFailureReason({ code: 'BAD_REQUEST' })).toBe('bad_request');
    expect(uploadFailureReason({ code: 'INTERNAL_SERVER_ERROR' })).toBe('mux_error');
    expect(uploadFailureReason({ code: 'NOT_FOUND' })).toBe('mux_error');
  });

  it('treats an error without a code as a network failure', () => {
    expect(uploadFailureReason({})).toBe('network');
  });

  it('never carries the error message', () => {
    const error = Object.assign(new Error('403 account acct_123 for me@example.com is suspended'), {
      code: 'FORBIDDEN',
    });

    expect(uploadFailureReason(error)).toBe('forbidden');
  });
});

describe('currentInstallationContext', () => {
  afterEach(() => {
    history.replaceState(null, '', '/');
  });

  it('reads the picks from an installation guide URL, without the source URL', () => {
    history.replaceState(
      null,
      '',
      '/docs/guides/installation/html?skin=neutral&source-url=https%3A%2F%2Fsecret.example.com%2Fv.m3u8'
    );

    const context = currentInstallationContext();

    expect(context).toMatchObject({ installation_route: 'html', installation_custom_source: true });
    expect(String(context.installation_skin)).toContain('neutral');
    expect(JSON.stringify(context)).not.toContain('secret.example.com');
  });

  it('is empty outside the installation guides', () => {
    history.replaceState(null, '', '/docs/framework/react/guides/why-videojs');

    expect(currentInstallationContext()).toEqual({});
  });
});
