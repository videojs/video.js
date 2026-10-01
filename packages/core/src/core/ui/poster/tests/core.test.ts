import { describe, expect, it } from 'vite-plus/test';

import { PosterCore } from '../core';

describe('PosterCore', () => {
  describe('getState', () => {
    it('is visible before playback starts and hidden after', () => {
      const core = new PosterCore();

      core.setMedia({ started: false, poster: 'poster.jpg' });
      expect(core.getState().visible).toBe(true);

      core.setMedia({ started: true, poster: 'poster.jpg' });
      expect(core.getState().visible).toBe(false);
    });

    it('reports no load state until the binding says otherwise', () => {
      const core = new PosterCore();

      core.setMedia({ started: false, poster: 'poster.jpg' });

      expect(core.getState()).toEqual({
        visible: true,
        src: 'poster.jpg',
        loading: false,
        loaded: false,
        error: false,
      });
    });

    it('reports exactly one load state at a time', () => {
      const core = new PosterCore();

      core.setMedia({ started: false, poster: 'poster.jpg' });

      core.setImageLoadState('loading');
      expect(core.getState()).toMatchObject({ loading: true, loaded: false, error: false });

      core.setImageLoadState('loaded');
      expect(core.getState()).toMatchObject({ loading: false, loaded: true, error: false });

      core.setImageLoadState('error');
      expect(core.getState()).toMatchObject({ loading: false, loaded: false, error: true });

      core.setImageLoadState('none');
      expect(core.getState()).toMatchObject({ loading: false, loaded: false, error: false });
    });

    it('keeps load state independent of the resolved src, which the author may not be using', () => {
      const core = new PosterCore();

      // The author set `src` on their own image, so nothing resolved a poster
      // yet an image is still loading.
      core.setMedia({ started: false, poster: '' });
      core.setImageLoadState('loading');

      expect(core.getState()).toMatchObject({ src: '', loading: true });
    });
  });
});
