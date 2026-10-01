import { createPlayer, selectPlayback, UIElement } from '@videojs/html';
import { videoFeatures } from '@videojs/html/video';
import '@videojs/html/ui/container';

const { PlayerElement: VideoPlayerElement, PlayerController } = createPlayer({
  features: videoFeatures,
});

class PlayToggle extends UIElement {
  static readonly tagName = 'demo-play-toggle';

  readonly #player = new PlayerController(this, selectPlayback);

  #disconnect: AbortController | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#disconnect = new AbortController();

    this.querySelector('button')?.addEventListener('click', this.#toggle, { signal: this.#disconnect.signal });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  protected override update(changed: Map<string, unknown>): void {
    super.update(changed);
    const state = this.#player.value;
    if (!state) return;

    this.toggleAttribute('data-paused', state.paused);
    this.toggleAttribute('data-ended', state.ended);
  }

  #toggle = (): void => {
    const state = this.#player.value;
    if (!state) return;

    if (state.paused) state.play();
    else state.pause();
  };
}

customElements.define('demo-video-player', VideoPlayerElement);
customElements.define(PlayToggle.tagName, PlayToggle);
