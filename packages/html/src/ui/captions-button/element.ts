import { CaptionsButtonCore, CaptionsButtonDataAttrs, type CaptionsButtonState } from '@videojs/core';
import { applyElementProps, selectTextTrack, type UIEvent } from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import type { MediaTextTrackState } from '@videojs/media';
import { isCaptionOrSubtitleTrack } from '@videojs/utils/dom';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { toggleCommandTarget } from '../command-for';
import { MediaButtonElement } from '../media-button-element';

function getCaptionTrackCount(state: MediaTextTrackState): number {
  return state.textTrackList.filter(isCaptionOrSubtitleTrack).length;
}

export class CaptionsButtonElement extends MediaButtonElement<CaptionsButtonState, MediaTextTrackState> {
  static readonly tagName = 'media-captions-button';

  static override properties = {
    label: { type: String },
    disabled: { type: Boolean },
    commandfor: { type: String },
    menuFor: { type: String, attribute: 'menu-for' },
  } satisfies PropertyDeclarationMap<'label' | 'disabled' | 'commandfor' | 'menuFor'>;

  commandfor: string | undefined = undefined;
  menuFor: string | undefined = undefined;
  #defaultCommandfor: string | undefined = undefined;

  protected readonly core = new CaptionsButtonCore();
  protected readonly stateAttrMap = CaptionsButtonDataAttrs;
  protected readonly mediaState = new PlayerController(this, playerContext, selectTextTrack);
  protected override readonly hotkeyAction = 'toggleSubtitles';

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.commandfor && this.commandfor !== this.menuFor) {
      this.#defaultCommandfor = this.commandfor;
    }
  }

  protected activate(state: MediaTextTrackState, event?: UIEvent): void {
    if (this.menuFor && getCaptionTrackCount(state) > 1) {
      if (event instanceof KeyboardEvent) {
        toggleCommandTarget(this, this.menuFor);
      }

      return;
    }

    this.core.toggle(state);
  }

  protected override getIsButtonDisabled(): boolean {
    const media = this.mediaState.value;

    if (super.getIsButtonDisabled()) return true;

    if (media && getCaptionTrackCount(media) === 0) return true;

    return false;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);

    if (changed.has('commandfor') && this.commandfor !== this.menuFor) {
      this.#defaultCommandfor = this.commandfor;
    }

    if (changed.has('commandfor') || changed.has('menuFor')) {
      this.#syncCommandFor();
    }
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const media = this.mediaState.value;
    if (!media) return;

    this.#syncCommandFor(media);

    if (this.menuFor && getCaptionTrackCount(media) > 1) {
      applyElementProps(this, {
        'aria-disabled': this.getIsButtonDisabled() ? 'true' : undefined,
      });
    }
  }

  #syncCommandFor(media?: MediaTextTrackState): void {
    const state = media ?? this.mediaState.value;
    const target = state && this.menuFor && getCaptionTrackCount(state) > 1 ? this.menuFor : this.#defaultCommandfor;

    if (target) {
      this.setAttribute('commandfor', target);
    } else {
      this.removeAttribute('commandfor');
    }
  }
}

export namespace CaptionsButtonElement {
  export type State = CaptionsButtonState;
}
