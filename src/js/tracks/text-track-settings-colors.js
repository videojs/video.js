import Component from '../component';
import * as Dom from '../utils/dom';
import TextTrackFieldset from './text-track-fieldset';

class TrackSettingsColors extends Component {
  constructor(player, options = {}) {
    super(player, options);

    const id_ = this.options_.textTrackComponentid;

    // createElFgColor_
    const ElFgColorFieldset = new TextTrackFieldset(
      player,
      {
        id_,
        legendId: `captions-text-legend-${id_}`,
        legendText: 'Text',
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
        legendText: 'Text Background',
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
        legendText: 'Caption Area Background',
        className: 'vjs-window vjs-track-setting',
        selects: this.options_.fieldSets[2],
        selectConfigs: this.options_.selectConfigs,
        type: 'colors'
      }
    );

    this.addChild(ElWinColorFieldset);

    // Add created components
    this.el().appendChild(ElFgColorFieldset.el());
    this.el().appendChild(ElBgColorFieldset.el());
    this.el().appendChild(ElWinColorFieldset.el());
  }

  /**
   * Create the `TrackSettingsColors`'s DOM element
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

Component.registerComponent('TrackSettingsColors', TrackSettingsColors);
export default TrackSettingsColors;
