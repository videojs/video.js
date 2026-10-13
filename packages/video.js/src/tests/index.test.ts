import { describe, expect, it } from 'vite-plus/test';

import * as root from '../index';
import videojs, { getComponent, getPlayer, getPlugin, options, registerComponent, registerPlugin } from '../videojs';

describe('video.js', () => {
  it('exports only the Video.js 8 stubs', () => {
    expect(Object.keys(root).sort()).toEqual(
      ['default', 'getComponent', 'getPlayer', 'getPlugin', 'options', 'registerComponent', 'registerPlugin'].sort()
    );

    expect(root.default).toBe(videojs);
    expect(root.registerPlugin).toBe(registerPlugin);
    expect(root.getPlugin).toBe(getPlugin);
    expect(root.registerComponent).toBe(registerComponent);
    expect(root.getComponent).toBe(getComponent);
    expect(root.getPlayer).toBe(getPlayer);
    expect(root.options).toBe(options);
  });
});
