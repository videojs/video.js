/* eslint-env qunit */
import CloseButton from '../../src/js/close-button';
import sinon from 'sinon';
import ModalDialog from '../../src/js/modal-dialog';
import * as Dom from '../../src/js/utils/dom';
import TestHelpers from './test-helpers';

const ESC = 27;

QUnit.module('ModalDialog', {

  beforeEach() {
    this.player = TestHelpers.makePlayer();
    this.modal = new ModalDialog(this.player, {temporary: false});
    this.el = this.modal.el();
  },

  afterEach() {
    this.player.dispose();
    this.modal.dispose();
    this.el = null;
  }
});

const mockFocusableEls = function(Modal, focuscallback) {
  Modal.prototype.oldFocusableEls = Modal.prototype.focusableEls_;

  const focus = function() {
    return focuscallback(this.i);
  };
  const els = [ {
    i: 0,
    focus
  }, {
    i: 1,
    focus
  }, {
    i: 2,
    focus
  }, {
    i: 3,
    focus
  }];

  Modal.prototype.focusableEls_ = () => els;
};

const restoreFocusableEls = function(Modal) {
  Modal.prototype.focusableEls_ = Modal.prototype.oldFocusableEls;
};

const mockActiveEl = function(modal, index) {
  modal.oldEl = modal.el_;
  modal.el_ = {
    querySelector() {
      const focusableEls = modal.focusableEls_();

      return focusableEls[index];
    }
  };
};

const restoreActiveEl = function(modal) {
  modal.el_ = modal.oldEl;
};

const tabTestHelper = function(assert, player) {
  return function(from, to, shift = false) {
    mockFocusableEls(ModalDialog, (focusIndex) => {
      assert.equal(focusIndex, to, `we should focus back on the ${to} element, we got ${focusIndex}.`);
    });
    const modal = new ModalDialog(player, {});

    mockActiveEl(modal, from);

    let prevented = false;

    modal.handleKeyDown({
      which: 9,
      shiftKey: shift,
      preventDefault() {
        prevented = true;
      }
    });

    if (!prevented) {
      const newIndex = shift ? from - 1 : from + 1;
      const newEl = modal.focusableEls_()[newIndex];

      if (newEl) {
        newEl.focus(newEl.i);
      }
    }

    restoreActiveEl(modal);
    modal.dispose();
    restoreFocusableEls(ModalDialog);
  };
};

QUnit.test('should create the expected element', function(assert) {
  const elAssertions = TestHelpers.assertEl(assert, this.el, {
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

QUnit.test('should create the expected description element', function(assert) {
  const elAssertions = TestHelpers.assertEl(assert, this.modal.descEl_, {
    tagName: 'p',
    innerHTML: this.modal.description(),
    classes: [
      'vjs-modal-dialog-description',
      'vjs-control-text'
    ],
    attrs: {
      id: this.el.getAttribute('aria-describedby')
    }
  });

  assert.expect(elAssertions.count);
  elAssertions();
});

QUnit.test('should create the expected contentEl', function(assert) {
  const elAssertions = TestHelpers.assertEl(assert, this.modal.contentEl(), {
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

QUnit.test('should create a close button by default', function(assert) {
  const btn = this.modal.getChild('closeButton');

  // We only check the aspects of the button that relate to the modal. Other
  // aspects of the button (classes, etc) are tested in their appropriate test
  // module.
  assert.expect(2);
  assert.ok(btn instanceof CloseButton, 'close button is a CloseButton');
  assert.strictEqual(btn.el().parentNode, this.el, 'close button is a child of el');
});

QUnit.test('open() triggers events', function(assert) {
  const modal = this.modal;
  const beforeModalOpenSpy = sinon.spy(function() {
    assert.notOk(modal.opened(), 'modal is not opened before opening event');
  });

  const modalOpenSpy = sinon.spy(function() {
    assert.ok(modal.opened(), 'modal is opened on opening event');
  });

  assert.expect(4);

  modal.on('beforemodalopen', beforeModalOpenSpy);
  modal.on('modalopen', modalOpenSpy);
  modal.open();

  assert.strictEqual(beforeModalOpenSpy.callCount, 1, 'beforemodalopen spy was called');
  assert.strictEqual(modalOpenSpy.callCount, 1, 'modalopen spy was called');
});

QUnit.test('open() removes "vjs-hidden" class', function(assert) {
  assert.expect(2);
  assert.ok(this.modal.hasClass('vjs-hidden'), 'modal starts hidden');
  this.modal.open();
  assert.notOk(this.modal.hasClass('vjs-hidden'), 'modal is not hidden after opening');
});

QUnit.test('open() cannot be called on an opened modal', function(assert) {
  const spy = sinon.spy();

  this.modal.on('modalopen', spy);
  this.modal.open();
  this.modal.open();

  assert.expect(1);
  assert.strictEqual(spy.callCount, 1, 'modal was only opened once');
});

QUnit.test('close() triggers events', function(assert) {
  const modal = this.modal;
  const beforeModalCloseSpy = sinon.spy(function() {
    assert.ok(modal.opened(), 'modal is not closed before closing event');
  });

  const modalCloseSpy = sinon.spy(function() {
    assert.notOk(modal.opened(), 'modal is closed on closing event');
  });

  assert.expect(4);

  modal.on('beforemodalclose', beforeModalCloseSpy);
  modal.on('modalclose', modalCloseSpy);
  modal.open();
  modal.close();

  assert.strictEqual(beforeModalCloseSpy.callCount, 1, 'beforemodalclose spy was called');
  assert.strictEqual(modalCloseSpy.callCount, 1, 'modalclose spy was called');
});

QUnit.test('close() adds the "vjs-hidden" class', function(assert) {
  assert.expect(1);
  this.modal.open();
  this.modal.close();
  assert.ok(this.modal.hasClass('vjs-hidden'), 'modal is hidden upon close');
});

QUnit.test('pressing ESC triggers close(), but only when the modal is opened', function(assert) {
  const spy = sinon.spy();

  this.modal.on('modalclose', spy);
  this.modal.handleKeyPress({which: ESC});
  assert.expect(2);
  assert.strictEqual(spy.callCount, 0, 'ESC did not close the closed modal');

  this.modal.open();
  this.modal.handleKeyPress({which: ESC});
  assert.strictEqual(spy.callCount, 1, 'ESC closed the now-opened modal');
});

QUnit.test('close() cannot be called on a closed modal', function(assert) {
  const spy = sinon.spy();

  this.modal.on('modalclose', spy);
  this.modal.open();
  this.modal.close();
  this.modal.close();

  assert.expect(1);
  assert.strictEqual(spy.callCount, 1, 'modal was only closed once');
});

QUnit.test('open() pauses playback, close() resumes', function(assert) {
  const playSpy = sinon.spy();
  const pauseSpy = sinon.spy();

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

QUnit.test('open() does not pause, close() does not play() with pauseOnOpen set to false', function(assert) {
  const playSpy = sinon.spy();
  const pauseSpy = sinon.spy();

  // don't pause the video on modal open
  this.modal.options_.pauseOnOpen = false;

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
  assert.strictEqual(pauseSpy.callCount, 0, 'player remains playing when the modal opens');

  this.modal.close();
  assert.strictEqual(playSpy.callCount, 0, 'player is resumed when the modal closes');
});

QUnit.test('open() hides controls, close() shows controls', function(assert) {
  this.modal.open();

  assert.expect(2);
  assert.notOk(this.player.controls_, 'controls are hidden');

  this.modal.close();
  assert.ok(this.player.controls_, 'controls are no longer hidden');
});

QUnit.test('opened()', function(assert) {
  const openSpy = sinon.spy();
  const closeSpy = sinon.spy();

  assert.expect(4);
  assert.strictEqual(this.modal.opened(), false, 'the modal is closed');
  this.modal.open();
  assert.strictEqual(this.modal.opened(), true, 'the modal is open');

  this.modal.close();
  this.modal.on('modalopen', openSpy);
  this.modal.on('modalclose', closeSpy);
  this.modal.opened(true);

  this.modal.opened(true);
  this.modal.opened(false);
  assert.strictEqual(openSpy.callCount, 1, 'modal was opened only once');
  assert.strictEqual(closeSpy.callCount, 1, 'modal was closed only once');
});

QUnit.test('content()', function(assert) {
  assert.expect(3);
  assert.strictEqual(typeof this.modal.content(), 'undefined', 'no content by default');

  const content = this.modal.content(Dom.createEl());

  assert.ok(Dom.isEl(content), 'content was set from a single DOM element');

  assert.strictEqual(this.modal.content(null), null, 'content was nullified');
});

QUnit.test('fillWith()', function(assert) {
  const contentEl = this.modal.contentEl();
  const children = [Dom.createEl(), Dom.createEl(), Dom.createEl()];
  const beforeFillSpy = sinon.spy();
  const fillSpy = sinon.spy();

  children.forEach(function(el) {
    contentEl.appendChild(el);
  });

  this.modal.on('beforemodalfill', beforeFillSpy);
  this.modal.on('modalfill', fillSpy);
  this.modal.fillWith(children);

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

QUnit.test('empty()', function(assert) {
  const beforeEmptySpy = sinon.spy();
  const emptySpy = sinon.spy();

  this.modal.fillWith([Dom.createEl(), Dom.createEl()]);
  this.modal.on('beforemodalempty', beforeEmptySpy);
  this.modal.on('modalempty', emptySpy);
  this.modal.empty();

  assert.expect(5);
  assert.strictEqual(this.modal.contentEl().children.length, 0, 'removed all `contentEl()` children');
  assert.strictEqual(beforeEmptySpy.callCount, 1, 'the "beforemodalempty" callback was called');
  assert.strictEqual(beforeEmptySpy.getCall(0).thisValue, this.modal, 'the value of "this" is the modal');
  assert.strictEqual(emptySpy.callCount, 1, 'the "modalempty" callback was called');
  assert.strictEqual(emptySpy.getCall(0).thisValue, this.modal, 'the value of "this" is the modal');
});

QUnit.test('closeable()', function(assert) {
  const initialCloseButton = this.modal.getChild('closeButton');

  assert.expect(8);
  assert.strictEqual(this.modal.closeable(), true, 'the modal is closed');

  this.modal.open();
  this.modal.closeable(false);
  assert.notOk(this.modal.getChild('closeButton'), 'the close button is no longer a child of the modal');
  assert.notOk(initialCloseButton.el(), 'the initial close button was disposed');

  this.modal.handleKeyPress({which: ESC});
  assert.ok(this.modal.opened(), 'the modal was not closed by the ESC key');

  this.modal.close();
  assert.notOk(this.modal.opened(), 'the modal was closed programmatically');

  this.modal.open();
  this.modal.closeable(true);
  assert.ok(this.modal.getChild('closeButton'), 'a new close button was created');

  this.modal.getChild('closeButton').trigger('click');
  assert.notOk(this.modal.opened(), 'the modal was closed by the new close button');

  this.modal.open();
  this.modal.handleKeyPress({which: ESC});
  assert.notOk(this.modal.opened(), 'the modal was closed by the ESC key');
});

QUnit.test('"content" option (fills on first open() invocation)', function(assert) {
  const modal = new ModalDialog(this.player, {
    content: Dom.createEl(),
    temporary: false
  });

  const spy = sinon.spy();

  modal.on('modalfill', spy);
  modal.open();
  modal.close();
  modal.open();

  assert.expect(3);
  assert.strictEqual(modal.content(), modal.options_.content, 'has the expected content');
  assert.strictEqual(spy.callCount, 1, 'auto-fills only once');
  assert.strictEqual(modal.contentEl().firstChild, modal.options_.content, 'has the expected content in the DOM');
});

QUnit.test('"temporary" option', function(assert) {
  const temp = new ModalDialog(this.player, {temporary: true});
  const tempSpy = sinon.spy();
  const perm = new ModalDialog(this.player, {temporary: false});
  const permSpy = sinon.spy();

  temp.on('dispose', tempSpy);
  perm.on('dispose', permSpy);
  temp.open();
  temp.close();
  perm.open();
  perm.close();

  assert.expect(2);
  assert.strictEqual(tempSpy.callCount, 1, 'temporary modals are disposed');
  assert.strictEqual(permSpy.callCount, 0, 'permanent modals are not disposed');
});

QUnit.test('"fillAlways" option', function(assert) {
  const modal = new ModalDialog(this.player, {
    content: 'foo',
    fillAlways: true,
    temporary: false
  });

  const spy = sinon.spy();

  modal.on('modalfill', spy);
  modal.open();
  modal.close();
  modal.open();

  assert.expect(1);
  assert.strictEqual(spy.callCount, 2, 'the modal was filled on each open call');
});

QUnit.test('"label" option', function(assert) {
  const label = 'foo';
  const modal = new ModalDialog(this.player, {label});

  assert.expect(1);
  assert.strictEqual(modal.el().getAttribute('aria-label'), label, 'uses the label as the aria-label');
});

QUnit.test('"uncloseable" option', function(assert) {
  const modal = new ModalDialog(this.player, {
    temporary: false,
    uncloseable: true
  });

  const spy = sinon.spy();

  modal.on('modalclose', spy);

  assert.expect(3);
  assert.strictEqual(modal.closeable(), false, 'the modal is uncloseable');
  assert.notOk(modal.getChild('closeButton'), 'the close button is not present');

  modal.open();
  modal.handleKeyPress({which: ESC});
  assert.strictEqual(spy.callCount, 0, 'ESC did not close the modal');
});

QUnit.test('handleKeyDown traps tab focus', function(assert) {
  const tabTester = tabTestHelper(assert, this.player);

  // tabbing forward from first element to last and cycling back to first
  tabTester(0, 1, false);
  tabTester(1, 2, false);
  tabTester(2, 3, false);
  tabTester(3, 0, false);

  // tabbing backwards from last element to first and cycling back to last
  tabTester(3, 2, true);
  tabTester(2, 1, true);
  tabTester(1, 0, true);
  tabTester(0, 3, true);
});
