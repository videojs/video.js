var Button, Component, vjslib, vjsevents;

Component = require('./component.js');
vjslib = require('./lib.js');
vjsevents = require('./events.js');

/* Button - Base class for all buttons
================================================================================ */
/**
 * Base class for all buttons
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
Button = Component.extend({
  /**
   * @constructor
   * @inheritDoc
   */
  init: function(player, options){
    Component.call(this, player, options);

    this.emitTapEvents();

    this.on('tap', this.onClick);
    this.on('click', this.onClick);
    this.on('focus', this.onFocus);
    this.on('blur', this.onBlur);
  }
});

Button.prototype.createEl = function(type, props){
  var el;

  // Add standard Aria and Tabindex info
  props = vjslib.obj.merge({
    className: this.buildCSSClass(),
    'role': 'button',
    'aria-live': 'polite', // let the screen reader user know that the text of the button may change
    tabIndex: 0
  }, props);

  el = Component.prototype.createEl.call(this, type, props);

  // if innerHTML hasn't been overridden (bigPlayButton), add content elements
  if (!props.innerHTML) {
    this.contentEl_ = vjslib.createEl('div', {
      className: 'vjs-control-content'
    });

    this.controlText_ = vjslib.createEl('span', {
      className: 'vjs-control-text',
      innerHTML: this.buttonText || 'Need Text'
    });

    this.contentEl_.appendChild(this.controlText_);
    el.appendChild(this.contentEl_);
  }

  return el;
};

Button.prototype.buildCSSClass = function(){
  // TODO: Change vjs-control to vjs-button?
  return 'vjs-control ' + Component.prototype.buildCSSClass.call(this);
};

  // Click - Override with specific functionality for button
Button.prototype.onClick = function(){};

  // Focus - Add keyboard functionality to element
Button.prototype.onFocus = function(){
  vjsevents.on(document, 'keyup', vjslib.bind(this, this.onKeyPress));
};

  // KeyPress (document level) - Trigger click when keys are pressed
Button.prototype.onKeyPress = function(event){
  // Check for space bar (32) or enter (13) keys
  if (event.which == 32 || event.which == 13) {
    event.preventDefault();
    this.onClick();
  }
};

// Blur - Remove keyboard triggers
Button.prototype.onBlur = function(){
  vjsevents.off(document, 'keyup', vjslib.bind(this, this.onKeyPress));
};

module.exports = Button;
