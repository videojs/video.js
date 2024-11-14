import Component from '../component';
import * as Dom from '../utils/dom';
import * as Guid from '../utils/guid';
import TextTrackSelect from './text-track-select';

/** @import Player from './player' */
/** @import { ContentDescriptor } from '../utils/dom' */

/**
 * Creates fieldset section of 'TextTrackSettings'.
 * Manganes two versions of fieldsets, one for type of 'colors'
 * & the other for 'font', Component adds diferent DOM elements
 * to that fieldset  depending on the type.
 *
 * @extends Component
 */
class TextTrackFieldset extends Component {

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
   * @param {string} [options.legendId]
   *        A text with part of an string to create atribute of aria-labelledby.
   *        It passes to 'TextTrackSelect'.
   *
   * @param {string} [options.id]
   *        A text with part of an string to create atribute of aria-labelledby.
   *        It passes to 'TextTrackSelect'.
   *
   * @param {string} [options.legendText]
   *        A text to use as the text content of the legend element.
   *
   * @param {Array} [options.selects]
   *        Array that contains the selects that are use to create 'selects'
   *        components.
   *
   * @param {Array} [options.SelectOptions]
   *        Array that contains the value & textContent of for each of the
   *        options elements, it passes to 'TextTrackSelect'.
   *
   * @param {string} [options.type]
   *        Conditions if some DOM elements will be added to the fieldset
   *        component.
   *
   * @param {Object} [options.selectConfigs]
   *        Object with the following properties that are the selects configurations:
   *        backgroundColor, backgroundOpacity, color, edgeStyle, fontFamily,
   *        fontPercent, textOpacity, windowColor, windowOpacity.
   *        These properties are use to configure the 'TextTrackSelect' Component.
   */
  constructor(player, options = {}) {
    super(player, options);

    // Add Components & DOM Elements
    const legendElement = Dom.createEl('legend', {
      textContent: this.localize(this.options_.legendText),
      id: this.options_.legendId
    });

    this.el().appendChild(legendElement);

    const selects = this.options_.selects;

    // Iterate array of selects to create 'selects' components
    for (const i of selects) {
      const selectConfig = this.options_.selectConfigs[i];
      const selectClassName = selectConfig.className;
      const id = selectConfig.id.replace('%s', this.options_.id_);
      let span = null;
      const guid = `vjs_select_${Guid.newGUID()}`;

      // Conditionally create span to add on the component
      if (this.options_.type === 'colors') {
        span = Dom.createEl('span', {
          className: selectClassName
        });

        const label = Dom.createEl('label', {
          id,
          className: 'vjs-label',
          textContent: this.localize(selectConfig.label)
        });

        label.setAttribute('for', guid);
        span.appendChild(label);
      }

      const textTrackSelect = new TextTrackSelect(player, {
        SelectOptions: selectConfig.options,
        legendId: this.options_.legendId,
        id: guid,
        labelId: id
      });

      this.addChild(textTrackSelect);

      // Conditionally append to 'select' component to conditionally created span
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
