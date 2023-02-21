/* eslint-env qunit */
import TestHelpers from '../../test-helpers';
import sinon from 'sinon';

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

QUnit.test('skips to end of video if time remaining is less than configured skip forward time', function(assert) {
  assert.expect(1);

  const SKIP_FORWARD_TIME = 30;

  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: SKIP_FORWARD_TIME}}});

  player.currentTime(25);
  player.duration(30);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  const button = player.controlBar.skipForward;

  button.trigger('click');

  assert.equal(curTimeSpy.getCall(1).args[0], 30, 'player current time is set to end of video');

  player.dispose();
});

QUnit.test('skisps forward in video by configured skip forward time amount', function(assert) {
  assert.expect(1);

  const SKIP_FORWARD_TIME = 30;

  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: SKIP_FORWARD_TIME}}});

  player.currentTime(0);
  player.duration(50);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  const button = player.controlBar.skipForward;

  button.trigger('click');

  assert.equal(curTimeSpy.getCall(1).args[0], 30, 'player current time set 30 seconds forward after button click');

  player.dispose();
});
