import AudioTrackList from '../../../src/js/tracks/audio-track-list.js';
import AudioTrack from '../../../src/js/tracks/audio-track.js';
import EventTarget from '../../../src/js/event-target.js';

q.module('Audio Track List');

test('trigger "change" event when "enabledchange" is fired on a track', function() {
  let track = new EventTarget();
  let audioTrackList = new AudioTrackList([track]);
  let changes = 0;
  let changeHandler = function() {
    changes++;
  };
  audioTrackList.on('change', changeHandler);
  track.trigger('enabledchange');

  audioTrackList.off('change', changeHandler);
  audioTrackList.onchange = changeHandler;

  track.trigger('enabledchange');
  equal(changes, 2, 'two change events should have fired');
});

test('trigger "change" event when a new AudioTrack is enabled', function() {
  let track = new AudioTrack({
    tech: {
      on() {},
      audioTracks() { return []; }
    }
  });
  let audioTrackList = new AudioTrackList([track]);
  let changes = 0;
  let changeHandler = function() {
    changes++;
  };
  audioTrackList.on('change', changeHandler);
  track.enabled = true;
  audioTrackList.off('change', changeHandler);
  audioTrackList.onchange = changeHandler;
  track.enabled = false;
  track.enabled = true;
  track.enabled = true;
  equal(changes, 3, 'three change events should have fired');
});
