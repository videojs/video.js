import type { MediaUIComponent, StateAttrMap } from '@videojs/core';
import { applyElementProps, applyStateDataAttrs, logMissingFeature } from '@videojs/core/dom';
import { isText, translateText } from '@videojs/core/i18n';
import type { PropertyValues } from '@videojs/element';
import { isFunction } from '@videojs/utils/predicate';

import { i18nContext } from '../i18n/context';
import { I18nController } from '../i18n/controller';
import type { PlayerController } from '../player/controller';
import { UIElement } from './ui-element';

/** The core a media UI element drives: it reads `MediaState` and computes `ComponentState`. */
type MediaUICore<ComponentState extends object, MediaState> = MediaUIComponent<object, ComponentState> & {
  setMedia(media: MediaState): void;
};

/**
 * Abstract base for HTML custom elements that display media state with data attributes. `ComponentState` is the state
 * the element reflects to data attributes, and `MediaState` is the player state it reads.
 */
export abstract class MediaUIElement<
  ComponentState extends object = object,
  MediaState extends object = object,
> extends UIElement {
  readonly #i18n = new I18nController(this, i18nContext);

  protected abstract readonly core: MediaUICore<ComponentState, MediaState>;
  protected abstract readonly stateAttrMap: StateAttrMap<ComponentState>;
  protected abstract readonly mediaState: PlayerController<any, MediaState | undefined>;

  override connectedCallback(): void {
    super.connectedCallback();

    if (__DEV__ && !this.mediaState.value && this.mediaState.displayName) {
      logMissingFeature(this.localName, this.mediaState.displayName);
    }
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const media = this.mediaState.value;
    if (!media) return;

    this.core.setMedia(media);
    const state = this.core.getState();

    if (isFunction(this.core.getAttrs)) {
      const attrs = this.core.getAttrs(state) as Record<string, unknown>;

      if (isText(attrs['aria-label'])) {
        attrs['aria-label'] = translateText(attrs['aria-label'], this.#i18n.value);
      }

      applyElementProps(this, attrs);
    }

    applyStateDataAttrs(this, state, this.stateAttrMap);
  }
}
