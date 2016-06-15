import TextTrackList from '../../../src/js/tracks/text-track-list.js';
import TextTrack from '../../../src/js/tracks/text-track.js';
import EventTarget from '../../../src/js/event-target.js';

q.module('Text Track List');
test('trigger "change" event when "modechange" is fired on a track', function() {
  let tt = new EventTarget();
  let ttl = new TextTrackList([tt]);
  let changes = 0;
  let changeHandler = function() {
    changes++;
  };

  ttl.on('change', changeHandler);
  tt.trigger('modechange');

  ttl.off('change', changeHandler);
  ttl.onchange = changeHandler;

  tt.trigger('modechange');
  equal(changes, 2, 'two change events should have fired');
});

test('trigger "change" event when mode changes on a TextTrack', function() {
  let tt = new TextTrack({
    tech: {
      on() {}
    }
  });
  let ttl = new TextTrackList([tt]);
  let changes = 0;
  let changeHandler = function() {
    changes++;
  };

  ttl.on('change', changeHandler);
  tt.mode = 'showing';

  ttl.off('change', changeHandler);
  ttl.onchange = changeHandler;

  tt.mode = 'hidden';
  tt.mode = 'disabled';

  equal(changes, 3, 'three change events should have fired');
});
