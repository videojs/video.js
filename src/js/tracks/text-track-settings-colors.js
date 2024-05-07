import Component from '../component';
import * as Dom from '../utils/dom';
import TextTrackFieldset from './text-track-fieldset';

/** @import Player from './player' */
/** @import { ContentDescriptor } from  '../utils/dom' */

/**
 * The component 'TextTrackSettingsColors' displays a set of 'fieldsets'
 * using the component 'TextTrackFieldset'.
 *
 * @extends Component
 */
class TextTrackSettingsColors extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {ContentDescriptor} [options.content=undefined]
   *        Provide customized content for this modal.
   *
   * @param {Array} [options.fieldSets]
   *        Array that contains the configurations for the selects.
   *
   * @param {Object} [options.selectConfigs]
   *        Object with the following properties that are the select confugations:
   *        backgroundColor, backgroundOpacity, color, edgeStyle, fontFamily,
   *        fontPercent, textOpacity, windowColor, windowOpacity.
   *        it passes to 'TextTrackFieldset'.
   */
  constructor(player, options = {}) {
    super(player, options);

    const id_ = this.options_.textTrackComponentid;

    // createElFgColor_
    const ElFgColorFieldset = new TextTrackFieldset(
      player,
      {
        id_,
        legendId: `captions-text-legend-${id_}`,
        legendText: this.localize('Text'),
        className: 'vjs-fg vjs-track-setting',
        selects: this.options_.fieldSets[0],
        selectConfigs: this.options_.selectConfigs,
        type: 'colors'
      }
    );

    this.addChild(ElFgColorFieldset);

    // createElBgColor_
    const ElBgColorFieldset = new TextTrackFieldset(
      player,
      {
        id_,
        legendId: `captions-background-${id_}`,
        legendText: this.localize('Text Background'),
        className: 'vjs-bg vjs-track-setting',
        selects: this.options_.fieldSets[1],
        selectConfigs: this.options_.selectConfigs,
        type: 'colors'
      }
    );

    this.addChild(ElBgColorFieldset);

    // createElWinColor_
    const ElWinColorFieldset = new TextTrackFieldset(
      player,
      {
        id_,
        legendId: `captions-window-${id_}`,
        legendText: this.localize('Caption Area Background'),
        className: 'vjs-window vjs-track-setting',
        selects: this.options_.fieldSets[2],
        selectConfigs: this.options_.selectConfigs,
        type: 'colors'
      }
    );

    this.addChild(ElWinColorFieldset);
  }

  /**
   * Create the `TextTrackSettingsColors`'s DOM element
   *
   * @return {Element}
   *         The DOM element that gets created.
   */
  createEl() {
    const el = Dom.createEl('div', {
      className: 'vjs-track-settings-colors'
    });

    return el;
  }
}

Component.registerComponent('TextTrackSettingsColors', TextTrackSettingsColors);
export default TextTrackSettingsColors;
