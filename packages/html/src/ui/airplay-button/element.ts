import { AirPlayButtonCore, AirPlayButtonDataAttrs } from '@videojs/core';
import { selectRemotePlayback } from '@videojs/core/dom';
import type { MediaRemotePlaybackState } from '@videojs/media';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { MediaButtonElement } from '../media-button-element';

export class AirPlayButtonElement extends MediaButtonElement<AirPlayButtonCore> {
  static readonly tagName = 'media-airplay-button';

  protected readonly core = new AirPlayButtonCore();
  protected readonly stateAttrMap = AirPlayButtonDataAttrs;
  protected readonly mediaState = new PlayerController(this, playerContext, selectRemotePlayback);

  protected activate(state: MediaRemotePlaybackState): Promise<void> {
    return this.core.toggle(state);
  }
}
