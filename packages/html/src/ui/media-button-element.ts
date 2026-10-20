import type { ButtonState, MediaButtonComponent, StateAttrMap } from '@videojs/core';
import {
  applyElementProps,
  applyStateDataAttrs,
  type ButtonActivationSource,
  createButton,
  HOTKEY_SHORTCUT_CHANGE_EVENT,
  logMissingFeature,
  type UIEvent,
} from '@videojs/core/dom';
import { isText, resolveText, type Text, translateText } from '@videojs/core/i18n';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import type { State } from '@videojs/store';
import { isBoolean, isObject } from '@videojs/utils/predicate';

import { i18nContext } from '../i18n/context';
import { I18nController } from '../i18n/controller';
import type { PlayerController } from '../player/controller';
import { AriaKeyShortcutsController } from './hotkey/aria-key-shortcuts-controller';
import { UIElement } from './ui-element';

type LabelParams = Record<string, string | number>;

/** The core a media button element drives: it reads `MediaState` and computes `ComponentState`. */
type MediaButtonCore<ComponentState extends ButtonState, MediaState> = MediaButtonComponent<object, ComponentState> & {
  setMedia(media: MediaState): void;
  getLabelParams?: (state: ComponentState) => LabelParams | undefined;
};

/**
 * Abstract base for HTML custom elements that render a media-control button. `ComponentState` is the state the button
 * reflects to data attributes, and `MediaState` is the player state it reads and acts on. Pass both: a subclass that
 * omits them still compiles, but types `activate(state)` and `mediaState` as the `ButtonState` and `object` defaults.
 */
export abstract class MediaButtonElement<
  ComponentState extends ButtonState = ButtonState,
  MediaState extends object = object,
> extends UIElement {
  static override properties: PropertyDeclarationMap = {
    label: { type: String },
    disabled: { type: Boolean },
  };

  disabled = false;
  label: Text | string = '';

  protected abstract readonly core: MediaButtonCore<ComponentState, MediaState>;
  protected abstract readonly stateAttrMap: StateAttrMap<ComponentState>;
  protected abstract readonly mediaState: PlayerController<any, MediaState | undefined>;

  protected abstract activate(state: MediaState, event: UIEvent, source: ButtonActivationSource): void | Promise<void>;

  protected getIsButtonDisabled(): boolean {
    return this.disabled || !this.mediaState.value;
  }

  protected handleActivate(event: UIEvent, source: ButtonActivationSource): void {
    // `createButton` invokes `onActivate` synchronously from click/keyup
    // handlers, so any rejection here would be unhandled. Log in dev for
    // visibility but absorb the failure at this UI boundary.
    Promise.resolve(this.activate(this.mediaState.value!, event, source)).catch((error) => {
      if (__DEV__) console.error(`[${this.localName}]`, error);
    });
  }

  /** Override to set the hotkey action name for `aria-keyshortcuts`. */
  protected readonly hotkeyAction: string | undefined = undefined;

  /** Override to match hotkeys that use action values, such as seek steps. */
  protected get hotkeyValue(): number | undefined {
    return undefined;
  }

  get $state(): State<ButtonState> {
    return this.core.state;
  }

  #disconnect: AbortController | null = null;
  #hotkeyRegistry: AriaKeyShortcutsController | null = null;
  #lastHotkeyShortcut: string | undefined;
  readonly #i18n = new I18nController(this, i18nContext);

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    if (this.hotkeyAction && !this.#hotkeyRegistry) {
      this.#hotkeyRegistry = new AriaKeyShortcutsController(this, this.hotkeyAction, {
        value: () => this.hotkeyValue,
      });
    }

    this.#disconnect = new AbortController();

    const buttonProps = createButton({
      onActivate: (event, source) => this.handleActivate(event, source),
      isDisabled: () => this.getIsButtonDisabled(),
    });

    applyElementProps(this, buttonProps, { signal: this.#disconnect.signal });

    if (__DEV__ && !this.mediaState.value && this.mediaState.displayName) {
      logMissingFeature(this.localName, this.mediaState.displayName);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  /** Returns the button's current label derived from media state. */
  getLabel(): string | undefined {
    return this.core.state.current.label ? resolveText(this.core.state.current.label) : undefined;
  }

  getShortcut(): string | undefined {
    return this.#hotkeyRegistry?.shortcut;
  }

  /** Resolved label for tooltips and other display surfaces. */
  getResolvedLabel(): string | undefined {
    const media = this.mediaState.value;
    if (!media) return undefined;

    this.core.setMedia(media);
    const state = this.core.getState();

    return translateText(this.core.getLabel(state), this.#i18n.value, this.core.getLabelParams?.(state));
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.core.setProps?.(this);
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const media = this.mediaState.value;

    this.#syncHotkeyShortcut();

    if (!media) return;

    this.core.setMedia(media);
    const state = this.core.getState();
    const attrs = (this.core.getAttrs?.(state) ?? {}) as Record<string, unknown>;

    if (isText(attrs['aria-label'])) {
      attrs['aria-label'] = translateText(attrs['aria-label'], this.#i18n.value, this.core.getLabelParams?.(state));
    }

    applyElementProps(this, {
      ...attrs,
      'aria-keyshortcuts': this.#hotkeyRegistry?.aria,
      // A button whose core reports itself hidden takes the real attribute, not
      // just the data one: `data-hidden` is a styling hook a skin may or may not
      // act on, where `hidden` removes the control the way the React components
      // do by rendering nothing.
      ...(isHideable(state) && { hidden: state.hidden ? '' : undefined }),
    });
    applyStateDataAttrs(this, state, this.stateAttrMap);
  }

  #syncHotkeyShortcut(): void {
    const shortcut = this.getShortcut();
    if (shortcut === this.#lastHotkeyShortcut) return;

    this.#lastHotkeyShortcut = shortcut;
    this.dispatchEvent(new CustomEvent(HOTKEY_SHORTCUT_CHANGE_EVENT));
  }
}

/** Whether a button's core reports whether it should be shown at all. */
function isHideable(state: unknown): state is { hidden: boolean } {
  return isObject(state) && isBoolean((state as { hidden?: unknown }).hidden);
}
