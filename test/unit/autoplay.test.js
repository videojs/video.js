/* eslint-env qunit */
import Player from '../../src/js/player.js';
import videojs from '../../src/js/video.js';
import TestHelpers from './test-helpers.js';
import document from 'global/document';
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
      muted: 0
    };

    fixture.appendChild(videoTag);

    // this promise fake will act right away
    // it will also only act on catch calls
    this.rejectPromise = {
      then(fn) {
        return this;
      },
      catch(fn) {
        fn();
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

        if (playRetval) {
          return playRetval;
        }
      };

      this.player.muted = (v) => {

        if (typeof v !== 'undefined') {
          this.counts.muted++;
        }

        return oldMuted.call(this.player, v);
      };

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

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});

QUnit.test('option = true no play/muted', function(assert) {
  this.createPlayer({autoplay: true});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});

QUnit.test('option = "random" no play/muted', function(assert) {
  this.createPlayer({autoplay: 'random'});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});

QUnit.test('option = null, should be set to false no play/muted', function(assert) {
  this.createPlayer({autoplay: null});

  assert.equal(this.player.autoplay(), false, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});

QUnit.test('options = "play" play, no muted', function(assert) {
  this.createPlayer({autoplay: 'play'});

  assert.equal(this.player.autoplay(), 'play', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});

QUnit.test('option = "any" play, no muted', function(assert) {
  this.createPlayer({autoplay: 'any'});

  assert.equal(this.player.autoplay(), 'any', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});

QUnit.test('option = "muted" play and muted', function(assert) {
  this.createPlayer({autoplay: 'muted'});

  assert.equal(this.player.autoplay(), 'muted', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 1, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');
});

QUnit.test('option = "play" play, no muted, rejection ignored', function(assert) {
  this.createPlayer({autoplay: 'play'}, {}, this.rejectPromise);

  assert.equal(this.player.autoplay(), 'play', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});

QUnit.test('option = "any" play, no muted, rejection leads to muted then play', function(assert) {
  this.createPlayer({autoplay: 'any'}, {}, this.rejectPromise);

  assert.equal(this.player.autoplay(), 'any', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  // muted called twice here, as muted is value is restored on failure.
  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 4, 'play count');
  assert.equal(this.counts.muted, 4, 'muted count');
});

QUnit.test('option = "muted" play and muted, rejection ignored', function(assert) {
  this.createPlayer({autoplay: 'muted'}, {}, this.rejectPromise);

  assert.equal(this.player.autoplay(), 'muted', 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), false, 'tech.autoplay getter');

  // muted called twice here, as muted is value is restored on failure.
  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 1, 'play count');
  assert.equal(this.counts.muted, 2, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 2, 'play count');
  assert.equal(this.counts.muted, 4, 'muted count');
});

QUnit.test('option = "muted", attr = true, play and muted', function(assert) {
  this.createPlayer({autoplay: 'muted'}, {autoplay: true});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});

QUnit.test('option = "play", attr = true, play only', function(assert) {
  this.createPlayer({autoplay: 'play'}, {autoplay: true});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});

QUnit.test('option = "any", attr = true, play only', function(assert) {
  this.createPlayer({autoplay: 'any'}, {autoplay: true});

  assert.equal(this.player.autoplay(), true, 'player.autoplay getter');
  assert.equal(this.player.tech_.autoplay(), true, 'tech.autoplay getter');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');

  this.player.tech_.trigger('loadstart');
  assert.equal(this.counts.play, 0, 'play count');
  assert.equal(this.counts.muted, 0, 'muted count');
});
