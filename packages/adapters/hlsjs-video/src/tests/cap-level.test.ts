import type { MediaResolution } from '@videojs/media';
import Hls, { type Level } from 'hls.js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  createCapLevelController,
  levelIndexAtOrAbove,
  levelIndexAtOrBelow,
  type RenditionCapPolicy,
  resolutionToPixelArea,
} from '../cap-level';

type FakeLevel = { width: number; height: number; bitrate: number };

const level = (width: number, height: number, bitrate: number): FakeLevel => ({ width, height, bitrate });

/** 16:9 ladder, ascending — the shape hls.js hands to `getMaxLevel`. */
const LADDER: FakeLevel[] = [
  level(640, 360, 800_000),
  level(854, 480, 1_400_000),
  level(1280, 720, 2_800_000),
  level(1920, 1080, 5_000_000),
  level(2560, 1440, 9_000_000),
];

const asLevels = (levels: FakeLevel[]) => levels as unknown as Level[];

function createEngine(levels: FakeLevel[], config: Record<string, unknown> = {}) {
  const listeners = new Map<string, Set<{ fn: (...args: any[]) => void; ctx: unknown }>>();

  return {
    levels,
    autoLevelCapping: -1,
    autoLevelEnabled: true,
    // Where a manual selection lands. `-1` is hls.js for "nothing forced".
    nextLevel: -1,
    currentLevel: -1,
    logger: { log: () => {} },
    config: {
      capLevelToPlayerSize: true,
      capLevelOnFPSDrop: true,
      // Pin the scale factor so a retina host does not change the arithmetic.
      ignoreDevicePixelRatio: true,
      maxDevicePixelRatio: Number.POSITIVE_INFINITY,
      ...config,
    },
    on(event: string, fn: (...args: any[]) => void, ctx?: unknown) {
      if (!listeners.has(event)) listeners.set(event, new Set());

      listeners.get(event)!.add({ fn, ctx });
    },
    off(event: string, fn: (...args: any[]) => void) {
      for (const entry of listeners.get(event) ?? []) {
        if (entry.fn === fn) listeners.get(event)!.delete(entry);
      }
    },
    emit(event: string, data: unknown) {
      for (const { fn, ctx } of [...(listeners.get(event) ?? [])]) fn.call(ctx, event, data);
    },
  } as unknown as Hls;
}

const emit = (engine: Hls, event: string, data: unknown) => (engine as any).emit(event, data);

const controllers: Array<{ destroy(): void }> = [];

afterEach(() => {
  // `startCapping()` opens a one-second interval; destroying clears it.
  while (controllers.length) controllers.pop()!.destroy();

  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

interface SetupOptions {
  maxAutoResolution?: MediaResolution | undefined;
  /** Defaults to on, as a source without the key does. */
  capToPlayerSize?: boolean;
  /**
   * Left unset by default, unlike a source, whose absent key means `'720p'`. The floor and the size cap it bounds are
   * then measurable one at a time; the default itself is a property of the source layer, covered there.
   */
  minAutoResolution?: MediaResolution | undefined;
  levels?: FakeLevel[];
  config?: Record<string, unknown>;
  /** Rendered size of the video element; omit to leave it unmeasurable. */
  playerSize?: { width: number; height: number };
}

function setup({
  maxAutoResolution,
  capToPlayerSize = true,
  minAutoResolution,
  levels = LADDER,
  config,
  playerSize,
}: SetupOptions = {}) {
  const policy: RenditionCapPolicy = { maxAutoResolution, capToPlayerSize, minAutoResolution };
  const engine = createEngine(levels, config);
  const Controller = createCapLevelController(policy);
  const controller = new Controller(engine) as InstanceType<typeof Controller> & { destroy(): void };

  controllers.push(controller);

  // hls.js starts its capping loop from here when the manifest signals video.
  emit(engine, Hls.Events.MANIFEST_PARSED, { levels, firstLevel: 0, video: true });

  if (playerSize) {
    const video = document.createElement('video');

    // jsdom reports an empty bounding rect, and hls.js falls back to the
    // element's width/height attributes when it does.
    video.width = playerSize.width;
    video.height = playerSize.height;
    document.body.appendChild(video);
    emit(engine, Hls.Events.MEDIA_ATTACHING, { media: video });
  }

  return { policy, engine, controller, topIndex: levels.length - 1 };
}

describe('resolutionToPixelArea', () => {
  it.each<[MediaResolution, number]>([
    ['270p', 480 * 270],
    ['360p', 640 * 360],
    ['540p', 960 * 540],
    ['720p', 1280 * 720],
    ['1080p', 1920 * 1080],
    ['1440p', 2560 * 1440],
    ['2160p', 3840 * 2160],
  ])('reads %s as its 16:9 pixel area', (resolution, pixelArea) => {
    expect(resolutionToPixelArea(resolution)).toBe(pixelArea);
  });

  it('treats an absent cap as unbounded', () => {
    expect(resolutionToPixelArea(undefined)).toBe(Number.POSITIVE_INFINITY);
  });

  it('rounds 480p up so the standard 854×480 rendition fits its own cap', () => {
    // 16:9 at 480 tall is 853.33 wide. The exact area (409_600) sits just
    // under the 854×480 (409_920) every real ladder ships, which would push
    // a '480p' cap down to 360p.
    expect(resolutionToPixelArea('480p')).toBe(854 * 480);
    expect(resolutionToPixelArea('480p')).toBeGreaterThan((480 * 480 * 16) / 9);
  });
});

describe('levelIndexAtOrBelow', () => {
  it('picks the largest level at or below the cap', () => {
    expect(levelIndexAtOrBelow(asLevels(LADDER), '720p')).toBe(2);
    expect(levelIndexAtOrBelow(asLevels(LADDER), '1080p')).toBe(3);
  });

  it('admits the rendition a cap is named after', () => {
    // Each rung should select itself rather than the one below it — 854×480 is
    // the case that a strict 16:9 area would get wrong.
    expect(levelIndexAtOrBelow(asLevels(LADDER), '360p')).toBe(0);
    expect(levelIndexAtOrBelow(asLevels(LADDER), '480p')).toBe(1);
    expect(levelIndexAtOrBelow(asLevels(LADDER), '1440p')).toBe(4);
  });

  it('has nothing to cap without a resolution', () => {
    expect(levelIndexAtOrBelow(asLevels(LADDER), undefined)).toBeUndefined();
  });

  it('has nothing to cap without levels', () => {
    expect(levelIndexAtOrBelow(asLevels([]), '720p')).toBeUndefined();
  });

  it('falls back to the smallest level when every rendition is above the cap', () => {
    // Nothing satisfies a 270p cap here; playing over-spec beats not adapting.
    expect(levelIndexAtOrBelow(asLevels(LADDER), '270p')).toBe(0);
  });

  it('measures area rather than height, so an ultrawide rendition counts its full pixels', () => {
    // 2560×1080 carries more pixels than 16:9 1080p despite being 1080 tall,
    // so a 1080p cap excludes it and lands on the 16:9 rendition below.
    const anamorphic = [level(1280, 720, 2_800_000), level(2560, 1080, 8_000_000)];

    expect(levelIndexAtOrBelow(asLevels(anamorphic), '1080p')).toBe(0);
  });

  it('reaches the top of a run of equally sized levels', () => {
    const sameSize = [level(1280, 720, 2_000_000), level(1280, 720, 3_500_000)];

    expect(levelIndexAtOrBelow(asLevels(sameSize), '720p')).toBe(1);
  });

  it('stops below an over-budget level even when a later one fits', () => {
    // hls.js orders levels by height, so a much wider rendition can blow the
    // pixel budget from a lower index. `autoLevelCapping` is an index ceiling,
    // so stopping at the later match would leave index 0 selectable.
    const mixedAspect = [
      level(3840, 720, 6_000_000), // 2_764_800 — over a 1080p budget
      level(1280, 1080, 4_000_000), // 1_382_400 — under it
    ];

    expect(levelIndexAtOrBelow(asLevels(mixedAspect), '1080p')).toBe(0);
  });

  it('ignores levels reported without dimensions', () => {
    const partial = [level(0, 0, 500_000), level(1280, 720, 2_800_000)];

    expect(levelIndexAtOrBelow(asLevels(partial), '720p')).toBe(1);
  });
});

describe('levelIndexAtOrAbove', () => {
  it('picks the smallest level at or above the floor', () => {
    expect(levelIndexAtOrAbove(asLevels(LADDER), '720p')).toBe(2);
    expect(levelIndexAtOrAbove(asLevels(LADDER), '540p')).toBe(2);
  });

  it('admits the rendition a floor is named after', () => {
    // Each rung satisfies its own floor rather than reaching for the next one —
    // 854×480 is the case a strict 16:9 area would get wrong.
    expect(levelIndexAtOrAbove(asLevels(LADDER), '360p')).toBe(0);
    expect(levelIndexAtOrAbove(asLevels(LADDER), '480p')).toBe(1);
    expect(levelIndexAtOrAbove(asLevels(LADDER), '1440p')).toBe(4);
  });

  it('has no floor to apply without a resolution', () => {
    expect(levelIndexAtOrAbove(asLevels(LADDER), undefined)).toBeUndefined();
  });

  it('has no floor to apply without levels', () => {
    expect(levelIndexAtOrAbove(asLevels([]), '720p')).toBeUndefined();
  });

  it('falls back to the largest level when every rendition is below the floor', () => {
    // A floor nothing satisfies cannot cap anything, so it points at the top.
    expect(levelIndexAtOrAbove(asLevels(LADDER), '2160p')).toBe(4);
  });

  it('measures area rather than height, so a narrow rendition does not clear a floor its height would', () => {
    // 960×720 is 720 tall but carries a quarter fewer pixels than 16:9 720p, so
    // a '720p' floor reaches past it — matching how a cap judges the same level.
    const anamorphic = [level(960, 720, 1_500_000), level(1920, 1080, 5_000_000)];

    expect(levelIndexAtOrAbove(asLevels(anamorphic), '720p')).toBe(1);
  });
});

describe('createCapLevelController', () => {
  it('leaves the player-size result alone when no cap is set', () => {
    const { controller, topIndex } = setup({ playerSize: { width: 1920, height: 1080 } });

    // A 1920-wide player admits the 1080p rendition but not 1440p.
    expect(controller.getMaxLevel(topIndex)).toBe(3);
  });

  it('lowers the ceiling to the requested resolution', () => {
    const { controller, topIndex } = setup({
      maxAutoResolution: '720p',
      playerSize: { width: 1920, height: 1080 },
    });

    expect(controller.getMaxLevel(topIndex)).toBe(2);
  });

  it('keeps the player-size ceiling when it is the stricter of the two', () => {
    const { controller, topIndex } = setup({
      maxAutoResolution: '1440p',
      playerSize: { width: 1920, height: 1080 },
    });

    // The caps intersect: 1440p asks for level 4, the player size allows 3.
    expect(controller.getMaxLevel(topIndex)).toBe(3);
  });

  it('writes the intersected ceiling to autoLevelCapping', () => {
    const { engine } = setup({
      maxAutoResolution: '720p',
      playerSize: { width: 1920, height: 1080 },
    });

    expect(engine.autoLevelCapping).toBe(2);
  });

  it('applies a policy change without waiting for the next tick', () => {
    const { engine, policy } = setup({ playerSize: { width: 1920, height: 1080 } });

    expect(engine.autoLevelCapping).toBe(3);

    policy.maxAutoResolution = '480p';
    policy.controller!.apply();

    expect(engine.autoLevelCapping).toBe(1);
  });

  it('returns to the uncapped ceiling when the policy is cleared', () => {
    const { engine, policy } = setup({
      maxAutoResolution: '360p',
      playerSize: { width: 1920, height: 1080 },
    });

    expect(engine.autoLevelCapping).toBe(0);

    policy.maxAutoResolution = undefined;
    policy.controller!.apply();

    expect(engine.autoLevelCapping).toBe(3);
  });

  it('re-resolves the cap after levels are updated', () => {
    const { engine } = setup({
      maxAutoResolution: '720p',
      playerSize: { width: 1920, height: 1080 },
    });

    expect(engine.autoLevelCapping).toBe(2);

    // hls.js drops the two lowest renditions; 720p is now index 0.
    const trimmed = LADDER.slice(2);

    (engine as any).levels = trimmed;
    emit(engine, Hls.Events.LEVELS_UPDATED, { levels: trimmed });

    expect(engine.autoLevelCapping).toBe(0);
  });

  it('caps automatic selection only, leaving the ladder whole for manual choice', () => {
    const { engine } = setup({
      maxAutoResolution: '360p',
      minAutoResolution: '720p',
      playerSize: { width: 320, height: 180 },
    });

    // Every cap here is a ceiling on ABR, never a filter on availability: hls.js
    // reads `autoLevelCapping` only while choosing on its own. The levels a
    // rendition list is built from stay whole, and nothing is forced, so a
    // viewer picking 1440p by hand still gets it.
    expect(engine.autoLevelCapping).toBe(0);
    expect(engine.levels).toHaveLength(LADDER.length);
    expect(engine.nextLevel).toBe(-1);
    expect(engine.currentLevel).toBe(-1);
  });

  it('registers itself on the policy and steps down on destroy', () => {
    const { controller, policy } = setup({ playerSize: { width: 1920, height: 1080 } });

    expect(policy.controller).toBe(controller);

    controller.destroy();

    expect(policy.controller).toBeUndefined();
  });

  it('keeps FPS-drop restrictions, which live behind the base controller', () => {
    const { engine, controller, topIndex } = setup({
      maxAutoResolution: '1440p',
      playerSize: { width: 4096, height: 2160 },
    });

    // A player this large admits the whole ladder; only the cap holds it to 4.
    expect(controller.getMaxLevel(topIndex)).toBe(4);

    // hls.js restricts a level after dropped frames. The restriction is applied
    // inside `super.getMaxLevel()`, so it only survives while we defer to it.
    emit(engine, Hls.Events.FPS_DROP_LEVEL_CAPPING, { droppedLevel: 4, level: 4 });

    expect(controller.getMaxLevel(topIndex)).toBe(3);
  });

  it('still caps while the element has no measurable size', () => {
    // hls.js abandons capping on an unmeasurable element. A requested ceiling
    // does not depend on layout, so a hidden or not-yet-laid-out player still
    // gets it — otherwise ABR would climb past the cap until layout settles.
    const { engine } = setup({ maxAutoResolution: '720p' });

    expect(engine.autoLevelCapping).toBe(2);
  });

  it('reports uncapped on an unmeasurable element when no resolution is requested', () => {
    const { engine } = setup();

    expect(engine.autoLevelCapping).toBe(-1);
  });

  it('hands the slot back to the size measurement once the element can be measured', () => {
    const { engine, controller } = setup({ maxAutoResolution: '1440p' });

    // Unmeasurable: only the resolution ceiling applies.
    expect(engine.autoLevelCapping).toBe(4);

    const video = document.createElement('video');

    video.width = 1920;
    video.height = 1080;
    document.body.appendChild(video);
    emit(engine, Hls.Events.MEDIA_ATTACHING, { media: video });
    controller.detectPlayerSize();

    // Measurable: the stricter player-size ceiling takes over.
    expect(engine.autoLevelCapping).toBe(3);
  });

  describe('with the player-size loop switched off', () => {
    const noSizeCapping = { config: { capLevelToPlayerSize: false } };

    it('still applies the resolution cap', () => {
      // hls.js never starts its capping loop here, so nothing else writes the
      // slot — and a naive implementation would leave the cap inert.
      const { engine } = setup({ maxAutoResolution: '720p', ...noSizeCapping });

      expect(engine.autoLevelCapping).toBe(2);
    });

    it('caps without regard to the player size', () => {
      const { engine } = setup({
        maxAutoResolution: '1440p',
        playerSize: { width: 320, height: 180 },
        ...noSizeCapping,
      });

      expect(engine.autoLevelCapping).toBe(4);
    });

    it('reports uncapped when no resolution is requested', () => {
      const { engine } = setup(noSizeCapping);

      expect(engine.autoLevelCapping).toBe(-1);
    });

    it('re-resolves the cap after levels are updated', () => {
      const { engine } = setup({ maxAutoResolution: '720p', ...noSizeCapping });

      const trimmed = LADDER.slice(2);

      (engine as any).levels = trimmed;
      emit(engine, Hls.Events.LEVELS_UPDATED, { levels: trimmed });

      expect(engine.autoLevelCapping).toBe(0);
    });
  });

  it('layers over a controller supplied through the engine config', () => {
    const policy: RenditionCapPolicy = {
      maxAutoResolution: '720p',
      capToPlayerSize: true,
      minAutoResolution: undefined,
    };
    const engine = createEngine(LADDER);
    const seen: number[] = [];

    class CustomController extends Hls.DefaultConfig.capLevelController {
      getMaxLevel(capLevelIndex: number): number {
        seen.push(capLevelIndex);
        // Ignore the player size entirely; allow everything.
        return capLevelIndex;
      }
    }

    const Controller = createCapLevelController(policy, CustomController);
    const controller = new Controller(engine) as InstanceType<typeof Controller> & { destroy(): void };

    controllers.push(controller);

    expect(controller.getMaxLevel(4)).toBe(2);
    expect(seen).toEqual([4]);
  });

  describe('capToPlayerSize', () => {
    it('caps to the smallest rendition covering the element by default', () => {
      const { controller, topIndex } = setup({ playerSize: { width: 320, height: 180 } });

      // hls.js covers the element rather than staying under it: the 640×360
      // rendition is the first whose largest dimension reaches 320.
      expect(controller.getMaxLevel(topIndex)).toBe(0);
    });

    it('stops the element size from capping when switched off', () => {
      const { controller, topIndex } = setup({
        capToPlayerSize: false,
        playerSize: { width: 320, height: 180 },
      });

      expect(controller.getMaxLevel(topIndex)).toBe(4);
    });

    it('leaves the resolution cap in force when switched off', () => {
      const { controller, topIndex } = setup({
        capToPlayerSize: false,
        maxAutoResolution: '720p',
        playerSize: { width: 320, height: 180 },
      });

      // The size no longer binds; the requested ceiling still does.
      expect(controller.getMaxLevel(topIndex)).toBe(2);
    });

    it('keeps FPS-drop restrictions when switched off', () => {
      const { engine, controller, topIndex } = setup({
        capToPlayerSize: false,
        playerSize: { width: 320, height: 180 },
      });

      expect(controller.getMaxLevel(topIndex)).toBe(4);

      emit(engine, Hls.Events.FPS_DROP_LEVEL_CAPPING, { droppedLevel: 4, level: 4 });

      // The restriction is applied inside `super.getMaxLevel()`, alongside the
      // size ceiling. Switching the size cap off must not be a way around it,
      // which is why the size component is neutralized through the measurement
      // rather than by skipping the call.
      expect(controller.getMaxLevel(topIndex)).toBe(3);
    });

    it('applies a toggle change without waiting for the next tick', () => {
      const { engine, policy } = setup({ playerSize: { width: 320, height: 180 } });

      expect(engine.autoLevelCapping).toBe(0);

      policy.capToPlayerSize = false;
      policy.controller!.apply();

      expect(engine.autoLevelCapping).toBe(4);
    });
  });

  describe('minAutoResolution', () => {
    const smallPlayer = { playerSize: { width: 320, height: 180 } };

    it('raises the size cap to the floor', () => {
      const { controller, topIndex } = setup({ minAutoResolution: '720p', ...smallPlayer });

      // Without a floor this player caps to 360p; the floor holds it at 720p.
      expect(controller.getMaxLevel(topIndex)).toBe(2);
    });

    it('does not raise an explicit maxAutoResolution', () => {
      const { controller, topIndex } = setup({
        maxAutoResolution: '360p',
        minAutoResolution: '720p',
        ...smallPlayer,
      });

      // The floor bounds the size cap only. A requested ceiling is the stricter
      // instruction and wins — it is not a quality minimum being negotiated.
      expect(controller.getMaxLevel(topIndex)).toBe(0);
    });

    it('does nothing while the size cap is off', () => {
      const { controller, topIndex } = setup({
        capToPlayerSize: false,
        minAutoResolution: '480p',
        ...smallPlayer,
      });

      // No size cap to lift, and a floor must never cap anything on its own.
      expect(controller.getMaxLevel(topIndex)).toBe(4);
    });

    it('cannot raise the cap onto a level FPS drops have restricted', () => {
      const { engine, controller, topIndex } = setup({ minAutoResolution: '1440p', ...smallPlayer });

      // The floor reaches the top rung while the device still keeps up.
      expect(controller.getMaxLevel(topIndex)).toBe(4);

      emit(engine, Hls.Events.FPS_DROP_LEVEL_CAPPING, { droppedLevel: 4, level: 4 });

      // Once it does not, the floor must not hand that rung back: the floor says
      // "do not cap a small player this far down", not "decode what you can't".
      expect(controller.getMaxLevel(topIndex)).toBe(3);
    });

    it('cannot raise the cap above the top of the ladder', () => {
      const { controller, topIndex } = setup({ minAutoResolution: '2160p', ...smallPlayer });

      expect(controller.getMaxLevel(topIndex)).toBe(topIndex);
    });

    it('leaves a ladder that starts above the floor alone', () => {
      // Only 1080p and 1440p on offer, so every rung already clears a 720p floor.
      const { controller, topIndex } = setup({
        minAutoResolution: '720p',
        levels: LADDER.slice(3),
        ...smallPlayer,
      });

      expect(controller.getMaxLevel(topIndex)).toBe(0);
    });

    it('applies no floor when none is named', () => {
      const { controller, topIndex } = setup(smallPlayer);

      expect(controller.getMaxLevel(topIndex)).toBe(0);
    });

    it('applies a floor change without waiting for the next tick', () => {
      const { engine, policy } = setup(smallPlayer);

      expect(engine.autoLevelCapping).toBe(0);

      policy.minAutoResolution = '1080p';
      policy.controller!.apply();

      expect(engine.autoLevelCapping).toBe(3);
    });
  });

  it('leaves every rendition of a multi-bitrate audio stream available', () => {
    const policy: RenditionCapPolicy = {
      maxAutoResolution: '720p',
      capToPlayerSize: true,
      minAutoResolution: '720p',
    };
    const levels = [level(0, 0, 64_000), level(0, 0, 128_000)];
    const engine = createEngine(levels);
    const Controller = createCapLevelController(policy);
    const controller = new Controller(engine) as InstanceType<typeof Controller> & { destroy(): void };

    controllers.push(controller);

    // No video codec in the manifest, so hls.js defers capping indefinitely.
    emit(engine, Hls.Events.MANIFEST_PARSED, { levels, firstLevel: 0, video: false });

    expect([-1, 1]).toContain(engine.autoLevelCapping);
    expect(controller.getMaxLevel(1)).toBe(1);
  });
});
