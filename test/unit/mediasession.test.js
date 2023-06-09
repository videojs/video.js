/* eslint-env qunit */
import TestHelpers from './test-helpers';
import sinon from 'sinon';
import window from 'global/window';

QUnit.module('Player: MediaSession', {
  afterEach() {
    this.player.dispose();
    if (this.clock) {
      this.clock.restore();
    }
  }
});

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
    };
  };

  this.player.playlist = () => {
    return [{
      artwork: [{
        src: 'https://example.com/playlist'
      }]
    }];
  };
  this.player.playlist.currentItem = () => 0;

  this.player.one('updatemediasession', (e, metadata) => {
    assert.equal(metadata.artwork[0].src, 'https://example.com/getmedia', 'set with loadMedia data');
  });
  this.player.trigger('playing');
  this.clock.tick(100);

  this.player.getMedia = () => {
    return {};
  };
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
});

QUnit.test('allows for action handlers that are not settable', function(assert) {
  sinon.stub(window.navigator.mediaSession, 'setActionHandler').throws();

  this.clock = sinon.useFakeTimers();
  this.player = TestHelpers.makePlayer({
    mediaSession: true
  });

  sinon.stub(this.player.log, 'debug');

  this.player.trigger('playing');

  this.clock.tick(10);

  assert.true(this.player.log.debug.calledWith('Couldn\'t register playlist media session actions.'));

  window.navigator.mediaSession.setActionHandler.restore();
  this.player.log.debug.restore();
});

QUnit.test('playback and position state', function(assert) {
  sinon.stub(window.navigator.mediaSession, 'setPositionState');

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
  assert.strictEqual(window.navigator.mediaSession.playbackState, 'playing', 'playbackState set to playing');

  this.player.currentTime = () => 5;
  this.player.duration = () => 10;
  this.player.playbackRate = () => 1.5;

  this.player.trigger('timeupdate');
  assert.true(window.navigator.mediaSession.setPositionState.calledWith({
    duration: 10,
    playbackRate: 1.5,
    position: 5
  }), 'setPositionState called');

  this.player.trigger('paused');
  assert.strictEqual(window.navigator.mediaSession.playbackState, 'paused', 'playbackState set to paused');

  window.navigator.mediaSession.setPositionState.restore();
});

QUnit.test('action handlers', function(assert) {
  const actions = {};

  sinon.stub(window.navigator.mediaSession, 'setActionHandler').callsFake((action, handler) => {
    actions[action] = handler;
  });

  this.clock = sinon.useFakeTimers();
  this.player = sinon.spy(TestHelpers.makePlayer({
    mediaSession: true
  }));

  this.player.trigger('playing');
  this.clock.tick(10);

  sinon.resetHistory();

  actions.play();
  assert.true(this.player.play.called, 'play handler calls play on player');

  actions.pause();
  assert.true(this.player.pause.called, 'pause handler calls play on player');

  sinon.resetHistory();

  assert.false(this.player.pause.called, 'pause handler should have been reset');

  actions.stop();
  assert.true(this.player.pause.called, 'pause handler calls play on player');
  assert.true(this.player.currentTime.calledWith(0), 'pause handler calls play on player');

  this.player.duration(600);
  this.player.currentTime(0);

  actions.seekforward({skipOffset: 10});
  assert.true(this.player.currentTime.calledWith(10), 'seek handler sets current time to requested offset');
  actions.seekforward({});
  assert.true(this.player.currentTime.calledWith(10 + 15), 'seek handler sets current time to default offset');
  actions.seekbackward({skipOffset: 10});
  assert.true(this.player.currentTime.calledWith(10 + 15 - 10), 'seek handler sets current time to requested offset');
  actions.seekbackward({});
  assert.true(this.player.currentTime.calledWith(10 + 15 - 10 - 15), 'seek handler sets current time to default offset');
  actions.seekbackward({});
  assert.true(this.player.currentTime.calledWith(10 + 15 - 10 - 15), 'seek handler does not set current time below 0');

  actions.seekto({seekTime: 10});
  assert.true(this.player.currentTime.calledWith(10), 'seek handler sets current time');

  window.navigator.mediaSession.setActionHandler.restore();
});

QUnit.test('seek action handlers ignored in ad breaks', function(assert) {
  const actions = {};

  sinon.stub(window.navigator.mediaSession, 'setActionHandler').callsFake((action, handler) => {
    actions[action] = handler;
  });

  this.clock = sinon.useFakeTimers();
  this.player = sinon.spy(TestHelpers.makePlayer({
    mediaSession: true
  }));

  this.player.trigger('playing');

  this.clock.tick(10);

  // Mocked contrib-ads
  this.player.activePlugins_ = {
    ads: true
  };
  this.player.ads = {
    inAdBreak: () => true
  };

  actions.seekto({seekTime: 15});
  assert.false(this.player.currentTime.calledWith(15), 'seek handler does not sets current time in ad break');

  actions.seekbackward({skipOffset: 10});
  assert.false(this.player.currentTime.called, 'seekbackward handler does not sets current time in ad break');

  actions.seekforward({skipOffset: 10});
  assert.false(this.player.currentTime.called, 'seekforward handler does not sets current time in ad break');

  window.navigator.mediaSession.setActionHandler.restore();
});

QUnit.test('playlist action handlers are called', function(assert) {
  const actions = {};

  sinon.stub(window.navigator.mediaSession, 'setActionHandler').callsFake((action, handler) => {
    actions[action] = handler;
  });

  this.clock = sinon.useFakeTimers();
  this.player = sinon.spy(TestHelpers.makePlayer({
    mediaSession: true
  }));

  this.player.trigger('pluginsetup:playlist');

  this.clock.tick(10);

  // Mocked playlist
  const mockPlaylist = {
    next: sinon.spy(),
    previous: sinon.spy()
  };

  this.player.activePlugins_ = {
    playlist: true
  };
  this.player.playlist = mockPlaylist;

  actions.previoustrack();
  assert.true(mockPlaylist.previous.called, 'playlist previous handler called');

  actions.nexttrack();
  assert.true(mockPlaylist.next.called, 'playlist next handler called');

  window.navigator.mediaSession.setActionHandler.restore();
});
