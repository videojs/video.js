/* eslint-env qunit */
import sinon from 'sinon';
import * as Dom from '../../src/js/utils/dom.js';
import TitleBar from '../../src/js/title-bar.js';
import TestHelpers from './test-helpers.js';

QUnit.module('TitleBar', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.player = TestHelpers.makePlayer();

    // Tick forward to make the player ready.
    this.clock.tick(1);
  },
  afterEach() {
    this.player.dispose();
    this.player = null;
    this.clock.restore();
  }
});

QUnit.test('has the expected DOM structure and pointers', function(assert) {
  const titleBar = new TitleBar(this.player);
  const el = titleBar.el();

  assert.ok(Dom.hasClass(el, 'vjs-title-bar'), 'TitleBar element has the expected class');
  assert.ok(Dom.hasClass(el, 'vjs-hidden'), 'TitleBar element has the expected class');
  assert.strictEqual(el.children[0], titleBar.titleEl, 'TitleBar title element is first child');
  assert.strictEqual(el.children[1], titleBar.descriptionEl, 'TitleBar description element is first child');
  assert.ok(Dom.hasClass(titleBar.titleEl, 'vjs-title-bar-title'), 'TitleBar title element has expected class');
  assert.ok(Dom.hasClass(titleBar.descriptionEl, 'vjs-title-bar-description'), 'TitleBar description element has expected class');
});

QUnit.test('setting title and description from options', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    description: 'test description'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, 'test title', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.descriptionEl.textContent, 'test description', 'TitleBar description element has expected content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.titleEl.id, 'tech aria-labelledby matches TitleBar title element');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.descriptionEl.id, 'tech aria-describedby matches TitleBar description element');
});

QUnit.test('setting title only from options', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, 'test title', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.descriptionEl.textContent, '', 'TitleBar description element has no content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.titleEl.id, 'tech aria-labelledby matches TitleBar title element');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
});

QUnit.test('setting description only from options', function(assert) {
  const titleBar = new TitleBar(this.player, {
    description: 'test description'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.descriptionEl.textContent, 'test description', 'TitleBar description element has expected content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.descriptionEl.id, 'tech aria-describedby matches TitleBar description element');
});
QUnit.test('setting no title or description', function(assert) {
  const titleBar = new TitleBar(this.player);

  assert.ok(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.descriptionEl.textContent, '', 'TitleBar description element has no content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
});

QUnit.test('updating title and description', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    description: 'test description'
  });

  titleBar.update({
    title: 'test title two',
    description: 'test description two'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, 'test title two', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.descriptionEl.textContent, 'test description two', 'TitleBar description element has expected content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.titleEl.id, 'tech aria-labelledby matches TitleBar title element');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.descriptionEl.id, 'tech aria-describedby matches TitleBar description element');
});

QUnit.test('updating title only', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    description: 'test description'
  });

  titleBar.update({
    title: 'test title two'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, 'test title two', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.descriptionEl.textContent, '', 'TitleBar description element has no content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.titleEl.id, 'tech aria-labelledby matches TitleBar title element');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
});

QUnit.test('updating description only from options', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    description: 'test description'
  });

  titleBar.update({
    description: 'test description two'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.descriptionEl.textContent, 'test description two', 'TitleBar description element has expected content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.descriptionEl.id, 'tech aria-describedby matches TitleBar description element');
});

QUnit.test('updating no title or description', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    description: 'test description'
  });

  titleBar.update();

  assert.ok(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.descriptionEl.textContent, '', 'TitleBar description element has no content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
});

QUnit.test('disposing removes aria attributes on the tech and removes child DOM refs', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    description: 'test description'
  });

  const techEl = this.player.tech_.el_;

  assert.ok(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is set');
  assert.ok(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is set');

  titleBar.dispose();

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
  assert.notOk(titleBar.titleEl, 'titleEl is nulled');
  assert.notOk(titleBar.descriptionEl, 'descriptionEl is nulled');

});
