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
  assert.strictEqual(el.children[0], titleBar.els.title, 'TitleBar title element is first child');
  assert.strictEqual(el.children[1], titleBar.els.description, 'TitleBar description element is first child');
  assert.ok(Dom.hasClass(titleBar.els.title, 'vjs-title-bar-title'), 'TitleBar title element has expected class');
  assert.ok(Dom.hasClass(titleBar.els.description, 'vjs-title-bar-description'), 'TitleBar description element has expected class');
});

QUnit.test('setting title and description', function(assert) {
  const titleBar = new TitleBar(this.player);

  titleBar.update({
    title: 'test title',
    description: 'test description'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.els.title.textContent, 'test title', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.els.description.textContent, 'test description', 'TitleBar description element has expected content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.els.title.id, 'tech aria-labelledby matches TitleBar title element');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.els.description.id, 'tech aria-describedby matches TitleBar description element');
});

QUnit.test('updating title only', function(assert) {
  const titleBar = new TitleBar(this.player);

  titleBar.update({
    title: 'test title',
    description: 'test description'
  });

  titleBar.update({
    title: 'test title two'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.els.title.textContent, 'test title two', 'TitleBar title element has expected content');
  assert.strictEqual(titleBar.els.description.textContent, 'test description', 'TitleBar description element has expected content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.els.title.id, 'tech aria-labelledby matches TitleBar title element');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.els.description.id, 'tech aria-describedby matches TitleBar description element');
});

QUnit.test('updating description only', function(assert) {
  const titleBar = new TitleBar(this.player);

  titleBar.update({
    title: 'test title',
    description: 'test description'
  });

  titleBar.update({
    description: 'test description two'
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.els.title.textContent, 'test title', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.els.description.textContent, 'test description two', 'TitleBar description element has expected content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.els.title.id, 'tech aria-labelledby matches TitleBar title element');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.els.description.id, 'tech aria-describedby matches TitleBar description element');
});

QUnit.test('removing title and description', function(assert) {
  const titleBar = new TitleBar(this.player);

  titleBar.update({
    title: 'test title',
    description: 'test description'
  });

  titleBar.update({
    title: '',
    description: ''
  });

  assert.ok(titleBar.hasClass('vjs-hidden'), 'TitleBar is hidden');
  assert.strictEqual(titleBar.els.title.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.els.description.textContent, '', 'TitleBar description element has no content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby does not exist');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby does not exist');
});

QUnit.test('removing title only', function(assert) {
  const titleBar = new TitleBar(this.player);

  titleBar.update({
    title: 'test title',
    description: 'test description'
  });

  titleBar.update({
    title: ''
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.els.title.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.els.description.textContent, 'test description', 'TitleBar description element has expected content');

  const techEl = this.player.tech_.el_;

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby does not exist');
  assert.strictEqual(techEl.getAttribute('aria-describedby'), titleBar.els.description.id, 'tech aria-describedby matches TitleBar description element');
});

QUnit.test('removing description only', function(assert) {
  const titleBar = new TitleBar(this.player);

  titleBar.update({
    title: 'test title',
    description: 'test description'
  });

  titleBar.update({
    description: ''
  });

  assert.notOk(titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(titleBar.els.title.textContent, 'test title', 'TitleBar title element has no content');
  assert.strictEqual(titleBar.els.description.textContent, '', 'TitleBar description element has no content');

  const techEl = this.player.tech_.el_;

  assert.strictEqual(techEl.getAttribute('aria-labelledby'), titleBar.els.title.id, 'tech aria-labelledby matches TitleBar title element');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby does not exist');
});

QUnit.test('disposing removes aria attributes on the tech and removes child DOM refs', function(assert) {
  const titleBar = new TitleBar(this.player);

  titleBar.update({
    title: 'test title',
    description: 'test description'
  });

  const techEl = this.player.tech_.el_;

  assert.ok(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is set');
  assert.ok(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is set');

  titleBar.dispose();

  assert.notOk(techEl.hasAttribute('aria-labelledby'), 'tech aria-labelledby is not set');
  assert.notOk(techEl.hasAttribute('aria-describedby'), 'tech aria-describedby is not set');
  assert.notOk(titleBar.els, 'els object is is nulled');
});
