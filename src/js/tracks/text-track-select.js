import Component from '../component';
import * as Dom from '../utils/dom';

class TextTrackSelect extends Component {
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
    this.selectLabelledbyIds = [this.options_.legendId, this.options_.id].join(' ').trim();

    // Create select & inner options
    const selectoptions = Dom.createEl(
      'select',
      {},
      {},
      this.options_.SelectOptions.map((optionText) => {
        const optionId = this.options_.id + '-' + optionText[1].replace(/\W+/g, '');

        const option = Dom.createEl(
          'option',
          {
            id: optionId,
            value: this.localize(optionText[0]),
            textContent: optionText[1]
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
