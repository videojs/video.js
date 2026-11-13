import { describe, expect, it } from 'vite-plus/test';

import * as defaultEntry from '..';
import * as hlsJsEntry from '../hls-js';
import * as spfEntry from '../spf';

describe('MuxAudioAdapter', () => {
  it('is the SPF-backed audio-only Media by default', () => {
    expect(defaultEntry.MuxAudioAdapter).toBe(spfEntry.MuxAudioAdapter);
    expect(defaultEntry.MuxAudioAdapter.engineName).toBe('spf-hls-audio-mpeg-ts');
  });

  it('exports everything the `spf` entry does', () => {
    expect(Object.keys(defaultEntry).sort()).toEqual(Object.keys(spfEntry).sort());
  });

  it('stays hls.js-backed at the `hls-js` entry', () => {
    expect(hlsJsEntry.MuxAudioAdapter).not.toBe(defaultEntry.MuxAudioAdapter);
    expect(hlsJsEntry.MuxAudioAdapter.defaultProps.preload).toBe('metadata');
  });
});
