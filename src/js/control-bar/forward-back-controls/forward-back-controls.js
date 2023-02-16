import Component from '../../component';
import * as Dom from '../../utils/dom';
import Button from '../../button';

class ForwardBackControls extends Component {
  constructor(player, options) {
    super(player, options);

    this.validOptions = [5, 10, 30];
    this.jumpForwardAndBackTime = this.options_.playerOptions.jumpForwardAndBack;

    this.forwardButton_ = new Button(player, options);
    this.backButton_ = new Button(player, options);

    this.populateForwardAndBackButtons();

    if (this.jumpForwardAndBackTime && this.validOptions.includes(this.jumpForwardAndBackTime)) {
      this.show();
    } else {
      this.hide();
    }
  }

  populateForwardAndBackButtons() {
    this.forwardButton_.addClass(`vjs-forward-button-${this.jumpForwardAndBackTime}`);
    this.forwardButton_.controlText('Jump Forward');
    this.backButton_.addClass(`vjs-back-button-${this.jumpForwardAndBackTime}`);
    this.backButton_.controlText('Jump Back');

    this.on(this.forwardButton_, 'click', (e) => this.handleForwardClick(e));
    this.on(this.backButton_, 'click', (e) => this.handleBackClick(e));

    this.addChild(this.forwardButton_);
    this.addChild(this.backButton_);
  }

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

  handleBackClick(event) {
    const currentVideoTime = this.player_.currentTime();

    let newTime;

    if (currentVideoTime >= this.jumpForwardAndBackTime) {
      newTime = currentVideoTime - this.jumpForwardAndBackTime;
    } else {
      newTime = 0;
    }
    this.player_.currentTime(newTime);
  }

  buildCSSClass() {
    return `vjs-forward-back-controls ${super.buildCSSClass()}`;
  }

  // we want to create two elements
  createEl() {
    const el = Dom.createEl('div', {
      className: this.buildCSSClass()
    });

    return el;
  }
}

Component.registerComponent('ForwardBackControls', ForwardBackControls);

export default ForwardBackControls;
