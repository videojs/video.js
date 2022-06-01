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
  assert.strictEqual(el.children[1], titleBar.descEl, 'TitleBar desc element is first child');
  assert.ok(Dom.hasClass(titleBar.titleEl, 'vjs-title-bar-title'), 'TitleBar title element has expected class');
  assert.ok(Dom.hasClass(titleBar.descEl, 'vjs-title-bar-desc'), 'TitleBar desc element has expected class');
});

QUnit.test('setting title and desc from options', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    desc: 'test desc'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, 'test title', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.descEl.textContent, 'test desc', 'TitleBar desc element has expected content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.titleEl.id, 'tech aria-labelledby matches TitleBar title element');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.descEl.id, 'tech aria-describedby matches TitleBar desc element');
});

QUnit.test('setting title only from options', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, 'test title', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.descEl.textContent, '', 'TitleBar desc element has no content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.titleEl.id, 'tech aria-labelledby matches TitleBar title element');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
});

QUnit.test('setting desc only from options', function(assert) {
  const titleBar = new TitleBar(this.player, {
    desc: 'test desc'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.descEl.textContent, 'test desc', 'TitleBar desc element has expected content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.descEl.id, 'tech aria-describedby matches TitleBar desc element');
});
QUnit.test('setting no title or desc', function(assert) {
  const titleBar = new TitleBar(this.player);

  assert.ok(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.descEl.textContent, '', 'TitleBar desc element has no content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
});

QUnit.test('updating title and desc', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    desc: 'test desc'
  });

  titleBar.update({
    title: 'test title two',
    desc: 'test desc two'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, 'test title two', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.descEl.textContent, 'test desc two', 'TitleBar desc element has expected content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.titleEl.id, 'tech aria-labelledby matches TitleBar title element');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.descEl.id, 'tech aria-describedby matches TitleBar desc element');
});

QUnit.test('updating title only', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    desc: 'test desc'
  });

  titleBar.update({
    title: 'test title two'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, 'test title two', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.descEl.textContent, '', 'TitleBar desc element has no content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.titleEl.id, 'tech aria-labelledby matches TitleBar title element');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
});

QUnit.test('updating desc only from options', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    desc: 'test desc'
  });

  titleBar.update({
    desc: 'test desc two'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.descEl.textContent, 'test desc two', 'TitleBar desc element has expected content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.descEl.id, 'tech aria-describedby matches TitleBar desc element');
});

QUnit.test('updating no title or desc', function(assert) {
  const titleBar = new TitleBar(this.player, {
    title: 'test title',
    desc: 'test desc'
  });

  titleBar.update();

  assert.ok(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.titleEl.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.descEl.textContent, '', 'TitleBar desc element has no content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
});
