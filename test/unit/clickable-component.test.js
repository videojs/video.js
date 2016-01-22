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

  ok(el.nodeName.toLowerCase().match('div'));
  ok(el.getAttribute('role').toLowerCase().match('button'));
});
