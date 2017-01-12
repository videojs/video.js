'use strict';

exports.__esModule = true;

var _slider = require('../../slider/slider.js');

var _slider2 = _interopRequireDefault(_slider);

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _fn = require('../../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

var _formatTime = require('../../utils/format-time.js');

var _formatTime2 = _interopRequireDefault(_formatTime);

var _computedStyle = require('../../utils/computed-style.js');

var _computedStyle2 = _interopRequireDefault(_computedStyle);

require('./load-progress-bar.js');

require('./play-progress-bar.js');

require('./tooltip-progress-bar.js');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file seek-bar.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Seek Bar and holder for the progress bars
 *
 * @extends Slider
 */
var SeekBar = function (_Slider) {
  _inherits(SeekBar, _Slider);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  function SeekBar(player, options) {
    _classCallCheck(this, SeekBar);

    var _this = _possibleConstructorReturn(this, _Slider.call(this, player, options));

    _this.on(player, 'timeupdate', _this.updateProgress);
    _this.on(player, 'ended', _this.updateProgress);
    player.ready(Fn.bind(_this, _this.updateProgress));

    if (options.playerOptions && options.playerOptions.controlBar && options.playerOptions.controlBar.progressControl && options.playerOptions.controlBar.progressControl.keepTooltipsInside) {
      _this.keepTooltipsInside = options.playerOptions.controlBar.progressControl.keepTooltipsInside;
    }

    if (_this.keepTooltipsInside) {
      _this.tooltipProgressBar = _this.addChild('TooltipProgressBar');
    }
    return _this;
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  SeekBar.prototype.createEl = function createEl() {
    return _Slider.prototype.createEl.call(this, 'div', {
      className: 'vjs-progress-holder'
    }, {
      'aria-label': 'progress bar'
    });
  };

  /**
   * Update the seek bars tooltip and width.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `ended` event that caused this to run.
   *
   * @listens Player#timeupdate
   * @listens Player#ended
   */


  SeekBar.prototype.updateProgress = function updateProgress(event) {
    this.updateAriaAttributes(this.el_);

    if (this.keepTooltipsInside) {
      this.updateAriaAttributes(this.tooltipProgressBar.el_);
      this.tooltipProgressBar.el_.style.width = this.bar.el_.style.width;

      var playerWidth = parseFloat((0, _computedStyle2['default'])(this.player().el(), 'width'));
      var tooltipWidth = parseFloat((0, _computedStyle2['default'])(this.tooltipProgressBar.tooltip, 'width'));
      var tooltipStyle = this.tooltipProgressBar.el().style;

      tooltipStyle.maxWidth = Math.floor(playerWidth - tooltipWidth / 2) + 'px';
      tooltipStyle.minWidth = Math.ceil(tooltipWidth / 2) + 'px';
      tooltipStyle.right = '-' + tooltipWidth / 2 + 'px';
    }
  };

  /**
   * Update ARIA accessibility attributes
   *
   * @param {Element} el
   *        The element to update with aria accessibility attributes.
   */


  SeekBar.prototype.updateAriaAttributes = function updateAriaAttributes(el) {
    // Allows for smooth scrubbing, when player can't keep up.
    var time = this.player_.scrubbing() ? this.player_.getCache().currentTime : this.player_.currentTime();

    // machine readable value of progress bar (percentage complete)
    el.setAttribute('aria-valuenow', (this.getPercent() * 100).toFixed(2));
    // human readable value of progress bar (time complete)
    el.setAttribute('aria-valuetext', (0, _formatTime2['default'])(time, this.player_.duration()));
  };

  /**
   * Get percentage of video played
   *
   * @return {number}
   *         The percentage played
   */


  SeekBar.prototype.getPercent = function getPercent() {
    var percent = this.player_.currentTime() / this.player_.duration();

    return percent >= 1 ? 1 : percent;
  };

  /**
   * Handle mouse down on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mousedown` event that caused this to run.
   *
   * @listens mousedown
   */


  SeekBar.prototype.handleMouseDown = function handleMouseDown(event) {
    this.player_.scrubbing(true);

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();

    _Slider.prototype.handleMouseDown.call(this, event);
  };

  /**
   * Handle mouse move on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this to run.
   *
   * @listens mousemove
   */


  SeekBar.prototype.handleMouseMove = function handleMouseMove(event) {
    var newTime = this.calculateDistance(event) * this.player_.duration();

    // Don't let video end while scrubbing.
    if (newTime === this.player_.duration()) {
      newTime = newTime - 0.1;
    }

    // Set new time (tell player to seek to new time)
    this.player_.currentTime(newTime);
  };

  /**
   * Handle mouse up on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mouseup` event that caused this to run.
   *
   * @listens mouseup
   */


  SeekBar.prototype.handleMouseUp = function handleMouseUp(event) {
    _Slider.prototype.handleMouseUp.call(this, event);

    this.player_.scrubbing(false);
    if (this.videoWasPlaying) {
      this.player_.play();
    }
  };

  /**
   * Move more quickly fast forward for keyboard-only users
   */


  SeekBar.prototype.stepForward = function stepForward() {
    // more quickly fast forward for keyboard-only users
    this.player_.currentTime(this.player_.currentTime() + 5);
  };

  /**
   * Move more quickly rewind for keyboard-only users
   */


  SeekBar.prototype.stepBack = function stepBack() {
    // more quickly rewind for keyboard-only users
    this.player_.currentTime(this.player_.currentTime() - 5);
  };

  return SeekBar;
}(_slider2['default']);

/**
 * Default options for the `SeekBar`
 *
 * @type {Object}
 * @private
 */


SeekBar.prototype.options_ = {
  children: ['loadProgressBar', 'mouseTimeDisplay', 'playProgressBar'],
  barName: 'playProgressBar'
};

/**
 * Call the update event for this Slider when this event happens on the player.
 *
 * @type {string}
 */
SeekBar.prototype.playerEvent = 'timeupdate';

_component2['default'].registerComponent('SeekBar', SeekBar);
exports['default'] = SeekBar;
