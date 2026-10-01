import type { MediaResolution } from '@videojs/media';
import Hls, { type Level } from 'hls.js';

/**
 * Live cap inputs the installed cap-level controller reads on every evaluation.
 *
 * Hls.js fixes `capLevelController` when the engine is constructed, so the class cannot carry values that change during
 * playback. The media element owns this object and mutates it in place instead, which is what lets a cap change skip
 * rebuilding the engine.
 */
export interface RenditionCapPolicy {
  /** Highest resolution ABR may auto-select, or `undefined` for no cap. */
  maxAutoResolution: MediaResolution | undefined;
  /** Whether the element's rendered size caps automatic selection. */
  capToPlayerSize: boolean;
  /** Lowest resolution {@link capToPlayerSize} may cap down to, or `undefined` for no floor. */
  minAutoResolution: MediaResolution | undefined;
  /** Registered by the controller's own constructor. */
  controller?: RenditionCapController | undefined;
}

/**
 * Floor applied to the player-size cap unless a source names another.
 *
 * The low rungs of a ladder are there for bad network conditions, and at that end the relationship between resolution
 * and perceived quality stops holding: a small player capped to 360p looks worse than its size alone suggests. No
 * reliable signal exists to key that on, so a fixed floor stands in for one.
 */
export const DEFAULT_MIN_AUTO_RESOLUTION: MediaResolution = '720p';

export interface RenditionCapController {
  /** Re-evaluate the policy now rather than on hls.js's next tick. */
  apply(): void;
}

/**
 * Pixel area of a resolution shorthand, assuming 16:9 — `'720p'` is `1280 × 720`, or `921_600`.
 *
 * Renditions are matched on area rather than literal height so anamorphic variants are judged by how many pixels they
 * actually carry: a 2560×1080 ultrawide rendition costs more than 16:9 1080p and is capped accordingly.
 *
 * Rounds the 16:9 width up so every standard rendition fits its own cap. For `'480p'`, the exact width is 853.33, while
 * ladders ship 854×480. The exact area would put that rendition over its own cap; rounding admits it while still
 * excluding wider renditions.
 */
export function resolutionToPixelArea(resolution: MediaResolution | undefined): number {
  if (resolution === undefined) return Number.POSITIVE_INFINITY;

  const height = Number.parseInt(resolution, 10);
  if (!(Number.isFinite(height) && height > 0)) return Number.POSITIVE_INFINITY;

  return Math.ceil((height * 16) / 9) * height;
}

/**
 * Highest level index that keeps automatic selection at or below `resolution`.
 *
 * `autoLevelCapping` is a ceiling on the _index_, so every level at or below it stays eligible. That makes the answer
 * the end of the leading run that fits the budget, not the single best match: hls.js orders levels by height, so a
 * wider rendition can exceed the pixel budget from a lower index, and capping at the best match would leave it
 * selectable.
 *
 * Falls back to index `0` when even the lowest rung is over budget — playing something over-spec beats refusing to
 * adapt.
 *
 * Returns `undefined` when there is nothing to cap: no resolution requested, or no levels to choose from.
 */
export function levelIndexAtOrBelow(
  levels: readonly Level[],
  resolution: MediaResolution | undefined
): number | undefined {
  const maxPixelArea = resolutionToPixelArea(resolution);
  if (maxPixelArea === Number.POSITIVE_INFINITY || levels.length === 0) return undefined;

  const overBudget = levels.findIndex((level) => (level.width ?? 0) * (level.height ?? 0) > maxPixelArea);

  // Everything fits: the whole ladder is eligible. Otherwise stop one short of
  // the first level that does not, and never below index 0.
  return overBudget === -1 ? levels.length - 1 : Math.max(0, overBudget - 1);
}

/**
 * Lowest level index that keeps a rendition at or above `resolution` eligible.
 *
 * The complement of {@link levelIndexAtOrBelow}, for raising a ceiling rather than lowering one, and reasoned the same
 * way: `autoLevelCapping` is a ceiling on the _index_, so the cheapest ceiling that still admits the floor is the first
 * index that reaches it. Every rung below stays eligible either way, which is what keeps this a bound on capping rather
 * than a quality minimum.
 *
 * Falls back to the top of the ladder when no rendition reaches the floor — a floor nothing can satisfy has no cap to
 * raise.
 *
 * Returns `undefined` when there is no floor to apply: no resolution requested, or no levels to choose from.
 */
export function levelIndexAtOrAbove(
  levels: readonly Level[],
  resolution: MediaResolution | undefined
): number | undefined {
  const minPixelArea = resolutionToPixelArea(resolution);
  if (minPixelArea === Number.POSITIVE_INFINITY || levels.length === 0) return undefined;

  const atFloor = levels.findIndex((level) => (level.width ?? 0) * (level.height ?? 0) >= minPixelArea);

  return atFloor === -1 ? levels.length - 1 : atFloor;
}

type CapLevelControllerClass = typeof Hls.DefaultConfig.capLevelController;

/**
 * Build the `capLevelController` class to hand to the hls.js constructor.
 *
 * `hls.autoLevelCapping` has exactly one writer: hls.js's own `CapLevelController`, which rewrites it on a one-second
 * interval for as long as `capLevelToPlayerSize` is on — and it is on by default here. Assigning the property from
 * outside is undone within a second, so a cap has to be applied from inside the controller rather than in competition
 * with it.
 *
 * The only seam hls.js offers is `getMaxLevel()`, which every value the capping loop writes passes through. Overriding
 * it makes the requested ceiling part of the same single-writer computation.
 *
 * @param policy - Live cap inputs, re-read on every evaluation.
 * @param BaseController - Controller to layer on top of, so a controller passed through
 *   `source.engine.capLevelController` keeps its behavior.
 */
export function createCapLevelController(
  policy: RenditionCapPolicy,
  BaseController: CapLevelControllerClass = Hls.DefaultConfig.capLevelController
): CapLevelControllerClass {
  return class RenditionCapLevelController extends BaseController {
    #hls: Hls;
    #capping = false;
    #measuringWithoutSize = false;

    constructor(hls: Hls) {
      super(hls);
      this.#hls = hls;
      policy.controller = this;

      // hls.js re-evaluates on both of these itself, but only while its capping
      // loop runs. These cover the case where it never starts.
      hls.on(Hls.Events.MANIFEST_PARSED, this.#onLevelsChanged);
      hls.on(Hls.Events.LEVELS_UPDATED, this.#onLevelsChanged);
    }

    destroy() {
      this.#hls.off(Hls.Events.MANIFEST_PARSED, this.#onLevelsChanged);
      this.#hls.off(Hls.Events.LEVELS_UPDATED, this.#onLevelsChanged);

      if (policy.controller === this) policy.controller = undefined;

      super.destroy();
    }

    // hls.js keeps the interval handle private, so the loop is tracked through
    // the public start/stop pair instead of reaching into it.
    startCapping() {
      this.#capping = true;
      super.startCapping();
    }

    stopCapping() {
      this.#capping = false;
      super.stopCapping();
    }

    /**
     * Hls.js derives its player-size ceiling from these two, so reporting an unbounded measurement is how
     * `capToPlayerSize: false` switches that ceiling off while leaving the rest of the base controller intact.
     *
     * Returning early from `getMaxLevel()` instead would be the obvious way to skip the size cap, and it would also
     * skip the levels `capLevelOnFPSDrop` has restricted: those are filtered inside the same `super.getMaxLevel()`
     * call, and `restrictedLevels` is private, so there is no way to reapply them afterwards. Neutralizing the input
     * keeps one path for both.
     */
    get mediaWidth(): number {
      return this.#sizeApplies ? super.mediaWidth : Number.POSITIVE_INFINITY;
    }

    get mediaHeight(): number {
      return this.#sizeApplies ? super.mediaHeight : Number.POSITIVE_INFINITY;
    }

    get #sizeApplies(): boolean {
      return policy.capToPlayerSize && !this.#measuringWithoutSize;
    }

    /**
     * What `super` allows with player size out of the picture — the ladder minus whatever `capLevelOnFPSDrop` has
     * restricted. Reached through the same unbounded-measurement seam the toggle uses, since `restrictedLevels` is
     * private and not readable any other way.
     */
    #topAllowedLevel(capLevelIndex: number): number {
      this.#measuringWithoutSize = true;

      try {
        return super.getMaxLevel(capLevelIndex);
      } finally {
        this.#measuringWithoutSize = false;
      }
    }

    /**
     * Intersect hls.js's player-size ceiling with the requested one. Deferring to `super` first keeps the behavior it
     * owns — notably the level restrictions `capLevelOnFPSDrop` accumulates.
     *
     * The translation from resolution to level index happens here, not when the policy is set, because levels arrive
     * after the option does and shift whenever hls.js drops one.
     */
    getMaxLevel(capLevelIndex: number): number {
      const { levels } = this.#hls;
      let ceiling = super.getMaxLevel(capLevelIndex);

      // Only where there is a size ceiling to lift: `super` reports `-1` when no
      // level is available at all, and player size is no reason to overrule that.
      if (policy.capToPlayerSize && ceiling >= 0) {
        const floor = levelIndexAtOrAbove(levels, policy.minAutoResolution);

        // A floor says "do not cap this small player that far down", not "decode
        // what this device can't", so it stops at the top allowed level.
        if (floor !== undefined) ceiling = Math.min(Math.max(ceiling, floor), this.#topAllowedLevel(capLevelIndex));
      }

      // Narrowing after the floor is what subordinates it: a caller asking for
      // at most 360p gets 360p, however high the floor sits.
      const byResolution = levelIndexAtOrBelow(levels, policy.maxAutoResolution);

      if (byResolution !== undefined) ceiling = Math.min(ceiling, byResolution);

      // A floor can push past the top of the ladder; `capLevelIndex` is the real bound.
      return Math.min(ceiling, capLevelIndex);
    }

    /**
     * Hls.js measures the element here and writes the ceiling it derives. It backs out entirely when the element has no
     * measurable size — sensible for a cap that _is_ the element's size, but a requested resolution ceiling does not
     * depend on layout. A player that is hidden, detached, or not laid out yet still has to honor it.
     */
    detectPlayerSize() {
      super.detectPlayerSize();

      // Through the base getters: the overrides above report an unbounded size
      // while the cap is off, which would pass for a measurable element.
      if (super.mediaWidth > 0 && super.mediaHeight > 0) return;

      this.#applyResolutionCap();
    }

    apply() {
      // While the loop runs it owns the slot, so go through its own path;
      // everything it writes already passes through `getMaxLevel()`.
      if (this.#capping) {
        this.detectPlayerSize();
        return;
      }

      this.#applyResolutionCap();
    }

    /**
     * The ceiling on its own, for when the size measurement is unavailable.
     *
     * Neither `capToPlayerSize` nor `minAutoResolution` reaches this path, and neither has anything to do here: both
     * describe a cap derived from the element's size, and this is precisely the case where no such cap exists — there
     * is none to switch off, and none for a floor to lift.
     */
    #applyResolutionCap() {
      const { levels } = this.#hls;
      if (!levels?.length) return;

      // `-1` is how hls.js spells "uncapped".
      this.#hls.autoLevelCapping = levelIndexAtOrBelow(levels, policy.maxAutoResolution) ?? -1;
    }

    #onLevelsChanged = () => this.apply();
  };
}
