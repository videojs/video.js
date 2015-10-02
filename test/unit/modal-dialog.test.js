import CloseButton from '../../src/js/close-button';
import ModalDialog from '../../src/js/modal-dialog';
import * as Fn from '../../src/js/utils/fn';
import TestHelpers from './test-helpers';

q.module('ModalDialog', {

  beforeEach: function() {
    this.player = TestHelpers.makePlayer();
    this.modal = new ModalDialog(this.player);
    this.el = this.modal.el();
  },

  afterEach: function() {
    this.player.dispose();
    this.modal.dispose();
  }
});

q.test('should create the expected element', function(assert) {
  var classes = [
    'modal-dialog',
    'hidden',
    'modal-dialog-none'
  ];

  assert.expect(4 + classes.length);
  assert.strictEqual(this.el.tagName.toLowerCase(), 'div', 'el is a <div>');
  assert.strictEqual(this.el.tabIndex, -1, 'el has -1 tabindex');
  assert.strictEqual(this.el.getAttribute('aria-role'), 'dialog', 'el has aria-role="dialog"');
  assert.strictEqual(this.el.getAttribute('aria-label'), '', 'el has aria-role="" by default');

  classes.forEach(function(s) {
    var c = 'vjs-' + s;
    assert.ok(this.modal.hasClass(c), [
      'has the "',
      c,
      '" class in "',
      this.el.className,
      '"'
    ].join(''));
  }, this);
});

q.test('should create the expected contentEl', function(assert) {
  var contentEl = this.modal.contentEl();

  assert.expect(3);
  assert.strictEqual(contentEl.parentNode, this.el, 'contentEl is a child of el');
  assert.strictEqual(contentEl.tagName.toLowerCase(), 'div', 'contentEl is a <div>');
  assert.strictEqual(contentEl.className.trim(), 'vjs-modal-dialog-content', 'has "vjs-modal-dialog-content" class');
});

q.test('should create a close button by default', function(assert) {
  var btn = this.modal.getChild('closeButton');

  // We only check the aspects of the button that relate to the modal. Other
  // aspects of the button (classes, etc) are tested in their appropriate test
  // module.
  assert.expect(2);
  assert.ok(btn instanceof CloseButton, 'close button is a CloseButton');
  assert.strictEqual(btn.el().parentNode, this.el, 'close button is a child of el');
});

q.test('open() triggers events', function(assert) {
  var modal = this.modal;
  var beforeModalOpenSpy = sinon.spy(function() {
    assert.notOk(modal.opened(), 'modal is not opened before opening event');
  });

  var modalOpenSpy = sinon.spy(function() {
    assert.ok(modal.opened(), 'modal is opened on opening event');
  });

  modal.on('beforemodalopen', beforeModalOpenSpy);
  modal.on('modalopen', modalOpenSpy);

  assert.expect(4);
  modal.open();
  assert.strictEqual(beforeModalOpenSpy.callCount, 1, 'beforemodalopen spy was called');
  assert.strictEqual(modalOpenSpy.callCount, 1, 'modalopen spy was called');
});

q.test('open() removes "vjs-hidden" class', function(assert) {
  assert.expect(2);
  assert.ok(this.modal.hasClass('vjs-hidden'), 'modal starts hidden');
  this.modal.open();
  assert.notOk(this.modal.hasClass('vjs-hidden'), 'modal is not hidden after opening');
});

q.test('open() cannot be called on an opened modal', function(assert) {
  var spy = sinon.spy();

  this.modal.on('modalopen', spy);
  this.modal.open();
  this.modal.open();

  assert.expect(1);
  assert.strictEqual(spy.callCount, 1, 'modal was only opened once');
});

q.test('close() triggers events', function(assert) {
  var modal = this.modal;
  var beforeModalCloseSpy = sinon.spy(function() {
    assert.ok(modal.opened(), 'modal is not closed before closing event');
  });

  var modalCloseSpy = sinon.spy(function() {
    assert.notOk(modal.opened(), 'modal is closed on closing event');
  });

  modal.on('beforemodalclose', beforeModalCloseSpy);
  modal.on('modalclose', modalCloseSpy);

  assert.expect(4);
  modal.open();
  modal.close();
  assert.strictEqual(beforeModalCloseSpy.callCount, 1, 'beforemodalclose spy was called');
  assert.strictEqual(modalCloseSpy.callCount, 1, 'modalclose spy was called');
});

q.test('close() adds the "vjs-hidden" class', function(assert) {
  assert.expect(1);
  this.modal.open();
  this.modal.close();
  assert.ok(this.modal.hasClass('vjs-hidden'), 'modal is hidden upon close');
});

q.test('pressing ESC triggers close(), but only when the modal is opened', function(assert) {
  var spy = sinon.spy();

  this.modal.on('modalclose', spy);
  this.modal.handleKeyPress({which: 27});
  assert.expect(2);
  assert.strictEqual(spy.callCount, 0, 'ESC did not close the closed modal');

  this.modal.open();
  this.modal.handleKeyPress({which: 27});
  assert.strictEqual(spy.callCount, 1, 'ESC closed the now-opened modal');
});

q.test('close() cannot be called on an closed modal', function(assert) {
  var spy = sinon.spy();

  this.modal.on('modalclose', spy);
  this.modal.open();
  this.modal.close();
  this.modal.close();

  assert.expect(1);
  assert.strictEqual(spy.callCount, 1, 'modal was only closed once');
});

q.test('open() pauses playback, close() resumes', function(assert) {

  // Quick and dirty; make it looks like the player is playing.
  this.player.paused = function() {
    return false;
  };

  sinon.spy(this.player, 'play');
  sinon.spy(this.player, 'pause');
  this.modal.open();

  assert.expect(2);
  assert.strictEqual(this.player.pause.callCount, 1, 'player is paused when the modal opens');

  this.modal.close();
  assert.strictEqual(this.player.play.callCount, 1, 'player is resumed when the modal closes');
});

q.test('open() hides controls, close() shows controls', function(assert) {
  this.modal.open();

  assert.expect(2);
  assert.notOk(this.player.controls_, 'controls are hidden');

  this.modal.close();
  assert.ok(this.player.controls_, 'controls are no longer hidden');
});

q.test('"disposeOnClose" option', function(assert) {
  var modal = new ModalDialog(this.player, {disposeOnClose: true});

  modal.open();
  sinon.spy(modal, 'dispose');
  modal.close();

  assert.expect(1);
  assert.strictEqual(modal.dispose.callCount, 1, 'dispose was called');
});

q.test('"label" option', function(assert) {
  var label = 'foo';
  var modal = new ModalDialog(this.player, {label: label});

  assert.expect(1);
  assert.strictEqual(modal.el().getAttribute('aria-label'), label, 'uses the label as the aria-label');
});

q.test('"openImmediately" option', function(assert) {
  var modal = new ModalDialog(this.player, {openImmediately: true});

  assert.expect(1);
  assert.ok(modal.opened(), 'the modal is opened immediately');
});

q.test('"slug" option', function(assert) {
  var player = this.player;
  var slug = 'foo';
  var modal = new ModalDialog(player, {slug: slug});

  assert.expect(2);
  assert.ok(modal.hasClass('vjs-modal-dialog-' + slug), 'adds the slug-based class');

  assert.throws(function() {
    new ModalDialog(player, {slug: 'content'});
  }, 'throws errors on disallowed slugs');
});
