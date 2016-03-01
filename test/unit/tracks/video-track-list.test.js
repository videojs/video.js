import VideoTrackList from '../../../src/js/tracks/video-track-list.js';
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

/* Uncomment when videotrack is merged
test('trigger "change" event when a new VideoTrack is selected', function() {
  let track = new VideoTrack({
    tech: {
      on() {}
    }
  });
  let videoTrackList = new VideoTrackList([track]);
  let changes = 0;
  let changeHandler = function() {
    changes++;
  };

  videoTrackList.on('change', changeHandler);
  track.mode = true;

  videoTrackList.off('change', changeHandler);
  videoTrackList.onchange = changeHandler;

  track.mode = false;
  track.mode = true;

  equal(changes, 3, 'three change events should have fired');
});
*/
