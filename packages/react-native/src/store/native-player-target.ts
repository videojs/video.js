import type { NativeMedia } from '../media/native-capability';

/**
 * What a react-native player store attaches to.
 *
 * Deliberately local rather than the shared `PlayerTarget` from `@videojs/core/dom`. Two reasons: that module's types
 * reference DOM globals this package's `lib: ["ESNext"]` does not provide, and its `media` is the broad `Media`
 * contract, so every feature would have to re-narrow with a capability predicate. Typing `media` as `NativeMedia` makes
 * the composed capability the guarantee instead.
 */
export interface NativePlayerTarget {
  media: NativeMedia;

  /**
   * Always `null`.
   *
   * The shared `PlayerTarget.container` is typed `MediaContainer | null`, and `MediaContainer extends HTMLElement` — a
   * react-native `<View>` cannot satisfy it. `MediaContainer` needs to be de-DOMed first, either by carving out a
   * `MediaContainerLike` the way `Media` was carved out of `HTMLMediaElement`, or by making `PlayerTarget` generic over
   * its container type.
   *
   * Until then the features that read `target.container` — controls auto-hide, fullscreen, picture-in-picture,
   * orientation lock, remote playback — cannot run here. Playback needs only the `media` half, so nothing in the
   * current feature set misses it.
   */
  container: null;
}
