/* eslint-env qunit */
import MenuButton from '../../src/js/menu/menu-button.js';
import TestHelpers from './test-helpers.js';
import * as Events from '../../src/js/utils/events.js';

QUnit.module('MenuButton');

QUnit.test('should not throw an error when there is no children', function() {
  QUnit.expect(0);
  const player = TestHelpers.makePlayer();

  const menuButton = new MenuButton(player);
  const el = menuButton.el();

  try {
    Events.trigger(el, 'click');
  } catch (error) {
    QUnit.ok(!error, 'click should not throw anything');
  }

  player.dispose();
});

QUnit.test('should place title list item into ul', function() {
  const player = TestHelpers.makePlayer();

  const menuButton = new MenuButton(player, {
    title: 'testTitle'
  });

  const menuContentElement = menuButton.el().getElementsByTagName('UL')[0];
  const titleElement = menuContentElement.children[0];

  QUnit.ok(titleElement.innerHTML === 'TestTitle', 'title element placed in ul');

  player.dispose();
});

QUnit.test('clicking should display the menu', function() {
  QUnit.expect(6);

  const player = TestHelpers.makePlayer();

  // Make sure there's some content in the menu, even if it's just a title!
  const menuButton = new MenuButton(player, {
    title: 'testTitle'
  });
  const el = menuButton.el();

  QUnit.ok(menuButton.menu !== undefined, 'menu is created');

  QUnit.equal(menuButton.menu.hasClass('vjs-lock-showing'), false, 'menu defaults to hidden');

  Events.trigger(el, 'click');

  QUnit.equal(menuButton.menu.hasClass('vjs-lock-showing'), true, 'clicking on the menu button shows the menu');

  Events.trigger(el, 'click');

  QUnit.equal(menuButton.menu.hasClass('vjs-lock-showing'), false, 'clicking again on the menu button hides the menu');

  menuButton.disable();

  Events.trigger(el, 'click');

  QUnit.equal(menuButton.menu.hasClass('vjs-lock-showing'), false, 'disable() prevents clicking from showing the menu');

  menuButton.enable();

  Events.trigger(el, 'click');

  QUnit.equal(menuButton.menu.hasClass('vjs-lock-showing'), true, 'enable() allows clicking to show the menu');

  player.dispose();
});
