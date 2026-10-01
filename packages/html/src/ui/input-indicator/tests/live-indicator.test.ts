import { type VolumeIndicatorCore, VolumeIndicatorDataAttrs } from '@videojs/core';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { LiveIndicator } from '../live-indicator';

afterEach(() => {
  document.body.replaceChildren();
});

describe('LiveIndicator', () => {
  it('uses authored HTML as the mounted visual surface', () => {
    const host = document.createElement('media-volume-indicator');

    host.hidden = true;
    host.innerHTML = `
      <media-volume-indicator-fill>
        <media-volume-indicator-value></media-volume-indicator-value>
      </media-volume-indicator-fill>
    `;
    document.body.append(host);

    const render = vi.fn();
    const indicator = new LiveIndicator<VolumeIndicatorCore.State>({
      host,
      dataAttrs: VolumeIndicatorDataAttrs,
      render,
    });
    const state: VolumeIndicatorCore.State = {
      open: true,
      generation: 1,
      level: 'high',
      value: '60%',
      fill: '60%',
      min: false,
      max: false,
      transitionStarting: true,
      transitionEnding: false,
    };
    const liveElement = indicator.render(state);

    expect(render).toHaveBeenCalledWith(host, state);
    expect(liveElement).toBe(host);
    expect(host.hidden).toBe(false);
    expect(document.body.querySelectorAll('media-volume-indicator')).toHaveLength(1);
    expect(liveElement.getAttribute('data-level')).toBe('high');

    indicator.remove();
    expect(host.hidden).toBe(true);
    expect(document.body.querySelectorAll('media-volume-indicator')).toHaveLength(1);
    expect(host.hasAttribute('data-open')).toBe(false);
    expect(host.hasAttribute('data-level')).toBe(false);
  });
});
