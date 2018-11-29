/* eslint-env qunit */
import TestHelpers from './test-helpers.js';

QUnit.test('Loading Spinner should show when calling loadingSpinner.show() and hide when calling loadingSpinner.hide()', function(assert) {
  const player = TestHelpers.makePlayer();

  player.getChild('loadingSpinner').show();
  assert.ok(
    /vjs-waiting/.test(player.el().className),
    'vjs-waiting is added to the player el on loadingSpinner.show()'
  );

  player.getChild('loadingSpinner').hide();
  assert.notOk(
    (/vjs-waiting/).test(player.el().className),
    'vjs-waiting removed from the player el on loadingSpinner.hide()'
  );
  player.dispose();
});

QUnit.test('Loading Spinner should not be visible after calling handleTechCanPlay_()', function(assert) {
  const player = TestHelpers.makePlayer();

  player.handleTechCanPlay_();

  assert.notOk(
    (/vjs-waiting/).test(player.el().className),
    'vjs-waiting removed from the player el on handleTechCanPlay_()'
  );
  player.dispose();
});

QUnit.test('Loading Spinner should be visible after calling handleTechSeeking_()', function(assert) {
  const player = TestHelpers.makePlayer();

  player.handleTechSeeking_();

  assert.ok(
    (/vjs-waiting/).test(player.el().className),
    'vjs-waiting added to the player el on handleTechSeeking_()'
  );
  player.dispose();
});

QUnit.test('Loading Spinner should not be visible after calling handleTechSeeked_()', function(assert) {
  const player = TestHelpers.makePlayer();

  player.handleTechSeeked_();

  assert.notOk(
    (/vjs-waiting/).test(player.el().className),
    'vjs-waiting removed from the player el on handleTechSeeked_()'
  );
  player.dispose();
});

QUnit.test('Loading Spinner should not be visible after calling handleTechCanPlay_()', function(assert) {
  const player = TestHelpers.makePlayer();

  player.handleTechCanPlay_();

  assert.notOk(
    (/vjs-waiting/).test(player.el().className),
    'vjs-waiting removed from the player el on handleTechCanPlay_()'
  );
  player.dispose();
});

QUnit.test('Loading Spinner should not be visible after calling handleTechCanPlayThrough_()', function(assert) {
  const player = TestHelpers.makePlayer();

  player.handleTechCanPlayThrough_();

  assert.notOk(
    (/vjs-waiting/).test(player.el().className),
    'vjs-waiting removed from the player el on handleTechCanPlayThrough_()'
  );
  player.dispose();
});

QUnit.test('Loading Spinner should not be visible after calling handleTechPlaying_()', function(assert) {
  const player = TestHelpers.makePlayer();

  player.handleTechPlaying_();

  assert.notOk(
    (/vjs-waiting/).test(player.el().className),
    'vjs-waiting removed from the player el on handleTechPlaying_()'
  );
  player.dispose();
});
