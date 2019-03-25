/* eslint-env qunit */
import AudioTrackList from '../../../src/js/tracks/audio-track-list.js';
import AudioTrack from '../../../src/js/tracks/audio-track.js';
import EventTarget from '../../../src/js/event-target.js';

QUnit.module('Audio Track List');

QUnit.test('trigger "change" when "enabledchange" is fired on a track', function(assert) {
  const track = new EventTarget();

  track.loaded_ = true;
  const audioTrackList = new AudioTrackList([track]);
  let changes = 0;
  const changeHandler = function() {
    changes++;
  };

  audioTrackList.on('change', changeHandler);
  track.trigger('enabledchange');
  assert.equal(changes, 1, 'one change events for trigger');

  audioTrackList.off('change', changeHandler);
  audioTrackList.onchange = changeHandler;

  track.trigger('enabledchange');
  assert.equal(changes, 2, 'one change events for another trigger');

  audioTrackList.removeTrack(track);
  audioTrackList.off('change');
});

QUnit.test('only one track is ever enabled', function(assert) {
  const track = new AudioTrack({enabled: true});
  const track2 = new AudioTrack({enabled: true});
  const track3 = new AudioTrack({enabled: true});
  const track4 = new AudioTrack();
  const list = new AudioTrackList([track, track2]);

  assert.equal(track.enabled, false, 'track is disabled');
  assert.equal(track2.enabled, true, 'track2 is enabled');

  track.enabled = true;
  assert.equal(track.enabled, true, 'track is enabled');
  assert.equal(track2.enabled, false, 'track2 is disabled');

  list.addTrack(track3);
  assert.equal(track.enabled, false, 'track is disabled');
  assert.equal(track2.enabled, false, 'track2 is disabled');
  assert.equal(track3.enabled, true, 'track3 is enabled');

  track2.enabled = true;
  assert.equal(track.enabled, false, 'track is disabled');
  assert.equal(track2.enabled, true, 'track2 is enabled');
  assert.equal(track3.enabled, false, 'track3 is disabled');

  list.addTrack(track4);
  assert.equal(track.enabled, false, 'track is disabled');
  assert.equal(track2.enabled, true, 'track2 is enabled');
  assert.equal(track3.enabled, false, 'track3 is disabled');
  assert.equal(track4.enabled, false, 'track4 is disabled');

  list.removeTrack(track);
  list.removeTrack(track2);
  list.removeTrack(track3);
  list.removeTrack(track4);
});

QUnit.test('all tracks can be disabled', function(assert) {
  const track = new AudioTrack();
  const track2 = new AudioTrack();

  // we need audiotracklist here to verify that it does not
  // re-enable a track
  const list = new AudioTrackList([track, track2]);

  assert.equal(track.enabled, false, 'track is disabled');
  assert.equal(track2.enabled, false, 'track2 is disabled');

  track.enabled = true;
  assert.equal(track.enabled, true, 'track is enabled');
  assert.equal(track2.enabled, false, 'track2 is disabled');

  track.enabled = false;
  assert.equal(track.enabled, false, 'track is disabled');
  assert.equal(track2.enabled, false, 'track2 is disabled');

  list.removeTrack(track);
  list.removeTrack(track2);
});

QUnit.test('trigger a change event per enabled change', function(assert) {
  const track = new AudioTrack({enabled: true});
  const track2 = new AudioTrack({enabled: true});
  const track3 = new AudioTrack({enabled: true});
  const track4 = new AudioTrack();
  const list = new AudioTrackList([track, track2]);
  let change = 0;

  list.on('change', () => change++);
  track.enabled = true;
  assert.equal(change, 1, 'one change triggered');

  list.addTrack(track3);
  assert.equal(change, 2, 'another change triggered by adding an enabled track');

  track.enabled = true;
  assert.equal(change, 3, 'another change trigger by changing enabled');

  track.enabled = false;
  assert.equal(change, 4, 'another change trigger by changing enabled');

  list.addTrack(track4);
  assert.equal(change, 4, 'no change triggered by adding a disabled track');

  list.removeTrack(track);
  list.removeTrack(track2);
  list.removeTrack(track3);
  list.removeTrack(track4);
  list.off();
});
