import CloseButton from '../../src/js/close-button';
import ModalDialog from '../../src/js/modal-dialog';
import * as Dom from '../../src/js/utils/dom';
import * as Fn from '../../src/js/utils/fn';
import TestHelpers from './test-helpers';

var ESC = 27;

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

q.test('close() cannot be called on an closed modal', function(assert) {
  var spy = sinon.spy();

  this.modal.on('modalclose', spy).open().close().close();

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

  assert.expect(4);
  assert.strictEqual(typeof this.modal.content(), 'undefined', 'no content by default');

  content = this.modal.content(Dom.createEl());
  assert.ok(Dom.isEl(content), 'content was set from a single DOM element');

  assert.strictEqual(this.modal.content(123), content, 'content was NOT changed by invalid input');
  assert.strictEqual(this.modal.content(null), null, 'content was nullified');
});

q.test('normalizeContent_() arrays, elements, and non-empty strings', function(assert) {
  var asElement = this.modal.normalizeContent_(Dom.createEl());

  var asString = this.modal.normalizeContent_('hello');

  var asArray = this.modal.normalizeContent_([
    Dom.createEl(), {}, Dom.createEl('span'), []
  ]);

  var asInvalid = this.modal.normalizeContent_(true);

  var asEmptyString = this.modal.normalizeContent_('  ');

  assert.expect(5);
  assert.strictEqual(asElement.length, 1, 'single elements are accepted');
  assert.strictEqual(asString.length, 5, 'non-empty strings are accepted');
  assert.strictEqual(asArray.length, 2, 'invalid values filtered out of array');
  assert.strictEqual(asInvalid, null, 'single invalid values are rejected');
  assert.strictEqual(asEmptyString, null, 'empty strings are rejected');
});

q.test('normalizeContent_() callbacks', function(assert) {
  var asElementFn = this.modal.normalizeContent_(function() {
    return Dom.createEl();
  });

  var asStringFn = this.modal.normalizeContent_(function() {
    return 'hello';
  });

  var asArrayFn = this.modal.normalizeContent_(function() {
    return [null, '123', Dom.createEl()];
  });

  var asInvalidFn = this.modal.normalizeContent_(function() {
    return 123;
  });

  var asEmptyStringFn = this.modal.normalizeContent_(function() {
    return '\t\r\n';
  });

  assert.expect(5);
  assert.strictEqual(asElementFn.length, 1, 'single elements are accepted when returned by a function');
  assert.strictEqual(asStringFn.length, 5, 'non-empty strings are passed through directly');
  assert.strictEqual(asArrayFn.length, 1, 'invalid values filtered out of array when returned by a function');
  assert.strictEqual(asInvalidFn, null, 'single invalid values are rejected when returned by a function');
  assert.strictEqual(asEmptyStringFn, null, 'empty strings are rejected when returned by a function');
});

q.test('normalizeContent_() callback invocations', function(assert) {
  var callbackSpy = sinon.spy();
  var spyCall;

  this.modal.normalizeContent_(callbackSpy);
  spyCall = callbackSpy.getCall(0);

  assert.expect(3);
  assert.strictEqual(callbackSpy.callCount, 1, 'the test callback was called');
  assert.strictEqual(spyCall.thisValue, this.modal, 'the value of "this" in the callback is the modal');
  assert.ok(spyCall.calledWithExactly(this.modal.contentEl()), 'the contentEl is passed to the callback');
});

q.test('fillWith()', function(assert) {
  var contentEl = this.modal.contentEl();
  var children = [Dom.createEl(), Dom.createEl(), Dom.createEl()];

  [Dom.createEl(), Dom.createEl()].forEach(function(el) {
    contentEl.appendChild(el);
  });

  this.modal.fillWith(children);

  assert.expect(1 + children.length);
  assert.strictEqual(contentEl.children.length, children.length, 'has the right number of children');
  children.forEach(function(el) {
    assert.strictEqual(el.parentNode, contentEl, 'new child appended');
  });
});

q.test('empty()', function(assert) {
  this.modal.fillWith([Dom.createEl(), Dom.createEl()]).empty();
  assert.expect(1);
  assert.strictEqual(this.modal.contentEl().children.length, 0, 'removed all `contentEl()` children');
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
  var modal = new ModalDialog(this.player, {content: Dom.createEl()});

  sinon.spy(modal, 'fill');
  modal.open().close().open();

  assert.expect(3);
  assert.strictEqual(modal.content(), modal.options_.content, 'has the expected content');
  assert.strictEqual(modal.fill.callCount, 1, 'auto-fills only once');
  assert.strictEqual(modal.contentEl().firstChild, modal.options_.content, 'has the expected content in the DOM');
});

q.test('"disposeOnClose" option', function(assert) {
  var modal = new ModalDialog(this.player, {disposeOnClose: true});

  sinon.spy(modal, 'dispose');
  modal.open().close();

  assert.expect(1);
  assert.strictEqual(modal.dispose.callCount, 1, 'dispose was called');
});

q.test('"fillAlways" option', function(assert) {
  var modal = new ModalDialog(this.player, {fillAlways: true});

  sinon.spy(modal, 'fill');
  modal.open().close().open();

  assert.expect(1);
  assert.strictEqual(modal.fill.callCount, 2, 'the modal was filled on each open call');
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

q.test('"uncloseable" option', function(assert) {
  var modal = new ModalDialog(this.player, {uncloseable: true});
  var spy = sinon.spy();

  modal.on('modalclose', spy);

  assert.expect(3);
  assert.strictEqual(modal.closeable(), false, 'the modal is uncloseable');
  assert.notOk(modal.getChild('closeButton'), 'the close button is not present');

  modal.open().handleKeyPress({which: ESC});
  assert.strictEqual(spy.callCount, 0, 'ESC did not close the modal');
});
