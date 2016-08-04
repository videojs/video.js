/* eslint-env qunit */
import Flash from '../../../src/js/tech/flash.js';

QUnit.module('Flash RTMP');

const streamToPartsAndBack = function(url) {
  const parts = Flash.streamToParts(url);

  return Flash.streamFromParts(parts.connection, parts.stream);
};

QUnit.test('test using both streamToParts and streamFromParts', function() {
  QUnit.ok(streamToPartsAndBack('rtmp://myurl.com/isthis') === 'rtmp://myurl.com/&isthis');
  QUnit.ok(streamToPartsAndBack('rtmp://myurl.com/&isthis') === 'rtmp://myurl.com/&isthis');
  QUnit.ok(streamToPartsAndBack('rtmp://myurl.com/isthis/andthis') === 'rtmp://myurl.com/isthis/&andthis');
});

QUnit.test('test streamToParts', function() {
  let parts = Flash.streamToParts('http://myurl.com/streaming&/is/fun');

  QUnit.ok(parts.connection === 'http://myurl.com/streaming');
  QUnit.ok(parts.stream === '/is/fun');

  parts = Flash.streamToParts('http://myurl.com/&streaming&/is/fun');
  QUnit.ok(parts.connection === 'http://myurl.com/');
  QUnit.ok(parts.stream === 'streaming&/is/fun');

  parts = Flash.streamToParts('http://myurl.com/really?streaming=fun&really=fun');
  QUnit.ok(parts.connection === 'http://myurl.com/');
  QUnit.ok(parts.stream === 'really?streaming=fun&really=fun');

  parts = Flash.streamToParts('http://myurl.com/streaming/is/fun');
  QUnit.ok(parts.connection === 'http://myurl.com/streaming/is/');
  QUnit.ok(parts.stream === 'fun');

  parts = Flash.streamToParts('whatisgoingonhere');
  QUnit.ok(parts.connection === 'whatisgoingonhere');
  QUnit.ok(parts.stream === '');

  parts = Flash.streamToParts();
  QUnit.ok(parts.connection === '');
  QUnit.ok(parts.stream === '');
});

QUnit.test('test isStreamingSrc', function() {
  const isStreamingSrc = Flash.isStreamingSrc;

  QUnit.ok(isStreamingSrc('rtmp://streaming.is/fun'));
  QUnit.ok(isStreamingSrc('rtmps://streaming.is/fun'));
  QUnit.ok(isStreamingSrc('rtmpe://streaming.is/fun'));
  QUnit.ok(isStreamingSrc('rtmpt://streaming.is/fun'));
  // test invalid protocols
  QUnit.ok(!isStreamingSrc('rtmp:streaming.is/fun'));
  QUnit.ok(!isStreamingSrc('rtmpz://streaming.is/fun'));
  QUnit.ok(!isStreamingSrc('http://streaming.is/fun'));
  QUnit.ok(!isStreamingSrc('https://streaming.is/fun'));
  QUnit.ok(!isStreamingSrc('file://streaming.is/fun'));
});
