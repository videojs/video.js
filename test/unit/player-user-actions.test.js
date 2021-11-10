/* eslint-env qunit */
import document from 'global/document';
import keycode from 'keycode';
import sinon from 'sinon';
import TestHelpers from './test-helpers';
import FullscreenApi from '../../src/js/fullscreen-api.js';

QUnit.module('Player: User Actions: Click', {

  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.player = TestHelpers.makePlayer({controls: true});
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('by default, click toggles play', function(assert) {
  let paused = true;

  this.player.paused = () => paused;
  this.player.play = sinon.spy();
  this.player.pause = sinon.spy();

  this.player.handleTechClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.play.callCount, 1, 'has called play');
  assert.strictEqual(this.player.pause.callCount, 0, 'has not called pause');

  paused = false;
  this.player.handleTechClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.play.callCount, 1, 'has called play, previously');
  assert.strictEqual(this.player.pause.callCount, 1, 'has called pause');
});

QUnit.test('when controls are disabled, click does nothing', function(assert) {
  let paused = true;

  this.player.controls(false);

  this.player.paused = () => paused;
  this.player.play = sinon.spy();
  this.player.pause = sinon.spy();

  this.player.handleTechClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.play.callCount, 0, 'has not called play');
  assert.strictEqual(this.player.pause.callCount, 0, 'has not called pause');

  paused = false;
  this.player.handleTechClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.play.callCount, 0, 'has not called play, previously');
  assert.strictEqual(this.player.pause.callCount, 0, 'has not called pause');
});

QUnit.test('when userActions.click is false, click does nothing', function(assert) {
  let paused = true;

  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      click: false
    }
  });

  this.player.paused = () => paused;
  this.player.play = sinon.spy();
  this.player.pause = sinon.spy();

  this.player.handleTechClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.play.callCount, 0, 'has not called play');
  assert.strictEqual(this.player.pause.callCount, 0, 'has not called pause');

  paused = false;
  this.player.handleTechClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.play.callCount, 0, 'has not called play, previously');
  assert.strictEqual(this.player.pause.callCount, 0, 'has not called pause');
});

QUnit.test('when userActions.click is a function, that function is called instead of toggling play', function(assert) {
  let paused = true;
  const clickSpy = sinon.spy();

  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      click: clickSpy
    }
  });

  this.player.paused = () => paused;
  this.player.play = sinon.spy();
  this.player.pause = sinon.spy();

  let event = {target: this.player.tech_.el_};

  this.player.handleTechClick_(event);

  assert.strictEqual(this.player.play.callCount, 0, 'has not called play');
  assert.strictEqual(this.player.pause.callCount, 0, 'has not called pause');
  assert.strictEqual(clickSpy.callCount, 1, 'has called the click handler');
  assert.strictEqual(clickSpy.getCall(0).args[0], event, 'has passed the event to the handler');

  paused = false;
  event = {target: this.player.tech_.el_};
  this.player.handleTechClick_(event);

  assert.strictEqual(this.player.play.callCount, 0, 'has not called play, previously');
  assert.strictEqual(this.player.pause.callCount, 0, 'has not called pause');
  assert.strictEqual(clickSpy.callCount, 2, 'has called the click handler');
  assert.strictEqual(clickSpy.getCall(1).args[0], event, 'has passed the event to the handler');
});

QUnit.module('Player: User Actions: Double Click', {

  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.player = TestHelpers.makePlayer({controls: true});
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('by default, double-click opens fullscreen', function(assert) {
  let fullscreen = false;

  this.player.isFullscreen = () => fullscreen;
  this.player.requestFullscreen = sinon.spy();
  this.player.exitFullscreen = sinon.spy();

  this.player.handleTechDoubleClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.requestFullscreen.callCount, 1, 'has gone fullscreen once');
  assert.strictEqual(this.player.exitFullscreen.callCount, 0, 'has not exited fullscreen');

  fullscreen = true;
  this.player.handleTechDoubleClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.requestFullscreen.callCount, 1, 'has gone fullscreen once');
  assert.strictEqual(this.player.exitFullscreen.callCount, 1, 'has exited fullscreen');
});

QUnit.test('when controls are disabled, double-click does nothing', function(assert) {
  let fullscreen = false;

  this.player.controls(false);

  this.player.isFullscreen = () => fullscreen;
  this.player.requestFullscreen = sinon.spy();
  this.player.exitFullscreen = sinon.spy();

  this.player.handleTechDoubleClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.requestFullscreen.callCount, 0, 'has not gone fullscreen');
  assert.strictEqual(this.player.exitFullscreen.callCount, 0, 'has not exited fullscreen');

  fullscreen = true;
  this.player.handleTechDoubleClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.requestFullscreen.callCount, 0, 'has not gone fullscreen');
  assert.strictEqual(this.player.exitFullscreen.callCount, 0, 'has not exited fullscreen');
});

QUnit.test('when userActions.doubleClick is false, double-click does nothing', function(assert) {
  let fullscreen = false;

  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      doubleClick: false
    }
  });

  this.player.isFullscreen = () => fullscreen;
  this.player.requestFullscreen = sinon.spy();
  this.player.exitFullscreen = sinon.spy();

  this.player.handleTechDoubleClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.requestFullscreen.callCount, 0, 'has not gone fullscreen');
  assert.strictEqual(this.player.exitFullscreen.callCount, 0, 'has not exited fullscreen');

  fullscreen = true;
  this.player.handleTechDoubleClick_({target: this.player.tech_.el_});

  assert.strictEqual(this.player.requestFullscreen.callCount, 0, 'has not gone fullscreen');
  assert.strictEqual(this.player.exitFullscreen.callCount, 0, 'has not exited fullscreen');
});

QUnit.test('when userActions.doubleClick is a function, that function is called instead of going fullscreen', function(assert) {
  let fullscreen = false;

  const doubleClickSpy = sinon.spy();

  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      doubleClick: doubleClickSpy
    }
  });

  this.player.isFullscreen = () => fullscreen;
  this.player.requestFullscreen = sinon.spy();
  this.player.exitFullscreen = sinon.spy();

  let event = {target: this.player.tech_.el_};

  this.player.handleTechDoubleClick_(event);

  assert.strictEqual(this.player.requestFullscreen.callCount, 0, 'has not gone fullscreen');
  assert.strictEqual(this.player.exitFullscreen.callCount, 0, 'has not exited fullscreen');
  assert.strictEqual(doubleClickSpy.callCount, 1, 'has called the doubleClick handler');
  assert.strictEqual(doubleClickSpy.getCall(0).args[0], event, 'has passed the event to the handler');

  fullscreen = true;
  event = {target: this.player.tech_.el_};
  this.player.handleTechDoubleClick_(event);

  assert.strictEqual(this.player.requestFullscreen.callCount, 0, 'has not gone fullscreen');
  assert.strictEqual(this.player.exitFullscreen.callCount, 0, 'has not exited fullscreen');
  assert.strictEqual(doubleClickSpy.callCount, 2, 'has called the doubleClick handler');
  assert.strictEqual(doubleClickSpy.getCall(1).args[0], event, 'has passed the event to the handler');
});

QUnit.module('Player: User Actions: Hotkeys', {

  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.player = TestHelpers.makePlayer();
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

const mockKeyDownEvent = (key) => {
  return {
    preventDefault() {},
    stopPropagation() {},
    type: 'keydown',
    which: keycode.codes[key]
  };
};

const defaultKeyTests = {
  fullscreen(player, assert, positive) {
    let fullscreen;

    if (document[FullscreenApi.fullscreenEnabled] === false) {
      assert.ok(true, 'skipped fullscreen test because not supported');
      assert.ok(true, 'skipped fullscreen test because not supported');
      assert.ok(true, 'skipped fullscreen test because not supported');
      assert.ok(true, 'skipped fullscreen test because not supported');
      return;
    }

    player.isFullscreen = () => fullscreen;
    player.requestFullscreen = sinon.spy();
    player.exitFullscreen = sinon.spy();

    fullscreen = false;
    player.handleKeyDown(mockKeyDownEvent('f'));

    if (positive) {
      assert.strictEqual(player.requestFullscreen.callCount, 1, 'has gone fullscreen');
      assert.strictEqual(player.exitFullscreen.callCount, 0, 'has not exited fullscreen');
    } else {
      assert.strictEqual(player.requestFullscreen.callCount, 0, 'has not gone fullscreen');
      assert.strictEqual(player.exitFullscreen.callCount, 0, 'has not exited fullscreen');
    }

    fullscreen = true;
    player.handleKeyDown(mockKeyDownEvent('f'));

    if (positive) {
      assert.strictEqual(player.requestFullscreen.callCount, 1, 'has gone fullscreen');
      assert.strictEqual(player.exitFullscreen.callCount, 1, 'has exited fullscreen');
    } else {
      assert.strictEqual(player.requestFullscreen.callCount, 0, 'has not gone fullscreen');
      assert.strictEqual(player.exitFullscreen.callCount, 0, 'has not exited fullscreen');
    }
  },
  mute(player, assert, positive) {
    let muted = false;

    player.muted = sinon.spy((val) => {
      if (val !== undefined) {
        muted = val;
      }
      return muted;
    });

    player.handleKeyDown(mockKeyDownEvent('m'));

    if (positive) {
      assert.strictEqual(player.muted.callCount, 2, 'muted was called twice (get and set)');
      assert.strictEqual(player.muted.lastCall.args[0], true, 'most recent call was to mute');
    } else {
      assert.strictEqual(player.muted.callCount, 0, 'muted was not called');
    }

    player.handleKeyDown(mockKeyDownEvent('m'));

    if (positive) {
      assert.strictEqual(player.muted.callCount, 4, 'muted was called twice (get and set)');
      assert.strictEqual(player.muted.lastCall.args[0], false, 'most recent call was to unmute');
    } else {
      assert.strictEqual(player.muted.callCount, 0, 'muted was not called');
    }
  },
  playPause(player, assert, positive) {
    let paused;

    player.paused = () => paused;
    player.pause = sinon.spy();
    player.play = sinon.spy();

    paused = true;
    player.handleKeyDown(mockKeyDownEvent('k'));

    if (positive) {
      assert.strictEqual(player.pause.callCount, 0, 'has not paused');
      assert.strictEqual(player.play.callCount, 1, 'has played');
    } else {
      assert.strictEqual(player.pause.callCount, 0, 'has not paused');
      assert.strictEqual(player.play.callCount, 0, 'has not played');
    }

    paused = false;
    player.handleKeyDown(mockKeyDownEvent('k'));

    if (positive) {
      assert.strictEqual(player.pause.callCount, 1, 'has paused');
      assert.strictEqual(player.play.callCount, 1, 'has played');
    } else {
      assert.strictEqual(player.pause.callCount, 0, 'has not paused');
      assert.strictEqual(player.play.callCount, 0, 'has not played');
    }

    paused = true;
    player.handleKeyDown(mockKeyDownEvent('space'));

    if (positive) {
      assert.strictEqual(player.pause.callCount, 1, 'has paused');
      assert.strictEqual(player.play.callCount, 2, 'has played twice');
    } else {
      assert.strictEqual(player.pause.callCount, 0, 'has not paused');
      assert.strictEqual(player.play.callCount, 0, 'has not played');
    }

    paused = false;
    player.handleKeyDown(mockKeyDownEvent('space'));

    if (positive) {
      assert.strictEqual(player.pause.callCount, 2, 'has paused twice');
      assert.strictEqual(player.play.callCount, 2, 'has played twice');
    } else {
      assert.strictEqual(player.pause.callCount, 0, 'has not paused');
      assert.strictEqual(player.play.callCount, 0, 'has not played');
    }
  }
};

QUnit.test('by default, hotkeys are disabled', function(assert) {
  assert.expect(14);
  defaultKeyTests.fullscreen(this.player, assert, false);
  defaultKeyTests.mute(this.player, assert, false);
  defaultKeyTests.playPause(this.player, assert, false);
});

QUnit.test('when userActions.hotkeys is true, hotkeys are enabled', function(assert) {
  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: true
    }
  });

  assert.expect(16);
  defaultKeyTests.fullscreen(this.player, assert, true);
  defaultKeyTests.mute(this.player, assert, true);
  defaultKeyTests.playPause(this.player, assert, true);
});

QUnit.test('when userActions.hotkeys is an object, hotkeys are enabled', function(assert) {
  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: {}
    }
  });

  assert.expect(16);
  defaultKeyTests.fullscreen(this.player, assert, true);
  defaultKeyTests.mute(this.player, assert, true);
  defaultKeyTests.playPause(this.player, assert, true);
});

QUnit.test('when userActions.hotkeys.fullscreenKey can be a function', function(assert) {
  if (document[FullscreenApi.fullscreenEnabled] === false) {
    assert.expect(0);
    return;
  }

  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: {
        fullscreenKey: sinon.spy((e) => keycode.isEventKey(e, 'x'))
      }
    }
  });

  let fullscreen;

  this.player.isFullscreen = () => fullscreen;
  this.player.requestFullscreen = sinon.spy();
  this.player.exitFullscreen = sinon.spy();

  fullscreen = false;
  this.player.handleKeyDown(mockKeyDownEvent('f'));

  assert.strictEqual(this.player.requestFullscreen.callCount, 0, 'has not gone fullscreen');
  assert.strictEqual(this.player.exitFullscreen.callCount, 0, 'has not exited fullscreen');

  this.player.handleKeyDown(mockKeyDownEvent('x'));

  assert.strictEqual(this.player.requestFullscreen.callCount, 1, 'has gone fullscreen');
  assert.strictEqual(this.player.exitFullscreen.callCount, 0, 'has not exited fullscreen');

  fullscreen = true;
  this.player.handleKeyDown(mockKeyDownEvent('x'));

  assert.strictEqual(this.player.requestFullscreen.callCount, 1, 'has gone fullscreen');
  assert.strictEqual(this.player.exitFullscreen.callCount, 1, 'has exited fullscreen');
});

QUnit.test('when userActions.hotkeys.muteKey can be a function', function(assert) {
  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: {
        muteKey: sinon.spy((e) => keycode.isEventKey(e, 'x'))
      }
    }
  });

  let muted = false;

  this.player.muted = sinon.spy((val) => {
    if (val !== undefined) {
      muted = val;
    }
    return muted;
  });

  this.player.handleKeyDown(mockKeyDownEvent('m'));

  assert.strictEqual(this.player.muted.callCount, 0, 'muted was not called');

  this.player.handleKeyDown(mockKeyDownEvent('x'));

  assert.strictEqual(this.player.muted.callCount, 2, 'muted was called twice (get and set)');
  assert.strictEqual(this.player.muted.lastCall.args[0], true, 'most recent call was to mute');

  this.player.handleKeyDown(mockKeyDownEvent('x'));

  assert.strictEqual(this.player.muted.callCount, 4, 'muted was called twice (get and set)');
  assert.strictEqual(this.player.muted.lastCall.args[0], false, 'most recent call was to unmute');
});

QUnit.test('when userActions.hotkeys.playPauseKey can be a function', function(assert) {
  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: {
        playPauseKey: sinon.spy((e) => keycode.isEventKey(e, 'x'))
      }
    }
  });

  let paused;

  this.player.paused = () => paused;
  this.player.pause = sinon.spy();
  this.player.play = sinon.spy();

  paused = true;
  this.player.handleKeyDown(mockKeyDownEvent('k'));
  this.player.handleKeyDown(mockKeyDownEvent('space'));

  assert.strictEqual(this.player.pause.callCount, 0, 'has not paused');
  assert.strictEqual(this.player.play.callCount, 0, 'has not played');

  this.player.handleKeyDown(mockKeyDownEvent('x'));

  assert.strictEqual(this.player.pause.callCount, 0, 'has not paused');
  assert.strictEqual(this.player.play.callCount, 1, 'has played');

  paused = false;
  this.player.handleKeyDown(mockKeyDownEvent('x'));

  assert.strictEqual(this.player.pause.callCount, 1, 'has paused');
  assert.strictEqual(this.player.play.callCount, 1, 'has played');
});

QUnit.test('hotkeys are ignored when focus is in a contenteditable element', function(assert) {
  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: true
    }
  });

  const div = document.createElement('div');

  div.contentEditable = 'true';
  this.player.el_.appendChild(div);
  div.focus();

  assert.expect(14);
  defaultKeyTests.fullscreen(this.player, assert, false);
  defaultKeyTests.mute(this.player, assert, false);
  defaultKeyTests.playPause(this.player, assert, false);
});

QUnit.test('hotkeys are ignored when focus is in a textarea', function(assert) {
  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: true
    }
  });

  const textarea = document.createElement('textarea');

  this.player.el_.appendChild(textarea);
  textarea.focus();

  assert.expect(14);
  defaultKeyTests.fullscreen(this.player, assert, false);
  defaultKeyTests.mute(this.player, assert, false);
  defaultKeyTests.playPause(this.player, assert, false);
});

QUnit.test('hotkeys are ignored when focus is in a text input', function(assert) {
  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: true
    }
  });

  const input = document.createElement('input');

  input.type = 'text';
  this.player.el_.appendChild(input);
  input.focus();

  assert.expect(14);
  defaultKeyTests.fullscreen(this.player, assert, false);
  defaultKeyTests.mute(this.player, assert, false);
  defaultKeyTests.playPause(this.player, assert, false);
});

QUnit.test('hotkeys are NOT ignored when focus is on a button element', function(assert) {
  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: true
    }
  });

  const button = document.createElement('button');

  this.player.el_.appendChild(button);
  button.focus();

  assert.expect(16);
  defaultKeyTests.fullscreen(this.player, assert, true);
  defaultKeyTests.mute(this.player, assert, true);
  defaultKeyTests.playPause(this.player, assert, true);
});

QUnit.test('hotkeys are NOT ignored when focus is on a button input', function(assert) {
  this.player.dispose();
  this.player = TestHelpers.makePlayer({
    controls: true,
    userActions: {
      hotkeys: true
    }
  });

  const input = document.createElement('input');

  input.type = 'button';
  this.player.el_.appendChild(input);
  input.focus();

  assert.expect(16);
  defaultKeyTests.fullscreen(this.player, assert, true);
  defaultKeyTests.mute(this.player, assert, true);
  defaultKeyTests.playPause(this.player, assert, true);
});
