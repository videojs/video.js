import type { MuxSource } from '@videojs/media/dom/mux';
import { escapeHtml } from '@videojs/utils/string';

import { applyCaptionTracks } from '../captions';
import { findMediaTag } from '../media-element';
import {
  getDirection,
  getInitialPlaybackOverrides,
  onDirectionChange,
  onSandboxStateChange,
  type PlaybackOverrides,
  readSandboxState,
  type SandboxState,
} from '../sandbox-listener';
import { installSandboxMirror } from '../sandbox-mirror';
import { getChapters, getPlaceholderSrc, getPosterSrc, getStoryboardSrc, isLiveSource, SOURCES } from '../sources';
import { renderChapters } from './chapters';
import { bindSandboxHtmlLocaleChange, prepareSandboxHtmlLocale, wrapSandboxHtmlI18n } from './i18n';
import { loadHtmlSkinTag } from './skins';
import { renderStoryboard } from './storyboard';

/** Tag for markup literals. `String.raw`, so a template reads as the HTML it produces. */
export const html = String.raw;

/** The player a page mounts, which fixes its element, its skin family, and the frame around them. */
export type HtmlSandboxPlayer = 'video' | 'audio' | 'background';

/** A source assigned as an object, for what a `src` attribute cannot carry: tokens, license servers, engine options. */
export type HtmlSandboxSource = MuxSource | ({ src: string } & PlaybackOverrides);

/** What a template's markup can read: the shell's selections plus what the runtime derived from them. */
export interface HtmlSandboxContext {
  readonly state: Readonly<SandboxState>;
  /** The live player and skin variants are in use for this render. */
  readonly live: boolean;
  /** The player element for this render, such as `video-player` or `live-audio-player`. */
  readonly playerTag: string;
  /** The skin element the shell selected and the runtime registered, such as `video-skin` or `audio-neutral-skin`. */
  readonly skinTag: string;
  /** The source's poster URL, safe to interpolate into an attribute, or empty when it has none. */
  readonly poster: string;
  /** A tiny blurred rendition of the poster for a blur-up placeholder, attribute-safe, or empty when there is none. */
  readonly placeholder: string;
  /** The selected source's plain URL, or empty when it has none. */
  readonly url: string;
  /** ` src="…"` for the media element, or empty when the source has to be assigned as an object after render. */
  readonly src: string;
  /** The object to assign to the media element's `source` once rendered, when `src` is empty. */
  readonly source: HtmlSandboxSource | undefined;
  /** The attributes the settings menu controls: autoplay, muted, loop, and preload. */
  readonly attrs: string;
  /** Chapter tracks for the source, or empty. */
  readonly chapters: string;
  /** The storyboard track for the source, or empty. */
  readonly storyboard: string;
}

export interface HtmlSandboxOptions {
  readonly player: HtmlSandboxPlayer;
  /** Switch to the live player and skin while the selected source is live. Leave off for media that cannot play one. */
  readonly live?: boolean;
  /**
   * Fold the query-string playback overrides into the initial source. That forces the object form, so the engine is
   * built with them rather than reconfigured afterwards.
   */
  readonly playbackOverrides?: boolean;
  /** The whole player as a consumer would write it: the player element, the skin, and the media inside it. */
  readonly render: (context: HtmlSandboxContext) => string;
  /** Runs once the markup is in the document, for what an attribute cannot carry: assigning `context.source`. */
  readonly attach?: (context: HtmlSandboxContext) => void;
}

/** Render the user-controlled media attributes (autoplay/muted/loop/preload) as HTML attributes. */
export function renderMediaAttrs(state: SandboxState): string {
  return [
    state.autoplay ? 'autoplay' : '',
    state.muted ? 'muted' : '',
    state.loop ? 'loop' : '',
    `preload="${state.preload}"`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function createLatestLoader() {
  let loadVersion = 0;

  return async <Result>(load: () => Promise<Result>): Promise<Result | undefined> => {
    const version = ++loadVersion;

    try {
      const result = await load();

      return version === loadVersion ? result : undefined;
    } catch (error) {
      // Swallow load errors to avoid unhandled promise rejections in callers
      // that do not await the returned promise. Callers can treat `undefined`
      // as a signal that no valid result is available.
      console.error('Failed to load latest result', error);
      return undefined;
    }
  };
}

function loadSkinTag(player: HtmlSandboxPlayer, state: SandboxState, live: boolean): Promise<string> {
  // The background skin is one element with no skin or styling variants, imported by the template.
  if (player === 'background') return Promise.resolve('background-video-skin');

  return loadHtmlSkinTag({ player, live, skin: state.skin, styling: state.styling, source: state.skins });
}

function describeSource(state: SandboxState, playbackOverrides: boolean) {
  const { source, url = '' } = SOURCES[state.source];
  const overrides = playbackOverrides ? getInitialPlaybackOverrides() : {};
  const initial = source ?? (Object.keys(overrides).length > 0 ? { src: url } : undefined);

  return {
    url,
    src: initial ? '' : ` src="${escapeHtml(url)}"`,
    source: initial ? { ...initial, ...overrides } : undefined,
  };
}

function playerTagFor(player: HtmlSandboxPlayer, live: boolean): string {
  if (player === 'background') return 'background-video-player';

  return live ? `live-${player}-player` : `${player}-player`;
}

function createContext(
  options: HtmlSandboxOptions,
  state: SandboxState,
  live: boolean,
  skinTag: string
): HtmlSandboxContext {
  const { url, src, source } = describeSource(state, options.playbackOverrides === true);

  return {
    state,
    live,
    playerTag: playerTagFor(options.player, live),
    skinTag,
    url,
    src,
    source,
    attrs: renderMediaAttrs(state),
    chapters: renderChapters(getChapters(state.source)),
    storyboard: renderStoryboard(getStoryboardSrc(state.source)),
    poster: escapeHtml(getPosterSrc(state.source) ?? ''),
    placeholder: escapeHtml(getPlaceholderSrc(state.source) ?? ''),
  };
}

function getRoot(): HTMLElement {
  const root = document.getElementById('root');
  if (!root) throw new Error('The sandbox page has no #root element.');

  return root;
}

/**
 * Mount a preview page: read the shell's selections, load the skin they name, render the template's player markup with
 * the tags and sources they resolve to, and render again as the shell streams changes. A locale change applies in place
 * through `<media-i18n>` once the player is up; a direction change renders again, since the provider owns the pinned
 * `dir`.
 */
export function createHtmlSandbox(options: HtmlSandboxOptions): void {
  const state = readSandboxState('html');
  const loadLatest = createLatestLoader();
  const root = getRoot();

  installSandboxMirror();

  async function render(): Promise<void> {
    await prepareSandboxHtmlLocale();

    const live = options.live === true && isLiveSource(state.source);
    const skinTag = await loadLatest(() => loadSkinTag(options.player, state, live));
    if (!skinTag) return;

    const context = createContext(options, state, live, skinTag);

    const template = document.createElement('template');

    template.innerHTML = wrapSandboxHtmlI18n(options.render(context));

    // Subtitle tracks are the page's to add, so a template never has to spell them out. They go in while the markup is
    // still inert: a custom media element reads its tracks when it upgrades, not when children arrive later.
    const media = options.player === 'video' ? findMediaTag(template.content) : undefined;

    if (media) applyCaptionTracks(media, state.captions);

    root.replaceChildren(template.content);
    options.attach?.(context);
  }

  void render();

  onSandboxStateChange((change) => {
    Object.assign(state, change);
    void render();
  });

  // The shell repeats the direction after load, so only an actual change is worth a render.
  let direction = getDirection();

  onDirectionChange((next) => {
    if (next === direction) return;

    direction = next;
    void render();
  });

  bindSandboxHtmlLocaleChange(render);
}
