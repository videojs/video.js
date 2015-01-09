/**
 * Container of main controls
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends vjs.Component
 */
vjs.ControlBar = vjs.Component.extend();

vjs.ControlBar.prototype.options_ = {
  loadEvent: 'play',
  children: {
    'playToggle': {},
    'currentTimeDisplay': {},
    'timeDivider': {},
    'durationDisplay': {},
    'remainingTimeDisplay': {},
    'liveDisplay': {},
    'progressControl': {},
    'RightControlsSubBar': {}
  }
};

vjs.ControlBar.prototype.createEl = function(){
  return vjs.createEl('div', {
    className: 'vjs-control-bar'
  });
};

/**
 * Right side container for the control bar
 * This holds all of the UI elements that are floated to the right of
 * the control bar. This is primarily the captions, subtitles, and chapters
 * menu. This, along with the MiddleControlSubBar is needed to reconcile the
 * onscreen order of the UI elements and the tab order of the elements in the
 * DOM.
 * 
 * For accessibility, their should be a logical order to the tab sequence. While
 * it is not essential that the tab order exactly match the visual layout, it
 * is suggested to not add any additional confusion to the UI.
 * 
 * http://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-focus-order.html

 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends vjs.Component
 */

vjs.RightControlsSubBar = vjs.Component.extend();

vjs.RightControlsSubBar.prototype.options_ = {
  loadEvent: 'play',
  children: {
    'MiddleControlsSubBar': {},
    'playbackRateMenuButton': {},
    // 'volumeMenuButton': {},
    'muteToggle': {},
    'volumeControl': {},
    'fullscreenToggle': {}
   }
};

vjs.RightControlsSubBar.prototype.createEl = function(){
  return vjs.createEl('div', {
    className: 'vjs-control-bar-right'
  });
};

/**
 * Middle container for the control bar
 * This holds all of the UI elements that are added at a later time
 * to the container that is floated to the right of the control bar.
 * This is primarily the captions, subtitles, and chapters menu. This,
 * along with the RightControlSubBar is needed to reconcile the onscreen
 * order of the UI elements and the tab order of the elements in the DOM.
 * 
 * For accessibility, their should be a logical order to the tab sequence. While
 * it is not essential that the tab order exactly match the visual layout, it
 * is suggested to not add any additional confusion to the UI.
 * 
 * http://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-focus-order.html
 * 
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends vjs.Component
 */

vjs.MiddleControlsSubBar = vjs.Component.extend();

vjs.MiddleControlsSubBar.prototype.options_ = {
  loadEvent: 'play',
  children: {}
};

vjs.MiddleControlsSubBar.prototype.createEl = function(){
  return vjs.createEl('div', {
    className: 'vjs-control-bar-middle'
  });
};
