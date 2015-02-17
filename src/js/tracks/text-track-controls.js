(function() {
'use strict';

/* Text Track Display
============================================================================= */
// Global container for both subtitle and captions text. Simple div container.

/**
 * The component for displaying text track cues
 *
 * @constructor
 */
vjs.TextTrackDisplay = vjs.Component.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.Component.call(this, player, options, ready);

    player.on('loadstart', vjs.bind(this, this.toggleDisplay));

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    player.ready(vjs.bind(this, function() {
      if (player.tech && player.tech['featuresNativeTextTracks']) {
        this.hide();
        return;
      }

      var i, tracks, track;

      player.on('fullscreenchange', vjs.bind(this, this.updateDisplay));

      tracks = player.options_['tracks'] || [];
      for (i = 0; i < tracks.length; i++) {
        track = tracks[i];
        this.player_.addRemoteTextTrack(track);
      }
    }));
  }
});

vjs.TextTrackDisplay.prototype.toggleDisplay = function() {
  if (this.player_.tech && this.player_.tech['featuresNativeTextTracks']) {
    this.hide();
  } else {
    this.show();
  }
};

vjs.TextTrackDisplay.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-text-track-display'
  });
};

vjs.TextTrackDisplay.prototype.clearDisplay = function() {
  if (typeof window['WebVTT'] === 'function') {
    window['WebVTT']['processCues'](window, [], this.el_);
  }
};

// Add cue HTML to display
var constructColor = function(color, opacity) {
  return 'rgba(' +
    // color looks like "#f0e"
    parseInt(color[1] + color[1], 16) + ',' +
    parseInt(color[2] + color[2], 16) + ',' +
    parseInt(color[3] + color[3], 16) + ',' +
    opacity + ')';
};
var darkGray = '#222';
var lightGray = '#ccc';
var fontMap = {
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
var tryUpdateStyle = function(el, style, rule) {
  // some style changes will throw an error, particularly in IE8. Those should be noops.
  try {
    el.style[style] = rule;
  } catch (e) {}
};

vjs.TextTrackDisplay.prototype.updateDisplay = function() {
  var tracks = this.player_.textTracks(),
      i = 0,
      track;

  this.clearDisplay();

  if (!tracks) {
    return;
  }

  for (; i < tracks.length; i++) {
    track = tracks[i];
    if (track['mode'] === 'showing') {
      this.updateForTrack(track);
    }
  }
};

vjs.TextTrackDisplay.prototype.updateForTrack = function(track) {
  if (typeof window['WebVTT'] !== 'function' || !track['activeCues']) {
    return;
  }

  var i = 0,
      property,
      cueDiv,
      overrides = this.player_['textTrackSettings'].getValues(),
      fontSize,
      cues = [];

  for (; i < track['activeCues'].length; i++) {
    cues.push(track['activeCues'][i]);
  }

  window['WebVTT']['processCues'](window, track['activeCues'], this.el_);

  i = cues.length;
  while (i--) {
    cueDiv = cues[i].displayState;
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
      fontSize = window.parseFloat(cueDiv.style.fontSize);
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
vjs.TextTrackMenuItem = vjs.MenuItem.extend({
  /** @constructor */
  init: function(player, options){
    var track = this.track = options['track'],
        tracks = player.textTracks(),
        changeHandler,
        event;

    if (tracks) {
      changeHandler = vjs.bind(this, function() {
        var selected = this.track['mode'] === 'showing',
            track,
            i,
            l;

        if (this instanceof vjs.OffTextTrackMenuItem) {
          selected = true;

          i = 0,
          l = tracks.length;

          for (; i < l; i++) {
            track = tracks[i];
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
    vjs.MenuItem.call(this, player, options);

    // iOS7 doesn't dispatch change events to TextTrackLists when an
    // associated track's mode changes. Without something like
    // Object.observe() (also not present on iOS7), it's not
    // possible to detect changes to the mode attribute and polyfill
    // the change event. As a poor substitute, we manually dispatch
    // change events whenever the controls modify the mode.
    if (tracks && tracks.onchange === undefined) {
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

vjs.TextTrackMenuItem.prototype.onClick = function(){
  var kind = this.track['kind'],
      tracks = this.player_.textTracks(),
      mode,
      track,
      i = 0;

  vjs.MenuItem.prototype.onClick.call(this);

  if (!tracks) {
    return;
  }

  for (; i < tracks.length; i++) {
    track = tracks[i];

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
vjs.OffTextTrackMenuItem = vjs.TextTrackMenuItem.extend({
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
    vjs.TextTrackMenuItem.call(this, player, options);
    this.selected(true);
  }
});

vjs.CaptionSettingsMenuItem = vjs.TextTrackMenuItem.extend({
  init: function(player, options) {
    options['track'] = {
      'kind': options['kind'],
      'player': player,
      'label': options['kind'] + ' settings',
      'default': false,
      mode: 'disabled'
    };

    vjs.TextTrackMenuItem.call(this, player, options);
    this.addClass('vjs-texttrack-settings');
  }
});

vjs.CaptionSettingsMenuItem.prototype.onClick = function() {
  this.player().getChild('textTrackSettings').show();
};

/**
 * The base class for buttons that toggle specific text track types (e.g. subtitles)
 *
 * @constructor
 */
vjs.TextTrackButton = vjs.MenuButton.extend({
  /** @constructor */
  init: function(player, options){
    var tracks, updateHandler;

    vjs.MenuButton.call(this, player, options);

    tracks = this.player_.textTracks();

    if (this.items.length <= 1) {
      this.hide();
    }

    if (!tracks) {
      return;
    }

    updateHandler = vjs.bind(this, this.update);
    tracks.addEventListener('removetrack', updateHandler);
    tracks.addEventListener('addtrack', updateHandler);

    this.player_.on('dispose', function() {
      tracks.removeEventListener('removetrack', updateHandler);
      tracks.removeEventListener('addtrack', updateHandler);
    });
  }
});

// Create a menu item for each text track
vjs.TextTrackButton.prototype.createItems = function(){
  var items = [], track, tracks;

  if (this instanceof vjs.CaptionsButton && !(this.player().tech && this.player().tech['featuresNativeTextTracks'])) {
    items.push(new vjs.CaptionSettingsMenuItem(this.player_, { 'kind': this.kind_ }));
  }

  // Add an OFF menu item to turn all tracks off
  items.push(new vjs.OffTextTrackMenuItem(this.player_, { 'kind': this.kind_ }));

  tracks = this.player_.textTracks();

  if (!tracks) {
    return items;
  }

  for (var i = 0; i < tracks.length; i++) {
    track = tracks[i];

    // only add tracks that are of the appropriate kind and have a label
    if (track['kind'] === this.kind_) {
      items.push(new vjs.TextTrackMenuItem(this.player_, {
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
vjs.CaptionsButton = vjs.TextTrackButton.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.TextTrackButton.call(this, player, options, ready);
    this.el_.setAttribute('aria-label','Captions Menu');
  }
});
vjs.CaptionsButton.prototype.kind_ = 'captions';
vjs.CaptionsButton.prototype.buttonText = 'Captions';
vjs.CaptionsButton.prototype.className = 'vjs-captions-button';

vjs.CaptionsButton.prototype.update = function() {
  var threshold = 2;
  vjs.TextTrackButton.prototype.update.call(this);

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
vjs.SubtitlesButton = vjs.TextTrackButton.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.TextTrackButton.call(this, player, options, ready);
    this.el_.setAttribute('aria-label','Subtitles Menu');
  }
});
vjs.SubtitlesButton.prototype.kind_ = 'subtitles';
vjs.SubtitlesButton.prototype.buttonText = 'Subtitles';
vjs.SubtitlesButton.prototype.className = 'vjs-subtitles-button';

// Chapters act much differently than other text tracks
// Cues are navigation vs. other tracks of alternative languages
/**
 * The button component for toggling and selecting chapters
 *
 * @constructor
 */
vjs.ChaptersButton = vjs.TextTrackButton.extend({
  /** @constructor */
  init: function(player, options, ready){
    vjs.TextTrackButton.call(this, player, options, ready);
    this.el_.setAttribute('aria-label','Chapters Menu');
  }
});
vjs.ChaptersButton.prototype.kind_ = 'chapters';
vjs.ChaptersButton.prototype.buttonText = 'Chapters';
vjs.ChaptersButton.prototype.className = 'vjs-chapters-button';

// Create a menu item for each text track
vjs.ChaptersButton.prototype.createItems = function(){
  var items = [], track, tracks;

  tracks = this.player_.textTracks();

  if (!tracks) {
    return items;
  }

  for (var i = 0; i < tracks.length; i++) {
    track = tracks[i];
    if (track['kind'] === this.kind_) {
      items.push(new vjs.TextTrackMenuItem(this.player_, {
        'track': track
      }));
    }
  }

  return items;
};

vjs.ChaptersButton.prototype.createMenu = function(){
  var tracks = this.player_.textTracks() || [],
      i = 0,
      l = tracks.length,
      track, chaptersTrack,
      items = this.items = [];

  for (; i < l; i++) {
    track = tracks[i];
    if (track['kind'] == this.kind_) {
      if (!track.cues) {
        track['mode'] = 'hidden';
        /* jshint loopfunc:true */
        // TODO see if we can figure out a better way of doing this https://github.com/videojs/video.js/issues/1864
        window.setTimeout(vjs.bind(this, function() {
          this.createMenu();
        }), 100);
        /* jshint loopfunc:false */
      } else {
        chaptersTrack = track;
        break;
      }
    }
  }

  var menu = this.menu;
  if (menu === undefined) {
    menu = new vjs.Menu(this.player_);
    menu.contentEl().appendChild(vjs.createEl('li', {
      className: 'vjs-menu-title',
      innerHTML: vjs.capitalize(this.kind_),
      tabindex: -1
    }));
  }

  if (chaptersTrack) {
    var cues = chaptersTrack['cues'], cue, mi;
    i = 0;
    l = cues.length;

    for (; i < l; i++) {
      cue = cues[i];

      mi = new vjs.ChaptersTrackMenuItem(this.player_, {
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
vjs.ChaptersTrackMenuItem = vjs.MenuItem.extend({
  /** @constructor */
  init: function(player, options){
    var track = this.track = options['track'],
        cue = this.cue = options['cue'],
        currentTime = player.currentTime();

    // Modify options for parent MenuItem class's init.
    options['label'] = cue.text;
    options['selected'] = (cue['startTime'] <= currentTime && currentTime < cue['endTime']);
    vjs.MenuItem.call(this, player, options);

    track.addEventListener('cuechange', vjs.bind(this, this.update));
  }
});

vjs.ChaptersTrackMenuItem.prototype.onClick = function(){
  vjs.MenuItem.prototype.onClick.call(this);
  this.player_.currentTime(this.cue.startTime);
  this.update(this.cue.startTime);
};

vjs.ChaptersTrackMenuItem.prototype.update = function(){
  var cue = this.cue,
      currentTime = this.player_.currentTime();

  // vjs.log(currentTime, cue.startTime);
  this.selected(cue['startTime'] <= currentTime && currentTime < cue['endTime']);
};
})();
