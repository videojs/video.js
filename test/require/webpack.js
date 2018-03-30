/* eslint-disable no-var */
/* eslint-env qunit */
var videojs = require('../../');
var videojsCore = require('../../core');

QUnit.module('Webpack Require');
QUnit.test('videojs should be requirable and bundled via webpack', function(assert) {
  assert.ok(videojs, 'videojs is required properly');
  assert.ok(videojsCore, 'videojs core is required properly');
});
