import type { RadioOption, RadioOptionsState } from '@videojs/core';
import { applyElementProps } from '@videojs/core/dom';
import { type Translator, translateText } from '@videojs/core/i18n';
import type { ReactiveController, ReactiveControllerHost } from '@videojs/element';
import { cloneTemplateRoot, getTemplateElement, getTemplateRoot } from '@videojs/utils/dom';
import { isUndefined } from '@videojs/utils/predicate';

import { cacheKey } from '../../i18n/cache-key';
import { MenuItemIndicatorElement } from '../menu/item-indicator';
import { MenuRadioItemElement } from '../menu/radio-item';

export type RadioOptionsControllerHost = ReactiveControllerHost &
  HTMLElement & {
    value: string;
  };

export interface RadioOptionsControllerConfig<Option extends RadioOption> {
  renderItem?: ((item: MenuRadioItemElement, label: string, option: Option) => void) | undefined;
  setItemAttributes?: ((item: MenuRadioItemElement, option: Option) => void) | undefined;
  getOptionCacheKey?: ((option: Option) => string) | undefined;
  onValueChange: (value: string) => void;
}

/** Renders normalized options into menu radio items and manages their interaction lifecycle. */
export class RadioOptionsController<Option extends RadioOption> implements ReactiveController {
  readonly #host: RadioOptionsControllerHost;
  readonly #config: RadioOptionsControllerConfig<Option>;

  #contentKey = '';
  #translator: Translator | null = null;
  #disconnect: AbortController | null = null;

  constructor(host: RadioOptionsControllerHost, config: RadioOptionsControllerConfig<Option>) {
    this.#host = host;
    this.#config = config;
    host.addController(this);
  }

  hostConnected(): void {
    this.#disconnect = new AbortController();
    this.#host.addEventListener('value-change', this.#handleValueChange, { signal: this.#disconnect.signal });
  }

  hostDisconnected(): void {
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  hostDestroyed(): void {
    this.hostDisconnected();
  }

  sync(state: RadioOptionsState<Option>, translator: Translator, locale: string): void {
    this.#host.value = state.value;
    applyElementProps(this.#host, {
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    });

    const template = getTemplateElement(this.#host);
    const templateRoot = template ? getTemplateRoot(template) : null;
    const itemRoot = templateRoot?.localName === MenuRadioItemElement.tagName ? templateRoot : null;

    const contentKey = `${state.options
      .map(
        (option) =>
          `${option.value}:${cacheKey(option.label, option.labelParams)}:${cacheKey(option.ariaLabel ?? '', option.ariaLabelParams)}:${this.#config.getOptionCacheKey?.(option) ?? ''}`
      )
      .join('|')}::${locale}::${template?.innerHTML ?? ''}`;

    if (contentKey !== this.#contentKey || translator !== this.#translator) {
      this.#contentKey = contentKey;
      this.#translator = translator;

      const staleChildren = [...this.#host.children].filter((child) => child !== template);
      const focusedValue = this.#getFocusedItem()?.value;

      const items = state.options.map((option) => {
        const item = itemRoot
          ? (cloneTemplateRoot(itemRoot, this.#host.ownerDocument) as MenuRadioItemElement)
          : (this.#host.ownerDocument.createElement(MenuRadioItemElement.tagName) as MenuRadioItemElement);

        item.value = option.value;
        this.#config.setItemAttributes?.(item, option);
        const label = translateText(option.label, translator, option.labelParams);

        if (this.#config.renderItem) this.#config.renderItem(item, label, option);
        else this.#setItemLabel(item, label);

        if (!isUndefined(option.ariaLabel)) {
          item.setAttribute('aria-label', translateText(option.ariaLabel, translator, option.ariaLabelParams));
        }

        return item;
      });

      this.#host.append(...items);

      const removeStale = () => {
        for (const child of staleChildren) child.remove();
      };

      // Removing the focused item fires a `focusout` with no destination, which closes an open menu. Its replacement
      // registers with the menu, and becomes focusable, on its first update, so the old items stay until focus can move.
      const replacement = isUndefined(focusedValue)
        ? undefined
        : (items.find((item) => item.value === focusedValue) ?? items.find((item) => item.value === state.value));

      if (replacement) {
        void replacement.updateComplete.then(() => {
          replacement.focus();
          removeStale();
        });
      } else {
        removeStale();
      }
    }

    const optionsByValue = new Map(state.options.map((option) => [option.value, option]));

    for (const item of this.#host.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)) {
      const checked = item.value === state.value;
      const option = optionsByValue.get(item.value);

      item.disabled = state.disabled || option?.disabled === true;

      for (const indicator of item.querySelectorAll<MenuItemIndicatorElement>(MenuItemIndicatorElement.tagName)) {
        indicator.checked = checked;
      }
    }
  }

  #handleValueChange = (event: Event): void => {
    if (event.target !== this.#host) return;

    const { value } = (event as CustomEvent<{ value: string }>).detail;

    this.#config.onValueChange(value);
  };

  #getFocusedItem(): MenuRadioItemElement | null {
    const active = (this.#host.getRootNode() as Document | ShadowRoot).activeElement;

    return active instanceof MenuRadioItemElement && active.parentElement === this.#host ? active : null;
  }

  #setItemLabel(item: MenuRadioItemElement, label: string): void {
    const labelPart = item.querySelector<HTMLElement>('[data-part~="label"]');

    if (labelPart) labelPart.textContent = label;
    else item.textContent = label;
  }
}
