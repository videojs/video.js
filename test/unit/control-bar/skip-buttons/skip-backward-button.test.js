/* eslint-env qunit */
import TestHelpers from '../../test-helpers';
import sinon from 'sinon';

QUnit.module('SkipBackwardButton');

QUnit.test('is not visible if option is not set', function(assert) {
  assert.expect(1);
  const player = TestHelpers.makePlayer({});
  const button = player.controlBar.skipBackward;

  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');

  player.dispose();
});

QUnit.test('is not visible if option is set with an invalid config', function(assert) {
  assert.expect(1);
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 4}}});
  const button = player.controlBar.skipBackward;

  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');

  player.dispose();
});

QUnit.test('is visible if option is set with a valid config', function(assert) {
  assert.expect(2);
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 5}}});
  const button = player.controlBar.skipBackward;

  assert.notOk(button.hasClass('vjs-hidden'), 'button is not hidden');
  assert.ok(button.hasClass('vjs-skip-backward-5'), 'button shows correct icon');

  player.dispose();
});

QUnit.test('skips to beginning of video if current time is less than configured skip backward time', function(assert) {
  assert.expect(1);

  const SKIP_BACKWARD_TIME = 30;

  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: SKIP_BACKWARD_TIME}}});

  player.currentTime(25);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  const button = player.controlBar.skipBackward;

  button.trigger('click');

  assert.equal(curTimeSpy.getCall(1).args[0], 0, 'player current time is set to start of video');

  player.dispose();
});

QUnit.test('skip backward in video by configured skip backward time amount', function(assert) {
  assert.expect(1);

  const SKIP_BACKWARD_TIME = 30;

  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: SKIP_BACKWARD_TIME}}});

  player.currentTime(31);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  const button = player.controlBar.skipBackward;

  button.trigger('click');

  assert.equal(curTimeSpy.getCall(1).args[0], 1, 'player current time set 30 seconds back on button click');

  player.dispose();
});
