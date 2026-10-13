import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createUrlWriter } from '../shell/url';

describe('createUrlWriter', () => {
  const replaceState = vi.fn();
  let target: EventTarget;

  beforeEach(() => {
    vi.useFakeTimers();
    target = new EventTarget();
    vi.stubGlobal('window', target);
    vi.stubGlobal('history', { state: null, replaceState });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    replaceState.mockReset();
  });

  it('writes only the latest URL once changes pause', () => {
    const write = createUrlWriter(250);

    for (let width = 0; width < 200; width++) write(`/?width=${width}`);

    vi.advanceTimersByTime(249);
    expect(replaceState).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(replaceState).toHaveBeenCalledOnce();
    expect(replaceState).toHaveBeenCalledWith(null, '', '/?width=199');
  });

  it('writes the pending URL when the page is hidden', () => {
    const write = createUrlWriter(250);

    write('/?width=640');
    target.dispatchEvent(new Event('pagehide'));

    expect(replaceState).toHaveBeenCalledWith(null, '', '/?width=640');

    vi.runAllTimers();
    expect(replaceState).toHaveBeenCalledOnce();
  });
});
