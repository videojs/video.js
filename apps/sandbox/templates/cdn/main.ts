import '@app/styles.css';
import { isMediaId, MEDIA, type MediaId } from '@app/media';
import { applyCaptionTracks } from '@app/shared/captions';
import { renderChapters } from '@app/shared/html/chapters';
import { createLatestLoader, renderMediaAttrs } from '@app/shared/html/sandbox';
import { packageSkinTag, skinPreset } from '@app/shared/html/skin-tags';
import { renderStoryboard } from '@app/shared/html/storyboard';
import { loadAudioStylesheets, loadVideoStylesheets } from '@app/shared/html/stylesheets';
import { ensureCdnSandboxLocale } from '@app/shared/i18n/cdn-sandbox-locales';
import { syncDocumentLocale } from '@app/shared/i18n/document-locale';
import type { SandboxLocaleTag } from '@app/shared/i18n/locale-meta';
import { findMediaTag } from '@app/shared/media-element';
import {
  getDirection,
  getInitialLocale,
  onDirectionChange,
  onLocaleChange,
  onSandboxStateChange,
  readSandboxState,
} from '@app/shared/sandbox-listener';
import { installSandboxMirror } from '@app/shared/sandbox-mirror';
import {
  getChapters,
  getPosterSrc,
  getStoryboardSrc,
  isLiveSource,
  SOURCES,
  withMuxMaxResolution,
} from '@app/shared/sources';
import type { Skin } from '@app/types';
import { getI18nTranslations } from '@videojs/cdn/i18n';
import { escapeHtml } from '@videojs/utils/string';

const html = String.raw;

const params = new URLSearchParams(location.search);

/** `preset` named this parameter before the skins' player presets took the word, so older links still resolve. */
function readMedia(): MediaId {
  const value = params.get('media') ?? params.get('preset');

  return isMediaId(value) ? value : 'video';
}

const media = readMedia();
const descriptor = MEDIA[media];

const state = readSandboxState('cdn');
const loadLatest = createLatestLoader();
let locale = getInitialLocale();

installSandboxMirror();
let localeApplySeq = 0;

type LitElementLike = HTMLElement & { requestUpdate?: () => void; updateComplete?: Promise<unknown> };

/** The provider carries the pinned direction as its own `dir`, which it keeps over the one its locale implies. */
function wrapCdnPlayerI18n(playerTag: string, inner: string): string {
  const direction = getDirection();
  const dir = direction === 'auto' ? '' : ` dir="${direction}"`;

  return html`
    <${playerTag}>
      <media-i18n${dir}>
        ${inner}
      </media-i18n>
    </${playerTag}>
  `;
}

async function waitForMediaMetadata(timeoutMs = 15_000): Promise<void> {
  const deadline = performance.now() + timeoutMs;

  while (performance.now() < deadline) {
    const video = document.querySelector('video');
    if (video && video.readyState >= HTMLMediaElement.HAVE_METADATA) return;

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

/** Controls only get aria-label after the player store attaches media — poll like e2e. */
async function waitForCdnPlayLabel(expected: string, timeoutMs = 15_000): Promise<string | undefined> {
  await waitForMediaMetadata(timeoutMs);

  const deadline = performance.now() + timeoutMs;

  while (performance.now() < deadline) {
    const provider = document.querySelector('media-i18n') as LitElementLike | null;

    provider?.requestUpdate?.();

    if (provider?.updateComplete) await provider.updateComplete;

    for (const button of document.querySelectorAll('media-play-button')) {
      const el = button as LitElementLike;

      el.requestUpdate?.();

      if (el.updateComplete) await el.updateComplete;
    }

    const playLabel = document.querySelector('media-play-button')?.getAttribute('aria-label');
    if (playLabel === expected) return playLabel;

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  return document.querySelector('media-play-button')?.getAttribute('aria-label') ?? undefined;
}

async function syncCdnI18nProvider(tag: SandboxLocaleTag, seq: number): Promise<void> {
  await ensureCdnSandboxLocale(tag);

  if (seq !== localeApplySeq) return;

  const provider = document.querySelector('media-i18n') as LitElementLike | null;
  if (!provider?.requestUpdate) return;

  provider.requestUpdate();
  await provider.updateComplete;

  if (seq !== localeApplySeq) return;

  // An embed plays in a cross-origin frame with no <video> of its own, so the
  // metadata gate the label check waits on never opens.
  if (!import.meta.env.DEV || tag === 'en' || descriptor.embed) return;

  if (!document.querySelector('media-play-button')) return;

  const expected = getI18nTranslations(tag)['buttons.play'];
  if (!expected) return;

  const playLabel = await waitForCdnPlayLabel(expected);

  if (seq !== localeApplySeq) return;

  if (playLabel !== expected) {
    throw new Error(
      `[videojs/sandbox] CDN controls are "${playLabel ?? '(missing)'}" but registry has "${expected}" for "${tag}". If the registry check passes, wait for media metadata or restart with a clean Vite cache: \`rm -rf apps/sandbox/node_modules/.vite && pnpm dev:sandbox\`.`
    );
  }
}

async function applyLocale(next: SandboxLocaleTag): Promise<void> {
  const seq = ++localeApplySeq;

  await ensureCdnSandboxLocale(next);

  if (seq !== localeApplySeq) return;

  locale = next;
  syncDocumentLocale(locale);
  await syncCdnI18nProvider(locale, seq);
}

// ---------------------------------------------------------------------------
// CDN module loading — mirrors the exact import graph of each CDN bundle.
// ---------------------------------------------------------------------------

async function loadCdnPlayer(skin: Skin, live: boolean) {
  switch (descriptor.player) {
    case 'video':
      if (live) {
        if (skin === 'neutral') await import('@videojs/cdn/live-video-neutral');
        else await import('@videojs/cdn/live-video');
      } else {
        if (skin === 'neutral') await import('@videojs/cdn/video-neutral');
        else await import('@videojs/cdn/video');
      }

      break;
    case 'audio':
      if (live) {
        if (skin === 'neutral') await import('@videojs/cdn/live-audio-neutral');
        else await import('@videojs/cdn/live-audio');
      } else {
        if (skin === 'neutral') await import('@videojs/cdn/audio-neutral');
        else await import('@videojs/cdn/audio');
      }

      break;
    // Player and skin are shared; the element each one renders is what differs,
    // and that arrives from `loadCdnMedia`.
    case 'background':
      await import('@videojs/cdn/background');
      break;
  }
}

async function loadCdnMedia(media: MediaId) {
  switch (media) {
    case 'hlsjs-video':
      await import('@videojs/cdn/media/hlsjs-video');
      break;
    case 'mux-video':
      await import('@videojs/cdn/media/mux-video');
      break;
    // One media loads one flavor, so the SPF-backed element is the only claimant
    // and registers as `<mux-video>` — the CDN page is where that rule is visible,
    // since a page picks bundles at runtime rather than by import path.
    case 'mux-video-spf':
      await import('@videojs/cdn/media/mux-video/spf');
      break;
    case 'mux-audio':
      await import('@videojs/cdn/media/mux-audio');
      break;
    case 'mux-audio-spf':
      await import('@videojs/cdn/media/mux-audio/spf');
      break;
    // `<background-video>` rides along inside the `background` bundle above; the
    // SPF-backed tags are their own bundles, so the page loads them the way it
    // loads every other media element. Both tags are one element, and a CDN page
    // loads bundles at runtime — so it loads only the one the media names.
    case 'hls-background-video':
      await import('@videojs/cdn/media/hls-background-video');
      break;
    case 'mux-background-video':
      await import('@videojs/cdn/media/mux-background-video');
      break;
    case 'native-hls-video':
      await import('@videojs/cdn/media/native-hls-video');
      break;
    case 'hls-video':
      await import('@videojs/cdn/media/hls-video');
      break;
    case 'hls-audio':
      await import('@videojs/cdn/media/hls-audio');
      break;
    case 'dash-video':
      await import('@videojs/cdn/media/dash-video');
      break;
    case 'shaka-video':
      await import('@videojs/cdn/media/shaka-video');
      break;
    // Each embed is one bundle beside the rest, so a page reaches a third-party
    // player the same way it reaches an HLS one — no npm-only step.
    case 'vimeo-video':
      await import('@videojs/cdn/media/vimeo-video');
      break;
    case 'youtube-video':
      await import('@videojs/cdn/media/youtube-video');
      break;
    case 'cloudflare-video':
      await import('@videojs/cdn/media/cloudflare-video');
      break;
    case 'spotify-audio':
      await import('@videojs/cdn/media/spotify-audio');
      break;
    case 'tiktok-video':
      await import('@videojs/cdn/media/tiktok-video');
      break;
    case 'twitch-video':
      await import('@videojs/cdn/media/twitch-video');
      break;
    case 'wistia-video':
      await import('@videojs/cdn/media/wistia-video');
      break;
  }
}

// ---------------------------------------------------------------------------
// Rendering — produces the exact HTML markup the installation builder generates.
// ---------------------------------------------------------------------------

/**
 * An embed fills the skin box the way `<video>` does on its own.
 *
 * TikTok's host floors itself at the portrait 325x578 its player refuses to draw below, so a landscape box needs that
 * floor cleared.
 */
function getEmbedMediaClass(media: MediaId): string {
  return media === 'tiktok-video' ? 'block w-full h-full min-w-0 min-h-0' : 'block w-full h-full';
}

function getPlayerTag(live: boolean): string {
  switch (descriptor.player) {
    case 'background':
      return 'background-video-player';
    case 'audio':
      return live ? 'live-audio-player' : 'audio-player';
    case 'video':
      return live ? 'live-video-player' : 'video-player';
  }
}

function getSkinTag(skin: Skin, live: boolean): string {
  if (descriptor.player === 'background') return 'background-video-skin';

  return packageSkinTag(skinPreset(descriptor.player, live), skin);
}

function loadStylesheets(skin: Skin, live: boolean) {
  if (descriptor.player === 'audio') loadAudioStylesheets(skin, live);
  else if (descriptor.player === 'video') loadVideoStylesheets(skin, live);
  // Background CSS is loaded via dynamic import in loadCdnPlayer.
}

async function render() {
  const live = descriptor.live === true && isLiveSource(state.source);
  const background = descriptor.player === 'background';
  const embed = descriptor.embed === true;
  // A skinned video element takes the source's chapters, storyboard, and poster; an embed brings its own.
  const skinnedVideo = descriptor.player === 'video' && !embed;

  const loaded = await loadLatest(async () => {
    await loadCdnPlayer(state.skin, live);
    await loadCdnMedia(media);
    return true;
  });
  if (!loaded) return;

  // Load the locale before rendering, but outside loadLatest so locale errors keep their specific message.
  await ensureCdnSandboxLocale(locale);

  loadStylesheets(state.skin, live);

  const root = document.getElementById('root')!;
  const playerTag = getPlayerTag(live);
  const skinTag = getSkinTag(state.skin, live);
  const mediaTag = descriptor.tag;
  const source = SOURCES[state.source];
  const storyboard = skinnedVideo ? getStoryboardSrc(state.source) : undefined;
  const poster = skinnedVideo ? getPosterSrc(state.source) : undefined;

  // `<background-video>` renders a fixed progressive MP4, since a native element
  // has no manifest to pick renditions from. The SPF-backed tags take the picked
  // HLS source instead, and the Mux one adds the cap param that is the whole reason
  // that name is worth keeping — `hls-background-video` is the same element against
  // an uncapped manifest.
  const backgroundSrc =
    media === 'mux-background-video'
      ? withMuxMaxResolution(source.url ?? '', '720p')
      : media === 'hls-background-video'
        ? (source.url ?? '')
        : (descriptor.fixedSource ?? '');
  const sourceAttr = `src="${escapeHtml(background ? backgroundSrc : (descriptor.fixedSource ?? source.url ?? ''))}"`;
  // An embed hands playback to a provider that owns autoplay, looping, and how much
  // it preloads, so the settings menu has nothing to attach to — same as the
  // per-embed pages on the html and react platforms.
  const mediaAttrs = embed ? '' : renderMediaAttrs(state);
  const crossoriginAttr = embed ? '' : 'crossorigin';
  const mediaClassAttr = embed ? `class="${getEmbedMediaClass(media)}"` : '';

  // Background video needs viewport dimensions instead of flex centering.
  if (background) {
    root.className = '';
    root.style.cssText = 'width: 100vw; height: 100vh;';
  }

  if (background) {
    root.innerHTML = wrapCdnPlayerI18n(
      playerTag,
      html`
        <${skinTag}>
          <${mediaTag} ${sourceAttr}></${mediaTag}>
        </${skinTag}>
      `
    );
    await syncCdnI18nProvider(locale, localeApplySeq);
    return;
  }

  if (descriptor.player === 'audio') {
    root.innerHTML = html`
      <div class="mx-auto w-full max-w-xl">
        ${wrapCdnPlayerI18n(
          playerTag,
          html`
            <${skinTag}>
              <${mediaTag} ${sourceAttr} ${mediaAttrs}></${mediaTag}>
            </${skinTag}>
          `
        )}
      </div>
    `;
    await syncCdnI18nProvider(locale, localeApplySeq);
    return;
  }

  const skin = html`
    <${skinTag} class="sandbox-video-frame mx-auto max-w-4xl">
      <${mediaTag} ${mediaClassAttr} ${sourceAttr} ${mediaAttrs} playsinline ${crossoriginAttr}>
        ${skinnedVideo ? renderChapters(getChapters(state.source)) : ''}
        ${renderStoryboard(storyboard)}
      </${mediaTag}>
      ${poster ? html`<img slot="poster" src="${escapeHtml(poster)}" alt="Video poster" crossorigin />` : ''}
    </${skinTag}>
  `;

  const template = document.createElement('template');

  template.innerHTML = wrapCdnPlayerI18n(playerTag, skin);

  // Subtitle tracks go in while the markup is still inert, as on the html pages: a custom media element reads its
  // tracks when it upgrades. An embed hands captions to its provider, so it gets none.
  const mediaElement = skinnedVideo ? findMediaTag(template.content) : undefined;

  if (mediaElement) applyCaptionTracks(mediaElement, state.captions);

  root.replaceChildren(template.content);

  await syncCdnI18nProvider(locale, localeApplySeq);

  if (import.meta.env.DEV && !document.querySelector('media-i18n')) {
    throw new Error(
      '[videojs/sandbox] The CDN page requires <media-i18n>. Run pnpm dev:sandbox (or pnpm exec tsx scripts/setup.ts).'
    );
  }
}

async function init(): Promise<void> {
  syncDocumentLocale(locale);
  await render();
}

void init();

onSandboxStateChange((change) => {
  Object.assign(state, change);
  render();
});

// The shell repeats the direction after load, so only an actual change is worth a render.
let direction = getDirection();

onDirectionChange((next) => {
  if (next === direction) return;

  direction = next;
  render();
});

onLocaleChange((next) => {
  const provider = document.querySelector('media-i18n');

  if (provider) {
    void applyLocale(next);
    return;
  }

  const seq = ++localeApplySeq;

  void (async () => {
    await ensureCdnSandboxLocale(next);

    if (seq !== localeApplySeq) return;

    locale = next;
    syncDocumentLocale(locale);
    await render();
  })();
});
