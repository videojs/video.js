import { TimeCore, TimeDataAttrs, type TimeType, type TimeProps, type TimeState } from '@videojs/core';
import { applyElementProps, applyStateDataAttrs, logMissingFeature, selectBuffer, selectTime } from '@videojs/core/dom';
import { type Text, translateText } from '@videojs/core/i18n';
import { durationSuffixText, elapsedSuffixText, remainingSuffixText } from '@videojs/core/i18n/text/time';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { hasTimeRange } from '@videojs/media';
import { isInteractiveActivation } from '@videojs/utils/dom';
import { formatTimeAsPhrase } from '@videojs/utils/time';

import { i18nContext } from '../../i18n/context';
import { I18nController } from '../../i18n/controller';
import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { UIElement } from '../ui-element';

export class TimeElement extends UIElement {
  static readonly tagName = 'media-time';

  static override properties = {
    type: { type: String },
    negativeSign: { type: String, attribute: 'negative-sign' },
    label: { type: String },
    toggle: { type: Boolean },
  } satisfies PropertyDeclarationMap<keyof TimeProps>;

  type: TimeType = TimeCore.defaultProps.type;
  negativeSign = TimeCore.defaultProps.negativeSign;
  label: Text | string = '';
  toggle = TimeCore.defaultProps.toggle;

  readonly #core = new TimeCore();
  readonly #state = new PlayerController(this, playerContext, selectTime);
  readonly #buffer = new PlayerController(this, playerContext, selectBuffer);
  readonly #i18n = new I18nController(this, i18nContext);

  readonly #signSpan = document.createElement('span');
  readonly #textNode = new Text();

  #disconnect: AbortController | null = null;
  #listening = false;
  #activeType: TimeType = TimeCore.defaultProps.type;

  override connectedCallback(): void {
    super.connectedCallback();

    this.#disconnect = new AbortController();
    this.#syncListeners();

    if (!this.#signSpan.parentNode) {
      this.#signSpan.setAttribute('aria-hidden', 'true');
      this.#signSpan.hidden = true;
      this.append(this.#signSpan, this.#textNode);
    }

    if (__DEV__ && !this.#state.value) {
      logMissingFeature(this.localName, this.#state.displayName!);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
    this.#listening = false;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);

    if (changed.has('type') || changed.has('toggle')) {
      this.#activeType = this.type;
    }
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    if (changed.has('toggle')) {
      this.#syncListeners();
    }

    const media = this.#state.value;

    if (!media) {
      this.#clearAttrs();
      return;
    }

    this.#core.setProps({
      type: this.toggle ? this.#activeType : this.type,
      negativeSign: this.negativeSign,
      label: this.label,
      toggle: this.toggle,
    });
    this.#core.setMedia({ ...media, seekable: this.#buffer.value?.seekable ?? [] });
    this.#core.setFormatLocale(this.#i18n.locale);
    const state = this.#core.getState();

    this.#signSpan.hidden = !state.negative;
    this.#signSpan.textContent = state.negative ? this.negativeSign : '';
    this.#textNode.textContent = state.text;

    const attrs = this.#core.getAttrs(state, this.type);
    const label = translateText(attrs['aria-label'], this.#i18n.value, this.#getLabelParams(state));
    const description = attrs['aria-description']
      ? translateText(attrs['aria-description'], this.#i18n.value)
      : undefined;

    applyElementProps(this, {
      'aria-label': label,
      'aria-description': description,
      'aria-disabled': attrs['aria-disabled'],
      role: this.toggle ? attrs.role : 'time',
      tabIndex: attrs.tabIndex,
      datetime: this.toggle || state.unavailable ? undefined : state.datetime,
    });
    applyStateDataAttrs(this, state, TimeDataAttrs);
  }

  #getLabelParams(state: TimeState): { duration: string } | undefined {
    const params = this.#core.getLabelParams(state);
    if (!params) return undefined;

    const duration = formatTimeAsPhrase(Math.abs(state.seconds), { locale: this.#i18n.locale });

    const text = {
      current: elapsedSuffixText,
      duration: durationSuffixText,
      remaining: remainingSuffixText,
    }[state.type];

    return { duration: translateText(text, this.#i18n.value, { duration }) };
  }

  #handleClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || !this.toggle || !this.#state.value || !this.#hasTimeRange()) return;

    this.#toggleType();
  };

  #handleKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || !isInteractiveActivation(event)) return;

    if (!this.toggle || !this.#state.value || !this.#hasTimeRange()) return;

    // Prevent space from scrolling page.
    event.preventDefault();

    if (event.repeat) return;

    this.#toggleType();
  };

  #toggleType(): void {
    if (this.type === 'current') {
      this.#activeType = this.#activeType === 'remaining' ? 'current' : 'remaining';
    } else {
      this.#activeType = this.#activeType === 'duration' ? 'remaining' : 'duration';
    }

    this.requestUpdate();
  }

  #hasTimeRange(): boolean {
    const media = this.#state.value;
    if (!media) return false;

    return hasTimeRange({ ...media, seekable: this.#buffer.value?.seekable ?? [] });
  }

  #syncListeners(): void {
    if (!this.toggle || !this.#disconnect || this.#listening) return;

    this.#listening = true;
    applyElementProps(
      this,
      {
        onClick: this.#handleClick,
        onKeyDown: this.#handleKeyDown,
      },
      { signal: this.#disconnect.signal }
    );
  }

  #clearAttrs(): void {
    applyElementProps(this, {
      'aria-label': undefined,
      'aria-description': undefined,
      'aria-disabled': undefined,
      role: undefined,
      tabIndex: undefined,
      datetime: undefined,
      'data-type': undefined,
      'data-disabled': undefined,
      'data-unavailable': undefined,
    });
  }
}
