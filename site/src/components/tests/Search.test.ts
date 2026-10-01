import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PostHogClient } from '@/utils/analytics';

import { reportNoResults } from '../Search';

let posthog: PostHogClient;

function showSearch(query: string, { noResults }: { noResults: boolean }) {
  document.body.innerHTML = `<input class="DocSearch-Input" value="${query}">${noResults ? '<div class="DocSearch-NoResults"></div>' : ''}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  posthog = { init: vi.fn(), capture: vi.fn() };
  window.posthog = posthog;
});

afterEach(() => {
  reportNoResults.cancel();
  vi.useRealTimers();
  document.body.innerHTML = '';
  delete window.posthog;
});

describe('reportNoResults', () => {
  it('reports the query the reader stopped on while it still has no results', () => {
    showSearch('hls mulitvariant', { noResults: true });
    reportNoResults('hls mulit');
    reportNoResults('hls mulitvariant');
    vi.advanceTimersByTime(1000);

    expect(posthog.capture).toHaveBeenCalledOnce();
    expect(posthog.capture).toHaveBeenCalledWith('search_no_results', { query: 'hls mulitvariant' });
  });

  it('skips a query that has found results by the time typing settles', () => {
    showSearch('captio', { noResults: true });
    reportNoResults('captio');
    showSearch('caption', { noResults: false });
    vi.advanceTimersByTime(1000);

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('skips a query the reader has since changed', () => {
    showSearch('captionz', { noResults: true });
    reportNoResults('captionz');
    showSearch('captionzz', { noResults: true });
    vi.advanceTimersByTime(1000);

    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
