import { BufferingIndicatorCore, BufferingIndicatorDataAttrs, type BufferingIndicatorProps } from '@videojs/core';
import { applyStateDataAttrs, logMissingFeature, selectPlayback } from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { UIElement } from '../ui-element';

export class BufferingIndicatorElement extends UIElement {
  static readonly tagName = 'media-buffering-indicator';

  static override properties = {
    delay: { type: Number },
  } satisfies PropertyDeclarationMap<keyof BufferingIndicatorProps>;

  delay = BufferingIndicatorCore.defaultProps.delay;

  readonly #core = new BufferingIndicatorCore();
  readonly #state = new PlayerController(this, playerContext, selectPlayback);

  #disconnect: AbortController | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    this.#disconnect = new AbortController();

    this.#core.state.subscribe(() => this.requestUpdate(), {
      signal: this.#disconnect.signal,
    });

    if (__DEV__ && !this.#state.value) {
      logMissingFeature(this.localName, this.#state.displayName!);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  override destroyCallback(): void {
    this.#core.destroy();
    super.destroyCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.#core.setProps(this);
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const media = this.#state.value;
    if (!media) return;

    this.#core.update(media);
    applyStateDataAttrs(this, this.#core.state.current, BufferingIndicatorDataAttrs);
  }
}
