import * as dashjs from 'dashjs';
import Hls from 'hls.js';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vite-plus/test';

import { toMuxDataEngineOptions } from '../engine';

/** Shaped like an hls.js instance, class statics included. */
class FakeHlsJsEngine {
  static Events = { MANIFEST_LOADED: 'hlsManifestLoaded' };
  static ErrorDetails = { MANIFEST_LOAD_ERROR: 'manifestLoadError' };
  static version = '1.6.15';
  levels: unknown[] = [];
  on() {}
  off() {}
}

/** Shaped like a dash.js v5 `MediaPlayerClass`. */
class FakeDashJsEngine {
  getCurrentTrackFor() {
    return null;
  }
  getRepresentationsByType() {
    return [];
  }
  on() {}
  off() {}
}

let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('toMuxDataEngineOptions', () => {
  it('wires an hls.js engine and its class into the hls.js integration', () => {
    const engine = new FakeHlsJsEngine();

    expect(toMuxDataEngineOptions(engine)).toEqual({ hlsjs: engine, Hls: FakeHlsJsEngine });
  });

  it('wires a dash.js player into the dash.js integration', () => {
    const engine = new FakeDashJsEngine();

    expect(toMuxDataEngineOptions(engine)).toEqual({ dashjs: engine });
  });

  it('wires a pre-v5 dash.js player into the dash.js integration', () => {
    // v5 replaced `getBitrateInfoListFor` with `getRepresentationsByType`, and
    // `mux-embed` reads whichever the player has.
    const engine = { on() {}, off() {}, getCurrentTrackFor() {}, getBitrateInfoListFor() {} };

    expect(toMuxDataEngineOptions(engine)).toEqual({ dashjs: engine });
  });

  it('sends no engine options for media with no engine', () => {
    expect(toMuxDataEngineOptions(null)).toEqual({});
    expect(toMuxDataEngineOptions(undefined)).toEqual({});
  });

  it('sends no engine options for an engine it has no integration for', () => {
    // An SPF playback engine: a composition, not a handle `mux-embed` can hook.
    const engine = { state: {}, context: {}, destroy: () => Promise.resolve() };

    expect(toMuxDataEngineOptions(engine)).toEqual({});
  });

  it('skips the hls.js integration when the engine class publishes no events', () => {
    // `mux-embed` needs the class to hook hls.js events, and reaches for
    // `window.Hls` when it isn't given one — better to monitor the element alone
    // than to let it pick up an unrelated global.
    const engine = { levels: [], on() {}, off() {} };

    expect(toMuxDataEngineOptions(engine)).toEqual({});
  });

  // The engines are matched by shape, so the real instances are what keeps the
  // match honest as hls.js and dash.js evolve.
  it('recognizes a real hls.js instance', () => {
    const engine = new Hls();

    expect(toMuxDataEngineOptions(engine)).toEqual({ hlsjs: engine, Hls });

    engine.destroy();
  });

  it('recognizes a real dash.js player', () => {
    const engine = dashjs.MediaPlayer().create();

    expect(toMuxDataEngineOptions(engine)).toEqual({ dashjs: engine });
  });

  it('warns once per unrecognized engine in development', () => {
    const engine = { destroy: () => {} };

    toMuxDataEngineOptions(engine);
    toMuxDataEngineOptions(engine);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('could not hook this playback engine'), engine);
  });
});
