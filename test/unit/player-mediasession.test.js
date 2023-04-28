/* eslint-env qunit */
import TestHelpers from './test-helpers';
import sinon from 'sinon';
import window from 'global/window';

QUnit.module('Player: MediaSession', {
  afterEach() {
    this.player.dispose();
  }
});

const testOrSkip = 'mediasession' in window.navigator ? 'test' : 'skip';

QUnit[testOrSkip]('mediasession data is populated from getMedia', function(assert) {
  const done = assert.async();

  this.player = TestHelpers.makePlayer({
    mediaSession: true
  });

  this.player.loadMedia({
    artist: 'Artist',
    album: 'Album',
    title: 'Title',
    description: 'Description',
    poster: 'poster.jpg',
    src: 'foo.mp4'
  });

  this.player.on('updatemediasession', (e, mediaSessionData) => {
    assert.deepEqual(mediaSessionData, {
      artist: 'Artist',
      album: 'Album',
      title: 'Title',
      artwork: [
        {
          src: 'poster.jpg',
          type: 'image/jpeg'
        }
      ]
    }, 'mediasession data as expected from getMedia');
    done();
  });

  this.player.trigger('playing');
});

QUnit[testOrSkip]('mediasession data is populated from playlist', function(assert) {
  const done = assert.async();

  this.player = TestHelpers.makePlayer({
    mediaSession: true
  });

  this.player.usingPlugin = (plugin) => {
    if (plugin === 'playlist') {
      return true;
    }
  };
  this.player.playlist = () => [{
    artist: 'ArtistPlaylist',
    album: 'AlbumPlaylist',
    name: 'TitlePlaylist'
  }];
  this.player.playlist.currentItem = () => 0;
  this.player.poster('posterPlaylist.jpg');

  this.player.on('updatemediasession', (e, mediaSessionData) => {
    assert.deepEqual(mediaSessionData, {
      artist: 'ArtistPlaylist',
      album: 'AlbumPlaylist',
      title: 'TitlePlaylist',
      artwork: [
        {
          src: 'posterPlaylist.jpg',
          type: 'image/jpeg'
        }
      ]
    }, 'mediasession data as expected from playlist');
    done();
  });

  this.player.trigger('playing');
});

QUnit[testOrSkip]('mediasession data set', function(assert) {
  this.clock = sinon.useFakeTimers();
  this.player = TestHelpers.makePlayer({
    mediaSession: true
  });

  this.player.loadMedia({
    artist: 'ArtistA',
    album: 'AlbumA',
    title: 'TitleA',
    description: 'DescriptionA',
    poster: 'posterA.jpg',
    src: 'fooA.mp4'
  });

  this.player.trigger('playing');

  this.clock.tick(100);

  assert.equal(window.navigator.mediaSession.metadata.artist, 'ArtistA', 'mediasession artist retrieved');
  assert.equal(window.navigator.mediaSession.metadata.title, 'TitleA', 'mediasession title retrieved');
  assert.equal(window.navigator.mediaSession.metadata.album, 'AlbumA', 'mediasession album retrieved');
  assert.ok(window.navigator.mediaSession.metadata.artwork[0].src.endsWith('posterA.jpg'), 'mediasession poster retrieved');

  this.clock.restore();
});

QUnit[testOrSkip]('mediasession can be customised befire being set', function(assert) {
  assert.expect(3);

  this.clock = sinon.useFakeTimers();
  this.player = TestHelpers.makePlayer({
    mediaSession: true
  });

  this.player.loadMedia({
    artist: 'ArtistB',
    album: 'AlbumB',
    title: 'TitleB',
    description: 'DescriptionB',
    poster: 'posterB.jpg',
    src: 'fooB.mp4'
  });

  this.player.on('updatemediasession', function(e, metadata) {
    assert.ok(true, 'updatemediasession triggered');
    metadata.artist = 'Another artist';
  });

  this.player.trigger('playing');

  this.clock.tick(100);

  assert.equal(window.navigator.mediaSession.metadata.artist, 'Another artist', 'set with updated artist');
  assert.equal(window.navigator.mediaSession.metadata.title, 'TitleB', 'mediasession original title used');

  this.clock.restore();
});

