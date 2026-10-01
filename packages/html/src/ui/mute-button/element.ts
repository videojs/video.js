import { MuteButtonCore, MuteButtonDataAttrs, type MuteButtonState } from '@videojs/core';
import { selectVolume } from '@videojs/core/dom';
import type { MediaVolumeState } from '@videojs/media';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { MediaButtonElement } from '../media-button-element';

export class MuteButtonElement extends MediaButtonElement<MuteButtonState, MediaVolumeState> {
  static readonly tagName = 'media-mute-button';

  protected readonly core = new MuteButtonCore();
  protected readonly stateAttrMap = MuteButtonDataAttrs;
  protected readonly mediaState = new PlayerController(this, playerContext, selectVolume);
  protected override readonly hotkeyAction = 'toggleMuted';

  protected activate(state: MediaVolumeState): void {
    this.core.toggle(state);
  }
}
