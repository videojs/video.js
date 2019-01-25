/* eslint-env qunit */
import MenuButton from '../../src/js/menu/menu-button.js';
import MenuItem from '../../src/js/menu/menu-item.js';
import TestHelpers from './test-helpers.js';
import * as Events from '../../src/js/utils/events.js';

QUnit.module('MenuButton');

QUnit.test('should not throw an error when there is no children', function(assert) {
  assert.expect(0);
  const player = TestHelpers.makePlayer();

  const menuButton = new MenuButton(player);
  const el = menuButton.el();

  try {
    Events.trigger(el, 'click');
  } catch (error) {
    assert.ok(!error, 'click should not throw anything');
  }

  player.dispose();
});

QUnit.test('should place title list item into ul', function(assert) {
  const player = TestHelpers.makePlayer();

  const menuButton = new MenuButton(player, {
    title: 'testTitle'
  });

  const menuContentElement = menuButton.el().getElementsByTagName('UL')[0];
  const titleElement = menuContentElement.children[0];

  assert.ok(titleElement.innerHTML === 'TestTitle', 'title element placed in ul');

  menuButton.dispose();
  player.dispose();
});

QUnit.test('clicking should display the menu', function(assert) {
  assert.expect(6);

  const player = TestHelpers.makePlayer();

  // Make sure there's some content in the menu, even if it's just a title!
  const menuButton = new MenuButton(player, {
    title: 'testTitle'
  });
  const el = menuButton.menuButton_.el();

  assert.ok(menuButton.menu !== undefined, 'menu is created');

  assert.equal(menuButton.menu.hasClass('vjs-lock-showing'), false, 'menu defaults to hidden');

  Events.trigger(el, 'click');

  assert.equal(menuButton.menu.hasClass('vjs-lock-showing'), true, 'clicking on the menu button shows the menu');

  Events.trigger(el, 'click');

  assert.equal(menuButton.menu.hasClass('vjs-lock-showing'), false, 'clicking again on the menu button hides the menu');

  menuButton.disable();

  Events.trigger(el, 'click');

  assert.equal(menuButton.menu.hasClass('vjs-lock-showing'), false, 'disable() prevents clicking from showing the menu');

  menuButton.enable();

  Events.trigger(el, 'click');

  assert.equal(menuButton.menu.hasClass('vjs-lock-showing'), true, 'enable() allows clicking to show the menu');

  menuButton.dispose();
  player.dispose();
});

QUnit.test('should keep all the added menu items', function(assert) {
  const player = TestHelpers.makePlayer();

  const menuItems = [];
  const menuItem1 = new MenuItem(player, { label: 'menu-item1' });
  const menuItem2 = new MenuItem(player, { label: 'menu-item2' });

  MenuButton.prototype.createItems = function() {
    return menuItems;
  };

  const menuButton = new MenuButton(player, {});

  menuItems.push(menuItem1);
  menuButton.update();

  assert.strictEqual(menuButton.children()[1].children().length, 1, 'the children number of the menu is 1 ');
  assert.strictEqual(menuButton.children()[1].children()[0], menuItem1, 'the first child of the menu is `menuItem1`');
  assert.ok(menuButton.el().contains(menuItem1.el()), 'the menu button contains the DOM element of `menuItem1`');

  menuItems.push(menuItem2);
  menuButton.update();

  assert.strictEqual(menuButton.children()[1].children().length, 2, 'the children number of the menu is 2 after second update');
  assert.strictEqual(menuButton.children()[1].children()[0], menuItem1, 'the first child of the menu is `menuItem1` after second update');
  assert.strictEqual(menuButton.children()[1].children()[1], menuItem2, 'the second child of the menu is `menuItem2` after second update');
  assert.ok(menuButton.el().contains(menuItem1.el()), 'the menu button contains the DOM element of `menuItem1` after second update');
  assert.ok(menuButton.el().contains(menuItem2.el()), 'the menu button contains the DOM element of `menuItem2` after second update');
});
