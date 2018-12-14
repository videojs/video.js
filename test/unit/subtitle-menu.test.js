/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import * as Events from '../../src/js/utils/events.js';

QUnit.module('Subtitles Menu');

QUnit.test('should close when clicking the control bar', function(assert) {
  const player = TestHelpers.makePlayer();
  const subsCapsButton = player.getChild('controlBar').getChild('subsCapsButton');
  const seekBar = player.getChild('controlBar').getChild('progressControl').getChild('seekBar');

  const el = subsCapsButton.menuButton_.el();
  const el2 = seekBar.el();

  // Open menu
  Events.trigger(el, 'click');

  // Verify menu is now open
  assert.ok(subsCapsButton.buttonPressed_, 'Button was pressed');
  assert.ok(!subsCapsButton.menu.hasClass('vjs-hidden'), 'Menu is showing');

  // Click progress bar
  Events.trigger(el2, 'mousedown');

  // Verify that menu is now closed
  assert.ok(seekBar.enabled(), 'Progress bar is enabled');
  assert.ok(!subsCapsButton.buttonPressed_, 'Button is no longer pressed');
  assert.ok(subsCapsButton.menu.hasClass('vjs-hidden'), 'Menu is no longer showing');

  player.dispose();
});
