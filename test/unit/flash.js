import Flash from '../../src/js/media/flash.js';
import document from 'global/document';

q.module('Flash');

var streamToPartsAndBack = function(url) {
  var parts = Flash.streamToParts(url);
  return Flash.streamFromParts(parts.connection, parts.stream);
};

test('test using both streamToParts and streamFromParts', function() {
  ok('rtmp://myurl.com/&isthis' === streamToPartsAndBack('rtmp://myurl.com/isthis'));
  ok('rtmp://myurl.com/&isthis' === streamToPartsAndBack('rtmp://myurl.com/&isthis'));
  ok('rtmp://myurl.com/isthis/&andthis' === streamToPartsAndBack('rtmp://myurl.com/isthis/andthis'));
});

test('test streamToParts', function() {
  var parts = Flash.streamToParts('http://myurl.com/streaming&/is/fun');
  ok(parts.connection === 'http://myurl.com/streaming');
  ok(parts.stream === '/is/fun');

  parts = Flash.streamToParts('http://myurl.com/&streaming&/is/fun');
  ok(parts.connection === 'http://myurl.com/');
  ok(parts.stream === 'streaming&/is/fun');

  parts = Flash.streamToParts('http://myurl.com/streaming/is/fun');
  ok(parts.connection === 'http://myurl.com/streaming/is/');
  ok(parts.stream === 'fun');

  parts = Flash.streamToParts('whatisgoingonhere');
  ok(parts.connection === 'whatisgoingonhere');
  ok(parts.stream === '');

  parts = Flash.streamToParts();
  ok(parts.connection === '');
  ok(parts.stream === '');
});

test('test isStreamingSrc', function() {
  var isStreamingSrc = Flash.isStreamingSrc;
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
  var canPlaySource = Flash.canPlaySource;

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
      tech = new Flash({
        id: noop,
        bufferedPercent: noop,
        on: noop,
        trigger: noop,
        ready: noop,
        addChild: noop,
        options_: {},
        // This complexity is needed because of the VTT.js loading
        // It'd be great if we can find a better solution for that
        options: function(){ return {}; },
        el: function(){
          return {
            appendChild: noop
          };
        }
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
      tech = new Flash({
        id: noop,
        on: noop,
        off: noop,
        trigger: noop,
        ready: noop,
        addChild: noop,
        options: function(){ return {}; },
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

  checkReady = sinon.stub(Flash, 'checkReady');

  fixtureDiv = document.getElementById('qunit-fixture');
  playerDiv = document.createElement('div');
  techEl = document.createElement('div');

  playerDiv.appendChild(techEl);
  fixtureDiv.appendChild(playerDiv);

  techEl.id = 'foo1234';
  playerDiv['player'] = {
    tech: {}
  };

  Flash['onReady'](techEl.id);
  ok(checkReady.called, 'checkReady should be called before the tech is disposed');

  // remove the tech el from the player div to simulate being disposed
  playerDiv.removeChild(techEl);
  Flash['onReady'](techEl.id);
  ok(!checkReady.calledTwice, 'checkReady should not be called after the tech is disposed');

  Flash['checkReady'].restore();
});

test('should have the source handler interface', function() {
  ok(Flash.registerSourceHandler, 'has the registerSourceHandler function');
});

test('canHandleSource should be able to work with src objects without a type', function () {
  var canHandleSource = Flash.nativeSourceHandler.canHandleSource;
  equal('maybe', canHandleSource({src: 'test.video.mp4'}), 'should guess that it is a mp4 video');
  equal('maybe', canHandleSource({src: 'test.video.m4v'}), 'should guess that it is a m4v video');
  equal('maybe', canHandleSource({src: 'test.video.flv'}), 'should guess that it is a flash video');
  equal('', canHandleSource({src: 'test.video.wgg'}), 'should return empty string if it can not play the video');
});
