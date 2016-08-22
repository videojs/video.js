/* eslint-disable no-var */
/* eslint-env qunit */
var videojs = require('../../');

QUnit.module('Webpack Require');
QUnit.test('videojs should be requirable and bundled via webpack', function(assert) {
  assert.ok(videojs, 'videojs is required properly');
});
