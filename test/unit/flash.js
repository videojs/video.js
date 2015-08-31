module('Flash');

var streamToPartsAndBack = function(url) {
  var parts = vjs.Flash.streamToParts(url);
  return vjs.Flash.streamFromParts(parts.connection, parts.stream);
};

test('test using both streamToParts and streamFromParts', function() {
  ok('rtmp://myurl.com/&isthis' === streamToPartsAndBack('rtmp://myurl.com/isthis'));
  ok('rtmp://myurl.com/&isthis' === streamToPartsAndBack('rtmp://myurl.com/&isthis'));
  ok('rtmp://myurl.com/isthis/&andthis' === streamToPartsAndBack('rtmp://myurl.com/isthis/andthis'));
});

test('test streamToParts', function() {
  var parts = vjs.Flash.streamToParts('http://myurl.com/streaming&/is/fun');
  ok(parts.connection === 'http://myurl.com/streaming');
  ok(parts.stream === '/is/fun');

  parts = vjs.Flash.streamToParts('http://myurl.com/&streaming&/is/fun');
  ok(parts.connection === 'http://myurl.com/');
  ok(parts.stream === 'streaming&/is/fun');

  parts = vjs.Flash.streamToParts('http://myurl.com/streaming/is/fun');
  ok(parts.connection === 'http://myurl.com/streaming/is/');
  ok(parts.stream === 'fun');

  parts = vjs.Flash.streamToParts('whatisgoingonhere');
  ok(parts.connection === 'whatisgoingonhere');
  ok(parts.stream === '');

  parts = vjs.Flash.streamToParts();
  ok(parts.connection === '');
  ok(parts.stream === '');
});

test('test isStreamingSrc', function() {
  var isStreamingSrc = vjs.Flash.isStreamingSrc;
  ok(isStreamingSrc('rtmp://streaming.is/fun'));
  ok(isStreamingSrc('rtmps://streaming.is/fun'));
  ok(isStreamingSrc('rtmpe://streaming.is/fun'));
  ok(isStreamingSrc('rtmpt://streaming.is/fun'));
  // test invalid protocols
  ok(!isStreamingSrc('rtmp:streaming.is/fun'));
  ok(!isStreamingSrc('rtmpz://streaming.is/fun'));
  ok(!isStreamingSrc('http://streaming.is/fun'));
  ok(!isStreamingSrc('https://streaming.is/fun'));
  ok(!isStreamingSrc('file://streaming.is/fun'));
});

test('test canPlaySource', function() {
  var canPlaySource = vjs.Flash.canPlaySource;

  // supported
  ok(canPlaySource({ type: 'video/mp4; codecs=avc1.42E01E,mp4a.40.2' }), 'codecs supported');
  ok(canPlaySource({ type: 'video/mp4' }), 'video/mp4 supported');
  ok(canPlaySource({ type: 'video/x-flv' }), 'video/x-flv supported');
  ok(canPlaySource({ type: 'video/flv' }), 'video/flv supported');
  ok(canPlaySource({ type: 'video/m4v' }), 'video/m4v supported');
  ok(canPlaySource({ type: 'VIDEO/FLV' }), 'capitalized mime type');

  // not supported
  ok(!canPlaySource({ type: 'video/webm; codecs="vp8, vorbis"' }));
  ok(!canPlaySource({ type: 'video/webm' }));
});

test('currentTime is the seek target during seeking', function() {
  var noop = function() {},
      seeking = false,
      parentEl = document.createElement('div'),
      tech = new vjs.Flash({
        id: noop,
        bufferedPercent: noop,
        on: noop,
        trigger: noop,
        ready: noop,
        addChild: noop,
        options_: {}
      }, {
        'parentEl': parentEl
      }),
      currentTime;

  tech.el().vjs_setProperty = function(property, value) {
    if (property === 'currentTime') {
      currentTime = value;
    }
  };
  tech.el().vjs_getProperty = function(name) {
    if (name === 'currentTime') {
      return currentTime;
    } else if (name === 'seeking') {
      return seeking;
    }
  };

  currentTime = 3;
  strictEqual(3, tech.currentTime(), 'currentTime is retreived from the SWF');

  tech['setCurrentTime'](7);
  seeking = true;
  strictEqual(7, tech.currentTime(), 'during seeks the target time is returned');
});

test('dispose removes the object element even before ready fires', function() {
  var noop = function() {},
      parentEl = document.createElement('div'),
      tech = new vjs.Flash({
        id: noop,
        on: noop,
        off: noop,
        trigger: noop,
        ready: noop,
        addChild: noop,
        options_: {}
      }, {
        'parentEl': parentEl
      });

  tech.dispose();
  strictEqual(tech.el(), null, 'tech el is null');
  strictEqual(parentEl.children.length, 0, 'parent el is empty');
});

test('ready triggering before and after disposing the tech', function() {
  var checkReady, fixtureDiv, playerDiv, techEl;

  checkReady = sinon.stub(vjs.Flash, 'checkReady');

  fixtureDiv = document.getElementById('qunit-fixture');
  playerDiv = document.createElement('div');
  techEl = document.createElement('div');

  playerDiv.appendChild(techEl);
  fixtureDiv.appendChild(playerDiv);

  techEl.id = 'foo1234';
  playerDiv['player'] = {
    tech: {}
  };

  vjs.Flash['onReady'](techEl.id);
  ok(checkReady.called, 'checkReady should be called before the tech is disposed');

  // remove the tech el from the player div to simulate being disposed
  playerDiv.removeChild(techEl);
  vjs.Flash['onReady'](techEl.id);
  ok(!checkReady.calledTwice, 'checkReady should not be called after the tech is disposed');

  vjs.Flash['checkReady'].restore();
});

test('should have the source handler interface', function() {
  ok(vjs.Flash['registerSourceHandler'], 'has the registerSourceHandler function');
});

test('seekable should be for the length of the loaded video', function() {
  var player = PlayerTest.makePlayer(),
      tech = new vjs.Flash(player, {
        'parentEl': player.el()
      }),
      duration = 23;

  // mock out duration
  tech.el().vjs_getProperty = function(name) {
    if (name === 'duration') {
      return duration;
    }
  };
  equal(tech.seekable().length, 1, 'seekable is non-empty');
  equal(tech.seekable().start(0), 0, 'starts at zero');
  equal(tech.seekable().end(0), duration, 'ends at the duration');
});

test('seekable should be empty if no video is loaded', function() {
  var player = PlayerTest.makePlayer(),
      tech = new vjs.Flash(player, {
        'parentEl': player.el()
      });

  // mock out duration
  tech.el().vjs_getProperty = function(name) {
    if (name === 'duration') {
      return 0;
    }
  };

  equal(tech.seekable().length, 0, 'seekable is empty');
});

test('hitting play again after video ends resets current time to 0', function() {
  var player = PlayerTest.makePlayer(),
    currentTime = 60,
    tech = new vjs.Flash(player, {
      'parentEl': player.el()
    });

  // mock out currentTime
  tech.el()['vjs_getProperty'] = function(name) {
    if (name === 'currentTime') {
      return currentTime;
    }
    if (name === 'ended') {
      return true;
    }
  };

  tech.el()['vjs_setProperty'] = function(property, value) {
    if (property === 'currentTime') {
      currentTime = value;
    }
  };

  tech.el()['vjs_play'] = function() {};

  tech.play();

  equal(tech.currentTime(), 0, 'current time was not 0');
});

test('calling methods before the SWF loads is safe', function() {
  var player = PlayerTest.makePlayer(),
      tech = new vjs.Flash(player, {
        'parentEl': player.el()
      });

  // force Flash callbacks to be undefined as they would be before the
  // SWF is ready
  tech.el().vjs_getProperty = undefined;

  equal(tech.buffered().length, 0, 'buffered percent is 0');
  equal(tech.duration(), 0, 'duration is 0');
});
