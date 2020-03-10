/* eslint-env qunit */
import sinon from 'sinon';
import {silencePromise} from '../../src/js/utils/promise';
import TestHelpers from './test-helpers';

QUnit.module('Player#play', {

  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.player = TestHelpers.makePlayer({});
    this.techPlayCallCount = 0;
    this.techCurrentTimeCallCount = 0;
    this.initTime = 0;
    this.player.tech_.play = () => {
      this.techPlayCallCount++;
    };
    this.player.tech_.setCurrentTime = (seconds) => {
      this.techCurrentTimeCallCount++;
      this.initTime = seconds;
    };
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('tech not ready + no source = wait for ready, then loadstart', function(assert) {

  // Mock the player/tech not being ready.
  this.player.isReady_ = false;

  // Attempt to play.
  this.player.play();
  this.clock.tick(100);
  assert.strictEqual(this.techPlayCallCount, 0, 'tech_.play was not called because the tech was not ready');

  // Ready the player.
  this.player.triggerReady();
  this.clock.tick(100);
  assert.strictEqual(this.techPlayCallCount, 0, 'tech_.play was not called because there was no source');

  // Add a source and trigger loadstart.
  this.player.src('xyz.mp4');
  this.clock.tick(100);
  this.player.trigger('loadstart');
  assert.strictEqual(this.techPlayCallCount, 1, 'tech_.play was called');
});

QUnit.test('tech not ready + has source = wait for ready', function(assert) {

  // Mock the player/tech not being ready, but having a source.
  this.player.isReady_ = false;
  this.player.src('xyz.mp4');
  this.clock.tick(100);

  // Attempt to play.
  this.player.play();
  this.clock.tick(100);
  assert.strictEqual(this.techPlayCallCount, 0, 'tech_.play was not called because the tech was not ready');

  // Ready the player.
  this.player.triggerReady();
  this.clock.tick(100);
  assert.strictEqual(this.techPlayCallCount, 1, 'tech_.play was called');
});

QUnit.test('tech ready + no source = wait for loadstart', function(assert) {

  // Attempt to play.
  this.player.play();
  this.clock.tick(100);
  assert.strictEqual(this.techPlayCallCount, 0, 'tech_.play was not called because the tech was not ready');

  // Add a source and trigger loadstart.
  this.player.src('xyz.mp4');
  this.clock.tick(100);
  this.player.trigger('loadstart');
  assert.strictEqual(this.techPlayCallCount, 1, 'tech_.play was called');
});

QUnit.test('tech ready + has source = play immediately!', function(assert) {

  // Mock the player having a source.
  this.player.src('xyz.mp4');
  this.clock.tick(100);

  // Attempt to play, but silence the promise that might be returned.
  silencePromise(this.player.play());
  assert.strictEqual(this.techPlayCallCount, 1, 'tech_.play was called');
});

QUnit.test('tech ready + has source + changing source = wait for loadstart', function(assert) {

  // Mock the player having a source and in the process of changing its source.
  this.player.src('xyz.mp4');
  this.clock.tick(100);
  this.player.src('abc.mp4');
  this.player.play();
  this.clock.tick(100);
  assert.strictEqual(this.techPlayCallCount, 0, 'tech_.play was not called because the source was changing');

  this.player.trigger('loadstart');
  assert.strictEqual(this.techPlayCallCount, 1, 'tech_.play was called');
});
