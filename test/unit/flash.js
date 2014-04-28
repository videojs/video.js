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
        on: noop,
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
