import { SeekButtonCore, SeekButtonDataAttrs, type SeekButtonState } from '@videojs/core';
import { selectTime } from '@videojs/core/dom';
import type { PropertyDeclarationMap } from '@videojs/element';
import type { MediaTimeState } from '@videojs/media';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { MediaButtonElement } from '../media-button-element';

export class SeekButtonElement extends MediaButtonElement<SeekButtonState, MediaTimeState> {
  static readonly tagName = 'media-seek-button';

  static override properties: PropertyDeclarationMap = {
    ...MediaButtonElement.properties,
    seconds: { type: Number },
  };

  seconds = SeekButtonCore.defaultProps.seconds;

  protected readonly core = new SeekButtonCore();
  protected readonly stateAttrMap = SeekButtonDataAttrs;
  protected readonly mediaState = new PlayerController(this, playerContext, selectTime);
  protected override readonly hotkeyAction = 'seekStep';

  protected override get hotkeyValue(): number | undefined {
    return this.seconds;
  }

  protected activate(state: MediaTimeState): void {
    this.core.seek(state);
  }
}
