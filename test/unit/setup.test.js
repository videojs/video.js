/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';
import window from 'global/window';

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

QUnit.test('should log an error if data-setup has invalid JSON', function(assert) {
  const logError = sinon.spy(window.console, 'error');

  const el = TestHelpers.makeTag();

  el.setAttribute(
    'data-setup',
    "{'controls': true}"
  );

  const player = TestHelpers.makePlayer({}, el);

  assert.ok(logError.calledWith('VIDEOJS:', 'ERROR:', 'data-setup'));
  player.dispose();
  window.console.error.restore();
});
