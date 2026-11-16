import { describe, expect, it } from 'vite-plus/test';

import * as defaultEntry from '..';
import * as hlsJsEntry from '../hls-js';
import * as spfEntry from '../spf';

describe('MuxVideoAdapter', () => {
  it('is the SPF-backed Media by default', () => {
    expect(defaultEntry.MuxVideoAdapter).toBe(spfEntry.MuxVideoAdapter);
    expect(defaultEntry.MuxVideoAdapter.engineName).toBe('spf-hls-video-mpeg-ts');
  });

  it('exports everything the `spf` entry does', () => {
    expect(Object.keys(defaultEntry).sort()).toEqual(Object.keys(spfEntry).sort());
  });

  it('stays hls.js-backed at the `hls-js` entry', () => {
    expect(hlsJsEntry.MuxVideoAdapter).not.toBe(defaultEntry.MuxVideoAdapter);
    expect(hlsJsEntry.MuxVideoAdapter.defaultProps.preload).toBe('metadata');
  });
});
