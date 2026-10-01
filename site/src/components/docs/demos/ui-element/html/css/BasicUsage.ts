import '@videojs/html/video/player';
import '@videojs/html/ui/container';
import { PlayerController, playerContext, type PropertyValues, selectTime, UIElement } from '@videojs/html';

class SeekByElement extends UIElement {
  static readonly tagName = 'demo-seek-by';

  static override properties = {
    seconds: { type: Number },
  };

  seconds = 10;

  readonly #time = new PlayerController(this, playerContext, selectTime);

  #disconnect: AbortController | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#disconnect = new AbortController();
    this.querySelector('button')?.addEventListener('click', this.#seek, { signal: this.#disconnect.signal });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const button = this.querySelector('button');
    if (!button) return;

    if (changed.has('seconds')) {
      const amount = Math.abs(this.seconds);

      button.textContent = `${this.seconds < 0 ? '-' : '+'}${amount}s`;
      button.ariaLabel = `Seek ${this.seconds < 0 ? 'backward' : 'forward'} ${amount} seconds`;
    }

    button.disabled = !this.#time.value;
  }

  #seek = () => {
    const time = this.#time.value;

    time?.seek(time.currentTime + this.seconds);
  };
}

customElements.define(SeekByElement.tagName, SeekByElement);
