/* eslint-env qunit */
import TestHelpers from '../../test-helpers.js';

QUnit.module('PlaybackRateMenuButton', {
  beforeEach(assert) {
    this.player = TestHelpers.makePlayer({
      playbackRates: [1, 2, 3]
    });
    this.button = this.player.controlBar.playbackRateMenuButton;
  },
  afterEach(assert) {
    this.player.dispose();
  }
});

QUnit.test('playback rate default value', function(assert) {
  const currentRate = this.player.playbackRate();

  assert.strictEqual(currentRate, 1, 'Playbackrate begins with value 1"');
});

QUnit.test('is visible when playback rates are configured and the tech supports playback rates', function(assert) {
  assert.expect(1);
  assert.notOk(this.button.hasClass('vjs-hidden'), 'does not have the vjs-hidden class');
});

QUnit.test('is not visible if no playback rates are configured', function(assert) {
  assert.expect(1);
  this.player.playbackRates([]);
  assert.ok(this.button.hasClass('vjs-hidden'), 'has the vjs-hidden class');
});

QUnit.test('is not visible if the tech does not support playback rates', function(assert) {
  assert.expect(1);
  this.player.tech_.featuresPlaybackRate = false;

  // loadstart is needed to update the hidden state.
  this.player.trigger('loadstart');
  assert.ok(this.button.hasClass('vjs-hidden'), 'has the vjs-hidden class');
});

QUnit.test('label is updated when playback rate changes', function(assert) {
  assert.expect(4);
  assert.strictEqual(this.button.labelEl_.textContent, '1x', 'the default label content is "1x"');
  this.player.playbackRate(2);
  assert.strictEqual(this.button.labelEl_.textContent, '2x', 'the label content is now "2x"');
  this.player.playbackRate(3);
  assert.strictEqual(this.button.labelEl_.textContent, '3x', 'the label content is now "3x"');
  this.player.playbackRate(4);
  assert.strictEqual(this.button.labelEl_.textContent, '4x', 'the playback rate (and label content) can change to values that are not in the rates available in the menu');
});

QUnit.test('menu is updated when playback rates configuration changes', function(assert) {
  assert.expect(2);

  const getItemLabels = () => this.button.menu.children().map(item => item.label);

  assert.deepEqual(getItemLabels(), ['3x', '2x', '1x'], 'the initial list of items is as expected');
  this.player.playbackRates([1, 1.5, 2, 5]);
  assert.deepEqual(getItemLabels(), ['5x', '2x', '1.5x', '1x'], 'the list of items was updated');
});
