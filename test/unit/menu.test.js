import MenuButton from '../../src/js/menu/menu-button.js';
import TestHelpers from './test-helpers.js';
import * as Events from '../../src/js/utils/events.js';

q.module('MenuButton');

q.test('should not throw an error when there is no children', function() {
  expect(0);
  let player = TestHelpers.makePlayer();

  let menuButton = new MenuButton(player);
  let el = menuButton.el();

  try {
    Events.trigger(el, 'click');
  } catch (error) {
    ok(!error, 'click should not throw anything');
  }

  player.dispose();
});

q.test('should place title list item into ul', function() {
  var player, menuButton;
  player = TestHelpers.makePlayer();

  menuButton = new MenuButton(player, {
    'title': 'testTitle'
  });

  var menuContentElement = menuButton.el().getElementsByTagName('UL')[0];
  var titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'TestTitle', 'title element placed in ul');

  player.dispose();
});
