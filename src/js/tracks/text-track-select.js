import Component from '../component';
import * as Dom from '../utils/dom';
import { newGUID } from '../utils/guid';

/** @import Player from './player' */
/** @import { ContentDescriptor } from  '../utils/dom' */

/**
 * Creates DOM element of 'select' & its options.
 *
 * @extends Component
 */
class TextTrackSelect extends Component {

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
   *
   * @param {string} [options.id]
   *        A text with part of an string to create atribute of aria-labelledby.
   *
   * @param {Array} [options.SelectOptions]
   *        Array that contains the value & textContent of for each of the
   *        options elements.
   */
  constructor(player, options = {}) {
    super(player, options);

    this.el_.setAttribute('aria-labelledby', this.selectLabelledbyIds);
  }

  /**
   * Create the `TextTrackSelect`'s DOM element
   *
   * @return {Element}
   *         The DOM element that gets created.
   */
  createEl() {
    this.selectLabelledbyIds = [this.options_.legendId, this.options_.labelId].join(' ').trim();

    // Create select & inner options
    const selectoptions = Dom.createEl(
      'select',
      {
        id: this.options_.id
      },
      {},
      this.options_.SelectOptions.map((optionText) => {
        // Constructs an id for the <option>.
        // For the colour settings that have two <selects> with a <label> each, generates an id based off the label value
        // For font size/family and edge style with one <select> and no <label>, generates an id with a guid
        const optionId = (this.options_.labelId ? this.options_.labelId : `vjs-track-option-${newGUID()}`) +
          '-' + optionText[1].replace(/\W+/g, '');

        const option = Dom.createEl(
          'option',
          {
            id: optionId,
            value: this.localize(optionText[0]),
            textContent: this.localize(optionText[1])
          }
        );

        option.setAttribute('aria-labelledby', `${this.selectLabelledbyIds} ${optionId}`);

        return option;
      })
    );

    return selectoptions;
  }
}

Component.registerComponent('TextTrackSelect', TextTrackSelect);
export default TextTrackSelect;
