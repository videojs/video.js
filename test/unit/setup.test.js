/* eslint-env qunit */
import TestHelpers from './test-helpers.js';

QUnit.module('Setup');

QUnit.test('should set options from data-setup even if autoSetup is not called before initialisation', function() {
  const el = TestHelpers.makeTag();

  el.setAttribute('data-setup',
                  '{"controls": true, "autoplay": false, "preload": "auto"}');

  const player = TestHelpers.makePlayer({}, el);

  QUnit.ok(player.options_.controls === true);
  QUnit.ok(player.options_.autoplay === false);
  QUnit.ok(player.options_.preload === 'auto');
});
