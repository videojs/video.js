/* eslint-env qunit */
import PlaybackRateMenuButton from '../../../../src/js/control-bar/playback-rate-menu/playback-rate-menu-button';
import TestHelpers from '../../test-helpers.js';
import * as Events from '../../../../src/js/utils/events.js';

QUnit.module('PlaybackRateMenuButton', {
  beforeEach(assert) {
    this.player = TestHelpers.makePlayer({
      playbackRates: [1, 2, 3]
    });
  },
  afterEach(assert) {
    this.player.dispose();
  }
});

QUnit.test('playback rate default value', function(assert) {
  const currentRate = this.player.playbackRate();

  assert.strictEqual(currentRate, 1, 'Playbackrate begins with value 1"');
});

QUnit.test('clicking should move to the next available rate', function(assert) {
  const playbackRateMenu = new PlaybackRateMenuButton(this.player);

  const el = playbackRateMenu.menuButton_.el();

  Events.trigger(el, 'click');

  const currentRate = this.player.playbackRate();

  assert.strictEqual(currentRate, 2, 'Playbackrate changes to value 2"');
});

QUnit.test('keep clicking should move to all possible rates in loop', function(assert) {
  const playbackRateMenu = new PlaybackRateMenuButton(this.player);

  const el = playbackRateMenu.menuButton_.el();

  Events.trigger(el, 'click');
  let currentRate = this.player.playbackRate();

  assert.strictEqual(currentRate, 2, 'Playbackrate changes to value 2"');

  Events.trigger(el, 'click');
  currentRate = this.player.playbackRate();
  assert.strictEqual(currentRate, 3, 'Playbackrate changes to value 3"');

  Events.trigger(el, 'click');
  currentRate = this.player.playbackRate();
  assert.strictEqual(currentRate, 1, 'Playbackrate changes back to value 1"');
});
