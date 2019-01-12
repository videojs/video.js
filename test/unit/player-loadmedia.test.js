/* eslint-env qunit */
import TestHelpers from './test-helpers';

QUnit.module('Player: loadMedia/getMedia', {

  beforeEach() {
    this.player = TestHelpers.makePlayer({});
  },

  afterEach() {
    this.player.dispose();
  }
});

QUnit.test('loadMedia sets source from a string', function(assert) {
  this.player.loadMedia({
    src: 'foo.mp4'
  });

  assert.strictEqual(this.player.currentSrc(), 'foo.mp4', 'currentSrc was correct');
});

QUnit.test('loadMedia sets source from an object', function(assert) {
  this.player.loadMedia({
    src: {
      src: 'foo.mp4',
      type: 'video/mp4'
    }
  });

  assert.strictEqual(this.player.currentSrc(), 'foo.mp4', 'currentSrc was correct');
});

QUnit.test('loadMedia sets source from an array', function(assert) {
  const sources = [{
    src: 'foo.mp4',
    type: 'video/mp4'
  }, {
    src: 'foo.webm',
    type: 'video/webm'
  }];

  this.player.loadMedia({
    src: sources
  });

  assert.strictEqual(this.player.currentSrc(), sources[0].src, 'currentSrc was correct');
  assert.deepEqual(this.player.currentSource(), sources[0], 'currentSource was correct');
  assert.deepEqual(this.player.currentSources(), sources, 'currentSources were correct');
});

QUnit.test('loadMedia sets poster and backfills artwork', function(assert) {
  this.player.loadMedia({
    poster: 'foo.jpg'
  });

  assert.strictEqual(this.player.poster(), 'foo.jpg', 'poster was correct');
});

QUnit.test('loadMedia sets artwork via poster', function(assert) {
  this.player.loadMedia({
    poster: 'foo.jpg'
  });

  const {artwork} = this.player.getMedia();

  assert.deepEqual(artwork, [{
    src: 'foo.jpg',
    type: 'image/jpeg'
  }], 'the artwork was set to match the poster');
});

QUnit.test('loadMedia sets artwork and poster independently', function(assert) {
  this.player.loadMedia({
    poster: 'foo.jpg',
    artwork: [{
      src: 'bar.png',
      type: 'image/png'
    }]
  });

  assert.strictEqual(this.player.poster(), 'foo.jpg', 'poster was correct');
  assert.deepEqual(this.player.getMedia().artwork, [{
    src: 'bar.png',
    type: 'image/png'
  }], 'the artwork was provided, so does not match poster');
});

QUnit.test('loadMedia creates text tracks', function(assert) {
  this.player.loadMedia({
    textTracks: [{
      kind: 'captions',
      src: 'foo.vtt',
      language: 'en',
      label: 'English'
    }]
  });

  const rtt = this.player.remoteTextTracks()[0];

  assert.ok(Boolean(rtt), 'the track exists');
  assert.strictEqual(rtt.kind, 'captions', 'the kind is correct');
  assert.strictEqual(rtt.src, 'foo.vtt', 'the src is correct');
  assert.strictEqual(rtt.language, 'en', 'the language is correct');
  assert.strictEqual(rtt.label, 'English', 'the label is correct');
});

QUnit.test('getMedia returns a clone of the media object', function(assert) {
  const original = {
    arbitrary: true,
    src: 'foo.mp4',
    poster: 'foo.gif',
    textTracks: [{
      kind: 'captions',
      src: 'foo.vtt',
      language: 'en',
      label: 'English'
    }]
  };

  this.player.loadMedia(original);

  const result = this.player.getMedia();

  assert.notStrictEqual(result, original, 'a new object is returned');
  assert.deepEqual(result, {
    arbitrary: true,
    artwork: [{
      src: 'foo.gif',
      type: 'image/gif'
    }],
    src: 'foo.mp4',
    poster: 'foo.gif',
    textTracks: [{
      kind: 'captions',
      src: 'foo.vtt',
      language: 'en',
      label: 'English'
    }]
  }, 'the object has the expected structure');
});

QUnit.test('getMedia returns a new media object when no media has been loaded', function(assert) {

  this.player.poster = () => 'foo.gif';
  this.player.currentSources = () => [{src: 'foo.mp4', type: 'video/mp4'}];
  this.player.remoteTextTracks = () => [{
    kind: 'captions',
    src: 'foo.vtt',
    language: 'en',
    label: 'English'
  }, {
    kind: 'subtitles',
    src: 'bar.vtt',
    language: 'de',
    label: 'German'
  }];

  const result = this.player.getMedia();

  assert.deepEqual(result, {
    artwork: [{
      src: 'foo.gif',
      type: 'image/gif'
    }],
    src: [{
      src: 'foo.mp4',
      type: 'video/mp4'
    }],
    poster: 'foo.gif',
    textTracks: [{
      kind: 'captions',
      src: 'foo.vtt',
      language: 'en',
      label: 'English'
    }, {
      kind: 'subtitles',
      src: 'bar.vtt',
      language: 'de',
      label: 'German'
    }]
  }, 'the object has the expected structure');
});

// This only tests the relevant aspect of the reset function. The rest of its
// effects are tested in player.test.js
QUnit.test('reset discards the media object', function(assert) {
  this.player.loadMedia({
    poster: 'foo.jpg',
    src: 'foo.mp4',
    textTracks: [{src: 'foo.vtt'}]
  });

  this.player.reset();

  // TODO: There is a bug with player.reset() where it does not clear internal
  // cachces completely. Remove this when that's fixed.
  this.player.cache_.sources = [];

  assert.deepEqual(this.player.getMedia(), {src: [], textTracks: []}, 'any empty media object is returned');
});
