import Component from '../component';
import Menu, { MenuItem, MenuButton } from '../menu';
import * as Lib from '../lib';
import document from 'global/document';
import window from 'global/window';

/* Text Track Display
============================================================================= */
// Global container for both subtitle and captions text. Simple div container.

/**
 * The component for displaying text track cues
 *
 * @constructor
 */
var TextTrackDisplay = Component.extend({
  /** @constructor */
  init: function(player, options, ready){
    Component.call(this, player, options, ready);

    player.on('loadstart', Lib.bind(this, this.toggleDisplay));

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    player.ready(Lib.bind(this, function() {
      if (player.tech && player.tech['featuresNativeTextTracks']) {
        this.hide();
        return;
      }

      player.on('fullscreenchange', Lib.bind(this, this.updateDisplay));

      let tracks = player.options_['tracks'] || [];
      for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i];
        this.player_.addRemoteTextTrack(track);
      }
    }));
  }
});

Component.registerComponent('TextTrackDisplay', TextTrackDisplay);

TextTrackDisplay.prototype.toggleDisplay = function() {
  if (this.player_.tech && this.player_.tech['featuresNativeTextTracks']) {
    this.hide();
  } else {
    this.show();
  }
};

TextTrackDisplay.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-text-track-display'
  });
};

TextTrackDisplay.prototype.clearDisplay = function() {
  if (typeof window['WebVTT'] === 'function') {
    window['WebVTT']['processCues'](window, [], this.el_);
  }
};

// Add cue HTML to display
let constructColor = function(color, opacity) {
  return 'rgba(' +
    // color looks like "#f0e"
    parseInt(color[1] + color[1], 16) + ',' +
    parseInt(color[2] + color[2], 16) + ',' +
    parseInt(color[3] + color[3], 16) + ',' +
    opacity + ')';
};
const darkGray = '#222';
const lightGray = '#ccc';
const fontMap = {
  monospace:             'monospace',
  sansSerif:             'sans-serif',
  serif:                 'serif',
  monospaceSansSerif:    '"Andale Mono", "Lucida Console", monospace',
  monospaceSerif:        '"Courier New", monospace',
  proportionalSansSerif: 'sans-serif',
  proportionalSerif:     'serif',
  casual:                '"Comic Sans MS", Impact, fantasy',
  script:                '"Monotype Corsiva", cursive',
  smallcaps:             '"Andale Mono", "Lucida Console", monospace, sans-serif'
};
let tryUpdateStyle = function(el, style, rule) {
  // some style changes will throw an error, particularly in IE8. Those should be noops.
  try {
    el.style[style] = rule;
  } catch (e) {}
};

TextTrackDisplay.prototype.updateDisplay = function() {
  var tracks = this.player_.textTracks();

  this.clearDisplay();

  if (!tracks) {
    return;
  }

  for (let i=0; i < tracks.length; i++) {
    let track = tracks[i];
    if (track['mode'] === 'showing') {
      this.updateForTrack(track);
    }
  }
};

TextTrackDisplay.prototype.updateForTrack = function(track) {
  if (typeof window['WebVTT'] !== 'function' || !track['activeCues']) {
    return;
  }

  let overrides = this.player_['textTrackSettings'].getValues();

  let cues = [];
  for (let i = 0; i < track['activeCues'].length; i++) {
    cues.push(track['activeCues'][i]);
  }

  window['WebVTT']['processCues'](window, track['activeCues'], this.el_);

  let i = cues.length;
  while (i--) {
    let cueDiv = cues[i].displayState;
    if (overrides.color) {
      cueDiv.firstChild.style.color = overrides.color;
    }
    if (overrides.textOpacity) {
      tryUpdateStyle(cueDiv.firstChild,
                     'color',
                     constructColor(overrides.color || '#fff',
                                    overrides.textOpacity));
    }
    if (overrides.backgroundColor) {
      cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
    }
    if (overrides.backgroundOpacity) {
      tryUpdateStyle(cueDiv.firstChild,
                     'backgroundColor',
                     constructColor(overrides.backgroundColor || '#000',
                                    overrides.backgroundOpacity));
    }
    if (overrides.windowColor) {
      if (overrides.windowOpacity) {
        tryUpdateStyle(cueDiv,
                       'backgroundColor',
                       constructColor(overrides.windowColor, overrides.windowOpacity));
      } else {
        cueDiv.style.backgroundColor = overrides.windowColor;
      }
    }
    if (overrides.edgeStyle) {
      if (overrides.edgeStyle === 'dropshadow') {
        cueDiv.firstChild.style.textShadow = '2px 2px 3px ' + darkGray + ', 2px 2px 4px ' + darkGray + ', 2px 2px 5px ' + darkGray;
      } else if (overrides.edgeStyle === 'raised') {
        cueDiv.firstChild.style.textShadow = '1px 1px ' + darkGray + ', 2px 2px ' + darkGray + ', 3px 3px ' + darkGray;
      } else if (overrides.edgeStyle === 'depressed') {
        cueDiv.firstChild.style.textShadow = '1px 1px ' + lightGray + ', 0 1px ' + lightGray + ', -1px -1px ' + darkGray + ', 0 -1px ' + darkGray;
      } else if (overrides.edgeStyle === 'uniform') {
        cueDiv.firstChild.style.textShadow = '0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray;
      }
    }
    if (overrides.fontPercent && overrides.fontPercent !== 1) {
      const fontSize = window.parseFloat(cueDiv.style.fontSize);
      cueDiv.style.fontSize = (fontSize * overrides.fontPercent) + 'px';
      cueDiv.style.height = 'auto';
      cueDiv.style.top = 'auto';
      cueDiv.style.bottom = '2px';
    }
    if (overrides.fontFamily && overrides.fontFamily !== 'default') {
      if (overrides.fontFamily === 'small-caps') {
        cueDiv.firstChild.style.fontVariant = 'small-caps';
      } else {
        cueDiv.firstChild.style.fontFamily = fontMap[overrides.fontFamily];
      }
    }
  }
};

/**
 * The specific menu item type for selecting a language within a text track kind
 *
 * @constructor
 */
var TextTrackMenuItem = MenuItem.extend({
  /** @constructor */
  init: function(player, options){
    let track = this.track = options['track'];
    let tracks = player.textTracks();

    let changeHandler;

    if (tracks) {
      changeHandler = Lib.bind(this, function() {
        let selected = this.track['mode'] === 'showing';

        if (this instanceof OffTextTrackMenuItem) {
          selected = true;

          for (let i = 0, l = tracks.length; i < l; i++) {
            let track = tracks[i];
            if (track['kind'] === this.track['kind'] && track['mode'] === 'showing') {
              selected = false;
              break;
            }
          }
        }

        this.selected(selected);
      });
      tracks.addEventListener('change', changeHandler);
      player.on('dispose', function() {
        tracks.removeEventListener('change', changeHandler);
      });
    }

    // Modify options for parent MenuItem class's init.
    options['label'] = track['label'] || track['language'] || 'Unknown';
    options['selected'] = track['default'] || track['mode'] === 'showing';
    MenuItem.call(this, player, options);

    // iOS7 doesn't dispatch change events to TextTrackLists when an
    // associated track's mode changes. Without something like
    // Object.observe() (also not present on iOS7), it's not
    // possible to detect changes to the mode attribute and polyfill
    // the change event. As a poor substitute, we manually dispatch
    // change events whenever the controls modify the mode.
    if (tracks && tracks.onchange === undefined) {
      let event;

      this.on(['tap', 'click'], function() {
        if (typeof window.Event !== 'object') {
          // Android 2.3 throws an Illegal Constructor error for window.Event
          try {
            event = new window.Event('change');
          } catch(err){}
        }

        if (!event) {
          event = document.createEvent('Event');
          event.initEvent('change', true, true);
        }

        tracks.dispatchEvent(event);
      });
    }
  }
});

Component.registerComponent('TextTrackMenuItem', TextTrackMenuItem);

TextTrackMenuItem.prototype.onClick = function(){
  let kind = this.track['kind'];
  let tracks = this.player_.textTracks();

  MenuItem.prototype.onClick.call(this);

  if (!tracks) return;

  for (let i = 0; i < tracks.length; i++) {
    let track = tracks[i];

    if (track['kind'] !== kind) {
      continue;
    }

    if (track === this.track) {
      track['mode'] = 'showing';
    } else {
      track['mode'] = 'disabled';
    }
  }
};

/**
 * A special menu item for turning of a specific type of text track
 *
 * @constructor
 */
var OffTextTrackMenuItem = TextTrackMenuItem.extend({
  /** @constructor */
  init: function(player, options){
    // Create pseudo track info
    // Requires options['kind']
    options['track'] = {
      'kind': options['kind'],
      'player': player,
      'label': options['kind'] + ' off',
      'default': false,
      'mode': 'disabled'
    };
    TextTrackMenuItem.call(this, player, options);
    this.selected(true);
  }
});

Component.registerComponent('OffTextTrackMenuItem', OffTextTrackMenuItem);

let CaptionSettingsMenuItem = TextTrackMenuItem.extend({
  init: function(player, options) {
    options['track'] = {
      'kind': options['kind'],
      'player': player,
      'label': options['kind'] + ' settings',
      'default': false,
      mode: 'disabled'
    };

    TextTrackMenuItem.call(this, player, options);
    this.addClass('vjs-texttrack-settings');
  }
});

Component.registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);

CaptionSettingsMenuItem.prototype.onClick = function() {
  this.player().getChild('textTrackSettings').show();
};

/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @constructor
 */
var TextTrackButton = MenuButton.extend({
  /** @constructor */
  init: function(player, options){
    MenuButton.call(this, player, options);

    let tracks = this.player_.textTracks();

    if (this.items.length <= 1) {
      this.hide();
    }

    if (!tracks) {
      return;
    }

    let updateHandler = Lib.bind(this, this.update);
    tracks.addEventListener('removetrack', updateHandler);
    tracks.addEventListener('addtrack', updateHandler);

    this.player_.on('dispose', function() {
      tracks.removeEventListener('removetrack', updateHandler);
      tracks.removeEventListener('addtrack', updateHandler);
    });
  }
});

Component.registerComponent('TextTrackButton', TextTrackButton);

// Create a menu item for each text track
TextTrackButton.prototype.createItems = function(){
  let items = [];

  if (this instanceof CaptionsButton && !(this.player().tech && this.player().tech['featuresNativeTextTracks'])) {
    items.push(new CaptionSettingsMenuItem(this.player_, { 'kind': this.kind_ }));
  }

  // Add an OFF menu item to turn all tracks off
  items.push(new OffTextTrackMenuItem(this.player_, { 'kind': this.kind_ }));

  let tracks = this.player_.textTracks();

  if (!tracks) {
    return items;
  }

  for (let i = 0; i < tracks.length; i++) {
    let track = tracks[i];

    // only add tracks that are of the appropriate kind and have a label
    if (track['kind'] === this.kind_) {
      items.push(new TextTrackMenuItem(this.player_, {
        'track': track
      }));
    }
  }

  return items;
};

/**
 * The button component for toggling and selecting captions
 *
 * @constructor
 */
var CaptionsButton = TextTrackButton.extend({
  /** @constructor */
  init: function(player, options, ready){
    TextTrackButton.call(this, player, options, ready);
    this.el_.setAttribute('aria-label','Captions Menu');
  }
});

Component.registerComponent('CaptionsButton', CaptionsButton);

CaptionsButton.prototype.kind_ = 'captions';
CaptionsButton.prototype.buttonText = 'Captions';
CaptionsButton.prototype.className = 'vjs-captions-button';

CaptionsButton.prototype.update = function() {
  let threshold = 2;
  TextTrackButton.prototype.update.call(this);

  // if native, then threshold is 1 because no settings button
  if (this.player().tech && this.player().tech['featuresNativeTextTracks']) {
    threshold = 1;
  }

  if (this.items && this.items.length > threshold) {
    this.show();
  } else {
    this.hide();
  }
};

/**
 * The button component for toggling and selecting subtitles
 *
 * @constructor
 */
var SubtitlesButton = TextTrackButton.extend({
  /** @constructor */
  init: function(player, options, ready){
    TextTrackButton.call(this, player, options, ready);
    this.el_.setAttribute('aria-label','Subtitles Menu');
  }
});

Component.registerComponent('SubtitlesButton', SubtitlesButton);

SubtitlesButton.prototype.kind_ = 'subtitles';
SubtitlesButton.prototype.buttonText = 'Subtitles';
SubtitlesButton.prototype.className = 'vjs-subtitles-button';

// Chapters act much differently than other text tracks
// Cues are navigation vs. other tracks of alternative languages
/**
 * The button component for toggling and selecting chapters
 *
 * @constructor
 */
var ChaptersButton = TextTrackButton.extend({
  /** @constructor */
  init: function(player, options, ready){
    TextTrackButton.call(this, player, options, ready);
    this.el_.setAttribute('aria-label','Chapters Menu');
  }
});

Component.registerComponent('ChaptersButton', ChaptersButton);

ChaptersButton.prototype.kind_ = 'chapters';
ChaptersButton.prototype.buttonText = 'Chapters';
ChaptersButton.prototype.className = 'vjs-chapters-button';

// Create a menu item for each text track
ChaptersButton.prototype.createItems = function(){
  let items = [];

  let tracks = this.player_.textTracks();

  if (!tracks) {
    return items;
  }

  for (let i = 0; i < tracks.length; i++) {
    let track = tracks[i];
    if (track['kind'] === this.kind_) {
      items.push(new TextTrackMenuItem(this.player_, {
        'track': track
      }));
    }
  }

  return items;
};

ChaptersButton.prototype.createMenu = function(){
  let tracks = this.player_.textTracks() || [];
  let chaptersTrack;
  let items = this.items = [];

  for (let i = 0, l = tracks.length; i < l; i++) {
    let track = tracks[i];
    if (track['kind'] == this.kind_) {
      if (!track.cues) {
        track['mode'] = 'hidden';
        /* jshint loopfunc:true */
        // TODO see if we can figure out a better way of doing this https://github.com/videojs/video.js/issues/1864
        window.setTimeout(Lib.bind(this, function() {
          this.createMenu();
        }), 100);
        /* jshint loopfunc:false */
      } else {
        chaptersTrack = track;
        break;
      }
    }
  }

  let menu = this.menu;
  if (menu === undefined) {
    menu = new Menu(this.player_);
    menu.contentEl().appendChild(Lib.createEl('li', {
      className: 'vjs-menu-title',
      innerHTML: Lib.capitalize(this.kind_),
      tabindex: -1
    }));
  }

  if (chaptersTrack) {
    let cues = chaptersTrack['cues'], cue;

    for (let i = 0, l = cues.length; i < l; i++) {
      cue = cues[i];

      let mi = new ChaptersTrackMenuItem(this.player_, {
        'track': chaptersTrack,
        'cue': cue
      });

      items.push(mi);

      menu.addChild(mi);
    }
    this.addChild(menu);
  }

  if (this.items.length > 0) {
    this.show();
  }

  return menu;
};


/**
 * @constructor
 */
var ChaptersTrackMenuItem = MenuItem.extend({
  /** @constructor */
  init: function(player, options){
    let track = this.track = options['track'];
    let cue = this.cue = options['cue'];
    let currentTime = player.currentTime();

    // Modify options for parent MenuItem class's init.
    options['label'] = cue.text;
    options['selected'] = (cue['startTime'] <= currentTime && currentTime < cue['endTime']);
    MenuItem.call(this, player, options);

    track.addEventListener('cuechange', Lib.bind(this, this.update));
  }
});

Component.registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);

ChaptersTrackMenuItem.prototype.onClick = function(){
  MenuItem.prototype.onClick.call(this);
  this.player_.currentTime(this.cue.startTime);
  this.update(this.cue.startTime);
};

ChaptersTrackMenuItem.prototype.update = function(){
  let cue = this.cue;
  let currentTime = this.player_.currentTime();

  // vjs.log(currentTime, cue.startTime);
  this.selected(cue['startTime'] <= currentTime && currentTime < cue['endTime']);
};

export { TextTrackDisplay, TextTrackButton, CaptionsButton, SubtitlesButton, ChaptersButton, TextTrackMenuItem, ChaptersTrackMenuItem };
