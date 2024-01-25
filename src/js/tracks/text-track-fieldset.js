import Component from '../component';
import * as Dom from '../utils/dom';
import TextTrackSelect from './text-track-select';

class TextTrackFieldset extends Component {
  constructor(player, options = {}) {
    super(player, options);

    // Add Components & DOM Elements
    const legendElement = Dom.createEl('legend', {
      textContent: this.localize(this.options_.legendText),
      id: this.options_.legendId
    });

    this.el().appendChild(legendElement);

    const selects = this.options_.selects;

    for (const i of selects) {
      const selectConfig = this.options_.selectConfigs[i];
      const selectClassName = selectConfig.className;
      const id = selectConfig.id.replace('%s', this.options_.id_);
      let span = null;

      if (this.options_.type === 'colors') {
        span = Dom.createEl('span', {
          className: selectClassName
        });

        const label = Dom.createEl('label', {
          id,
          className: 'vjs-label',
          textContent: selectConfig.label
        });

        span.appendChild(label);
      }

      const textTrackSelect = new TextTrackSelect(player, {
        SelectOptions: selectConfig.options,
        legendId: this.options_.legendId,
        id
      });

      this.addChild(textTrackSelect);

      if (this.options_.type === 'colors') {
        span.appendChild(textTrackSelect.el());
        this.el().appendChild(span);
      }
    }
  }

  /**
   * Create the `TextTrackFieldset`'s DOM element
   *
   * @return {Element}
   *         The DOM element that gets created.
   */
  createEl() {
    const el = Dom.createEl('fieldset', {
      // Prefixing classes of elements within a player with "vjs-"
      // is a convention used in Video.js.
      className: this.options_.className
    });

    return el;
  }
}

Component.registerComponent('TextTrackFieldset', TextTrackFieldset);
export default TextTrackFieldset;
