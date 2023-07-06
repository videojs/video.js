/* eslint-env qunit */
import TestHelpers from '../../test-helpers';
import sinon from 'sinon';
import { createTimeRange } from '../../../../src/js/utils/time';
import videojs from '../../../../src/js/video.js';

QUnit.module('SkipBackwardButton');

QUnit.test('is not visible if option is not set', function(assert) {
  const player = TestHelpers.makePlayer({});
  const button = player.controlBar.skipBackward;

  assert.expect(1);
  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');

  player.dispose();
});

QUnit.test('is not visible if option is set with an invalid config', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 4}}});
  const button = player.controlBar.skipBackward;

  assert.expect(1);
  assert.ok(button.hasClass('vjs-hidden'), 'has the vjs-hidden class');

  player.dispose();
});

QUnit.test('is visible if option is set with a valid config', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 5}}});
  const button = player.controlBar.skipBackward;

  assert.expect(2);
  assert.notOk(button.hasClass('vjs-hidden'), 'button is not hidden');
  assert.ok(button.hasClass('vjs-skip-backward-5'), 'button shows correct icon');

  player.dispose();
});

QUnit.test('control text should specify amount seconds that can be skipped backward', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 10}}});
  const button = player.controlBar.skipBackward;

  assert.expect(1);
  assert.strictEqual(button.controlText_, 'Skip backward 10 seconds', 'control text specifies number of seconds backward');

  player.dispose();
});

QUnit.test('skip to beginning of seekable range in live video if current time - seekableStart is less than skip bacward time', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 30}}});
  const button = player.controlBar.skipBackward;

  player.options_.liveui = true;
  player.seekable = () => createTimeRange(20, 40);
  player.duration(Infinity);
  player.currentTime(22);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  button.trigger('click');

  assert.expect(1);
  assert.equal(curTimeSpy.getCall(1).args[0], 20, 'player set to start of seekable range');

  player.dispose();
});

QUnit.test('skips to beginning of video if current time is less than configured skip backward time', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 30}}});
  const button = player.controlBar.skipBackward;

  player.currentTime(25);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  button.trigger('click');

  assert.expect(1);
  assert.equal(curTimeSpy.getCall(1).args[0], 0, 'player current time is set to start of video');

  player.dispose();
});

QUnit.test('skip backward in video by configured skip backward time amount', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 30}}});
  const button = player.controlBar.skipBackward;

  player.currentTime(31);

  const curTimeSpy = sinon.spy(player, 'currentTime');

  button.trigger('click');

  assert.expect(1);
  assert.equal(curTimeSpy.getCall(1).args[0], 1, 'player current time set 30 seconds back on button click');

  player.dispose();
});

QUnit.test('localizes on languagechange', function(assert) {
  const player = TestHelpers.makePlayer({controlBar: {skipButtons: {backward: 30}}});
  const button = player.controlBar.skipBackward;

  videojs.addLanguage('test', {'Skip backward {1} seconds': '{1} BACKWARD'});
  player.language('test');

  assert.equal(button.$('.vjs-control-text').textContent, '30 BACKWARD', 'control text updates on languagechange');

  player.dispose();
});
