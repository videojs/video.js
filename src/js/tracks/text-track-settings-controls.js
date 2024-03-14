import Component from '../component';
import * as Dom from '../utils/dom';
import Button from '../button';

/**
 * Buttons of reset & done that modal 'TextTrackSettings'
 * uses as part of its content.
 *
 * 'Reset': Resets all settings on 'TextTrackSettings'.
 * 'Done': Closes 'TextTrackSettings' modal.
 *
 * @extends Component
 */
class TrackSettingsControls extends Component {
  constructor(player, options = {}) {
    super(player, options);

    // Create DOM elements
    const defaultsDescription = this.localize('restore all settings to the default values');

    const resetButton = new Button(player, {
      controlText: defaultsDescription,
      className: 'vjs-default-button'
    });

    resetButton.el().classList.remove('vjs-control', 'vjs-button');
    resetButton.el().textContent = this.localize('Reset');

    this.addChild(resetButton);

    const doneButton = new Button(player, {
      controlText: defaultsDescription,
      className: 'vjs-done-button'
    });

    // Remove unrequired style classes
    doneButton.el().classList.remove('vjs-control', 'vjs-button');
    doneButton.el().textContent = this.localize('Done');

    this.addChild(doneButton);
  }

  /**
   * Create the `TrackSettingsControls`'s DOM element
   *
   * @return {Element}
   *         The DOM element that gets created.
   */
  createEl() {
    const el = Dom.createEl('div', {
      className: 'vjs-track-settings-controls'
    });

    return el;
  }

}

Component.registerComponent('TrackSettingsControls', TrackSettingsControls);
export default TrackSettingsControls;
