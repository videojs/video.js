'use strict';

exports.__esModule = true;

var _textTrackButton = require('./text-track-button.js');

var _textTrackButton2 = _interopRequireDefault(_textTrackButton);

var _component = require('../../component.js');

var _component2 = _interopRequireDefault(_component);

var _chaptersTrackMenuItem = require('./chapters-track-menu-item.js');

var _chaptersTrackMenuItem2 = _interopRequireDefault(_chaptersTrackMenuItem);

var _toTitleCase = require('../../utils/to-title-case.js');

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file chapters-button.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The button component for toggling and selecting chapters
 * Chapters act much differently than other text tracks
 * Cues are navigation vs. other tracks of alternative languages
 *
 * @extends TextTrackButton
 */
var ChaptersButton = function (_TextTrackButton) {
  _inherits(ChaptersButton, _TextTrackButton);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when this function is ready.
   */
  function ChaptersButton(player, options, ready) {
    _classCallCheck(this, ChaptersButton);

    var _this = _possibleConstructorReturn(this, _TextTrackButton.call(this, player, options, ready));

    _this.el_.setAttribute('aria-label', 'Chapters Menu');
    return _this;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */


  ChaptersButton.prototype.buildCSSClass = function buildCSSClass() {
    return 'vjs-chapters-button ' + _TextTrackButton.prototype.buildCSSClass.call(this);
  };

  /**
   * Update the menu based on the current state of its items.
   *
   * @param {EventTarget~Event} [event]
   *        An event that triggered this function to run.
   *
   * @listens TextTrackList#addtrack
   * @listens TextTrackList#removetrack
   * @listens TextTrackList#change
   */


  ChaptersButton.prototype.update = function update(event) {
    if (!this.track_ || event && (event.type === 'addtrack' || event.type === 'removetrack')) {
      this.setTrack(this.findChaptersTrack());
    }
    _TextTrackButton.prototype.update.call(this);
  };

  /**
   * Set the currently selected track for the chapters button.
   *
   * @param {TextTrack} track
   *        The new track to select. Nothing will change if this is the currently selected
   *        track.
   */


  ChaptersButton.prototype.setTrack = function setTrack(track) {
    if (this.track_ === track) {
      return;
    }

    if (!this.updateHandler_) {
      this.updateHandler_ = this.update.bind(this);
    }

    // here this.track_ refers to the old track instance
    if (this.track_) {
      var remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);

      if (remoteTextTrackEl) {
        remoteTextTrackEl.removeEventListener('load', this.updateHandler_);
      }

      this.track_ = null;
    }

    this.track_ = track;

    // here this.track_ refers to the new track instance
    if (this.track_) {
      this.track_.mode = 'hidden';

      var _remoteTextTrackEl = this.player_.remoteTextTrackEls().getTrackElementByTrack_(this.track_);

      if (_remoteTextTrackEl) {
        _remoteTextTrackEl.addEventListener('load', this.updateHandler_);
      }
    }
  };

  /**
   * Find the track object that is currently in use by this ChaptersButton
   *
   * @return {TextTrack|undefined}
   *         The current track or undefined if none was found.
   */


  ChaptersButton.prototype.findChaptersTrack = function findChaptersTrack() {
    var tracks = this.player_.textTracks() || [];

    for (var i = tracks.length - 1; i >= 0; i--) {
      // We will always choose the last track as our chaptersTrack
      var track = tracks[i];

      if (track.kind === this.kind_) {
        return track;
      }
    }
  };

  /**
   * Get the caption for the ChaptersButton based on the track label. This will also
   * use the current tracks localized kind as a fallback if a label does not exist.
   *
   * @return {string}
   *         The tracks current label or the localized track kind.
   */


  ChaptersButton.prototype.getMenuCaption = function getMenuCaption() {
    if (this.track_ && this.track_.label) {
      return this.track_.label;
    }
    return this.localize((0, _toTitleCase2['default'])(this.kind_));
  };

  /**
   * Create menu from chapter track
   *
   * @return {Menu}
   *         New menu for the chapter buttons
   */


  ChaptersButton.prototype.createMenu = function createMenu() {
    this.options_.title = this.getMenuCaption();
    return _TextTrackButton.prototype.createMenu.call(this);
  };

  /**
   * Create a menu item for each text track
   *
   * @return {TextTrackMenuItem[]}
   *         Array of menu items
   */


  ChaptersButton.prototype.createItems = function createItems() {
    var items = [];

    if (!this.track_) {
      return items;
    }

    var cues = this.track_.cues;

    if (!cues) {
      return items;
    }

    for (var i = 0, l = cues.length; i < l; i++) {
      var cue = cues[i];
      var mi = new _chaptersTrackMenuItem2['default'](this.player_, { track: this.track_, cue: cue });

      items.push(mi);
    }

    return items;
  };

  return ChaptersButton;
}(_textTrackButton2['default']);

/**
 * `kind` of TextTrack to look for to associate it with this menu.
 *
 * @type {string}
 * @private
 */


ChaptersButton.prototype.kind_ = 'chapters';

/**
 * The text that should display over the `ChaptersButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
ChaptersButton.prototype.controlText_ = 'Chapters';

_component2['default'].registerComponent('ChaptersButton', ChaptersButton);
exports['default'] = ChaptersButton;
