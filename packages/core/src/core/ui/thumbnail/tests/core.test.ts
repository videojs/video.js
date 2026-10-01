import { describe, expect, it } from 'vite-plus/test';

import { ThumbnailCore } from '../core';
import type { ThumbnailImage } from '../types';

function createImage(overrides: Partial<ThumbnailImage> = {}): ThumbnailImage {
  return {
    url: 'sprite.jpg',
    startTime: 0,
    endTime: 5,
    width: 256,
    height: 160,
    coords: { x: 0, y: 0 },
    ...overrides,
  };
}

function createTimeline(count: number, interval = 5): ThumbnailImage[] {
  const images: ThumbnailImage[] = [];
  const cols = 10;
  const tileW = 256;
  const tileH = 160;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    images.push(
      createImage({
        startTime: i * interval,
        endTime: (i + 1) * interval,
        coords: { x: col * tileW, y: row * tileH },
      })
    );
  }

  return images;
}

describe('ThumbnailCore', () => {
  describe('findActiveThumbnail', () => {
    it('clamps to last thumbnail for time past all end times', () => {
      const core = new ThumbnailCore();
      const images = createTimeline(3);

      expect(core.findActiveThumbnail(images, 15)).toBe(images[2]);
      expect(core.findActiveThumbnail(images, 100)).toBe(images[2]);

      const withoutEnds: ThumbnailImage[] = [
        { url: 'sprite.jpg', startTime: 0, width: 256, height: 160, coords: { x: 0, y: 0 } },
        { url: 'sprite.jpg', startTime: 5, width: 256, height: 160, coords: { x: 0, y: 0 } },
        { url: 'sprite.jpg', startTime: 10, width: 256, height: 160, coords: { x: 0, y: 0 } },
      ];

      expect(core.findActiveThumbnail(withoutEnds, 0)).toBe(withoutEnds[0]);
      expect(core.findActiveThumbnail(withoutEnds, 7)).toBe(withoutEnds[1]);
      expect(core.findActiveThumbnail(withoutEnds, 999)).toBe(withoutEnds[2]);
    });
  });

  describe('calculateScale', () => {
    it('returns 1 when no constraints apply', () => {
      const core = new ThumbnailCore();

      expect(
        core.calculateScale(256, 160, { minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity })
      ).toBe(1);
    });

    it('scales down to fit max-width', () => {
      const core = new ThumbnailCore();

      const scale = core.calculateScale(256, 160, {
        minWidth: 0,
        maxWidth: 128,
        minHeight: 0,
        maxHeight: Infinity,
      });

      expect(scale).toBe(0.5);
    });

    it('scales down to fit max-height', () => {
      const core = new ThumbnailCore();

      const scale = core.calculateScale(256, 160, {
        minWidth: 0,
        maxWidth: Infinity,
        minHeight: 0,
        maxHeight: 80,
      });

      expect(scale).toBe(0.5);
    });

    it('uses the smaller ratio when both max constraints apply', () => {
      const core = new ThumbnailCore();

      const scale = core.calculateScale(256, 160, {
        minWidth: 0,
        maxWidth: 128,
        minHeight: 0,
        maxHeight: 40,
      });

      // min(128/256, 40/160) = min(0.5, 0.25) = 0.25
      expect(scale).toBe(0.25);
    });

    it('scales up to meet min-width', () => {
      const core = new ThumbnailCore();

      const scale = core.calculateScale(100, 50, {
        minWidth: 200,
        maxWidth: Infinity,
        minHeight: 0,
        maxHeight: Infinity,
      });

      expect(scale).toBe(2);
    });

    it('scales up to fill the max box', () => {
      const core = new ThumbnailCore();

      const scale = core.calculateScale(256, 160, {
        minWidth: 0,
        maxWidth: 512,
        minHeight: 0,
        maxHeight: 320,
      });

      expect(scale).toBe(2);
    });

    it('lets min constraints win over max', () => {
      const core = new ThumbnailCore();

      const scale = core.calculateScale(100, 50, {
        minWidth: 400,
        maxWidth: 200,
        minHeight: 0,
        maxHeight: Infinity,
      });

      // Filling max-width alone gives 200/100 = 2; min-width raises it to 400/100 = 4.
      expect(scale).toBe(4);
    });
  });

  describe('resize', () => {
    it('returns container and image dimensions for sprite thumbnail', () => {
      const core = new ThumbnailCore();
      const thumbnail = createImage({ coords: { x: 512, y: 320 } });
      const noConstraints = { minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity };

      const result = core.resize(thumbnail, 2560, 1600, noConstraints);

      expect(result).toEqual({
        scale: 1,
        containerWidth: 256,
        containerHeight: 160,
        imageWidth: 2560,
        imageHeight: 1600,
        offsetX: 512,
        offsetY: 320,
      });
    });

    it('returns zero offsets for first tile', () => {
      const core = new ThumbnailCore();
      const thumbnail = createImage({ coords: { x: 0, y: 0 } });
      const noConstraints = { minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity };

      const result = core.resize(thumbnail, 2560, 1600, noConstraints);

      expect(result).toMatchObject({ offsetX: 0, offsetY: 0 });
    });

    it('scales all dimensions uniformly when constrained', () => {
      const core = new ThumbnailCore();
      const thumbnail = createImage({ coords: { x: 512, y: 320 } });

      const result = core.resize(thumbnail, 2560, 1600, {
        minWidth: 0,
        maxWidth: 128,
        minHeight: 0,
        maxHeight: Infinity,
      });

      // scale = 128/256 = 0.5, inset = 1 (scale !== 1)
      expect(result).toEqual({
        scale: 0.5,
        containerWidth: 126,
        containerHeight: 78,
        imageWidth: 1280,
        imageHeight: 800,
        offsetX: 257,
        offsetY: 161,
      });
    });

    it('handles individual images without coords', () => {
      const core = new ThumbnailCore();
      const thumbnail: ThumbnailImage = { url: 'thumb.jpg', startTime: 0, endTime: 5 };
      const noConstraints = { minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity };

      const result = core.resize(thumbnail, 320, 180, noConstraints);

      expect(result).toEqual({
        scale: 1,
        containerWidth: 320,
        containerHeight: 180,
        imageWidth: 320,
        imageHeight: 180,
        offsetX: 0,
        offsetY: 0,
      });
    });

    it('rounds fractional pixel dimensions to integers', () => {
      const core = new ThumbnailCore();
      const thumbnail = createImage({ coords: { x: 512, y: 320 } });

      // maxWidth 177 / tileWidth 256 = scale 0.69140625 → fractional dimensions
      const result = core.resize(thumbnail, 2560, 1600, {
        minWidth: 0,
        maxWidth: 177,
        minHeight: 0,
        maxHeight: Infinity,
      });

      const scale = 177 / 256;
      const inset = 1; // scale !== 1

      expect(result).toEqual({
        scale,
        containerWidth: Math.floor(256 * scale) - inset * 2,
        containerHeight: Math.floor(160 * scale) - inset * 2,
        imageWidth: Math.ceil(2560 * scale),
        imageHeight: Math.ceil(1600 * scale),
        offsetX: Math.ceil(512 * scale) + inset,
        offsetY: Math.ceil(320 * scale) + inset,
      });

      expect(result!.containerWidth).toBeLessThanOrEqual(256 * scale);
      expect(result!.containerHeight).toBeLessThanOrEqual(160 * scale);
      expect(result!.imageWidth).toBeGreaterThanOrEqual(result!.containerWidth);
      expect(result!.imageHeight).toBeGreaterThanOrEqual(result!.containerHeight);
      expect(result!.offsetX).toBeGreaterThanOrEqual(512 * scale);
      expect(result!.offsetY).toBeGreaterThanOrEqual(320 * scale);
      expect(result!.offsetX + result!.containerWidth).toBeLessThanOrEqual((512 + 256) * scale);
      expect(result!.offsetY + result!.containerHeight).toBeLessThanOrEqual((320 + 160) * scale);

      // Verify all pixel values are integers (no sub-pixel rendering gaps).
      for (const key of ['containerWidth', 'containerHeight', 'imageWidth', 'imageHeight', 'offsetX', 'offsetY']) {
        expect(Number.isInteger(result![key as keyof typeof result])).toBe(true);
      }
    });

    it('container dimensions are stable across different tile positions', () => {
      const core = new ThumbnailCore();
      const positions = [
        { x: 0, y: 0 },
        { x: 256, y: 0 },
        { x: 512, y: 0 },
        { x: 768, y: 0 },
        { x: 0, y: 160 },
        { x: 256, y: 160 },
        { x: 512, y: 320 },
        { x: 768, y: 480 },
      ];

      const constraints = { minWidth: 0, maxWidth: 177, minHeight: 0, maxHeight: Infinity };
      const results = positions.map((coords) => core.resize(createImage({ coords }), 2560, 1600, constraints));

      const widths = new Set(results.map((r) => r!.containerWidth));
      const heights = new Set(results.map((r) => r!.containerHeight));

      expect(widths.size).toBe(1);
      expect(heights.size).toBe(1);
    });

    it('clamps container dimensions to zero at extreme scales', () => {
      const core = new ThumbnailCore();
      const thumbnail = createImage();

      // maxWidth 3 / tileWidth 256 → scale so small that floor(h*s) - 2 would be negative.
      const result = core.resize(thumbnail, 2560, 1600, {
        minWidth: 0,
        maxWidth: 3,
        minHeight: 0,
        maxHeight: Infinity,
      });

      expect(result!.containerWidth).toBeGreaterThanOrEqual(0);
      expect(result!.containerHeight).toBeGreaterThanOrEqual(0);
    });

    it('returns undefined when dimensions are unavailable', () => {
      const core = new ThumbnailCore();
      const thumbnail: ThumbnailImage = { url: 'thumb.jpg', startTime: 0, endTime: 5 };

      expect(
        core.resize(thumbnail, 0, 0, { minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity })
      ).toBeUndefined();
    });
  });

  describe('resolveCrossOrigin', () => {
    it('inherits when unset', () => {
      const core = new ThumbnailCore();

      expect(core.resolveCrossOrigin(undefined, 'anonymous')).toBe('anonymous');
      expect(core.resolveCrossOrigin(undefined, 'use-credentials')).toBe('use-credentials');
    });

    it('returns nothing when there is nothing to inherit', () => {
      const core = new ThumbnailCore();

      expect(core.resolveCrossOrigin(undefined, undefined)).toBeUndefined();
      expect(core.resolveCrossOrigin(undefined, null)).toBeUndefined();
    });

    it('prefers an explicit value over the inherited one', () => {
      const core = new ThumbnailCore();

      expect(core.resolveCrossOrigin('anonymous', 'use-credentials')).toBe('anonymous');
    });

    it('opts out of inheritance for an explicit null', () => {
      const core = new ThumbnailCore();

      expect(core.resolveCrossOrigin(null, 'anonymous')).toBeUndefined();
    });

    it('passes an empty value through rather than opting out', () => {
      const core = new ThumbnailCore();

      expect(core.resolveCrossOrigin('', 'use-credentials')).toBe('');
    });
  });

  describe('getState', () => {
    it('returns loading state', () => {
      const core = new ThumbnailCore();
      const state = core.getState(true, false, undefined);

      expect(state).toEqual({ loading: true, error: false, hidden: false });
    });

    it('returns error state', () => {
      const core = new ThumbnailCore();
      const state = core.getState(false, true, undefined);

      expect(state).toEqual({ loading: false, error: true, hidden: true });
    });

    it('returns hidden when no thumbnail and not loading', () => {
      const core = new ThumbnailCore();
      const state = core.getState(false, false, undefined);

      expect(state).toEqual({ loading: false, error: false, hidden: true });
    });

    it('returns visible when thumbnail exists', () => {
      const core = new ThumbnailCore();
      const state = core.getState(false, false, createImage());

      expect(state).toEqual({ loading: false, error: false, hidden: false });
    });
  });

  describe('getAttrs', () => {
    it('returns image attributes with physical LTR cropping', () => {
      const core = new ThumbnailCore();
      const state = core.getState(false, false, createImage());
      const attrs = core.getAttrs(state);

      expect(attrs.dir).toBe('ltr');
      expect(attrs.role).toBe('img');
      expect(attrs['aria-hidden']).toBe('true');
    });
  });

  describe('parseConstraints', () => {
    it('parses valid numeric strings', () => {
      const core = new ThumbnailCore();
      const result = core.parseConstraints({
        minWidth: '100px',
        maxWidth: '200px',
        minHeight: '50px',
        maxHeight: '150px',
      });

      expect(result).toEqual({ minWidth: 100, maxWidth: 200, minHeight: 50, maxHeight: 150 });
    });

    it('defaults non-finite values to 0 for min and Infinity for max', () => {
      const core = new ThumbnailCore();
      const result = core.parseConstraints({
        minWidth: 'none',
        maxWidth: 'none',
        minHeight: '',
        maxHeight: '',
      });

      expect(result).toEqual({ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity });
    });

    it('handles mixed valid and invalid values', () => {
      const core = new ThumbnailCore();
      const result = core.parseConstraints({
        minWidth: '0px',
        maxWidth: '128px',
        minHeight: 'none',
        maxHeight: 'none',
      });

      expect(result).toEqual({ minWidth: 0, maxWidth: 128, minHeight: 0, maxHeight: Infinity });
    });
  });
});
