/* eslint-env qunit */
import TestHelpers from '../../test-helpers';
import sinon from 'sinon';
import { createTimeRange } from '../../../../src/js/utils/time';
import videojs from '../../../../src/js/video.js';

QUnit.module('SkipForwardButton');

QUnit.test('is not visible if option is not set', function(assert) {
  const player = TestHelpers.makePlayer({});
  const button = player.controlBar.skipForward;

  assert.expect(1);
  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');

  player.dispose();
});

QUnit.test('is not visible if option is set with an invalid config', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 4}}});
  const button = player.controlBar.skipForward;

  assert.expect(1);
  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');

  player.dispose();
});

QUnit.test('is visible if option is set with a valid config', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 5}}});
  const button = player.controlBar.skipForward;

  assert.expect(2);
  assert.notOk(button.hasClass('vjs-hidden'), 'button is not hidden');
  assert.ok(button.hasClass('vjs-skip-forward-5'), 'button shows correct icon');

  player.dispose();
});

QUnit.test('control text should specify how many seconds forward can be skipped', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 5}}});
  const button = player.controlBar.skipForward;

  assert.expect(1);
  assert.strictEqual(button.controlText_, 'Skip forward 5 seconds', 'control text specifies seconds forward');

  player.dispose();
});

QUnit.test('skips to end of video if time remaining is less than configured skip forward time', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 30}}});
  const button = player.controlBar.skipForward;

  player.currentTime(25);
  player.duration(30);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  button.trigger('click');

  assert.expect(1);
  assert.equal(curTimeSpy.getCall(1).args[0], 30, 'player current time is set to end of video');

  player.dispose();
});

QUnit.test('skips to end of seekable range in live video if time remaining is less than configured skip forward time', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 30}}});
  const button = player.controlBar.skipForward;

  player.options_.liveui = true;
  player.seekable = () => createTimeRange(0, 20);
  player.duration(Infinity);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  button.trigger('click');

  assert.expect(1);
  assert.equal(curTimeSpy.getCall(1).args[0], 20, 'player current time is set to end of seekable range in live video');

  player.dispose();
});

QUnit.test('skips forward in live video by configured skip forward time amount', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 10}}});
  const button = player.controlBar.skipForward;

  player.options_.liveui = true;
  player.seekable = () => createTimeRange(0, 45);
  player.duration(Infinity);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  button.trigger('click');

  assert.expect(1);
  assert.equal(curTimeSpy.getCall(1).args[0], 10, 'player current time is set 10 seconds forward in live video');

  player.dispose();
});

QUnit.test('skips forward in video by configured skip forward time amount', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 30}}});
  const button = player.controlBar.skipForward;

  player.currentTime(0);
  player.duration(50);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  button.trigger('click');

  assert.expect(1);
  assert.equal(curTimeSpy.getCall(1).args[0], 30, 'player current time set 30 seconds forward after button click');

  player.dispose();
});

QUnit.test('localizes on languagechange', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 30}}});
  const button = player.controlBar.skipForward;

  videojs.addLanguage('test', {'Skip forward {1} seconds': '{1} FORWARD'});
  player.language('test');

  assert.equal(button.$('.vjs-control-text').textContent, '30 FORWARD', 'control text updates on languagechange');

  player.dispose();
});

QUnit.test('skips forward only if the duration is valid', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {forward: 5}}});
  const currentTimeSpy = sinon.spy(player, 'currentTime');
  const button = player.controlBar.skipForward;

  button.trigger('click');

  assert.ok(currentTimeSpy.notCalled, 'currentTime was not called');

  player.duration(0);
  button.trigger('click');

  assert.ok(currentTimeSpy.called, 'currentTime was called');

  currentTimeSpy.restore();
  player.dispose();
});
