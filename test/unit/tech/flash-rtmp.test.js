/* eslint-env qunit */
import Flash from '../../../src/js/tech/flash.js';

QUnit.module('Flash RTMP');

const streamToPartsAndBack = function(url) {
  const parts = Flash.streamToParts(url);

  return Flash.streamFromParts(parts.connection, parts.stream);
};

QUnit.test('test using both streamToParts and streamFromParts', function(assert) {
  assert.ok(streamToPartsAndBack('rtmp://myurl.com/isthis') === 'rtmp://myurl.com/&isthis');
  assert.ok(streamToPartsAndBack('rtmp://myurl.com/&isthis') === 'rtmp://myurl.com/&isthis');
  assert.ok(streamToPartsAndBack('rtmp://myurl.com/isthis/andthis') === 'rtmp://myurl.com/isthis/&andthis');
});

QUnit.test('test streamToParts', function(assert) {
  let parts = Flash.streamToParts('http://myurl.com/streaming&/is/fun');

  assert.ok(parts.connection === 'http://myurl.com/streaming');
  assert.ok(parts.stream === '/is/fun');

  parts = Flash.streamToParts('http://myurl.com/&streaming&/is/fun');
  assert.ok(parts.connection === 'http://myurl.com/');
  assert.ok(parts.stream === 'streaming&/is/fun');

  parts = Flash.streamToParts('http://myurl.com/really?streaming=fun&really=fun');
  assert.ok(parts.connection === 'http://myurl.com/');
  assert.ok(parts.stream === 'really?streaming=fun&really=fun');

  parts = Flash.streamToParts('http://myurl.com/streaming/is/fun');
  assert.ok(parts.connection === 'http://myurl.com/streaming/is/');
  assert.ok(parts.stream === 'fun');

  parts = Flash.streamToParts('whatisgoingonhere');
  assert.ok(parts.connection === 'whatisgoingonhere');
  assert.ok(parts.stream === '');

  parts = Flash.streamToParts();
  assert.ok(parts.connection === '');
  assert.ok(parts.stream === '');
});

QUnit.test('test isStreamingSrc', function(assert) {
  const isStreamingSrc = Flash.isStreamingSrc;

  assert.ok(isStreamingSrc('rtmp://streaming.is/fun'));
  assert.ok(isStreamingSrc('rtmps://streaming.is/fun'));
  assert.ok(isStreamingSrc('rtmpe://streaming.is/fun'));
  assert.ok(isStreamingSrc('rtmpt://streaming.is/fun'));
  // test invalid protocols
  assert.ok(!isStreamingSrc('rtmp:streaming.is/fun'));
  assert.ok(!isStreamingSrc('rtmpz://streaming.is/fun'));
  assert.ok(!isStreamingSrc('http://streaming.is/fun'));
  assert.ok(!isStreamingSrc('https://streaming.is/fun'));
  assert.ok(!isStreamingSrc('file://streaming.is/fun'));
});
