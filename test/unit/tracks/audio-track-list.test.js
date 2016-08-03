/* eslint-env qunit */
import AudioTrackList from '../../../src/js/tracks/audio-track-list.js';
import AudioTrack from '../../../src/js/tracks/audio-track.js';
import EventTarget from '../../../src/js/event-target.js';

QUnit.module('Audio Track List');

QUnit.test('trigger "change" when "enabledchange" is fired on a track', function() {
  const track = new EventTarget();

  track.loaded_ = true;
  const audioTrackList = new AudioTrackList([track]);
  let changes = 0;
  const changeHandler = function() {
    changes++;
  };

  audioTrackList.on('change', changeHandler);
  track.trigger('enabledchange');
  QUnit.equal(changes, 1, 'one change events for trigger');

  audioTrackList.off('change', changeHandler);
  audioTrackList.onchange = changeHandler;

  track.trigger('enabledchange');
  QUnit.equal(changes, 2, 'one change events for another trigger');
});

QUnit.test('only one track is ever enabled', function() {
  const track = new AudioTrack({enabled: true});
  const track2 = new AudioTrack({enabled: true});
  const track3 = new AudioTrack({enabled: true});
  const track4 = new AudioTrack();
  const list = new AudioTrackList([track, track2]);

  QUnit.equal(track.enabled, false, 'track is disabled');
  QUnit.equal(track2.enabled, true, 'track2 is enabled');

  track.enabled = true;
  QUnit.equal(track.enabled, true, 'track is enabled');
  QUnit.equal(track2.enabled, false, 'track2 is disabled');

  list.addTrack_(track3);
  QUnit.equal(track.enabled, false, 'track is disabled');
  QUnit.equal(track2.enabled, false, 'track2 is disabled');
  QUnit.equal(track3.enabled, true, 'track3 is enabled');

  track.enabled = true;
  QUnit.equal(track.enabled, true, 'track is disabled');
  QUnit.equal(track2.enabled, false, 'track2 is disabled');
  QUnit.equal(track3.enabled, false, 'track3 is disabled');

  list.addTrack_(track4);
  QUnit.equal(track.enabled, true, 'track is enabled');
  QUnit.equal(track2.enabled, false, 'track2 is disabled');
  QUnit.equal(track3.enabled, false, 'track3 is disabled');
  QUnit.equal(track4.enabled, false, 'track4 is disabled');

});

QUnit.test('all tracks can be disabled', function() {
  const track = new AudioTrack();
  const track2 = new AudioTrack();

  /* eslint-disable no-unused-vars */
  // we need audiotracklist here to verify that it does not
  // re-enable a track
  const list = new AudioTrackList([track, track2]);
  /* eslint-enable no-unused-vars */

  QUnit.equal(track.enabled, false, 'track is disabled');
  QUnit.equal(track2.enabled, false, 'track2 is disabled');

  track.enabled = true;
  QUnit.equal(track.enabled, true, 'track is enabled');
  QUnit.equal(track2.enabled, false, 'track2 is disabled');

  track.enabled = false;
  QUnit.equal(track.enabled, false, 'track is disabled');
  QUnit.equal(track2.enabled, false, 'track2 is disabled');
});

QUnit.test('trigger a change event per enabled change', function() {
  const track = new AudioTrack({enabled: true});
  const track2 = new AudioTrack({enabled: true});
  const track3 = new AudioTrack({enabled: true});
  const track4 = new AudioTrack();
  const list = new AudioTrackList([track, track2]);
  let change = 0;

  list.on('change', () => change++);
  track.enabled = true;
  QUnit.equal(change, 1, 'one change triggered');

  list.addTrack_(track3);
  QUnit.equal(change, 2, 'another change triggered by adding an enabled track');

  track.enabled = true;
  QUnit.equal(change, 3, 'another change trigger by changing enabled');

  track.enabled = false;
  QUnit.equal(change, 4, 'another change trigger by changing enabled');

  list.addTrack_(track4);
  QUnit.equal(change, 4, 'no change triggered by adding a disabled track');

});
