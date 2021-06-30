/* eslint-env qunit */
import Player from '../../src/js/player.js';
import videojs from '../../src/js/video.js';
import TestHelpers from './test-helpers.js';
import document from 'global/document';
import window from 'global/window';
import sinon from 'sinon';

QUnit.module('autoplay', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    // reset players storage
    for (const playerId in Player.players) {
      if (Player.players[playerId] !== null) {
        Player.players[playerId].dispose();
      }
      delete Player.players[playerId];
    }

    const videoTag = TestHelpers.makeTag();
    const fixture = document.getElementById('qunit-fixture');

    this.counts = {
      play: 0,
      muted: 0,
      success: 0,
      failure: 0
    };

    fixture.appendChild(videoTag);

    // These mock promises immediately execute,
    // effectively synchronising promise chains for testing

    // This will only act on catch calls
    this.rejectPromise = {
      then(fn) {
        return this;
      },
      catch(fn) {
        try {
          fn();
        } catch (err) {
          return this;
        }
        return this;
      }
    };

    // This will only act on then calls
    this.resolvePromise = {
      then(fn) {
        fn();
        return this;
      },
      catch(fn) {
        return this;
      }
    };

    this.createPlayer = (options = {}, attributes = {}, playRetval = null) => {
      Object.keys(attributes).forEach((a) => {
        videoTag.setAttribute(a, attributes[a]);
      });

      this.player = videojs(videoTag.id, videojs.mergeOptions({techOrder: ['techFaker']}, options));
      const oldMuted = this.player.muted;

      this.player.play = () => {
        this.counts.play++;

        if (playRetval || this.playRetval) {
          return playRetval || this.playRetval;
        }
      };

      this.mutedValue = this.player.muted();

      this.player.muted = (v) => {

        if (typeof v !== 'undefined') {
          this.counts.muted++;
          this.mutedValue = v;
        }

        return oldMuted.call(this.player, v);
      };

      this.player.on('autoplay-success', () => this.counts.success++);
      this.player.on('autoplay-failure', () => this.counts.failure++);

      // we have to trigger ready so that we
      // are waiting for loadstart
      this.player.tech_.triggerReady();
      return this.player;
    };
  },
  afterEach() {
    this.clock.restore();
    this.player.dispose();
  }
});

QUnit.test('option = false no play/muted', function(assert) {
  this.createPlayer({autoplay: false});

  assert.equal(this.player.autoplay(), false, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = true no play/muted', function(assert) {
  this.createPlayer({autoplay: true});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = "random" no play/muted', function(assert) {
  this.createPlayer({autoplay: 'random'});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = null, should be set to false no play/muted', function(assert) {
  this.createPlayer({autoplay: null});

  assert.equal(this.player.autoplay(), false, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = "play" play, no muted', function(assert) {
  this.createPlayer({autoplay: 'play'}, {}, this.resolvePromise);

  assert.equal(this.player.autoplay(), 'play', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 1, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 2, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = true w/ normalizeAutoplay = true play, no muted', function(assert) {
  this.createPlayer({
    autoplay: true,
    normalizeAutoplay: true
  }, {}, this.resolvePromise);

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 1, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 2, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = "any" play, no muted', function(assert) {
  this.createPlayer({autoplay: 'any'}, {}, this.resolvePromise);

  assert.equal(this.player.autoplay(), 'any', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 1, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 2, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = "muted" play and muted', function(assert) {
  this.createPlayer({autoplay: 'muted'}, {}, this.resolvePromise);

  assert.equal(this.player.autoplay(), 'muted', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 1, 'muted count');
  assert.equal(this.counts.success, 1, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');
  assert.equal(this.counts.success, 2, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = "play" play, no muted, rejection ignored', function(assert) {
  this.createPlayer({autoplay: 'play'}, {}, this.rejectPromise);

  assert.equal(this.player.autoplay(), 'play', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 1, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 2, 'failure count');
});

QUnit.test('option = "any" play, no muted, rejection leads to muted then play', function(assert) {
  this.createPlayer({autoplay: 'any'}, {}, this.rejectPromise);

  assert.equal(this.player.autoplay(), 'any', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  // The workflow described here:
  // Call play() -> on rejection, attempt to set mute to true ->
  // call play() again -> on rejection, set original mute value ->
  // catch failure at the end of promise chain
  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 1, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 4, 'play count');
  assert.equal(this.counts.muted, 4, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 2, 'failure count');
});

QUnit.test('option = "muted" play and muted, rejection ignored', function(assert) {
  this.createPlayer({autoplay: 'muted'}, {}, this.rejectPromise);

  assert.equal(this.player.autoplay(), 'muted', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  // muted called twice here, as muted is value is restored on failure.
  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 1, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 4, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 2, 'failure count');
});

QUnit.test('option = "muted", attr = true, play and muted', function(assert) {
  this.createPlayer({autoplay: 'muted'}, {autoplay: true});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = "play", attr = true, play only', function(assert) {
  this.createPlayer({autoplay: 'play'}, {autoplay: true});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = "any", attr = true, play only', function(assert) {
  this.createPlayer({autoplay: 'any'}, {autoplay: true});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = "any", play terminated restores muted', function(assert) {
  this.createPlayer({autoplay: 'any'});

  this.playRetval = {
    then(fn) {
      fn();
      return this;
    },
    catch: (fn) => {
      assert.equal(this.counts.play, 1, 'play count');
      assert.equal(this.counts.muted, 0, 'muted count');
      assert.equal(this.counts.success, 0, 'success count');
      assert.equal(this.counts.failure, 0, 'failure count');

      this.playRetval = {
        then(_fn) {
          window.setTimeout(_fn, 1);
          return this;
        },
        catch(_fn) {
          return this;
        }
      };
      const retval = fn();

      assert.equal(this.counts.play, 2, 'play count');
      assert.equal(this.counts.muted, 1, 'muted count');
      assert.equal(this.mutedValue, true, 'is muted');
      assert.equal(this.counts.success, 0, 'success count');
      assert.equal(this.counts.failure, 0, 'failure count');

      return retval;
    }
  };

  assert.equal(this.player.autoplay(), 'any', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');
  assert.equal(this.mutedValue, false, 'is not muted');

  this.player.tech_.trigger('loadstart');

  this.player.runPlayTerminatedQueue_();

  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');
  assert.equal(this.mutedValue, false, 'is not muted');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.runPlayTerminatedQueue_();

  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');
  assert.equal(this.mutedValue, false, 'is not muted');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  // verify autoplay success
  this.clock.tick(1);
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');
  assert.equal(this.counts.success, 1, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});

QUnit.test('option = "muted", play terminated restores muted', function(assert) {
  this.createPlayer({autoplay: 'muted'}, {}, {
    then(fn) {
      window.setTimeout(() => {
        fn();
      }, 1);
      return this;
    },
    catch(fn) {
      return this;
    }
  });

  assert.equal(this.player.autoplay(), 'muted', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');

  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 1, 'muted count');
  assert.equal(this.mutedValue, true, 'is muted');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  this.player.runPlayTerminatedQueue_();
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');
  assert.equal(this.mutedValue, false, 'no longer muted');
  assert.equal(this.counts.success, 0, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');

  // verify autoplay success
  this.clock.tick(1);
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');
  assert.equal(this.counts.success, 1, 'success count');
  assert.equal(this.counts.failure, 0, 'failure count');
});
