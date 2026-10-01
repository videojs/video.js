import * as html from '@videojs/html';
import { describe, expect, it } from 'vite-plus/test';

import * as root from '../index';
import videojs, { getComponent, getPlayer, getPlugin, options, registerComponent, registerPlugin } from '../videojs';

describe('video.js', () => {
  it('registers the video preset on import, matching the CDN video.js bundle', () => {
    expect(customElements.get('video-player')).toBeDefined();
    expect(customElements.get('video-skin')).toBeDefined();
    expect(customElements.get('media-i18n')).toBeDefined();
  });

  it('re-exports everything @videojs/html exports', () => {
    for (const name of Object.keys(html)) {
      expect(root[name as keyof typeof root], name).toBe(html[name as keyof typeof html]);
    }
  });

  it('adds the Video.js 8 stubs without shadowing an @videojs/html export', () => {
    const stubs = [
      'default',
      'registerPlugin',
      'getPlugin',
      'registerComponent',
      'getComponent',
      'getPlayer',
      'options',
    ];

    for (const name of stubs) {
      expect(name in html, name).toBe(false);
    }

    expect(root.default).toBe(videojs);
    expect(root.registerPlugin).toBe(registerPlugin);
    expect(root.getPlugin).toBe(getPlugin);
    expect(root.registerComponent).toBe(registerComponent);
    expect(root.getComponent).toBe(getComponent);
    expect(root.getPlayer).toBe(getPlayer);
    expect(root.options).toBe(options);
  });
});
