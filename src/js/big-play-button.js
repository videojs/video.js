/**
 * @file big-play-button.js
 */
import Button from './button.js';
import Component from './component.js';

/**
 * The initial play button that shows before the video has played. The hiding of the
 * `BigPlayButton` get done via CSS and `Player` states.
 *
 * @extends Button
 */
class BigPlayButton extends Button {

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object. Always returns 'vjs-big-play-button'.
   */
  buildCSSClass() {
    return 'vjs-big-play-button';
  }

  /**
   * This gets called when a `BigPlayButton` gets:
   * - Clicked (via the `click` event, listening starts in the constructor)
   * - Tapped (via the `tap` event, listening starts in the constructor)
   * - Gains focus (via the `focus` event). Causes `ClickableComponent`
   *   to listen for the `keydown` event. If the enter/space key gets
   *   pressed before focus gets lost (via the `blur` event) this function gets called.
   *
   * @param {EventTarget~Event} event
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens {tap}
   * @listens {click}
   */
  handleClick(event) {
    this.player_.play();
  }
}

/**
 * The text that should display over the `BigPlayButton`s controls. Added to for localization.
 *
 * @type {string}
 * @private
 */
BigPlayButton.prototype.controlText_ = 'Play Video';

Component.registerComponent('BigPlayButton', BigPlayButton);
export default BigPlayButton;
