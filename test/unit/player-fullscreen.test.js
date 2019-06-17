/* eslint-env qunit */
import Player from '../../src/js/player.js';
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';
import window from 'global/window';

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
