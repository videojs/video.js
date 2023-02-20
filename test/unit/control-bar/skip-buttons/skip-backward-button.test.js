/* eslint-env qunit */
import TestHelpers from '../../test-helpers';

QUnit.module('SkipBackwardButton');

QUnit.test('is not visible if option is not set', function(assert) {
  assert.expect(1);
  const player = TestHelpers.makePlayer({});
  const button = player.controlBar.skipBackward;

  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');
});

QUnit.test('is not visible if option is set with an invalid config', function(assert) {
  assert.expect(1);
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 4}}});
  const button = player.controlBar.skipBackward;

  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');
});

QUnit.test('is visible if option is set with a valid config', function(assert) {
  assert.expect(2);
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 5}}});
  const button = player.controlBar.skipBackward;

  assert.notOk(button.hasClass('vjs-hidden'), 'button is not hidden');
  assert.ok(button.hasClass('vjs-skip-backward-5'), 'button shows correct icon');
});

QUnit.test('is positioned after the play/pause button', function(assert) {
  assert.expect(1);
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 5}}});
  const button = player.controlBar.skipBackward;
  const playPausePosition = player.controlBar.children().indexOf(player.controlBar.playToggle);
  const buttonPosition = player.controlBar.children().indexOf(button);

  assert.ok(playPausePosition + 1 === buttonPosition, 'skip backward button is on the right of play toggle button');

  // TODO test this
  assert.true(false);
});
