/* eslint-env qunit */
import TestHelpers from '../../test-helpers';

QUnit.module('SkipForwardButton');

QUnit.test('is not visible if option is not set', function(assert) {
  assert.expect(1);
  const player = TestHelpers.makePlayer({});
  const button = player.controlBar.skipForward;

  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');
});

QUnit.test('is not visible if option is set with an invalid config', function(assert) {
  assert.expect(1);
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 4}}});
  const button = player.controlBar.skipForward;

  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');
});

QUnit.test('is visible if option is set with a valid config', function(assert) {
  assert.expect(2);
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 5}}});
  const button = player.controlBar.skipForward;

  assert.notOk(button.hasClass('vjs-hidden'), 'button is not hidden');
  assert.ok(button.hasClass('vjs-skip-forward-5'), 'button shows correct icon');
});

QUnit.test('is positioned after the play/pause button if there is no skipBackward button', function(assert) {
  assert.expect(1);
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 5}}});
  const button = player.controlBar.skipForward;
  // TODO test this

  assert.true(button === false);
});

QUnit.test('is positioned after the skip backward button if both forward and backward are configured', function(assert) {
  assert.expect(1);
  assert.true(false);
});
