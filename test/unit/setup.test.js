/* eslint-env qunit */
import TestHelpers from './test-helpers.js';

QUnit.module('Setup');

QUnit.test('should set options from data-setup even if autoSetup is not called before initialisation', function(assert) {
  const el = TestHelpers.makeTag();

  el.setAttribute(
    'data-setup',
    '{"controls": true, "autoplay": false, "preload": "auto", "playsinline": true}'
  );

  const player = TestHelpers.makePlayer({}, el);

  assert.ok(player.options_.controls === true);
  assert.ok(player.options_.autoplay === false);
  assert.ok(player.options_.preload === 'auto');
  assert.ok(player.options_.playsinline === true);
  player.dispose();
});
