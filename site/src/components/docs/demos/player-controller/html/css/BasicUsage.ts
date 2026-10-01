import { createPlayer, selectPlayback, selectTime, selectVolume, UIElement } from '@videojs/html';
import { videoFeatures } from '@videojs/html/video';
import '@videojs/html/ui/container';

const { PlayerElement: DemoPlayerElement, PlayerController } = createPlayer({
  features: videoFeatures,
});

class PlayerActions extends UIElement {
  static readonly tagName = 'demo-ctrl-actions';

  readonly #player = new PlayerController(this);

  #disconnect: AbortController | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#disconnect = new AbortController();
    const signal = this.#disconnect.signal;

    const bind = (selector: string, action: () => void) => {
      this.querySelector(selector)?.addEventListener('click', action, { signal });
    };

    bind('.play', () => this.#player.value?.play());
    bind('.pause', () => this.#player.value?.pause());
    bind('.volume', () => this.#player.value?.setVolume(0.5));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }
}

class PlayerState extends UIElement {
  static readonly tagName = 'demo-ctrl-state';

  readonly #playback = new PlayerController(this, selectPlayback);
  readonly #time = new PlayerController(this, selectTime);
  readonly #volume = new PlayerController(this, selectVolume);

  protected override update(changed: Map<string, unknown>): void {
    super.update(changed);
    const playback = this.#playback.value;
    const time = this.#time.value;
    const volume = this.#volume.value;

    if (!playback) return;

    const el = this.querySelector('.text');

    if (el) {
      el.textContent = `Paused: ${playback.paused ? 'Yes' : 'No'} | Time: ${(time?.currentTime ?? 0).toFixed(1)}s | Volume: ${Math.round((volume?.volume ?? 0) * 100)}%`;
    }
  }
}

customElements.define('demo-ctrl-player', DemoPlayerElement);
customElements.define(PlayerActions.tagName, PlayerActions);
customElements.define(PlayerState.tagName, PlayerState);
