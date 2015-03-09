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
        on: Function.prototype,
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

test('html5 tech supports native text tracks if the video supports it', function() {
  var oldTestVid = vjs.TEST_VID;

  vjs.TEST_VID = {
    textTracks: []
  };

  ok(vjs.Html5.supportsNativeTextTracks(), 'if textTracks are available on video element, native text tracks are supported');

  vjs.TEST_VID = oldTestVid;
});

test('listen to remove and add track events in native text tracks', function() {
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
      i,
      player,
      tag,
      track,
      oldTextTracks,
      events = {},
      oldCaptionsUpdate,
      oldSubsUpdate,
      oldChaptersUpdate;

  oldCaptionsUpdate = vjs.CaptionsButton.prototype.update;
  oldSubsUpdate = vjs.SubtitlesButton.prototype.update;
  oldChaptersUpdate = vjs.ChaptersButton.prototype.update;
  vjs.CaptionsButton.prototype.update = function() {
    update++;
    oldCaptionsUpdate.call(this);
  };
  vjs.SubtitlesButton.prototype.update = function() {
    update++;
    oldSubsUpdate.call(this);
  };
  vjs.ChaptersButton.prototype.update = function() {
    update++;
    oldChaptersUpdate.call(this);
  };

  vjs.MediaTechController.prototype['featuresNativeTextTracks'] = true;
  oldTextTracks = videojs.MediaTechController.prototype.textTracks;
  vjs.MediaTechController.prototype.textTracks = function() {
    return {
      length: 0,
      addEventListener: function(type, handler) {
        if (!events[type]) {
          events[type] = [];
        }
        events[type].push(handler);
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

  player =  PlayerTest.makePlayer({}, tag);

  player.player_ = player;

  equal(update, 3, 'update was called on the three buttons during init');

  for (i = 0; i < events['removetrack'].length; i++) {
    events['removetrack'][i]();
  }

  equal(update, 6, 'update was called on the three buttons for remove track');

  for (i = 0; i < events['addtrack'].length; i++) {
    events['addtrack'][i]();
  }

  equal(update, 9, 'update was called on the three buttons for remove track');

  vjs.MediaTechController.prototype.textTracks = oldTextTracks;
  vjs.MediaTechController.prototype['featuresNativeTextTracks'] = false;
  vjs.CaptionsButton.prototype.update = oldCaptionsUpdate;
  vjs.SubtitlesButton.prototype.update = oldSubsUpdate;
  vjs.ChaptersButton.prototype.update = oldChaptersUpdate;
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

test('html5 tech supports native text tracks if the video supports it, unless mode is a number', function() {
  var oldTestVid = vjs.TEST_VID;

  vjs.TEST_VID = {
    textTracks: [{
      mode: 0
    }]
  };

  ok(!vjs.Html5.supportsNativeTextTracks(), 'native text tracks are not supported if mode is a number');

  vjs.TEST_VID = oldTestVid;
});

test('html5 tech supports native text tracks if the video supports it, unless it is firefox', function() {
  var oldTestVid = vjs.TEST_VID,
      oldIsFirefox = vjs.IS_FIREFOX;

  vjs.TEST_VID = {
    textTracks: []
  };

  vjs.IS_FIREFOX = true;

  ok(!vjs.Html5.supportsNativeTextTracks(), 'if textTracks are available on video element, native text tracks are supported');

  vjs.TEST_VID = oldTestVid;
  vjs.IS_FIREFOX = oldIsFirefox;
});

test('when switching techs, we should not get a new text track', function() {
  var player = PlayerTest.makePlayer({
        html5: {
          nativeTextTracks: false
        }
      }),
      htmltracks,
      flashtracks;

  player.loadTech('Html5');

  htmltracks = player.textTracks();

  player.loadTech('Flash');

  flashtracks = player.textTracks();

  ok(htmltracks === flashtracks, 'the tracks are equal');
});
