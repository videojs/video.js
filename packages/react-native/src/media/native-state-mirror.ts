import type {
  PlayerContentData,
  PlayerError,
  PlayerStatePatch,
  PlayerTimeRange,
  PlayerUpdate,
} from './NativeEngineStore';

/** A player's state as JS last learned it, field for field with `PlayerStatePatch`. */
export interface NativeState {
  currentTime: number;
  duration: number;
  buffered: readonly PlayerTimeRange[];
  seekable: readonly PlayerTimeRange[];
  error: PlayerError | null;
  paused: boolean;
  ended: boolean;
  seeking: boolean;
  currentSrc: string;
  readyState: number;
  playbackRate: number;
  contentData: PlayerContentData;
}

/** A media element's initial state. */
export const initialNativeState: Readonly<NativeState> = {
  currentTime: 0,
  duration: Number.NaN,
  buffered: [],
  seekable: [],
  error: null,
  paused: true,
  ended: false,
  seeking: false,
  currentSrc: '',
  readyState: 0,
  playbackRate: 1,
  contentData: {},
};

type Field = keyof NativeState;

const FIELDS = [
  'currentTime',
  'duration',
  'buffered',
  'seekable',
  'error',
  'paused',
  'ended',
  'seeking',
  'currentSrc',
  'readyState',
  'playbackRate',
  'contentData',
] as const satisfies readonly (keyof PlayerStatePatch & Field)[];

/**
 * JS's copy of one native player's state, kept by applying {@link PlayerUpdate}s.
 *
 * Updates can arrive out of order: a command's own update is applied when the command returns, ahead of updates from
 * earlier native writes still in flight. Each field keeps the version that last set it, and an update only sets fields
 * it is newer for. So a late update never rolls a field back, and the mirror converges on native state whatever the
 * arrival order.
 */
export class NativeStateMirror {
  #state: NativeState = { ...initialNativeState };
  #versions: Partial<Record<Field, number>> = {};

  /** The current copy. Replaced, never mutated, so a held reference is a consistent snapshot. */
  get state(): Readonly<NativeState> {
    return this.#state;
  }

  /** Returns the fields this update set; empty when it was entirely stale. */
  apply(update: PlayerUpdate): Field[] {
    const applied: Field[] = [];
    let next: NativeState | null = null;

    for (const field of FIELDS) {
      // Present-as-null is a value (a cleared `error`); absent means unchanged.
      if (!Object.hasOwn(update.patch, field)) continue;

      if ((this.#versions[field] ?? 0) >= update.version) continue;

      next = Object.assign(next ?? { ...this.#state }, { [field]: update.patch[field] });
      this.#versions[field] = update.version;
      applied.push(field);
    }

    if (next) this.#state = next;

    return applied;
  }
}
