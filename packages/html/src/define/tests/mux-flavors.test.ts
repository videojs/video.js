/**
 * The engine each Mux define entry registers. The bare `media/mux-video` and `media/mux-audio` entries are the SPF
 * flavor; hls.js is reached only through the explicit `hls-js` entry, which this file leaves unimported so the default
 * registration is what holds the tag.
 */
import { describe, expect, it } from 'vite-plus/test';

import { MuxAudio as SpfMuxAudio } from '../../media/mux-audio/spf';
import { MuxVideo as SpfMuxVideo } from '../../media/mux-video/spf';
import { MuxAudioElement } from '../media/mux-audio';
import { MuxAudioElement as SpfMuxAudioElement } from '../media/mux-audio/spf';
import { MuxVideoElement } from '../media/mux-video';
import { MuxVideoElement as SpfMuxVideoElement } from '../media/mux-video/spf';

describe('MuxVideoElement', () => {
  it('registers the SPF-backed flavor as <mux-video> by default', () => {
    expect(MuxVideoElement).toBe(SpfMuxVideoElement);
    expect(customElements.get('mux-video')).toBe(MuxVideoElement);
    expect(Object.getPrototypeOf(MuxVideoElement)).toBe(SpfMuxVideo);
  });
});

describe('MuxAudioElement', () => {
  it('registers the SPF-backed flavor as <mux-audio> by default', () => {
    expect(MuxAudioElement).toBe(SpfMuxAudioElement);
    expect(customElements.get('mux-audio')).toBe(MuxAudioElement);
    expect(Object.getPrototypeOf(MuxAudioElement)).toBe(SpfMuxAudio);
  });
});
