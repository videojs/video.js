/* eslint-env qunit */
import TestHelpers from './test-helpers';
import sinon from 'sinon';
import window from 'global/window';

QUnit.module('Player: MediaSession', {
  // before() {
  //   if (!('mediaSession' in window.navigator)) {
  //     window.navigator.mediaSession = {
  //       setPositionState: () => {},
  //       setHandlerAction: () => {},
  //       metadata: {},
  //       _mocked: true
  //     };

  //     // Object.defineProperty(window.navigator, 'mediaSession', {
  //     //   configurable: true,
  //     //   enumerable: true,
  //     //   value: mockMediaSession,
  //     //   writable: true
  //     // });

  //     window.MediaMetadata = class MediaMetadata {
  //       constructor(data) {
  //         return data;
  //       }
  //     };
  //   }
  // },
  afterEach() {
    this.player.dispose();
    if (this.clock) {
      this.clock.restore();
    }
  }
  // ,
  // after() {
  //   if (window.navigator.mediaSession._mocked) {
  //     delete window.navigator.mediaSession;
  //     delete window.MediaMetadata;
  //   }
  // }
});

// const testOrSkip = 'mediasession' in window.navigator ? 'test' : 'skip';

QUnit.test('mediasession data is populated from getMedia', function(assert) {
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

QUnit.test('mediasession data is populated from playlist', function(assert) {
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

QUnit.test('mediasession data set', function(assert) {
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

QUnit.test('mediasession can be customised before being set', function(assert) {
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

QUnit.test('mediasession artwork', function(assert) {
  assert.expect(4);

  this.clock = sinon.useFakeTimers();
  this.player = TestHelpers.makePlayer({
    mediaSession: true,
    poster: 'https://example.com/poster'
  });

  this.player.getMedia = () => {
    return {
      artwork: [{
        src: 'https://example.com/getmedia'
      }]
    }
  };

  this.player.playlist = () => {
    return [{
      artwork: [{
        src: 'https://example.com/playlist'
      }]
    }]
  };
  this.player.playlist.currentItem = () => 0;


  this.player.one('updatemediasession', (e, metadata) => {
    assert.equal(metadata.artwork[0].src, 'https://example.com/getmedia', 'set with loadMedia data');
  });
  this.player.trigger('playing');
  this.clock.tick(100);

  this.player.getMedia = () => { return {}; };
  this.player.usingPlugin = () => true;
  
  this.player.one('updatemediasession', (e, metadata) => {
    assert.equal(metadata.artwork[0].src, 'https://example.com/playlist', 'set with playlist data');
  });
  this.player.trigger('playing');
  this.clock.tick(100);

  this.player.usingPlugin = () => false;
  
  this.player.one('updatemediasession', (e, metadata) => {
    assert.equal(metadata.artwork[0].src, 'https://example.com/poster', 'set with poster data');
  });
  this.player.trigger('playing');  
  this.clock.tick(100);

  this.player.poster(null);
  
  this.player.one('updatemediasession', (e, metadata) => {
    assert.equal(metadata.artwork, undefined, 'omitted with no data');
  });
  this.player.trigger('playing');

});

QUnit.test('action handlers set up', function(assert) {
  const spy = sinon.spy(window.navigator.mediaSession, 'setActionHandler');

  this.player = TestHelpers.makePlayer({
    mediaSession: true
  });

  assert.true(spy.calledWith('play'), 'play handler set');
  assert.false(spy.calledWith('previoustrack'), 'playlist handler not set');

  spy.restore();
});

QUnit.test('playlist action handlers set up', function(assert) {
  const spy = sinon.spy(window.navigator.mediaSession, 'setActionHandler');

  this.clock = sinon.useFakeTimers();
  this.player = TestHelpers.makePlayer({
    mediaSession: true
  });

  this.player.trigger('pluginsetup:playlist');

  this.clock.tick(10);

  assert.true(spy.calledWith('play'), 'play handler set');
  assert.true(spy.calledWith('previoustrack'), 'playlist handler set');

  spy.restore();
  this.clock.restore();
});

QUnit.test('allows for action handlers that are not settable', function(assert) {
  sinon.stub(window.navigator.mediaSession, 'setActionHandler').throws();

  this.clock = sinon.useFakeTimers();
  this.player = TestHelpers.makePlayer({
    mediaSession: true
  });
  
  sinon.stub(this.player.log, 'debug');

  this.player.trigger('pluginsetup:playlist');

  this.clock.tick(10);

  assert.true(this.player.log.debug.calledWith('Couldn\'t register playlist media session actions.'));

  window.navigator.mediaSession.setActionHandler.restore();
  this.player.log.debug.restore();
  this.clock.restore();
});
