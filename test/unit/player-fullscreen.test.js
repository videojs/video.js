/* eslint-env qunit */
import Player from '../../src/js/player.js';
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';
import window from 'global/window';
import document from 'global/document';

const FullscreenTestHelpers = {
  makePlayer(prefixed, playerOptions, videoTag) {
    const player = TestHelpers.makePlayer(playerOptions, videoTag);

    player.fsApi_ = {
      prefixed,
      requestFullscreen: 'vjsRequestFullscreen',
      exitFullscreen: 'vjsExitFullscreen',
      fullscreenElement: 'vjsFullscreenElement',
      fullscreenEnabled: 'vjsFullscreenEnabled',
      fullscreenchange: 'vjsfullscreenchange',
      fullscreenerror: 'vjsfullscreenerror',
      fullscreen: 'vjsfullscreen'
    };

    return player;
  }
};

QUnit.module('Player Fullscreen', {
  beforeEach(assert) {
    this.clock = sinon.useFakeTimers();
    // reset players storage
    for (const playerId in Player.players) {
      if (Player.players[playerId] !== null) {
        Player.players[playerId].dispose();
      }
      delete Player.players[playerId];
    }

    window.Element.prototype.vjsRequestFullscreen = function() {
      assert.ok(false, 'vjsRequestFullscreen should not be called');
    };
    window.Element.prototype.vjsExitFullscreen = function() {
      assert.ok(false, 'vjsExitFullscreen should not be called');
    };
    window.Element.prototype.vjsFullscreenElement = function() {
      assert.ok(false, 'vjsFullscreenElement should not be called');
    };
    window.Element.prototype.vjsFullscreenEnabled = function() {
      assert.ok(false, 'vjsFullscreenEnabled should not be called');
    };
    window.Element.prototype.vjsfullscreenchange = function() {
      assert.ok(false, 'vjsfullscreenchange should not be called');
    };
    window.Element.prototype.vjsfullscreenerror = function() {
      assert.ok(false, 'vjsfullscreenerror should not be called');
    };
  },
  afterEach() {
    this.clock.restore();

    delete window.Element.prototype.vjsRequestFullscreen;
    delete window.Element.prototype.vjsExitFullscreen;
    delete window.Element.prototype.vjsFullscreenElement;
    delete window.Element.prototype.vjsFullscreenEnabled;
    delete window.Element.prototype.vjsfullscreenchange;
    delete window.Element.prototype.vjsfullscreenerror;
  }
});

QUnit.test('fullscreenOptions should not be passed from player options on prefixed api', function(assert) {

  const fullscreenOptions = {
    navigationUI: 'test',
    foo: 'bar'
  };

  const player = FullscreenTestHelpers.makePlayer(true, {
    fullscreen: {
      options: fullscreenOptions
    }
  });

  let requestFullscreenCalled = false;
  let fsOpts;

  window.Element.prototype.vjsRequestFullscreen = function(opts) {
    requestFullscreenCalled = true;
    fsOpts = opts;
  };

  player.requestFullscreen();

  assert.ok(requestFullscreenCalled, 'vjsRequestFullscreen should be called');
  assert.strictEqual(fsOpts, undefined, 'fullscreenOptions should not be passed');

  player.dispose();
});

QUnit.test('fullscreenOptions should be passed from player options on unprefixed api', function(assert) {

  const fullscreenOptions = {
    navigationUI: 'test',
    foo: 'bar'
  };

  const player = FullscreenTestHelpers.makePlayer(false, {
    fullscreen: {
      options: fullscreenOptions
    }
  });

  let requestFullscreenCalled = false;
  let fsOpts;

  window.Element.prototype.vjsRequestFullscreen = function(opts) {
    requestFullscreenCalled = true;
    fsOpts = opts;
  };

  player.requestFullscreen();

  assert.ok(requestFullscreenCalled, 'vjsRequestFullscreen should be called');
  assert.notStrictEqual(fsOpts, undefined, 'fullscreenOptions should be passed');
  assert.deepEqual(fsOpts, fullscreenOptions, 'fullscreenOptions should match player options');

  player.dispose();
});

QUnit.test('fullscreenOptions should not be passed from function arguments on prefixed api', function(assert) {

  const fullscreenOptions = {
    navigationUI: 'test',
    foo: 'bar'
  };

  const player = FullscreenTestHelpers.makePlayer(true);

  let requestFullscreenCalled = false;
  let fsOpts;

  window.Element.prototype.vjsRequestFullscreen = function(opts) {
    requestFullscreenCalled = true;
    fsOpts = opts;
  };

  player.requestFullscreen(fullscreenOptions);

  assert.ok(requestFullscreenCalled, 'vjsRequestFullscreen should be called');
  assert.strictEqual(fsOpts, undefined, 'fullscreenOptions should not be passed');

  player.dispose();
});

QUnit.test('fullscreenOptions should be passed from function arguments on unprefixed api', function(assert) {

  const fullscreenOptions = {
    navigationUI: 'test',
    foo: 'bar'
  };

  const player = FullscreenTestHelpers.makePlayer(false);

  let requestFullscreenCalled = false;
  let fsOpts;

  window.Element.prototype.vjsRequestFullscreen = function(opts) {
    requestFullscreenCalled = true;
    fsOpts = opts;
  };

  player.requestFullscreen(fullscreenOptions);

  assert.ok(requestFullscreenCalled, 'vjsRequestFullscreen should be called');
  assert.notStrictEqual(fsOpts, undefined, 'fullscreenOptions should be passed');
  assert.deepEqual(fsOpts, fullscreenOptions, 'fullscreenOptions should match function args');

  player.dispose();
});

QUnit.test('fullscreenOptions from function args should override player options', function(assert) {

  const fullscreenOptions = {
    navigationUI: 'args',
    baz: 'bar'
  };

  const player = FullscreenTestHelpers.makePlayer(false, {
    fullscreen: {
      options: {
        navigationUI: 'playeroptions',
        foo: 'bar'
      }
    }
  });

  let requestFullscreenCalled = false;
  let fsOpts;

  window.Element.prototype.vjsRequestFullscreen = function(opts) {
    requestFullscreenCalled = true;
    fsOpts = opts;
  };

  player.requestFullscreen(fullscreenOptions);

  assert.ok(requestFullscreenCalled, 'vjsRequestFullscreen should be called');
  assert.notStrictEqual(fsOpts, undefined, 'fullscreenOptions should be passed');
  assert.deepEqual(fsOpts, fullscreenOptions, 'fullscreenOptions should match function args');

  player.dispose();
});

QUnit.test('full window can be preferred to fullscreen tech', function(assert) {

  const player = FullscreenTestHelpers.makePlayer(false, {
    preferFullWindow: true
  });

  player.fsApi_ = {};
  player.tech_.supportsFullScreen = () => true;

  player.requestFullscreen();

  assert.strictEqual(player.isFullscreen(), true, 'player considered fullscreen');
  assert.strictEqual(player.isFullWindow, true, 'player is full window');

  player.exitFullscreen();
  assert.strictEqual(player.isFullWindow, false, 'full window is exited');

  player.dispose();
});

QUnit.test('fullwindow mode should exit when ESC event triggered', function(assert) {
  const player = TestHelpers.makePlayer();

  player.enterFullWindow();
  assert.ok(player.isFullWindow, 'enterFullWindow should be called');

  const evt = TestHelpers.createEvent('keydown');

  evt.keyCode = 27;
  evt.which = 27;
  player.boundFullWindowOnEscKey_(evt);
  // player.fullWindowOnEscKey(evt);
  assert.equal(player.isFullWindow, false, 'exitFullWindow should be called');

  player.dispose();
});

QUnit.test('fullscreenchange event from Html5 should change player.isFullscreen_', function(assert) {
  const player = FullscreenTestHelpers.makePlayer(false);
  const html5 = player.tech(true);

  // simulate html5.proxyWebkitFullscreen_
  html5.trigger('fullscreenchange', {
    isFullscreen: true,
    nativeIOSFullscreen: true
  });

  assert.ok(player.isFullscreen(), 'player.isFullscreen_ should be true');

  html5.trigger('fullscreenchange', { isFullscreen: false });

  assert.ok(!player.isFullscreen(), 'player.isFullscreen_ should be false');

  player.dispose();
});

QUnit.test('fullscreenerror event from Html5 should pass through player', function(assert) {
  const player = FullscreenTestHelpers.makePlayer(false);
  const html5 = player.tech(true);
  const err = new Error('This is test');
  let fullscreenerror;

  player.on('fullscreenerror', function(evt, error) {
    fullscreenerror = error;
  });

  html5.trigger('fullscreenerror', err);

  assert.strictEqual(fullscreenerror, err);

  player.dispose();
});

// only run where we have sinon.promise
const skipOrTest = sinon.promise ? 'test' : 'skip';

QUnit[skipOrTest]('requestFullscreen returns a rejected promise if unable to go fullscreen', function(assert) {
  const player = TestHelpers.makePlayer();
  const playerEl = player.el();
  const stub = sinon.stub(playerEl, player.fsApi_.requestFullscreen);
  const promise = sinon.promise();

  stub.returns(promise);
  promise.reject(new Error('Cannot go fullscreen'));

  assert.rejects(
    player.requestFullscreen(),
    new Error('Cannot go fullscreen'),
    'our promise was rejected'
  );

  stub.restore();
});

QUnit[skipOrTest]('requestFullscreen returns a resolved promise if we were fullscreen', function(assert) {
  const player = TestHelpers.makePlayer();
  const playerEl = player.el();
  const stub = sinon.stub(playerEl, player.fsApi_.requestFullscreen);
  const promise = sinon.promise();

  stub.returns(promise);
  // pretend we successfully went fullscreen.
  promise.resolve();

  player.requestFullscreen().then(() => assert.ok(true, 'our promise resolved'));

  stub.restore();
});

QUnit[skipOrTest]('exitFullscreen returns a rejected promise if document is not active', function(assert) {
  const player = TestHelpers.makePlayer();
  const stub = sinon.stub(document, player.fsApi_.exitFullscreen);
  const promise = sinon.promise();

  stub.returns(promise);
  promise.reject(new Error('Document not active'));

  assert.rejects(
    player.exitFullscreen(),
    new Error('Document not active'),
    'our promise was rejected'
  );

  stub.restore();
});

QUnit[skipOrTest]('exitFullscreen returns a resolved promise if we were fullscreen', function(assert) {
  const player = TestHelpers.makePlayer();
  const stub = sinon.stub(document, player.fsApi_.exitFullscreen);
  const promise = sinon.promise();

  stub.returns(promise);
  // pretend we successfully exited.
  promise.resolve();

  player.exitFullscreen().then(() => assert.ok(true, 'our promise resolved'));

  stub.restore();
});
