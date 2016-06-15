import CloseButton from '../../src/js/close-button';
import ModalDialog from '../../src/js/modal-dialog';
import * as Dom from '../../src/js/utils/dom';
import * as Fn from '../../src/js/utils/fn';
import TestHelpers from './test-helpers';

var ESC = 27;

q.module('ModalDialog', {

  beforeEach: function() {
    this.player = TestHelpers.makePlayer();
    this.modal = new ModalDialog(this.player, {temporary: false});
    this.el = this.modal.el();
  },

  afterEach: function() {
    this.player.dispose();
    this.modal.dispose();
    this.el = null;
  }
});

q.test('should create the expected element', function(assert) {
  let elAssertions = TestHelpers.assertEl(assert, this.el, {
    tagName: 'div',
    classes: [
      'vjs-modal-dialog',
      'vjs-hidden'
    ],
    attrs: {
      'aria-describedby': this.modal.descEl_.id,
      'aria-hidden': 'true',
      'aria-label': this.modal.label(),
      'role': 'dialog'
    },
    props: {
      tabIndex: -1
    }
  });

  assert.expect(elAssertions.count);
  elAssertions();
});

q.test('should create the expected description element', function(assert) {
  let elAssertions = TestHelpers.assertEl(assert, this.modal.descEl_, {
    tagName: 'p',
    innerHTML: this.modal.description(),
    classes: [
      'vjs-modal-dialog-description',
      'vjs-offscreen'
    ],
    attrs: {
      id: this.el.getAttribute('aria-describedby')
    }
  });

  assert.expect(elAssertions.count);
  elAssertions();
});

q.test('should create the expected contentEl', function(assert) {
  let elAssertions = TestHelpers.assertEl(assert, this.modal.contentEl(), {
    tagName: 'div',
    classes: [
      'vjs-modal-dialog-content'
    ],
    props: {
      parentNode: this.el
    }
  });

  assert.expect(elAssertions.count);
  elAssertions();
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

q.test('returns `this` for expected methods', function(assert) {
  var methods = ['close', 'empty', 'fill', 'fillWith', 'open'];

  assert.expect(methods.length);
  methods.forEach(function(method) {
    assert.strictEqual(this[method](), this, '`' + method + '()` returns `this`');
  }, this.modal);
});

q.test('open() triggers events', function(assert) {
  var modal = this.modal;
  var beforeModalOpenSpy = sinon.spy(function() {
    assert.notOk(modal.opened(), 'modal is not opened before opening event');
  });

  var modalOpenSpy = sinon.spy(function() {
    assert.ok(modal.opened(), 'modal is opened on opening event');
  });

  assert.expect(4);

  modal.
    on('beforemodalopen', beforeModalOpenSpy).
    on('modalopen', modalOpenSpy).
    open();

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

  this.modal.on('modalopen', spy).open().open();

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

  assert.expect(4);

  modal.
    on('beforemodalclose', beforeModalCloseSpy).
    on('modalclose', modalCloseSpy).
    open().
    close();

  assert.strictEqual(beforeModalCloseSpy.callCount, 1, 'beforemodalclose spy was called');
  assert.strictEqual(modalCloseSpy.callCount, 1, 'modalclose spy was called');
});

q.test('close() adds the "vjs-hidden" class', function(assert) {
  assert.expect(1);
  this.modal.open().close();
  assert.ok(this.modal.hasClass('vjs-hidden'), 'modal is hidden upon close');
});

q.test('pressing ESC triggers close(), but only when the modal is opened', function(assert) {
  var spy = sinon.spy();

  this.modal.on('modalclose', spy).handleKeyPress({which: ESC});
  assert.expect(2);
  assert.strictEqual(spy.callCount, 0, 'ESC did not close the closed modal');

  this.modal.open().handleKeyPress({which: ESC});
  assert.strictEqual(spy.callCount, 1, 'ESC closed the now-opened modal');
});

q.test('close() cannot be called on a closed modal', function(assert) {
  var spy = sinon.spy();

  this.modal.on('modalclose', spy);
  this.modal.open().close().close();

  assert.expect(1);
  assert.strictEqual(spy.callCount, 1, 'modal was only closed once');
});

q.test('open() pauses playback, close() resumes', function(assert) {
  var playSpy = sinon.spy();
  var pauseSpy = sinon.spy();

  // Quick and dirty; make it looks like the player is playing.
  this.player.paused = function() {
    return false;
  };

  this.player.play = function() {
    playSpy();
  };

  this.player.pause = function() {
    pauseSpy();
  };

  this.modal.open();

  assert.expect(2);
  assert.strictEqual(pauseSpy.callCount, 1, 'player is paused when the modal opens');

  this.modal.close();
  assert.strictEqual(playSpy.callCount, 1, 'player is resumed when the modal closes');
});

q.test('open() hides controls, close() shows controls', function(assert) {
  this.modal.open();

  assert.expect(2);
  assert.notOk(this.player.controls_, 'controls are hidden');

  this.modal.close();
  assert.ok(this.player.controls_, 'controls are no longer hidden');
});

q.test('opened()', function(assert) {
  var openSpy = sinon.spy();
  var closeSpy = sinon.spy();

  assert.expect(4);
  assert.strictEqual(this.modal.opened(), false, 'the modal is closed');
  this.modal.open();
  assert.strictEqual(this.modal.opened(), true, 'the modal is open');

  this.modal.
    close().
    on('modalopen', openSpy).
    on('modalclose', closeSpy).
    opened(true);

  this.modal.opened(true);
  this.modal.opened(false);
  assert.strictEqual(openSpy.callCount, 1, 'modal was opened only once');
  assert.strictEqual(closeSpy.callCount, 1, 'modal was closed only once');
});

q.test('content()', function(assert) {
  var content;

  assert.expect(3);
  assert.strictEqual(typeof this.modal.content(), 'undefined', 'no content by default');

  content = this.modal.content(Dom.createEl());
  assert.ok(Dom.isEl(content), 'content was set from a single DOM element');

  assert.strictEqual(this.modal.content(null), null, 'content was nullified');
});

q.test('fillWith()', function(assert) {
  var contentEl = this.modal.contentEl();
  var children = [Dom.createEl(), Dom.createEl(), Dom.createEl()];
  var beforeFillSpy = sinon.spy();
  var fillSpy = sinon.spy();

  children.forEach(function(el) {
    contentEl.appendChild(el);
  });

  this.modal.
    on('beforemodalfill', beforeFillSpy).
    on('modalfill', fillSpy).
    fillWith(children);

  assert.expect(5 + children.length);
  assert.strictEqual(contentEl.children.length, children.length, 'has the right number of children');

  children.forEach(function(el) {
    assert.strictEqual(el.parentNode, contentEl, 'new child appended');
  });

  assert.strictEqual(beforeFillSpy.callCount, 1, 'the "beforemodalfill" callback was called');
  assert.strictEqual(beforeFillSpy.getCall(0).thisValue, this.modal, 'the value of "this" is the modal');
  assert.strictEqual(fillSpy.callCount, 1, 'the "modalfill" callback was called');
  assert.strictEqual(fillSpy.getCall(0).thisValue, this.modal, 'the value of "this" is the modal');
});

q.test('empty()', function(assert) {
  var beforeEmptySpy = sinon.spy();
  var emptySpy = sinon.spy();

  this.modal.
    fillWith([Dom.createEl(), Dom.createEl()]).
    on('beforemodalempty', beforeEmptySpy).
    on('modalempty', emptySpy).
    empty();

  assert.expect(5);
  assert.strictEqual(this.modal.contentEl().children.length, 0, 'removed all `contentEl()` children');
  assert.strictEqual(beforeEmptySpy.callCount, 1, 'the "beforemodalempty" callback was called');
  assert.strictEqual(beforeEmptySpy.getCall(0).thisValue, this.modal, 'the value of "this" is the modal');
  assert.strictEqual(emptySpy.callCount, 1, 'the "modalempty" callback was called');
  assert.strictEqual(emptySpy.getCall(0).thisValue, this.modal, 'the value of "this" is the modal');
});

q.test('closeable()', function(assert) {
  let initialCloseButton = this.modal.getChild('closeButton');

  assert.expect(8);
  assert.strictEqual(this.modal.closeable(), true, 'the modal is closed');

  this.modal.open().closeable(false);
  assert.notOk(this.modal.getChild('closeButton'), 'the close button is no longer a child of the modal');
  assert.notOk(initialCloseButton.el(), 'the initial close button was disposed');

  this.modal.handleKeyPress({which: ESC});
  assert.ok(this.modal.opened(), 'the modal was not closed by the ESC key');

  this.modal.close();
  assert.notOk(this.modal.opened(), 'the modal was closed programmatically');

  this.modal.open().closeable(true);
  assert.ok(this.modal.getChild('closeButton'), 'a new close button was created');

  this.modal.getChild('closeButton').trigger('click');
  assert.notOk(this.modal.opened(), 'the modal was closed by the new close button');

  this.modal.open().handleKeyPress({which: ESC});
  assert.notOk(this.modal.opened(), 'the modal was closed by the ESC key');
});

q.test('"content" option (fills on first open() invocation)', function(assert) {
  var modal = new ModalDialog(this.player, {
    content: Dom.createEl(),
    temporary: false
  });

  var spy = sinon.spy();

  modal.on('modalfill', spy);
  modal.open().close().open();

  assert.expect(3);
  assert.strictEqual(modal.content(), modal.options_.content, 'has the expected content');
  assert.strictEqual(spy.callCount, 1, 'auto-fills only once');
  assert.strictEqual(modal.contentEl().firstChild, modal.options_.content, 'has the expected content in the DOM');
});

q.test('"temporary" option', function(assert) {
  var temp = new ModalDialog(this.player, {temporary: true});
  var tempSpy = sinon.spy();
  var perm = new ModalDialog(this.player, {temporary: false});
  var permSpy = sinon.spy();

  temp.on('dispose', tempSpy);
  perm.on('dispose', permSpy);
  temp.open().close();
  perm.open().close();

  assert.expect(2);
  assert.strictEqual(tempSpy.callCount, 1, 'temporary modals are disposed');
  assert.strictEqual(permSpy.callCount, 0, 'permanent modals are not disposed');
});

q.test('"fillAlways" option', function(assert) {
  var modal = new ModalDialog(this.player, {
    content: 'foo',
    fillAlways: true,
    temporary: false
  });

  var spy = sinon.spy();

  modal.on('modalfill', spy);
  modal.open().close().open();

  assert.expect(1);
  assert.strictEqual(spy.callCount, 2, 'the modal was filled on each open call');
});

q.test('"label" option', function(assert) {
  var label = 'foo';
  var modal = new ModalDialog(this.player, {label: label});

  assert.expect(1);
  assert.strictEqual(modal.el().getAttribute('aria-label'), label, 'uses the label as the aria-label');
});

q.test('"uncloseable" option', function(assert) {
  var modal = new ModalDialog(this.player, {
    temporary: false,
    uncloseable: true
  });

  var spy = sinon.spy();

  modal.on('modalclose', spy);

  assert.expect(3);
  assert.strictEqual(modal.closeable(), false, 'the modal is uncloseable');
  assert.notOk(modal.getChild('closeButton'), 'the close button is not present');

  modal.open().handleKeyPress({which: ESC});
  assert.strictEqual(spy.callCount, 0, 'ESC did not close the modal');
});
