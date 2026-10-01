import { CastButtonCore, CastButtonDataAttrs, type CastButtonState } from '@videojs/core';
import { selectRemotePlayback } from '@videojs/core/dom';
import type { MediaRemotePlaybackState } from '@videojs/media';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { MediaButtonElement } from '../media-button-element';

export class CastButtonElement extends MediaButtonElement<CastButtonState, MediaRemotePlaybackState> {
  static readonly tagName = 'media-cast-button';

  protected readonly core = new CastButtonCore();
  protected readonly stateAttrMap = CastButtonDataAttrs;
  protected readonly mediaState = new PlayerController(this, playerContext, selectRemotePlayback);

  protected activate(state: MediaRemotePlaybackState): Promise<void> {
    return this.core.toggle(state);
  }
}
