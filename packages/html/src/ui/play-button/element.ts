import { PlayButtonCore, PlayButtonDataAttrs, type PlayButtonState } from '@videojs/core';
import { selectPlayback } from '@videojs/core/dom';
import type { MediaPlaybackState } from '@videojs/media';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { MediaButtonElement } from '../media-button-element';

export class PlayButtonElement extends MediaButtonElement<PlayButtonState, MediaPlaybackState> {
  static readonly tagName = 'media-play-button';

  protected readonly core = new PlayButtonCore();
  protected readonly stateAttrMap = PlayButtonDataAttrs;
  protected readonly mediaState = new PlayerController(this, playerContext, selectPlayback);
  protected override readonly hotkeyAction = 'togglePaused';

  protected activate(state: MediaPlaybackState): Promise<void> {
    return this.core.toggle(state);
  }
}
