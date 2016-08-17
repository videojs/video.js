/* eslint-env qunit */
import ClickableComponent from '../../src/js/clickable-component.js';
import TestHelpers from './test-helpers.js';

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
