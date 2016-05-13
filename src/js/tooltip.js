/**
 * @file tooltip.js
 */
import Component from './component';
import * as Dom from './utils/dom.js';
import * as Events from './utils/events.js';
import * as Fn from './utils/fn.js';
import document from 'global/document';
import throttle from 'lodash-compat/function/throttle';

/**
 * Base class for all tooltips
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends Component
 * @class Tooltip
 */
class Tooltip extends Component {

  constructor(player, options) {
    super(player, options);

    this.handleHover_ = throttle(Fn.bind(this, this.handleHover), 25);
    this.handleLeave_ = throttle(Fn.bind(this, this.handleLeave), 25);
  }

  createEl() {
    return super.createEl('div', {
      className: 'vjs-tooltip'
    });
  }

  text(text) {
    if (!text) return this.text_ || '';

    this.text_ = text;
    this.el_.innerHTML = this.localize(this.text_);

    this.update();

    return this;
  }

  handler(handler) {
    if (!handler) return this.handler;

    if (this.handler_) {
      this.off(this.handler_, 'mouseover', this.handleHover_);
      this.off(this.handler_, 'mouseout', this.handleLeave_);

    }

    this.handler_ = handler;
    this.on(this.handler_, 'mouseover', this.handleHover_);
    this.on(this.handler_, 'mouseout', this.handleLeave_);

    return this;
  }

  handleHover() {
    if (this.timeout) {
      this.clearTimeout(this.timeout);
      this.timeout = 0;
    }
    this.timeout = this.setTimeout(()=>this.hide(), 5000);
    this.show();
  }

  handleLeave() {
    if (this.timeout) {
      this.clearTimeout(this.timeout);
      this.timeout = 0;
    }
    this.hide();
  }

  show() {
    this.player_.trigger('tooltipShown');
    this.player_.on('tooltipShown', Fn.bind(this, this.hide));

    this.addClass('vjs-tooltip-active');
    this.update();
  }

  hide() {
    this.removeClass('vjs-tooltip-active');

    this.player_.off('tooltipShown');
  }

  update() {
    let width = this.width();

    if (!width) {
      return this;
    }

    let parent_ = this.handler_;
    let parentWidth = parent_ ? parent_.offsetWidth : 0;

    let parentLeft = Dom.findElPosition(parent_).left - Dom.findElPosition(this.player_.el()).left;
    let skew = parentWidth/2 - width/2;

    let minSkew = -parentLeft;
    // TODO: player_.width() is not working properly after switch to fullscreen
    let maxSkew = this.player_.el().offsetWidth - parentLeft - width;

    skew = Math.min(Math.max(minSkew, skew), maxSkew);

    this.el_.style.left = skew + 'px';

    return this;
  }

}

Component.registerComponent('Tooltip', Tooltip);
export default Tooltip;
