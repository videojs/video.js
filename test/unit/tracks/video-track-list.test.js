import VideoTrackList from '../../../src/js/tracks/video-track-list.js';
import VideoTrack from '../../../src/js/tracks/video-track.js';
import EventTarget from '../../../src/js/event-target.js';

q.module('Video Track List');
test('trigger "change" event when "selectedchange" is fired on a track', function() {
  let track = new EventTarget();
  let videoTrackList = new VideoTrackList([track]);
  let changes = 0;
  let changeHandler = function() {
    changes++;
  };
  videoTrackList.on('change', changeHandler);
  track.trigger('selectedchange');

  videoTrackList.off('change', changeHandler);
  videoTrackList.onchange = changeHandler;

  track.trigger('selectedchange');
  equal(changes, 2, 'two change events should have fired');
});

test('trigger "change" event when a new VideoTrack is selected', function() {
  let track = new VideoTrack({
    tech: {
      on() {},
      videoTracks() { return []; }
    }
  });
  let videoTrackList = new VideoTrackList([track]);
  let changes = 0;
  let changeHandler = function() {
    changes++;
  };

  videoTrackList.on('change', changeHandler);
  track.selected = true;

  videoTrackList.off('change', changeHandler);
  videoTrackList.onchange = changeHandler;

  track.selected = false;
  track.selected = true;
  track.selected = true;

  equal(changes, 3, 'three change events should have fired');
});
