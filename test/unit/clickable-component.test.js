import ClickableComponent from '../../src/js/clickable-component.js';
import TestHelpers from './test-helpers.js';

q.module('ClickableComponent');

q.test('should create a div with role="button"', function(){
  expect(2);

  let player = TestHelpers.makePlayer({});

  let testClickableComponent = new ClickableComponent(player);
  let el = testClickableComponent.createEl();

  equal(el.nodeName.toLowerCase(), 'div', 'the name of the element is "div"');
  equal(el.getAttribute('role').toLowerCase(), 'button', 'the role of the element is "button"');

  testClickableComponent.dispose();
  player.dispose();
});

q.test('should be enabled/disabled', function(){
  expect(3);

  let player = TestHelpers.makePlayer({});

  let testClickableComponent = new ClickableComponent(player);

  equal(testClickableComponent.hasClass('vjs-disabled'), false, 'ClickableComponent defaults to enabled');

  testClickableComponent.disable();

  equal(testClickableComponent.hasClass('vjs-disabled'), true, 'ClickableComponent is disabled');

  testClickableComponent.enable();

  equal(testClickableComponent.hasClass('vjs-disabled'), false, 'ClickableComponent is enabled');

  testClickableComponent.dispose();
  player.dispose();
});
