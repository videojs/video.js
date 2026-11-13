import { createPlayer, ReactiveElement, selectPlayback, selectPlaybackRate, videoFeatures } from '@videojs/html';
import '@videojs/html/ui/container';
import '@videojs/html/ui/gesture';
import '@videojs/html/ui/controls';
import '@videojs/html/ui/controls-content';
import '@videojs/html/ui/play-button';
import '@videojs/html/ui/playback-rate-button';
import '@videojs/html/ui/time-slider';
import '@videojs/html/ui/slider-track';
import '@videojs/html/ui/slider-fill';
import '@videojs/html/ui/slider-thumb';
import { pauseIcon, playIcon, restartIcon } from '@videojs/html/icons';
import { createSelector } from '@videojs/store';

import { frameFeature, loopFeature, snapshotFeature } from '../../features';

/**
 * A player whose store knows about frames. The stock video features keep play, pause, seek, and rate; the shared
 * features add loop, the frame index with stepping, and a snapshot of the picture on screen. None of them is
 * GIF-specific.
 */
const { PlayerElement, PlayerController: GifPlayerController } = createPlayer({
  features: [...videoFeatures, loopFeature, frameFeature, snapshotFeature],
});

/** Player-state provider registered as `<gif-player>`. Put a `<gif-skin>` with a `<gif-video>` inside it. */
export class GifPlayerElement extends PlayerElement {
  static readonly tagName = 'gif-player';
}

const selectLoop = createSelector(loopFeature);
const selectFrame = createSelector(frameFeature);
const selectSnapshot = createSelector(snapshotFeature);

const loopIcon = /* svg */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`;
const stepIcon = /* svg */ `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 5l9 7-9 7V5z"/><path d="M17 5h2v14h-2z"/></svg>`;
const copyIcon = /* svg */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>`;

const template = /* html */ `
  <style>
    :host {
      display: block;
      position: relative;
      isolation: isolate;
      overflow: hidden;
      border-radius: 1rem;
      background: #0a0a0a;
      color: #fff;
      user-select: none;
      -webkit-user-select: none;
      font: 500 11px/1 ui-sans-serif, system-ui, sans-serif;
    }

    media-container {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
    }

    ::slotted(*) {
      display: block;
      width: 100%;
      height: 100%;
    }

    .badge {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      display: flex;
      gap: 0.375rem;
      pointer-events: none;
      letter-spacing: 0.02em;
    }

    .badge > span {
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      background: rgb(0 0 0 / 0.6);
      backdrop-filter: blur(4px);
    }

    .frames {
      font-family: ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
      color: rgb(255 255 255 / 0.8);
    }

    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      pointer-events: none;
    }

    :host(:not([data-paused])) .overlay {
      display: none;
    }

    .overlay media-play-button {
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 4rem;
      height: 4rem;
      border-radius: 9999px;
      background: rgb(0 0 0 / 0.55);
      backdrop-filter: blur(4px);
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
      cursor: pointer;
      transition: transform 150ms, background 150ms;
    }

    .overlay media-play-button:hover {
      transform: scale(1.05);
      background: rgb(0 0 0 / 0.7);
    }

    .overlay media-play-button svg {
      display: block;
      width: 2rem;
      height: 2rem;
    }

    .hint {
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      background: rgb(0 0 0 / 0.55);
      font-size: 12px;
      font-weight: 400;
    }

    /* The page withholds autoplay under reduced motion; say so until the viewer starts it themselves. */
    .hint {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      :host(:not([data-started])) .hint {
        display: block;
      }
    }

    media-controls-content {
      position: absolute;
      inset: auto 0 0 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 1.5rem 0.5rem 0.5rem;
      background: linear-gradient(to top, rgb(0 0 0 / 0.7), transparent);
      opacity: 0;
      transition: opacity 200ms;
    }

    :host(:hover) media-controls-content,
    :host(:focus-within) media-controls-content,
    :host([data-paused]) media-controls-content {
      opacity: 1;
    }

    :host([minimal]) media-controls {
      display: none;
    }

    .control {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      width: 2rem;
      height: 2rem;
      border: 0;
      border-radius: 9999px;
      background: transparent;
      color: rgb(255 255 255 / 0.9);
      cursor: pointer;
      transition: background 150ms;
    }

    .control:hover {
      background: rgb(255 255 255 / 0.15);
      color: #fff;
    }

    .control:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    .control[disabled],
    .control[aria-disabled='true'] {
      cursor: default;
      opacity: 0.3;
      background: transparent;
    }

    .control[aria-pressed='true'] {
      background: rgb(255 255 255 / 0.25);
      color: #fff;
    }

    .control svg {
      display: block;
      width: 1rem;
      height: 1rem;
      fill: currentColor;
    }

    .step-back svg {
      transform: scaleX(-1);
    }

    .rate {
      width: auto;
      padding: 0 0.5rem;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    /* The play button renders one of its three icons by state. */
    media-play-button .icon-play,
    media-play-button .icon-pause,
    media-play-button .icon-restart {
      display: none;
    }

    media-play-button[data-paused]:not([data-ended]) .icon-play,
    media-play-button:not([data-paused]):not([data-ended]) .icon-pause,
    media-play-button[data-ended] .icon-restart {
      display: block;
    }

    media-time-slider {
      position: relative;
      display: flex;
      flex: 1;
      align-items: center;
      height: 2rem;
      margin: 0 0.25rem;
      cursor: pointer;
      touch-action: none;
    }

    media-slider-track {
      position: relative;
      display: block;
      width: 100%;
      height: 0.25rem;
      overflow: hidden;
      border-radius: 9999px;
      background: rgb(255 255 255 / 0.25);
    }

    media-slider-fill {
      position: absolute;
      inset: 0 auto 0 0;
      display: block;
      width: var(--media-slider-fill);
      background: #fff;
    }

    media-slider-thumb {
      position: absolute;
      top: 50%;
      left: var(--media-slider-fill);
      display: block;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 9999px;
      background: #fff;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
      translate: -50% -50%;
      opacity: 0;
      transition: opacity 150ms;
    }

    :host(:hover) media-slider-thumb,
    media-time-slider:focus-within media-slider-thumb {
      opacity: 1;
    }

    .copy {
      position: relative;
    }

    .copy-status {
      position: absolute;
      top: -1.75rem;
      left: 50%;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      background: rgb(0 0 0 / 0.8);
      font-size: 10px;
      white-space: nowrap;
      translate: -50%;
    }

    .copy-status:empty {
      display: none;
    }
  </style>
  <media-container>
    <slot></slot>
    <media-gesture type="tap" action="togglePaused"></media-gesture>
    <div class="badge">
      <span>GIF</span>
      <span class="frames" hidden></span>
    </div>
    <div class="overlay">
      <media-play-button>
        <span class="icon-play">${playIcon}</span>
        <span class="icon-restart">${restartIcon}</span>
      </media-play-button>
      <span class="hint">Paused for reduced motion</span>
    </div>
    <media-controls>
      <media-controls-content>
        <media-play-button class="control">
          <span class="icon-play">${playIcon}</span>
          <span class="icon-pause">${pauseIcon}</span>
          <span class="icon-restart">${restartIcon}</span>
        </media-play-button>
        <button type="button" class="control step-back" aria-label="Previous frame" data-step="-1">${stepIcon}</button>
        <button type="button" class="control step-forward" aria-label="Next frame" data-step="1">${stepIcon}</button>
        <media-time-slider>
          <media-slider-track>
            <media-slider-fill></media-slider-fill>
          </media-slider-track>
          <media-slider-thumb></media-slider-thumb>
        </media-time-slider>
        <button type="button" class="control loop" aria-label="Loop" aria-pressed="false">${loopIcon}</button>
        <media-playback-rate-button class="control rate">1×</media-playback-rate-button>
        <button type="button" class="control copy" aria-label="Copy this frame" title="Copy this frame as an image">
          ${copyIcon}
          <span class="copy-status" role="status"></span>
        </button>
      </media-controls-content>
    </media-controls>
  </media-container>
`;

/**
 * A skin for GIFs rather than videos, registered as `<gif-skin>`: the first frame shows with no poster layer, a tap
 * anywhere toggles playback, a paused GIF carries one big play affordance, and the bar has what a GIF viewer wants — a
 * frame scrubber with a frame counter, frame stepping, a loop toggle, speed, and copying the still on screen — and
 * nothing a GIF cannot do (no volume, no captions, no fullscreen). `minimal` drops the bar for grids and feeds.
 */
export class GifSkinElement extends ReactiveElement {
  static readonly tagName = 'gif-skin';

  static override properties = {
    minimal: { type: Boolean },
  };

  minimal = false;

  readonly #playback = new GifPlayerController(this, selectPlayback);
  readonly #rate = new GifPlayerController(this, selectPlaybackRate);
  readonly #loop = new GifPlayerController(this, selectLoop);
  readonly #frame = new GifPlayerController(this, selectFrame);
  readonly #snapshot = new GifPlayerController(this, selectSnapshot);
  readonly #store = new GifPlayerController(this);
  #copyStatusTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();

    const root = this.attachShadow({ mode: 'open' });

    root.innerHTML = template;
    root.addEventListener('click', this.#onClick);
  }

  get #part() {
    const root = this.shadowRoot!;

    return {
      frames: root.querySelector<HTMLElement>('.frames')!,
      steps: [...root.querySelectorAll<HTMLButtonElement>('[data-step]')],
      loop: root.querySelector<HTMLButtonElement>('.loop')!,
      rate: root.querySelector<HTMLElement>('.rate')!,
      copy: root.querySelector<HTMLButtonElement>('.copy')!,
      copyStatus: root.querySelector<HTMLElement>('.copy-status')!,
    };
  }

  protected override updated(): void {
    const playback = this.#playback.value;
    const frame = this.#frame.value;
    const rate = this.#rate.value;
    const { frames, steps, loop, rate: rateText, copy } = this.#part;

    this.toggleAttribute('data-paused', playback?.paused ?? true);
    this.toggleAttribute('data-started', playback?.started ?? false);

    const frameCount = frame?.frameCount ?? 0;

    frames.hidden = frameCount === 0;
    frames.textContent = frameCount > 0 ? `${(frame?.currentFrame ?? 0) + 1}/${frameCount}` : '';

    const canStep = (playback?.paused ?? true) && frameCount > 0;

    for (const step of steps) {
      step.disabled = !canStep;
      step.title = canStep ? step.getAttribute('aria-label')! : 'Pause to step frames';
    }

    const looping = this.#loop.value?.loop ?? false;

    loop.setAttribute('aria-pressed', String(looping));
    loop.title = looping ? 'Looping' : 'Play once';
    rateText.textContent = `${rate?.playbackRate ?? 1}×`;
    copy.disabled = this.#snapshot.value?.snapshotAvailability !== 'available';
  }

  #onClick = (event: Event): void => {
    const store = this.#store.value;
    if (!store) return;

    const button = event.composedPath().find((node): node is HTMLButtonElement => node instanceof HTMLButtonElement);
    if (!button || button.disabled) return;

    if (button.dataset.step) {
      store.stepFrame(Number(button.dataset.step));
    } else if (button.classList.contains('loop')) {
      store.setLoop(!store.loop);
    } else if (button.classList.contains('copy')) {
      void this.#copy();
    }
  };

  async #copy(): Promise<void> {
    const store = this.#store.value;
    if (!store) return;

    const copied = await store.copySnapshot();
    const { copyStatus } = this.#part;

    copyStatus.textContent = copied ? 'Copied' : 'Clipboard unavailable';

    if (this.#copyStatusTimer) clearTimeout(this.#copyStatusTimer);

    this.#copyStatusTimer = setTimeout(() => {
      copyStatus.textContent = '';
    }, 1500);
  }
}

for (const element of [GifPlayerElement, GifSkinElement]) {
  if (!customElements.get(element.tagName)) customElements.define(element.tagName, element);
}

declare global {
  interface HTMLElementTagNameMap {
    [GifPlayerElement.tagName]: GifPlayerElement;
    [GifSkinElement.tagName]: GifSkinElement;
  }
}
