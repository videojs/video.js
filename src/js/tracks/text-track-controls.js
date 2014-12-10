var getProp = function(obj, prop) {
  return (typeof obj[prop] === 'function') ? obj[prop]() : obj[prop];
};

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

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    player.ready(function() {
      var controlBar, i, tracks, track;

      tracks = player.options_['tracks'] || [];
      for (i = 0; i < tracks.length; i++) {
        track = tracks[i];
        this.player_.addRemoteTextTrack(track);
      }

      controlBar = this.player_.getChild('controlBar');
      if (!controlBar) {
        return;
      }

      controlBar.getChild('subtitlesButton').update();
      controlBar.getChild('captionsButton').update();
      controlBar.getChild('chaptersButton').update();
    });
  }
});

vjs.TextTrackDisplay.prototype.createEl = function(){
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-text-track-display'
  });
};


/**
 * The specific menu item type for selecting a language within a text track kind
 *
 * @constructor
 */
vjs.TextTrackMenuItem = vjs.MenuItem.extend({
  /** @constructor */
  init: function(player, options){
    var track = this.track = options['track'];

    // Modify options for parent MenuItem class's init.
    options['label'] = getProp(track, 'label');
    options['selected'] = track.dflt && track.dflt() || track.mode === 'showing';
    vjs.MenuItem.call(this, player, options);

    this.on(player, getProp(track, 'kind') + 'trackchange', this.update);
  }
});

vjs.TextTrackMenuItem.prototype.onClick = function(){
  vjs.MenuItem.prototype.onClick.call(this);
  this.player_.showTextTrack(this.track.id_ || this.track.language, getProp(this.track, 'kind'));
};

vjs.TextTrackMenuItem.prototype.update = function(){
  this.selected(getProp(this.track, 'mode') == 2);
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
      kind: function() { return options['kind']; },
      player: player,
      label: function(){ return options['kind'] + ' off'; },
      dflt: function(){ return false; },
      mode: function(){ return false; }
    };
    vjs.TextTrackMenuItem.call(this, player, options);
    this.selected(true);
  }
});

vjs.OffTextTrackMenuItem.prototype.onClick = function(){
  vjs.TextTrackMenuItem.prototype.onClick.call(this);
  this.player_.showTextTrack(this.track.id_, this.track.kind());
};

vjs.OffTextTrackMenuItem.prototype.update = function(){
  var tracks = this.player_.textTracks(),
      i=0, j=tracks.length, track,
      off = true;

  for (;i<j;i++) {
    track = tracks[i];
    if (getProp(track, 'kind') === getProp(this.track, 'kind') && getProp(track, 'mode') == 2) {
      off = false;
    }
  }

  this.selected(off);
};

vjs.CaptionSettingsMenuItem = vjs.TextTrackMenuItem.extend({
  init: function(player, options) {
    options['track'] = {
      kind: function() { return options['kind']; },
      player: player,
      label: function() { return options['kind'] + ' settings'; },
      dftl: function() { return false; },
      mode: function() { return false; }
    };

    vjs.TextTrackMenuItem.call(this, player, options);
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
    vjs.MenuButton.call(this, player, options);

    if (this.items.length <= 1) {
      this.hide();
    }
  }
});

// vjs.TextTrackButton.prototype.buttonPressed = false;

// vjs.TextTrackButton.prototype.createMenu = function(){
//   var menu = new vjs.Menu(this.player_);

//   // Add a title list item to the top
//   // menu.el().appendChild(vjs.createEl('li', {
//   //   className: 'vjs-menu-title',
//   //   innerHTML: vjs.capitalize(this.kind_),
//   //   tabindex: -1
//   // }));

//   this.items = this.createItems();

//   // Add menu items to the menu
//   for (var i = 0; i < this.items.length; i++) {
//     menu.addItem(this.items[i]);
//   }

//   // Add list to element
//   this.addChild(menu);

//   return menu;
// };

// Create a menu item for each text track
vjs.TextTrackButton.prototype.createItems = function(){
  var items = [], track;

  // Add an OFF menu item to turn all tracks off
  items.push(new vjs.OffTextTrackMenuItem(this.player_, { 'kind': this.kind_ }));

  if (this instanceof vjs.CaptionsButton && !(this.player().tech && this.player().tech.featuresTextTracks)) {
    items.push(new vjs.CaptionSettingsMenuItem(this.player_, { 'kind': this.kind_ }));
  }

  for (var i = 0; i < this.player_.textTracks().length; i++) {
    track = this.player_.textTracks()[i];
    if (getProp(track, 'kind') === this.kind_) {
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
  if (this.player().tech && this.player().tech.featuresTextTracks) {
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
  var items = [], track;

  for (var i = 0; i < this.player_.textTracks().length; i++) {
    track = this.player_.textTracks()[i];
    if (getProp(track, 'kind') === this.kind_) {
      items.push(new vjs.TextTrackMenuItem(this.player_, {
        'track': track
      }));
    }
  }

  return items;
};

vjs.ChaptersButton.prototype.createMenu = function(){
  var tracks = this.player_.textTracks(),
      i = 0,
      j = tracks.length,
      track, chaptersTrack,
      items = this.items = [];

  for (;i<j;i++) {
    track = tracks[i];
    if (getProp(track, 'kind') == this.kind_) {
      if (track.readyState() === 0) {
        track.load();
        track.on('loaded', vjs.bind(this, this.createMenu));
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
    var cues = chaptersTrack.cues_, cue, mi;
    i = 0;
    j = cues.length;

    for (;i<j;i++) {
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
    options['selected'] = (cue.startTime <= currentTime && currentTime < cue.endTime);
    vjs.MenuItem.call(this, player, options);

    track.on('cuechange', vjs.bind(this, this.update));
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
  this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
};

// vjs.Cue = vjs.Component.extend({
//   /** @constructor */
//   init: function(player, options){
//     vjs.Component.call(this, player, options);
//   }
// });
