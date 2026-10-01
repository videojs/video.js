import { afterAll, beforeAll, describe, expect, it, type MockInstance, vi } from 'vite-plus/test';

import { ControlsBackdropElement } from '../../ui/controls/backdrop';
import { ControlsContentElement } from '../../ui/controls/content';

/**
 * Tests that direct UI define files register one element while preset composites register complete UI blocks.
 *
 * Tests run sequentially. Each dynamically imports a composite define file and checks the batch of
 * `customElements.define()` calls that resulted. Because modules are cached within a test file, shared sub-elements
 * (e.g. slider parts) are only registered once and subsequent imports skip them via `safeDefine`.
 */
describe('composite define registration', () => {
  let spy: MockInstance;

  /** Tag names registered since `offset` (the call count before an import). */
  function batchSince(offset: number): string[] {
    return spy.mock.calls.slice(offset).map(([tag]) => String(tag));
  }

  beforeAll(() => {
    spy = vi.spyOn(customElements, 'define');
  });

  afterAll(() => {
    spy.mockRestore();
  });

  // ── Player composites ────────────────────────────────────────────────

  describe('video/player', () => {
    it('registers only video-player', async () => {
      const before = spy.mock.calls.length;

      await import('../video/player');
      const batch = batchSince(before);

      expect(batch).toEqual(['video-player']);
    });
  });

  describe('audio/player', () => {
    it('registers audio-player', async () => {
      const before = spy.mock.calls.length;

      await import('../audio/player');
      const batch = batchSince(before);

      expect(batch).toEqual(['audio-player']);
    });
  });

  describe('background/player', () => {
    it('registers background-video-player', async () => {
      const before = spy.mock.calls.length;

      await import('../background/player');
      const batch = batchSince(before);

      expect(batch).toEqual(['background-video-player']);
    });
  });

  describe('live-video/player', () => {
    it('registers only live-video-player', async () => {
      const before = spy.mock.calls.length;

      await import('../live-video/player');

      expect(batchSince(before)).toEqual(['live-video-player']);
    });
  });

  describe('live-audio/player', () => {
    it('registers only live-audio-player', async () => {
      const before = spy.mock.calls.length;

      await import('../live-audio/player');

      expect(batchSince(before)).toEqual(['live-audio-player']);
    });
  });

  // ── Exact UI entries ─────────────────────────────────────────────────

  describe('ui/time-slider', () => {
    it('registers only media-time-slider', async () => {
      const before = spy.mock.calls.length;

      await import('../ui/time-slider');
      const batch = batchSince(before);

      expect(batch).toEqual(['media-time-slider']);
    });
  });

  describe('ui/time-slider-chapters', () => {
    it('registers only the chapter collection', async () => {
      const before = spy.mock.calls.length;

      await import('../ui/time-slider-chapters');
      const batch = batchSince(before);

      expect(batch).toEqual(['media-time-slider-chapters']);
    });
  });

  describe('ui/volume-slider', () => {
    it('registers only media-volume-slider', async () => {
      const before = spy.mock.calls.length;

      await import('../ui/volume-slider');
      const batch = batchSince(before);

      expect(batch).toEqual(['media-volume-slider']);
    });
  });

  describe('ui/slider', () => {
    it('registers media-slider', async () => {
      const before = spy.mock.calls.length;

      await import('../ui/slider');
      const batch = batchSince(before);

      expect(batch).toEqual(['media-slider']);
    });
  });

  // ── Other exact entries ──────────────────────────────────────────────

  describe('ui/time', () => {
    it('registers only media-time', async () => {
      const before = spy.mock.calls.length;

      await import('../ui/time');
      const batch = batchSince(before);

      expect(batch).toEqual(['media-time']);
    });
  });

  describe('ui/alert-dialog', () => {
    it('registers only media-alert-dialog', async () => {
      const before = spy.mock.calls.length;

      await import('../ui/alert-dialog');
      const batch = batchSince(before);

      expect(batch).toEqual(['media-alert-dialog']);
    });
  });

  describe('ui/error-dialog', () => {
    it('registers only media-error-dialog', async () => {
      const before = spy.mock.calls.length;

      await import('../ui/error-dialog');
      const batch = batchSince(before);

      expect(batch).toEqual(['media-error-dialog']);
    });
  });

  describe('ui/controls', () => {
    it('registers only media-controls', async () => {
      const before = spy.mock.calls.length;

      await import('../ui/controls');
      const batch = batchSince(before);

      expect(batch).toEqual(['media-controls']);
    });
  });

  describe('video/ui', () => {
    it('registers the elements used by video skins', async () => {
      const before = spy.mock.calls.length;

      await import('../video/ui');
      const batch = batchSince(before);

      expect(batch).toContain('media-container');
      expect(batch).toContain('media-text');
      expect(batch).toContain('media-menu');
      expect(batch).toContain('media-menu-item');
    });
  });

  // ── Final state ──────────────────────────────────────────────────────

  describe('registry completeness', () => {
    it('all expected elements are registered after importing all composites', () => {
      const expected = [
        // Players + container
        'video-player',
        'audio-player',
        'background-video-player',
        'live-video-player',
        'live-audio-player',
        'media-container',
        // Sliders
        'media-slider',
        'media-time-slider',
        'media-volume-slider',
        // Slider sub-elements
        'media-slider-buffer',
        'media-slider-fill',
        'media-slider-thumb',
        'media-slider-track',
        'media-slider-value',
        'media-slider-preview',
        'media-slider-thumbnail',
        'media-time-slider-chapters',
        'media-time-slider-chapter-title',
        // Time
        'media-time',
        'media-time-group',
        'media-time-separator',
        // Controls
        'media-controls',
        'media-controls-backdrop',
        'media-controls-content',
        'media-controls-group',
        // Dialogs
        'media-alert-dialog',
        'media-dialog-backdrop',
        'media-dialog-close',
        'media-dialog-description',
        'media-dialog-popup',
        'media-dialog-title',
        'media-error-dialog',
      ];

      for (const tagName of expected) {
        expect(customElements.get(tagName), `${tagName} should be registered`).toBeDefined();
      }

      expect(customElements.get('media-controls-backdrop')).toBe(ControlsBackdropElement);
      expect(customElements.get('media-controls-content')).toBe(ControlsContentElement);
    });
  });
});
