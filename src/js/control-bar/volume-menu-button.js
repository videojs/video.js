/**
 * @file volume-menu-button.js
 */
import * as Fn from '../utils/fn.js';
import Component from '../component.js';
import Popup from '../popup/popup.js';
import PopupButton from '../popup/popup-button.js';
import MuteToggle from './mute-toggle.js';
import VolumeBar from './volume-control/volume-bar.js';

/**
 * Button for volume popup
 *
 * @extends PopupButton
 */
class VolumeMenuButton extends PopupButton {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    // Default to inline
    if (options.inline === undefined) {
      options.inline = true;
    }

    // If the vertical option isn't passed at all, default to true.
    if (options.vertical === undefined) {
      // If an inline volumeMenuButton is used, we should default to using
      // a horizontal slider for obvious reasons.
      if (options.inline) {
        options.vertical = false;
      } else {
        options.vertical = true;
      }
    }

    // The vertical option needs to be set on the volumeBar as well,
    // since that will need to be passed along to the VolumeBar constructor
    options.volumeBar = options.volumeBar || {};
    options.volumeBar.vertical = !!options.vertical;

    super(player, options);

    // Same listeners as MuteToggle
    this.on(player, 'volumechange', this.volumeUpdate);
    this.on(player, 'loadstart', this.volumeUpdate);

    // hide mute toggle if the current tech doesn't support volume control
    function updateVisibility() {
      if (player.tech_ && player.tech_.featuresVolumeControl === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    }

    updateVisibility.call(this);
    this.on(player, 'loadstart', updateVisibility);

    this.on(this.volumeBar, ['slideractive', 'focus'], function() {
      this.addClass('vjs-slider-active');
    });

    this.on(this.volumeBar, ['sliderinactive', 'blur'], function() {
      this.removeClass('vjs-slider-active');
    });

    this.on(this.volumeBar, ['focus'], function() {
      this.addClass('vjs-lock-showing');
    });

    this.on(this.volumeBar, ['blur'], function() {
      this.removeClass('vjs-lock-showing');
    });
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    let orientationClass = '';

    if (this.options_.vertical) {
      orientationClass = 'vjs-volume-menu-button-vertical';
    } else {
      orientationClass = 'vjs-volume-menu-button-horizontal';
    }

    return `vjs-volume-menu-button ${super.buildCSSClass()} ${orientationClass}`;
  }

  /**
   * Create the VolumeMenuButton popup
   *
   * @return {Popup}
   *         The popup that was created
   */
  createPopup() {
    const popup = new Popup(this.player_, {
      contentElType: 'div'
    });

    const vb = new VolumeBar(this.player_, this.options_.volumeBar);

    popup.addChild(vb);

    this.menuContent = popup;
    this.volumeBar = vb;

    this.attachVolumeBarEvents();

    return popup;
  }

  /**
   * This gets called when an `VolumeMenuButton` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    MuteToggle.prototype.handleClick.call(this);
    super.handleClick();
  }

  /**
   * Add events listeners to the created `VolumeBar`.
   */
  attachVolumeBarEvents() {
    this.menuContent.on(['mousedown', 'touchdown'], Fn.bind(this, this.handleMouseDown));
  }

  /**
   * Handle the `mousedown` and `touchdown` events on the `VolumeBar`
   *
   * @param {EventTarget~Event} [event]
   *        The `mousedown` or `touchdown` event that caused this to run.
   *
   * @listens mousedown
   * @listens touchdown
   */
  handleMouseDown(event) {
    this.on(['mousemove', 'touchmove'], Fn.bind(this.volumeBar, this.volumeBar.handleMouseMove));
    this.on(this.el_.ownerDocument, ['mouseup', 'touchend'], this.handleMouseUp);
  }

  /**
   * Handle the `mouseup` and `touchend` events on the `VolumeBar`
   *
   * @param {EventTarget~Event} [event]
   *        The `mouseup` or `touchend` event that caused this to run.
   *
   * @listens mouseup
   * @listens touchend
   */
  handleMouseUp(event) {
    this.off(['mousemove', 'touchmove'], Fn.bind(this.volumeBar, this.volumeBar.handleMouseMove));
  }
}

/**
 * @borrows MuteToggle#update as VolumeMenuButton#volumeUpdate
 */
VolumeMenuButton.prototype.volumeUpdate = MuteToggle.prototype.update;

/**
 * The text that should display over the `VolumeMenuButton`s controls. Added for localization.
 *
 * @type {string}
 * @private
 */
VolumeMenuButton.prototype.controlText_ = 'Mute';

Component.registerComponent('VolumeMenuButton', VolumeMenuButton);
export default VolumeMenuButton;
