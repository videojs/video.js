/* eslint-env qunit */
import * as DomData from '../../src/js/utils/dom-data';
import MenuButton from '../../src/js/menu/menu-button.js';
import Menu from '../../src/js/menu/menu.js';
import CaptionSettingsMenuItem from '../../src/js/control-bar/text-track-controls/caption-settings-menu-item';
import MenuItem from '../../src/js/menu/menu-item.js';
import TestHelpers from './test-helpers.js';
import * as Events from '../../src/js/utils/events.js';
import sinon from 'sinon';

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
  menuButton.dispose();
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

  const oldCreateItems = MenuButton.prototype.createItems;

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

  menuButton.dispose();
  menuItem1.dispose();
  menuItem2.dispose();
  player.dispose();

  MenuButton.prototype.createItems = oldCreateItems;
});

QUnit.test('should remove old event listeners when the menu item adds to the new menu', function(assert) {
  const player = TestHelpers.makePlayer();
  const menuButton = new MenuButton(player, {});
  const oldMenu = new Menu(player, { menuButton });
  const newMenu = new Menu(player, { menuButton });

  oldMenu.addItem('MenuItem');

  const menuItem = oldMenu.children()[0];

  assert.ok(menuItem instanceof MenuItem, '`menuItem` should be the instanceof of `MenuItem`');

  /**
   * A reusable collection of assertions.
   */
  function validateMenuEventListeners(watchedMenu) {
    const eventData = DomData.getData(menuItem.eventBusEl_);
    // `MenuButton`.`unpressButton` will be called when triggering click event on the menu item.
    const unpressButtonSpy = sinon.spy(menuButton, 'unpressButton');
    // `MenuButton`.`focus` will be called when triggering click event on the menu item.
    const focusSpy = sinon.spy(menuButton, 'focus');

    // `Menu`.`children` will be called when triggering blur event on the menu item.
    const menuChildrenSpy = sinon.spy(watchedMenu, 'children');

    assert.strictEqual(eventData.handlers.blur.length, 1, 'the number of blur listeners is one');

    // The number of click listeners is two because `ClickableComponent`
    // adds the click event listener during the construction and
    // `MenuItem` inherits from `ClickableComponent`.
    assert.strictEqual(eventData.handlers.click.length, 2, 'the number of click listeners is two');

    const clickListenerAddedByMenu = eventData.handlers.click[1];

    assert.strictEqual(
      typeof clickListenerAddedByMenu.calledOnce,
      'undefined',
      'previous click listener wrapped in the spy should be removed'
    );

    const clickListenerSpy = eventData.handlers.click[1] = sinon.spy(clickListenerAddedByMenu);

    TestHelpers.triggerDomEvent(menuItem.el(), 'blur');

    assert.ok(menuChildrenSpy.calledOnce, '`watchedMenu`.`children` has been called');

    TestHelpers.triggerDomEvent(menuItem.el(), 'click');

    assert.ok(clickListenerSpy.calledOnce, 'click event listener should be called');
    assert.strictEqual(clickListenerSpy.getCall(0).args[0].target, menuItem.el(), 'event target should be the `menuItem`');
    assert.ok(unpressButtonSpy.calledOnce, '`menuButton`.`unpressButtion` has been called');
    assert.ok(focusSpy.calledOnce, '`menuButton`.`focus` has been called');

    unpressButtonSpy.restore();
    focusSpy.restore();
    menuChildrenSpy.restore();
  }

  validateMenuEventListeners(oldMenu);

  newMenu.addItem(menuItem);
  validateMenuEventListeners(newMenu);

  const focusSpy = sinon.spy(menuButton, 'focus');
  const captionMenuItem = new CaptionSettingsMenuItem(player, {
    kind: 'subtitles'
  });

  newMenu.addItem(captionMenuItem);

  TestHelpers.triggerDomEvent(captionMenuItem.el(), 'click');
  assert.ok(!focusSpy.called, '`menuButton`.`focus` should never be called');

  focusSpy.restore();

  player.dispose();
  newMenu.dispose();
  oldMenu.dispose();
  menuButton.dispose();
});
