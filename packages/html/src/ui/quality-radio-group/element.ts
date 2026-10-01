import {
  QualityRadioGroupCore,
  QualityRadioGroupDataAttrs,
  type QualityRadioGroupOption,
  type QualityRadioGroupState,
} from '@videojs/core';
import { applyStateDataAttrs, logMissingFeature, selectQuality } from '@videojs/core/dom';
import { type Text, translateText } from '@videojs/core/i18n';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';

import { i18nContext } from '../../i18n/context';
import { I18nController } from '../../i18n/controller';
import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { MenuRadioGroupElement } from '../menu/radio-group';
import type { MenuRadioItemElement } from '../menu/radio-item';
import { RadioOptionsController } from '../radio-options/controller';

/**
 * Menu radio group that generates an Auto `<media-menu-radio-item>` plus one per video rendition, and shares the
 * selected label and availability with an enclosing menu. An optional `<template>` holding one
 * `<media-menu-radio-item>` customizes each generated item; its `data-part` `label`, `tier`, and `badge` descendants
 * receive the rendition's text.
 */
export class QualityRadioGroupElement extends MenuRadioGroupElement {
  static override readonly tagName = 'media-quality-radio-group';

  static override properties = {
    ...MenuRadioGroupElement.properties,
    disabled: { type: Boolean },
    label: { type: String },
  } satisfies PropertyDeclarationMap<'value' | 'label' | 'disabled'>;

  disabled = false;
  label: Text | string = '';
  formatRendition = QualityRadioGroupCore.defaultProps.formatRendition;

  readonly #core = new QualityRadioGroupCore();
  readonly #i18n = new I18nController(this, i18nContext);
  readonly #mediaState = new PlayerController(this, playerContext, selectQuality);
  readonly #options = new RadioOptionsController<QualityRadioGroupOption>(this, {
    renderItem: (item, label, option) => this.#setContent(item, label, option.tier, option.badge),
    setItemAttributes: (item, option) => item.setAttribute('data-rendition', option.value),
    getOptionCacheKey: (option) => `${option.tier ?? ''}:${option.badge ?? ''}`,
    onValueChange: (value) => {
      const media = this.#mediaState.value;

      if (media) this.#core.selectValue(media, value);
    },
  });

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    if (__DEV__ && !this.#mediaState.value && this.#mediaState.displayName) {
      logMissingFeature(this.localName, this.#mediaState.displayName);
    }
  }

  protected override update(changed: PropertyValues): void {
    const media = this.#mediaState.value;
    let state: QualityRadioGroupState | null = null;

    if (media) {
      this.#core.setProps({ formatRendition: this.formatRendition, disabled: this.disabled, label: this.label });
      this.#core.setMedia(media);
      state = this.#core.getState();

      this.applyDefaultAriaLabel(translateText(this.#core.getLabel(state), this.#i18n.value));
      this.#options.sync(state, this.#i18n.value, this.#i18n.locale);
      this.publishMenuOptionState(state.disabled, state.hidden, state.availability);
    } else {
      this.publishMenuOptionState(true, true, 'unsupported');
    }

    super.update(changed);

    if (state) applyStateDataAttrs(this, state, QualityRadioGroupDataAttrs);
  }

  #setContent(item: MenuRadioItemElement, label: string, tier: string | undefined, badge: string | undefined): void {
    const labelPart = item.querySelector<HTMLElement>('[data-part~="label"]');
    const tierPart = item.querySelector<HTMLElement>('[data-part~="tier"]');
    const badgePart = item.querySelector<HTMLElement>('[data-part~="badge"]');

    if (labelPart) {
      labelPart.textContent = label;
    }

    if (tierPart) {
      tierPart.textContent = tier ?? '';
      tierPart.hidden = !tier;
    }

    if (badgePart) {
      badgePart.textContent = badge ?? '';
      badgePart.hidden = !badge;
    }

    if (!labelPart && !tierPart && !badgePart) {
      item.textContent = [label, tier, badge].filter(Boolean).join(' ');
    }
  }
}

export namespace QualityRadioGroupElement {
  export type State = QualityRadioGroupState;
}
