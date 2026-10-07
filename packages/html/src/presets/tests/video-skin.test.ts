import type { FCastSender, FCastSnapshot } from '@videojs/fcast';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { template as videoTemplate } from '../../internal/skins/default-video/template';
import { FCastVideoSkinElement } from '../video-skin';

let tagId = 0;

afterEach(() => {
  document.body.replaceChildren();
  document.getElementById('__media-styles')?.remove();
});

describe('FCastVideoSkinElement', () => {
  it('forwards FCast configuration to the built-in video control', () => {
    const tag = `test-fcast-video-skin-${tagId++}`;

    customElements.define(
      tag,
      class extends FCastVideoSkinElement {
        static template = videoTemplate;
      }
    );
    const skin = document.createElement(tag);
    if (!(skin instanceof FCastVideoSkinElement)) throw new Error(`Failed to create ${tag}`);

    const button = skin.shadowRoot?.querySelector('media-fcast-button');

    expect(button).not.toBeNull();
    const snapshot: FCastSnapshot = {
      availability: 'available',
      connection: 'disconnected',
      paused: true,
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
      speed: 1,
    };
    const sender = Object.assign(new EventTarget(), {
      snapshot,
      prompt: async () => {},
      disconnect: async () => {},
      load: async () => {},
      play: async () => {},
      pause: async () => {},
      seek: async () => {},
      setVolume: async () => {},
      setSpeed: async () => {},
    }) satisfies FCastSender;

    skin.fcastSender = sender;
    skin.fcastSrc = 'https://example.com/receiver.m3u8';
    skin.fcastContentType = 'application/vnd.apple.mpegurl';

    expect(skin.fcastSender).toBe(sender);
    expect(skin.fcastSrc).toBe('https://example.com/receiver.m3u8');
    expect(skin.fcastContentType).toBe('application/vnd.apple.mpegurl');
  });
});
