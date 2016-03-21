import AudioTrackList from '../../../src/js/tracks/audio-track-list.js';
import AudioTrack from '../../../src/js/tracks/audio-track.js';
import EventTarget from '../../../src/js/event-target.js';

q.module('Audio Track List');

test('trigger "change" when "enabledchange" is fired on a track', function() {
  let track = new EventTarget();
  track.loaded_ = true;
  let audioTrackList = new AudioTrackList([track]);
  let changes = 0;
  let changeHandler = function() {
    changes++;
  };
  audioTrackList.on('change', changeHandler);
  track.trigger('enabledchange');
  equal(changes, 1, 'one change events for trigger');

  audioTrackList.off('change', changeHandler);
  audioTrackList.onchange = changeHandler;

  track.trigger('enabledchange');
  equal(changes, 2, 'one change events for another trigger');
});

test('only one track is ever enabled', function() {
  let track = new AudioTrack({enabled: true});
  let track2 = new AudioTrack({enabled: true});
  let track3 = new AudioTrack({enabled: true});
  let track4 = new AudioTrack();
  let list = new AudioTrackList([track, track2]);
  equal(track.enabled, false, 'track is disabled');
  equal(track2.enabled, true, 'track2 is enabled');

  track.enabled = true;
  equal(track.enabled, true, 'track is enabled');
  equal(track2.enabled, false, 'track2 is disabled');

  list.addTrack_(track3);
  equal(track.enabled, false, 'track is disabled');
  equal(track2.enabled, false, 'track2 is disabled');
  equal(track3.enabled, true, 'track3 is enabled');

  track.enabled = true;
  equal(track.enabled, true, 'track is disabled');
  equal(track2.enabled, false, 'track2 is disabled');
  equal(track3.enabled, false, 'track3 is disabled');

  list.addTrack_(track4);
  equal(track.enabled, true, 'track is enabled');
  equal(track2.enabled, false, 'track2 is disabled');
  equal(track3.enabled, false, 'track3 is disabled');
  equal(track4.enabled, false, 'track4 is disabled');

});

test('all tracks can be disabled', function() {
  let track = new AudioTrack();
  let track2 = new AudioTrack();
  let list = new AudioTrackList([track, track2]);
  equal(track.enabled, false, 'track is disabled');
  equal(track2.enabled, false, 'track2 is disabled');

  track.enabled = true;
  equal(track.enabled, true, 'track is enabled');
  equal(track2.enabled, false, 'track2 is disabled');

  track.enabled = false;
  equal(track.enabled, false, 'track is disabled');
  equal(track2.enabled, false, 'track2 is disabled');
});

test('trigger a change event per enabled change', function() {
  let track = new AudioTrack({enabled: true});
  let track2 = new AudioTrack({enabled: true});
  let track3 = new AudioTrack({enabled: true});
  let track4 = new AudioTrack();
  let list = new AudioTrackList([track, track2]);

  let change = 0;
  list.on('change', () => change++);
  track.enabled = true;
  equal(change, 1, 'one change triggered');

  list.addTrack_(track3);
  equal(change, 2, 'another change triggered by adding an enabled track');

  track.enabled = true;
  equal(change, 3, 'another change trigger by changing enabled');

  track.enabled = false;
  equal(change, 4, 'another change trigger by changing enabled');

  list.addTrack_(track4);
  equal(change, 4, 'no change triggered by adding a disabled track');

});
