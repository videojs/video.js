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

test('cue parsing', function() {
  var mockTrack = {
    cues_: [],
    reset: function(){ this.cues_ = []; },
    parseCues: vjs.TextTrack.prototype.parseCues,
    parseCueTime: vjs.TextTrack.prototype.parseCueTime,
    trigger: function(){}
  };
  var vttHead = 'WEBVTT\n\n';

  var timeWithSpaces = vttHead + '00:00.700 --> 00:04.110\nText line 1';
  mockTrack.parseCues(timeWithSpaces);
  equal(mockTrack.cues_[0].startTime, 0.7, 'Cue start time w/ spaces');
  equal(mockTrack.cues_[0].endTime, 4.11, 'Cue end time w/ spaces');
  equal(mockTrack.cues_[0].text, 'Text line 1', 'Cue text');

  mockTrack.reset(); // reset mock track
  var timeWithTabs = vttHead + '00:00.700\t-->\t00:04.110\nText line 1';
  mockTrack.parseCues(timeWithTabs);
  equal(mockTrack.cues_[0].startTime, 0.7, 'Cue start time w/ spaces');
  equal(mockTrack.cues_[0].endTime, 4.11, 'Cue end time w/ spaces');

  mockTrack.reset(); // reset mock track
  var timeWithMixedWhiteSpace = vttHead + '00:00.700  -->\t 00:04.110\nText line 1';
  mockTrack.parseCues(timeWithMixedWhiteSpace);
  equal(mockTrack.cues_[0].startTime, 0.7, 'Cue start time w/ spaces');
  equal(mockTrack.cues_[0].endTime, 4.11, 'Cue end time w/ spaces');

  mockTrack.reset(); // reset mock track
  var timeWithFlags = vttHead + '00:00.700  -->\t 00:04.110 line:90% position:26% size:9%\nText line 1';
  mockTrack.parseCues(timeWithMixedWhiteSpace);
  equal(mockTrack.cues_[0].startTime, 0.7, 'Cue start time w/ flags');
  equal(mockTrack.cues_[0].endTime, 4.11, 'Cue end time w/ flags');
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
      player = {
        addTextTracks: vjs.Player.prototype.addTextTracks,
        addTextTrack: function() {
          add++;
        },
        getChild: function(child) {
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
        },
        ready: function(cb) {
          cb.call(this);
        }
      },
      options = {
        tracks: [{
          kind: 'captions',
          label: 'en',
          language: 'English',
          src: 'en.vtt'
        }, {
          kind: 'captions',
          label: 'es',
          language: 'Spanish',
          src: 'es.vtt'
        }]
      },
      ttd;

  player.player_ = player;
  player.options_ = options;

  ttd = new vjs.TextTrackDisplay(player, options);

  equal(add, 2, 'calls to addTextTrack');
  equal(get, 4, 'four children were request: controlBar and its children subtitles, captions, and chapters buttons');
  equal(update, 3, 'each button should have been updated');
});

test('html5 tech supports native text tracks if the video supports it', function() {
  var oldTestVid = vjs.TEST_VID,
      player,
      options,
      html;

  vjs.TEST_VID = {
    textTracks: []
  };

  player = {
    controls: Function.prototype,
    ready: Function.prototype,
    options: Function.prototype,
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

  ok(html['featuresNativeTracks'], 'if textTracks are available on video element, native text tracks are supported');

  vjs.TEST_VID = oldTestVid;
});

test('html5 tech supports native text tracks if the video supports it, unless mode is a number', function() {
  var oldTestVid = vjs.TEST_VID,
      player,
      options,
      html;

  vjs.TEST_VID = {
    textTracks: []
  };

  player = {
    controls: Function.prototype,
    ready: Function.prototype,
    options: Function.prototype,
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

  ok(!html['featuresNativeTracks'], 'native text tracks are not supported if mode is a number');

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
    controls: Function.prototype,
    ready: Function.prototype,
    options: Function.prototype,
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

  ok(!html['featuresNativeTracks'], 'if textTracks are available on video element, native text tracks are supported');

  vjs.TEST_VID = oldTestVid;
  vjs.IS_FIREFOX = oldIsFirefox;
});

test('in html5, if native text tracks are not supported, create a texttrackdisplay', function() {
  var oldTestVid = vjs.TEST_VID,
      oldIsFirefox = vjs.IS_FIREFOX,
      oldTextTrackDisplay = vjs.TextTrackDisplay,
      called = false,
      player,
      options,
      html;

  vjs.TEST_VID = {
    textTracks: []
  };

  player = {
    controls: Function.prototype,
    ready: Function.prototype,
    options: Function.prototype,
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

  vjs.TextTrackDisplay = function() {
    called = true;
  };

  vjs.IS_FIREFOX = true;
  html = new vjs.Html5(player, options);

  ok(called, 'text track display was created');

  vjs.TEST_VID = oldTestVid;
  vjs.IS_FIREFOX = oldIsFirefox;
  vjs.TextTrackDisplay = oldTextTrackDisplay;
});

test('a tech that does not support native text tracks, should create a texttrackdisplay', function() {
  var tech,
      oldTextTrackDisplay = vjs.TextTrackDisplay,
      called = false;

  vjs.TextTrackDisplay = function() {
    called = true;
  };

  tech = new vjs.MediaTechController({
    ready: Function.prototype,
    addChild: Function.prototype,
    bufferedPercent: Function.prototype
  },{}),

  ok(called, 'text track display was created');

  vjs.TextTrackDisplay = oldTextTrackDisplay;
});
