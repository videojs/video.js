import Component from '../component';
import * as Dom from '../utils/dom';
import TextTrackFieldset from './text-track-fieldset';

/** @import Player from './player' */
/** @import { ContentDescriptor } from  '../utils/dom' */

/**
 * The component 'TextTrackSettingsFont' displays a set of 'fieldsets'
 * using the component 'TextTrackFieldset'.
 *
 * @extends Component
 */
class TextTrackSettingsFont extends Component {

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

    const ElFgColorFieldset = new TextTrackFieldset(
      player,
      {
        id_,
        legendId: `captions-font-size-${id_}`,
        legendText: 'Font Size',
        className: 'vjs-font-percent vjs-track-setting',
        selects: this.options_.fieldSets[0],
        selectConfigs: this.options_.selectConfigs,
        type: 'font'
      }
    );

    this.addChild(ElFgColorFieldset);

    const ElBgColorFieldset = new TextTrackFieldset(
      player,
      {
        id_,
        legendId: `captions-edge-style-${id_}`,
        legendText: this.localize('Text Edge Style'),
        className: 'vjs-edge-style vjs-track-setting',
        selects: this.options_.fieldSets[1],
        selectConfigs: this.options_.selectConfigs,
        type: 'font'
      }
    );

    this.addChild(ElBgColorFieldset);

    const ElWinColorFieldset = new TextTrackFieldset(
      player,
      {
        id_,
        legendId: `captions-font-family-${id_}`,
        legendText: this.localize('Font Family'),
        className: 'vjs-font-family vjs-track-setting',
        selects: this.options_.fieldSets[2],
        selectConfigs: this.options_.selectConfigs,
        type: 'font'
      }
    );

    this.addChild(ElWinColorFieldset);
  }

  /**
   * Create the `TextTrackSettingsFont`'s DOM element
   *
   * @return {Element}
   *         The DOM element that gets created.
   */
  createEl() {
    const el = Dom.createEl('div', {
      className: 'vjs-track-settings-font'
    });

    return el;
  }
}

Component.registerComponent('TextTrackSettingsFont', TextTrackSettingsFont);
export default TextTrackSettingsFont;
