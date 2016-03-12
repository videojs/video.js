import MenuButton from '../../src/js/menu/menu-button.js';
import TestHelpers from './test-helpers.js';
import * as Events from '../../src/js/utils/events.js';

q.module('MenuButton');

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

q.test('clicking should display the menu', function() {
  expect(6);

  var player, menuButton, el;

  player = TestHelpers.makePlayer();

  // Make sure there's some content in the menu, even if it's just a title!
  menuButton = new MenuButton(player, {
    'title': 'testTitle'
  });
  el = menuButton.el();

  ok(menuButton.menu !== undefined, 'menu is created');

  equal(menuButton.menu.hasClass('vjs-lock-showing'), false, 'menu defaults to hidden');

  Events.trigger(el, 'click');

  equal(menuButton.menu.hasClass('vjs-lock-showing'), true, 'clicking on the menu button shows the menu');

  Events.trigger(el, 'click');

  equal(menuButton.menu.hasClass('vjs-lock-showing'), false, 'clicking again on the menu button hides the menu');

  menuButton.disable();

  Events.trigger(el, 'click');

  equal(menuButton.menu.hasClass('vjs-lock-showing'), false, 'disable() prevents clicking from showing the menu');

  menuButton.enable();

  Events.trigger(el, 'click');

  equal(menuButton.menu.hasClass('vjs-lock-showing'), true, 'enable() allows clicking to show the menu');

  player.dispose();
});
