import ClickableComponent from '../../src/js/clickable-component.js';
import TestHelpers from './test-helpers.js';

q.module('ClickableComponent');

test('should create a div with role="button"', function(){
  expect(2);

  var player, testClickableComponent, el;

  player = TestHelpers.makePlayer({
  });

  testClickableComponent = new ClickableComponent(player);
  el = testClickableComponent.createEl();

  equal(el.nodeName.toLowerCase(), 'div', 'the name of the element is "div"');
  equal(el.getAttribute('role').toLowerCase(), 'button', 'the role of the element is "button"');
});
