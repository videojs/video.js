/* eslint-env qunit */
import ClickableComponent from '../../src/js/clickable-component.js';
import TestHelpers from './test-helpers.js';
import * as Events from '../../src/js/utils/events.js';

QUnit.module('ClickableComponent');

QUnit.test('should create a div with role="button"', function(assert) {
  assert.expect(2);

  const player = TestHelpers.makePlayer({});

  const testClickableComponent = new ClickableComponent(player);
  const el = testClickableComponent.createEl();

  assert.equal(el.nodeName.toLowerCase(), 'div', 'the name of the element is "div"');
  assert.equal(el.getAttribute('role').toLowerCase(), 'button', 'the role of the element is "button"');

  testClickableComponent.dispose();
  player.dispose();
});

QUnit.test('should be enabled/disabled', function(assert) {
  assert.expect(3);

  const player = TestHelpers.makePlayer({});

  const testClickableComponent = new ClickableComponent(player);

  assert.equal(testClickableComponent.hasClass('vjs-disabled'), false, 'ClickableComponent defaults to enabled');

  testClickableComponent.disable();

  assert.equal(testClickableComponent.hasClass('vjs-disabled'), true, 'ClickableComponent is disabled');

  testClickableComponent.enable();

  assert.equal(testClickableComponent.hasClass('vjs-disabled'), false, 'ClickableComponent is enabled');

  testClickableComponent.dispose();
  player.dispose();
});

QUnit.test('handleClick should not be triggered when disabled', function() {
  let clicks = 0;

  class TestClickableComponent extends ClickableComponent {
    handleClick() {
      clicks++;
    }
  }

  const player = TestHelpers.makePlayer({});
  const testClickableComponent = new TestClickableComponent(player);
  const el = testClickableComponent.el();

  // 1st click
  Events.trigger(el, 'click');
  QUnit.equal(clicks, 1, 'click on enabled ClickableComponent is handled');

  testClickableComponent.disable();
  // No click should happen.
  Events.trigger(el, 'click');
  QUnit.equal(clicks, 1, 'click on disabled ClickableComponent is not handled');

  testClickableComponent.enable();
  // 2nd Click
  Events.trigger(el, 'click');
  QUnit.equal(clicks, 2, 'click on re-enabled ClickableComponent is handled');

  testClickableComponent.dispose();
  player.dispose();
});

QUnit.test('handleClick should not be triggered more than once when enabled', function() {
  let clicks = 0;

  class TestClickableComponent extends ClickableComponent {
    handleClick() {
      clicks++;
    }
  }

  const player = TestHelpers.makePlayer({});
  const testClickableComponent = new TestClickableComponent(player);
  const el = testClickableComponent.el();

  testClickableComponent.enable();
  // Click should still be handled just once
  Events.trigger(el, 'click');
  QUnit.equal(clicks, 1, 'no additional click handler when already enabled ClickableComponent has been enabled again');

  testClickableComponent.dispose();
  player.dispose();
});
