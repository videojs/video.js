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

  let menuContentElement = menuButton.el().getElementsByTagName('UL')[0];
  let titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'TestTitle', 'title element placed in ul');

  player.dispose();
});

q.test('clicking should display the menu', function() {
  expect(6);

  let player = TestHelpers.makePlayer();

  // Make sure there's some content in the menu, even if it's just a title!
  let menuButton = new MenuButton(player, {
    'title': 'testTitle'
  });
  let el = menuButton.el();

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
