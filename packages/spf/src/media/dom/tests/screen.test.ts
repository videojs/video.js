import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { getScreenResolution, type ScreenResolutionOptions, watchScreenResolution } from '../screen';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getScreenResolution', () => {
  it('reads the ambient screen', () => {
    // The real browser screen — its size is the environment's to decide, so
    // assert the shape rather than the numbers.
    const resolution = getScreenResolution();

    expect(resolution).toBeDefined();
    expect(resolution!.width).toBeGreaterThan(0);
    expect(resolution!.height).toBeGreaterThan(0);
  });

  it('reports a portrait screen with its axes as given', () => {
    // Not normalized to landscape: whether a cap should flap on rotation is the
    // cap's question, so the reading stays literal.
    vi.stubGlobal('screen', { width: 390, height: 844 });
    vi.stubGlobal('devicePixelRatio', 1);

    expect(getScreenResolution()).toEqual({ width: 390, height: 844 });
  });

  it('returns undefined when there is no screen', () => {
    // The answer a cap needs in order to not cap.
    vi.stubGlobal('screen', undefined);

    expect(getScreenResolution()).toBeUndefined();
  });

  describe('useDevicePixelRatio', () => {
    it('scales into device pixels by default', () => {
      vi.stubGlobal('screen', { width: 1440, height: 900 });
      vi.stubGlobal('devicePixelRatio', 2);

      expect(getScreenResolution()).toEqual({ width: 2880, height: 1800 });
      expect(getScreenResolution({ useDevicePixelRatio: true })).toEqual({ width: 2880, height: 1800 });
    });

    it('reports CSS pixels when opted out', () => {
      vi.stubGlobal('screen', { width: 1440, height: 900 });
      vi.stubGlobal('devicePixelRatio', 2);

      expect(getScreenResolution({ useDevicePixelRatio: false })).toEqual({ width: 1440, height: 900 });
    });

    it('rounds to whole device pixels on a fractional ratio', () => {
      // 390 * 2.75 = 1072.5 → nearest; 844 * 2.75 = 2321 exactly.
      vi.stubGlobal('screen', { width: 390, height: 844 });
      vi.stubGlobal('devicePixelRatio', 2.75);

      expect(getScreenResolution()).toEqual({ width: 1073, height: 2321 });
    });

    it('falls back to CSS pixels for an unusable ratio rather than failing the reading', () => {
      // A CSS-pixel reading is still true and still cappable, so an unusable
      // ratio costs the refinement, not the whole answer.
      vi.stubGlobal('screen', { width: 1440, height: 900 });

      for (const devicePixelRatio of [0, Number.NaN, undefined]) {
        vi.stubGlobal('devicePixelRatio', devicePixelRatio);

        expect(getScreenResolution()).toEqual({ width: 1440, height: 900 });
      }
    });
  });
});

describe('watchScreenResolution', () => {
  /**
   * A `matchMedia` stand-in whose queries can be told to fire. The real one only reports on ratios the environment
   * actually has, so driving a ratio change means driving the query.
   */
  function stubMatchMedia() {
    const queries: Array<{ query: string; fire: () => void }> = [];

    vi.stubGlobal('matchMedia', (query: string) => {
      // A real `EventTarget`, so `once` and `signal` come from the platform rather
      // than from a stub that could model them wrongly — the watcher leans on both.
      const target = new EventTarget();

      queries.push({ query, fire: () => target.dispatchEvent(new Event('change')) });

      return Object.assign(target, { matches: true, media: query });
    });

    return queries;
  }

  /**
   * A mutable screen, so a test can move it the way the environment would. An `EventTarget` because the real one is:
   * `screen` dispatches its own `change`.
   */
  function stubScreen(width: number, height: number, ratio = 1) {
    const screen = Object.assign(new EventTarget(), { width, height, orientation: new EventTarget() });

    vi.stubGlobal('screen', screen);
    vi.stubGlobal('devicePixelRatio', ratio);
    return screen;
  }

  /** Subscribe, then forget the call the subscribe itself makes, so a test can assert on changes alone. */
  function watchChanges(options?: ScreenResolutionOptions) {
    const onChange = vi.fn();
    const stop = watchScreenResolution(onChange, options);

    onChange.mockClear();
    return { onChange, stop };
  }

  describe('on subscribe', () => {
    it('reports the starting value, so a consumer needs no separate read', () => {
      stubScreen(1440, 900);
      const onChange = vi.fn();

      const stop = watchScreenResolution(onChange);

      expect(onChange).toHaveBeenCalledExactlyOnceWith({ width: 1440, height: 900 });
      stop();
    });

    it('reports undefined where there is no screen', () => {
      // Unconditional, so a consumer can tell "there is no screen" from "not
      // called yet". Comparing against an empty starting value would stay silent.
      vi.stubGlobal('screen', undefined);
      const onChange = vi.fn();

      const stop = watchScreenResolution(onChange);

      expect(onChange).toHaveBeenCalledExactlyOnceWith(undefined);
      stop();
    });

    it('honors the reader options', () => {
      stubScreen(1440, 900, 2);
      const onChange = vi.fn();

      const stop = watchScreenResolution(onChange, { useDevicePixelRatio: false });

      expect(onChange).toHaveBeenCalledExactlyOnceWith({ width: 1440, height: 900 });
      stop();
    });
  });

  it('reports a new reading on resize', () => {
    const screen = stubScreen(1440, 900);
    const { onChange, stop } = watchChanges();

    screen.width = 1920;
    screen.height = 1080;
    globalThis.dispatchEvent(new Event('resize'));

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ width: 1920, height: 1080 });
    stop();
  });

  it('does not report when nothing moved', () => {
    // `resize` is noisy, so comparing readings is what keeps it from firing.
    stubScreen(1440, 900);
    const { onChange, stop } = watchChanges();

    globalThis.dispatchEvent(new Event('resize'));

    expect(onChange).not.toHaveBeenCalled();
    stop();
  });

  it("reports on the screen's own change event", () => {
    // The direct signal, and the only one that catches a window moving between
    // two same-size, same-ratio displays. Chromium-only, so the others stay.
    const screen = stubScreen(1440, 900);
    const { onChange, stop } = watchChanges();

    screen.width = 3840;
    screen.height = 2160;
    screen.dispatchEvent(new Event('change'));

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ width: 3840, height: 2160 });
    stop();
  });

  it('reports rotation, which swaps the axes without a resize', () => {
    const screen = stubScreen(390, 844);
    const { onChange, stop } = watchChanges();

    screen.width = 844;
    screen.height = 390;
    screen.orientation.dispatchEvent(new Event('change'));

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ width: 844, height: 390 });
    stop();
  });

  it('reports a device pixel ratio change under a window that kept its size', () => {
    // The cross-display drag: the only coverage that case has in WebKit and Gecko.
    const queries = stubMatchMedia();

    stubScreen(1440, 900, 1);
    const { onChange, stop } = watchChanges();

    expect(queries[0]?.query).toBe('(resolution: 1dppx)');

    vi.stubGlobal('devicePixelRatio', 2);
    queries[0]!.fire();

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ width: 2880, height: 1800 });
    stop();
  });

  it('re-arms the ratio query against the new ratio', () => {
    // A `dppx` query only answers about the ratio it was built for, so the old
    // one goes quiet once the ratio moves.
    const queries = stubMatchMedia();

    stubScreen(1440, 900, 1);
    const { onChange, stop } = watchChanges();

    vi.stubGlobal('devicePixelRatio', 2);
    queries[0]!.fire();

    expect(queries[1]?.query).toBe('(resolution: 2dppx)');

    vi.stubGlobal('devicePixelRatio', 3);
    queries[1]!.fire();

    expect(onChange).toHaveBeenLastCalledWith({ width: 4320, height: 2700 });
    stop();
  });

  it('arms one ratio query, no matter how much else fires', () => {
    // Only the query's own handler re-arms, so noisy signals can't accumulate
    // queries. This is what `once: true` replaces the old ratio bookkeeping with.
    const queries = stubMatchMedia();

    stubScreen(1440, 900, 1);
    const { stop } = watchChanges();

    globalThis.dispatchEvent(new Event('resize'));
    globalThis.dispatchEvent(new Event('resize'));

    expect(queries).toHaveLength(1);
    stop();
  });

  it('reports the reading becoming unknown, then known again', () => {
    const screen = stubScreen(1440, 900);
    const { onChange, stop } = watchChanges();

    screen.width = 0;
    globalThis.dispatchEvent(new Event('resize'));
    expect(onChange).toHaveBeenLastCalledWith(undefined);

    screen.width = 1440;
    globalThis.dispatchEvent(new Event('resize'));
    expect(onChange).toHaveBeenLastCalledWith({ width: 1440, height: 900 });

    expect(onChange).toHaveBeenCalledTimes(2);
    stop();
  });

  it('reports changes in CSS pixels when the ratio is opted out', () => {
    const screen = stubScreen(1440, 900, 2);
    const { onChange, stop } = watchChanges({ useDevicePixelRatio: false });

    screen.width = 1920;
    globalThis.dispatchEvent(new Event('resize'));

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ width: 1920, height: 900 });
    stop();
  });

  it('watches harmlessly where there is no screen to read', () => {
    // Nothing to report from a signal an environment doesn't have, which is not a
    // reason to fail — same line the reading draws.
    vi.stubGlobal('screen', undefined);
    const { onChange, stop } = watchChanges();

    globalThis.dispatchEvent(new Event('resize'));

    expect(onChange).not.toHaveBeenCalled();
    expect(stop).not.toThrow();
  });

  it('stops reporting once stopped', () => {
    const screen = stubScreen(1440, 900);
    const { onChange, stop } = watchChanges();

    stop();
    screen.width = 1920;
    globalThis.dispatchEvent(new Event('resize'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('stops every signal, not just resize', () => {
    // One abort signal behind all of them, so none can outlive the watcher.
    const queries = stubMatchMedia();
    const screen = stubScreen(1440, 900, 1);
    const { onChange, stop } = watchChanges();

    stop();

    screen.width = 1920;
    queries[0]!.fire();
    screen.dispatchEvent(new Event('change'));
    screen.orientation.dispatchEvent(new Event('change'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
