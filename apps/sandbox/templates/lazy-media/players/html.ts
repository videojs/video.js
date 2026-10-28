import { type LazyPlayer, type LazyPlayerOptions, observeEmbedFetching } from '@app/shared/lazy-sources';
import type { AudioPlayerElement } from '@videojs/html/audio';
import type { VideoPlayerElement } from '@videojs/html/video';

interface HtmlPlayerTags {
  player: string;
  skin: string;
  /** `lazy-video` or `lazy-audio`. */
  media: string;
  skinClass: string;
}

/** Writes the player markup into `stage` and reports what the lazy media element resolves to. */
export function mountHtmlPlayer(stage: HTMLElement, options: LazyPlayerOptions, tags: HtmlPlayerTags): LazyPlayer {
  const { src, poster, autoplay, muted, preload, onResolved, onEmbedFetching, onStarted } = options;
  // Left off for `none`, so the page shows what lazy media does by default.
  const attrs = `${autoplay ? ' autoplay' : ''}${muted ? ' muted' : ''}${preload === 'none' ? '' : ` preload="${preload}"`}`;

  stage.innerHTML = `
    <${tags.player}${poster ? ` poster="${poster}"` : ''}>
      <${tags.skin} class="${tags.skinClass}">
        <${tags.media} src="${src}" playsinline crossorigin${attrs}></${tags.media}>
      </${tags.skin}>
    </${tags.player}>
  `;

  const player = stage.querySelector<VideoPlayerElement | AudioPlayerElement>(tags.player)!;
  const media = stage.querySelector(tags.media)!;
  let stopEmbedObserver = () => {};
  const syncResolved = () => {
    const child = media.firstElementChild;

    onResolved(child ? `<${child.localName}>` : null);
    stopEmbedObserver();
    onEmbedFetching(false);
    // Embed hosts keep their frame in their shadow root; it's there from the moment the element is created.
    stopEmbedObserver = child
      ? observeEmbedFetching(child.shadowRoot?.querySelector('iframe') ?? null, onEmbedFetching)
      : () => {};
  };
  const observer = new MutationObserver(syncResolved);
  const unsubscribe = player.store.subscribe(() => {
    if (player.store.state.started) onStarted();
  });

  observer.observe(media, { childList: true });
  syncResolved();

  return {
    setSource(next, nextPoster) {
      // The same lazy media element swaps its media in place, so the player's poster has to follow it.
      if (nextPoster) player.setAttribute('poster', nextPoster);
      else player.removeAttribute('poster');

      media.setAttribute('src', next);
    },
    destroy() {
      observer.disconnect();
      stopEmbedObserver();
      unsubscribe();
      stage.replaceChildren();
    },
  };
}
