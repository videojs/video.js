/* eslint-env qunit */
import ClickableComponent from '../../src/js/clickable-component.js';
import TestHelpers from './test-helpers.js';

QUnit.module('ClickableComponent');

QUnit.test('should create a div with role="button"', function() {
  QUnit.expect(2);

  const player = TestHelpers.makePlayer({});

  const testClickableComponent = new ClickableComponent(player);
  const el = testClickableComponent.createEl();

  QUnit.equal(el.nodeName.toLowerCase(), 'div', 'the name of the element is "div"');
  QUnit.equal(el.getAttribute('role').toLowerCase(), 'button', 'the role of the element is "button"');

  testClickableComponent.dispose();
  player.dispose();
});

QUnit.test('should be enabled/disabled', function() {
  QUnit.expect(3);

  const player = TestHelpers.makePlayer({});

  const testClickableComponent = new ClickableComponent(player);

  QUnit.equal(testClickableComponent.hasClass('vjs-disabled'), false, 'ClickableComponent defaults to enabled');

  testClickableComponent.disable();

  QUnit.equal(testClickableComponent.hasClass('vjs-disabled'), true, 'ClickableComponent is disabled');

  testClickableComponent.enable();

  QUnit.equal(testClickableComponent.hasClass('vjs-disabled'), false, 'ClickableComponent is enabled');

  testClickableComponent.dispose();
  player.dispose();
});
