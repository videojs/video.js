import { WistiaPlayer } from '@wistia/wistia-player';

import { normalizeWistiaPlayer } from './normalize';
import { type WistiaMediaOptionsProps, wistiaMediaOptions } from './options';
import type { WistiaAdapterProps } from './props';
import { type WistiaSource, wistiaPlayerStyle } from './source';

/**
 * The tag Wistia registers its player element under, and it has to be declared here: this is the module whose
 * evaluation registers the element and the only thing React takes from it, so naming it somewhere that pulls none of
 * Wistia in would leave a bundler free to drop this module and React rendering an undefined tag.
 *
 * `server.ts` declares it too, for the runtimes that resolve there instead.
 *
 * @internal
 */
export const WISTIA_PLAYER_TAG = 'wistia-player';

/** Wistia's own player element: the type of the node React renders and hands back. */
export type { WistiaPlayer };

/**
 * Wistia is the one media here that ships a web component of its own, so this is that component rather than a wrapper
 * around one; the platform packages give it a tag and a player store.
 *
 * `normalizeWistiaPlayer` gives the player the members and events `HTMLMediaElement` has that Wistia names differently
 * or not at all. This class does the rest: the attributes a media element is written with, which Wistia has its own
 * names, spellings, and defaults for.
 */
export class WistiaAdapter extends WistiaPlayer {
  static readonly defaultProps: WistiaAdapterProps = {
    src: '',
    autoplay: false,
    defaultMuted: false,
    muted: false,
    loop: false,
    controls: false,
    playsInline: true,
    preload: 'metadata',
    poster: '',
    source: null,
  };

  /** The hashed id of the media playing, or a Wistia URL to resolve one from. Installed by the normalizer. */
  declare src: string;
  /** Wistia's own options, `mediaId` among them. Assigning applies every one of them to the player. */
  declare source: WistiaSource | null;
  /** The muted state the player starts in. Installed by the normalizer. */
  declare defaultMuted: boolean;
  declare playsInline: boolean;
  declare loop: boolean;

  static override get observedAttributes(): string[] {
    return [...WistiaPlayer.observedAttributes, ...Object.keys(MEDIA_ATTRIBUTES)];
  }

  constructor() {
    super();
    // No cast: this is where Wistia's real class is held to the contract the normalizer describes.
    normalizeWistiaPlayer(this);
  }

  protected override connectedCallback(): void {
    super.connectedCallback?.();
    // Markup that writes none of them still gets them: an absent attribute reports no change to act on, and
    // Wistia's defaults are not a media element's.
    applyOptions(this);
  }

  protected override attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    const apply = MEDIA_ATTRIBUTES[name];

    if (!apply) {
      super.attributeChangedCallback(name, oldValue, newValue);
      return;
    }

    // Wistia writes some of these back from the setter this is about to reach, so the guard is what stops
    // the two answering each other.
    if (oldValue !== newValue) apply(this, newValue as string | null);
  }
}

/**
 * What each attribute a media element is written with does to a Wistia player.
 *
 * The five that configure the player go through `applyOptions` together, which is what lets `controls` going away put
 * the player back the way this media would have had it rather than the way Wistia would. Wistia observes `autoplay`,
 * `poster`, and `preload` too, and these readings win. The other three mean something on their own: Wistia has no `src`
 * and names its media by id, `muted` is the state to start in rather than the live one a mute button drives, and
 * `playsinline` goes no further since Wistia plays inline anyway.
 */
const MEDIA_ATTRIBUTES: Record<string, (player: WistiaAdapter, value: string | null) => void> = {
  autoplay: applyOptions,
  controls: applyOptions,
  loop: applyOptions,
  poster: applyOptions,
  preload: applyOptions,
  muted: (player, value) => {
    player.defaultMuted = value !== null;
  },
  playsinline: (player, value) => {
    player.playsInline = value !== null;
  },
  src: (player, value) => {
    player.src = value ?? '';
  },
};

/** The player's whole configuration, worked out from scratch: cheaper than keeping it up to date piecemeal. */
function applyOptions(player: WistiaAdapter): void {
  const controls = player.hasAttribute('controls');

  Object.assign(
    player,
    wistiaMediaOptions({
      autoplay: player.hasAttribute('autoplay'),
      controls,
      loop: player.hasAttribute('loop'),
      poster: player.getAttribute('poster') ?? undefined,
      preload: (player.getAttribute('preload') ?? undefined) as WistiaMediaOptionsProps['preload'],
    })
  );

  // A source outranks what an attribute decided, whenever it was set — including before the first connect.
  if (player.source) Object.assign(player, player.source);

  Object.assign(player.style, wistiaPlayerStyle(controls));
}
