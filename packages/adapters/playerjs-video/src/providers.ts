import type { PlayerJsAdapterProps } from './props';

/** The host props a provider can express as embed URL parameters. */
export type PlayerJsProviderProps = Partial<
  Pick<PlayerJsAdapterProps, 'autoplay' | 'defaultMuted' | 'loop' | 'controls' | 'preload'>
>;

/**
 * What the host knows about one player.js service's URL. player.js standardizes the messages an embed answers, not its
 * URL, so each service spells autoplay, mute, loop, and its chrome its own way. A service without an entry still plays;
 * the host just drives those props over the protocol alone, once the embed reports ready.
 */
interface PlayerJsProvider {
  readonly name: string;
  matches(url: URL): boolean;
  /** Parameters for the host's props. `null` leaves the service's default in place. */
  params(props: PlayerJsProviderProps): Record<string, string | null>;
}

/**
 * Every provider hides as much of its own chrome as it allows without `controls`, since a player skin above the frame
 * is expected to be the UI. Parameters a service defaults the wrong way for that (Gumlet and Streamable loop, Bunny
 * autoplays) are spelled out either way rather than left to the service; the rest are only written when turned on.
 */
const PROVIDERS: readonly PlayerJsProvider[] = [
  {
    // https://docs.gumlet.com/video/embed-stream
    name: 'gumlet',
    matches: (url) => url.hostname === 'play.gumlet.io',
    params: ({ autoplay, loop, controls }) => ({
      autoplay: autoplay ? 'true' : 'false',
      loop: loop ? 'true' : 'false',
      // Leaves only the large center play button; `background` would hide that too, but forces autoplay and loop.
      disable_player_controls: controls ? null : 'true',
    }),
  },
  {
    // Streamable documents no parameters; these are the ones its embed page reads.
    name: 'streamable',
    matches: (url) => url.hostname === 'streamable.com' || url.hostname === 'www.streamable.com',
    params: ({ autoplay, defaultMuted, loop, controls }) => ({
      // Read as on only for `1`; any other value, `0` included, is the default of off.
      autoplay: autoplay ? '1' : null,
      muted: defaultMuted ? '1' : null,
      loop: loop ? null : '0',
      // Read as on whatever its value, so it can only be left out to keep the controls.
      nocontrols: controls ? null : '1',
    }),
  },
  {
    // https://bunny.net/docs/stream/embedding
    name: 'bunny',
    matches: (url) => url.hostname === 'iframe.mediadelivery.net' || url.hostname === 'player.mediadelivery.net',
    params: ({ autoplay, defaultMuted, loop, controls, preload }) => ({
      autoplay: autoplay ? 'true' : 'false',
      muted: defaultMuted ? 'true' : null,
      loop: loop ? 'true' : 'false',
      preload: preload === 'none' ? 'false' : null,
      // Bunny has no parameter that hides its control bar, so it is shrunk to the least it offers instead.
      ...(!controls && {
        compactControls: 'true',
        showSpeed: 'false',
        showHeatmap: 'false',
        chromecast: 'false',
        disableAirPlay: 'true',
      }),
    }),
  },
  {
    // https://support.livid.com/article/46-advanced-embedding-parameters
    name: 'livid',
    matches: (url) => url.hostname === 'livid.com' || url.hostname === 'www.livid.com',
    params: ({ autoplay, defaultMuted, loop, controls, preload }) => ({
      autoplay: autoplay ? '1' : null,
      muted: defaultMuted ? '1' : null,
      loop: loop ? '1' : null,
      // Hides every player element, the play button included. Livid honors it for Pro and Premium accounts only;
      // `background` would too, but forces autoplay, loop, and mute.
      controls: controls ? null : '0',
      // Livid reads the media element's own values, so the prop passes straight through.
      preload: preload ?? null,
    }),
  },
  {
    // FrameRate documents no parameters; these are the ones its embed page reads, and its own embed-code builder writes.
    name: 'framerate',
    matches: (url) => url.hostname === 'framerate.tv' || url.hostname === 'www.framerate.tv',
    params: ({ autoplay, defaultMuted, loop, controls }) => ({
      // Each is read as on only for `1`.
      autoplay: autoplay ? '1' : null,
      muted: defaultMuted ? '1' : null,
      loop: loop ? '1' : null,
      // The control bar and the large start button are separate switches; `controls=0` alone hides neither.
      ...(!controls && { show_controls: '0', initial_play_btn: '0' }),
    }),
  },
  {
    // https://www.mux.com/docs/guides/player: the iframe embed takes Mux Player's attributes as query parameters.
    name: 'mux',
    matches: (url) => url.hostname === 'player.mux.com',
    params: ({ autoplay, defaultMuted, loop, preload }) => ({
      // Boolean attributes, so a present `false` would still read as on; they are only written when on.
      autoplay: autoplay ? 'true' : null,
      muted: defaultMuted ? 'true' : null,
      loop: loop ? 'true' : null,
      preload: preload ?? null,
      // No parameter hides the controls: that takes the `--controls` CSS property, which the iframe does not expose,
      // and a `theme` the embed does not bundle leaves no video at all.
    }),
  },
];

/** The known service an embed URL belongs to, if any. */
export function getPlayerJsProvider(url: URL): PlayerJsProvider | undefined {
  return PROVIDERS.find((provider) => provider.matches(url));
}
