var deps = {
  'core.js':          ['goog.base.js'],
  'events.js':        ['core.js'],
  'lib.js':           ['core.js'],
  'component.js':     ['lib.js', 'events.js'],
  'player.js':        ['component.js'],
  'controls.js':      ['component.js', 'player.js'],
  'media.js':         ['component.js'],
  'media.html5.js':   ['media.js'],
  'media.flash.js':   ['media.js'],
  'tracks.js':        ['controls.js'],
  'json.js':          ['core.js'],
  'setup.js':         ['events.js', 'json.js'],
  'plugins.js':       ['player.js'],
  'exports.js':       ['player.js', 'plugins.js', 'setup.js']
};
