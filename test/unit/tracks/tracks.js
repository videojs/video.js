module('Tracks');

test('should place title list item into ul', function() {
  var player, chaptersButton;

  player = PlayerTest.makePlayer();

  chaptersButton = new vjs.ChaptersButton(player);

  var menuContentElement = chaptersButton.el().getElementsByTagName('UL')[0];
  var titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'Chapters', 'title element placed in ul');

  player.dispose();
});

test('cue time parsing', function() {
  var parse = vjs.TextTrack.prototype.parseCueTime;

  equal(parse('11:11'), 671, 'Only minutes and seconds (11:11)');
  equal(parse('11:11:11'), 40271, 'Hours, minutes, seconds (11:11:11)');
  equal(parse('11:11:11.111'), 40271.111, 'Hours, minutes, seconds, decimals (11:11:11.111)');
});

test('Player track methods call the tech', function() {
  var player,
      calls = 0;

  player = PlayerTest.makePlayer();

  player.tech.textTracks = function() {
    calls++;
  };
  player.tech.addTextTrack = function() {
    calls++;
  };

  player.addTextTrack();
  player.textTracks();

  equal(calls, 2, 'both textTrack and addTextTrack defer to the tech');
});

test('TextTrackDisplay initializes tracks on player ready', function() {
  var calls = 0,
      ttd = new vjs.TextTrackDisplay({
        addTextTracks: function() {
          calls--;
        },
        getChild: function() {
          calls--;
        },
        ready: function() {
          calls++;
        }
      }, {});

  equal(calls, 1, 'only a player.ready call was made');
});

test('TextTrackDisplay adds tracks and updates children', function() {
  var add = 0,
      get = 0,
      update = 0,
      player,
      tag,
      track,
      oldAddTextTrack = vjs.Player.prototype.addTextTrack,
      oldGetChild = vjs.Player.prototype.getChild;

  tag = document.createElement('video');
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'en';
  track.language = 'English';
  track.src = 'en.vtt';
  tag.appendChild(track);
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'es';
  track.language = 'Spanish';
  track.src = 'es.vtt';
  tag.appendChild(track);

  vjs.Player.prototype.addTextTrack = function() {
    add++;
  };
  vjs.Player.prototype.getChild = function(child) {
    get++;
    return {
      getChild: function() {
        get++;
        return {
          update: function() {
            update++;
          }
        };
      }
    };
  };

  player =  PlayerTest.makePlayer({}, tag);

  player.player_ = player;

  equal(add, 2, 'calls to addTextTrack');
  equal(get, 4, 'four children were request: controlBar and its children subtitles, captions, and chapters buttons');
  equal(update, 3, 'each button should have been updated');

  vjs.Player.prototype.addTextTrack = oldAddTextTrack;
  vjs.Player.prototype.getChild = oldGetChild;
});

test('html5 tech supports native text tracks if the video supports it', function() {
  var oldTestVid = vjs.TEST_VID,
      player,
      options,
      oldTextTracks,
      html;

  oldTextTracks = vjs.Html5.prototype.textTracks;
  vjs.Html5.prototype.textTracks = function() {
    return {
      // Function.prototype is a built-in no-op function.
      addEventListener: Function.prototype
    };
  };

  vjs.TEST_VID = {
    textTracks: []
  };

  player = {
    // Function.prototype is a built-in no-op function.
    controls: Function.prototype,
    ready: Function.prototype,
    options: function() {
      return {};
    },
    addChild: Function.prototype,
    id: Function.prototype,
    el: function() {
      return {
        insertBefore: Function.prototype,
        appendChild: Function.prototype
      };
    }
  };
  player.player_ = player;
  player.options_ = options = {};

  html = new vjs.Html5(player, options);

  ok(html['featuresTextTracks'], 'if textTracks are available on video element, native text tracks are supported');

  vjs.TEST_VID = oldTestVid;
  vjs.Html5.prototype.textTracks = oldTextTracks;
});

test('listen ot remove and add track events in native text tracks', function() {
  var oldTestVid = vjs.TEST_VID,
      player,
      options,
      oldTextTracks,
      events = {},
      html;

  oldTextTracks = vjs.Html5.prototype.textTracks;
  vjs.Html5.prototype.textTracks = function() {
    return {
      addEventListener: function(type, handler) {
        events[type] = true;
      }
    };
  };

  vjs.TEST_VID = {
    textTracks: []
  };

  player = {
    // Function.prototype is a built-in no-op function.
    controls: Function.prototype,
    ready: Function.prototype,
    options: function() {
      return {};
    },
    addChild: Function.prototype,
    id: Function.prototype,
    el: function() {
      return {
        insertBefore: Function.prototype,
        appendChild: Function.prototype
      };
    }
  };
  player.player_ = player;
  player.options_ = options = {};

  html = new vjs.Html5(player, options);

  ok(events['removetrack'], 'removetrack listener was added');
  ok(events['addtrack'], 'addtrack listener was added');

  vjs.TEST_VID = oldTestVid;
  vjs.Html5.prototype.textTracks = oldTextTracks;
});

test('update texttrack buttons on removetrack or addtrack', function() {
  var update = 0,
      player,
      tag,
      track,
      oldGetChild = vjs.Player.prototype.getChild,
      oldTextTracks,
      events = {};

  vjs.MediaTechController.prototype['featuresTextTracks'] = true;
  oldTextTracks = videojs.MediaTechController.prototype.textTracks;
  vjs.MediaTechController.prototype.textTracks = function() {
    return {
      addEventListener: function(type, handler) {
        events[type] = handler;
      }
    };
  };

  tag = document.createElement('video');
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'en';
  track.language = 'English';
  track.src = 'en.vtt';
  tag.appendChild(track);
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'es';
  track.language = 'Spanish';
  track.src = 'es.vtt';
  tag.appendChild(track);

  vjs.Player.prototype.getChild = function(child) {
    return {
      getChild: function() {
        return {
          update: function() {
            update++;
          }
        };
      }
    };
  };

  player =  PlayerTest.makePlayer({}, tag);

  player.player_ = player;

  events['removetrack']();

  equal(update, 3, 'update was called on the three buttons for remove track');

  events['addtrack']();

  equal(update, 6, 'update was called on the three buttons for remove track');

  vjs.Player.prototype.getChild = oldGetChild;
  vjs.MediaTechController.prototype.textTracks = oldTextTracks;
  vjs.MediaTechController.prototype['featuresTextTracks'] = false;
});

test('html5 tech supports native text tracks if the video supports it, unless mode is a number', function() {
  var oldTestVid = vjs.TEST_VID,
      player,
      options,
      html;

  vjs.TEST_VID = {
    textTracks: [{
      mode: 0
    }]
  };

  player = {
    // Function.prototype is a built-in no-op function.
    controls: Function.prototype,
    ready: Function.prototype,
    options: function() {
      return {};
    },
    addChild: Function.prototype,
    id: Function.prototype,
    el: function() {
      return {
        insertBefore: Function.prototype,
        appendChild: Function.prototype
      };
    }
  };
  player.player_ = player;
  player.options_ = options = {
    parentEl: {
      firstChild: {
        textTracks: [{
          mode: 0
        }]
      }
    }
  };

  html = new vjs.Html5(player, options);

  ok(!html['featuresTextTracks'], 'native text tracks are not supported if mode is a number');

  vjs.TEST_VID = oldTestVid;
});

test('html5 tech supports native text tracks if the video supports it, unless it is firefox', function() {
  var oldTestVid = vjs.TEST_VID,
      oldIsFirefox = vjs.IS_FIREFOX,
      player,
      options,
      html;

  vjs.TEST_VID = {
    textTracks: []
  };

  player = {
    // Function.prototype is a built-in no-op function.
    controls: Function.prototype,
    ready: Function.prototype,
    options: function() {
      return {};
    },
    addChild: Function.prototype,
    id: Function.prototype,
    el: function() {
      return {
        insertBefore: Function.prototype,
        appendChild: Function.prototype
      };
    }
  };
  player.player_ = player;
  player.options_ = options = {};

  vjs.IS_FIREFOX = true;
  html = new vjs.Html5(player, options);

  ok(!html['featuresTextTracks'], 'if textTracks are available on video element, native text tracks are supported');

  vjs.TEST_VID = oldTestVid;
  vjs.IS_FIREFOX = oldIsFirefox;
});

test('if native text tracks are not supported, create a texttrackdisplay', function() {
  var oldTestVid = vjs.TEST_VID,
      oldIsFirefox = vjs.IS_FIREFOX,
      oldTextTrackDisplay = window['videojs']['TextTrackDisplay'],
      called = false,
      player,
      tag,
      track,
      options,
      html;

  tag = document.createElement('video');
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'en';
  track.language = 'English';
  track.src = 'en.vtt';
  tag.appendChild(track);
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'es';
  track.language = 'Spanish';
  track.src = 'es.vtt';
  tag.appendChild(track);

  vjs.TEST_VID = {
    textTracks: []
  };

  vjs.IS_FIREFOX = true;
  window['videojs']['TextTrackDisplay'] = function() {
    called = true;
  };

  player = PlayerTest.makePlayer({}, tag);

  ok(called, 'text track display was created');

  vjs.TEST_VID = oldTestVid;
  vjs.IS_FIREFOX = oldIsFirefox;
  window['videojs']['TextTrackDisplay'] = oldTextTrackDisplay;
});
