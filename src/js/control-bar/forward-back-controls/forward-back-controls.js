import Component from '../../component';
import Button from '../../button';

/**
 * A component that contains both a 'Forward' and a 'Back' button.
 * These buttons allow the user to jump forward or back in the timeline
 * of a video by a certain number of seconds (either 5, 10, or 30)
 *
 * @extends Component
 */
class ForwardBackControls extends Component {
  constructor(player, options) {
    super(player, options);

    this.validOptions = [5, 10, 30];
    this.jumpForwardAndBackTime = this.options_.playerOptions.jumpForwardAndBack;

    this.forwardButton_ = new Button(player, options);
    this.backButton_ = new Button(player, options);

    this.populateForwardAndBackButtons();

    // should only show this component if user has set the `jumpForwardAndBack` option to a valid time
    if (this.jumpForwardAndBackTime && this.validOptions.includes(this.jumpForwardAndBackTime)) {
      this.show();
    } else {
      this.hide();
    }
  }
  /**
   * Populates the forward and back buttons with the relevant
   * class names, control text and onClick functionality.
   */
  populateForwardAndBackButtons() {
    this.forwardButton_.addClass(`vjs-forward-button-${this.jumpForwardAndBackTime}`);
    this.forwardButton_.controlText('Jump Forward');

    this.backButton_.addClass(`vjs-back-button-${this.jumpForwardAndBackTime}`);
    this.backButton_.controlText('Jump Back');

    this.on(this.forwardButton_, 'click', (e) => this.handleForwardClick(e));
    this.on(this.forwardButton_, 'tap', (e) => this.handleForwardClick(e));

    this.on(this.backButton_, 'click', (e) => this.handleBackClick(e));
    this.on(this.backButton_, 'tap', (e) => this.handleBackClick(e));

    this.addChild(this.forwardButton_);
    this.addChild(this.backButton_);
  }

  /**
   * Handle a click on a `Forward Button`
   * Moves the current time on a video forward by x seconds,
   * or if the amount of time remaining is less than x,
   * moves the video to the end.
   *
   * @param {EventTarget~Event} event
   *        The `tap` or `click` event that caused this function
   *        to be called
   */
  handleForwardClick(event) {
    const currentTime = this.player_.currentTime();
    const duration = this.player_.duration();

    let newTime;

    if (currentTime + this.jumpForwardAndBackTime <= duration) {
      newTime = currentTime + this.jumpForwardAndBackTime;
    } else {
      newTime = duration;
    }
    this.player_.currentTime(newTime);
  }

  /**
   * Handle a click on a `Back Button`
   * Moves the current time on a video back by x seconds,
   * or if the current time is less than x, moves the
   * video to the beginning
   *
   * @param {EventTarget~Event} event
   *        The `tap` or `click` event that cuased this function
   *        to be called
   */
  handleBackClick(event) {
    const currentTime = this.player_.currentTime();

    let newTime;

    if (currentTime >= this.jumpForwardAndBackTime) {
      newTime = currentTime - this.jumpForwardAndBackTime;
    } else {
      newTime = 0;
    }
    this.player_.currentTime(newTime);
  }

  buildCSSClass() {
    return `vjs-forward-back-controls ${super.buildCSSClass()}`;
  }
}

Component.registerComponent('ForwardBackControls', ForwardBackControls);

export default ForwardBackControls;
