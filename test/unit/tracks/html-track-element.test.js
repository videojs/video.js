import HTMLTrackElement from '../../../src/js/tracks/html-track-element.js';
import TextTrack from '../../../src/js/tracks/text-track.js';
import window from 'global/window';

let noop = Function.prototype;
let defaultTech = {
  textTracks: noop,
  on: noop,
  off: noop,
  currentTime: noop
};

q.module('HTML Track Element');

test('html track element requires a tech', function() {
  window.throws(
    function() {
      new HTMLTrackElement();
    },
    new Error('A tech was not provided.'),
    'a tech is required for html track element'
  );
});

test('can create a html track element with various properties', function() {
  let kind = 'chapters',
      label = 'English',
      language = 'en',
      src = 'http://www.example.com';

  let htmlTrackElement = new  HTMLTrackElement({
    kind,
    label,
    language,
    src,
    tech: defaultTech
  });

  equal(htmlTrackElement.default, undefined, 'we have a default');
  equal(htmlTrackElement.kind, kind, 'we have a kind');
  equal(htmlTrackElement.label, label, 'we have a label');
  equal(htmlTrackElement.readyState, 0, 'we have a readyState');
  equal(htmlTrackElement.src, src, 'we have a src');
  equal(htmlTrackElement.srclang, language, 'we have a srclang');
  equal(htmlTrackElement.track.cues, null, 'we have a track');
});

test('defaults when items not provided', function() {
  let htmlTrackElement = new  HTMLTrackElement({
    tech: defaultTech
  });

  equal(htmlTrackElement.default, undefined, 'we have a default');
  equal(htmlTrackElement.kind, 'subtitles', 'we have a kind');
  equal(htmlTrackElement.label, '', 'we have a label');
  equal(htmlTrackElement.readyState, 0, 'we have a readyState');
  equal(htmlTrackElement.src, undefined, 'we have a src');
  equal(htmlTrackElement.srclang, '', 'we have a srclang');
  equal(htmlTrackElement.track.cues.length, 0, 'we have a track');
});

test('fires loadeddata when track cues become populated', function() {
  let changes = 0,
      loadHandler;

  loadHandler = function() {
    changes++;
  };

  let htmlTrackElement = new HTMLTrackElement({
    tech: noop
  });

  htmlTrackElement.addEventListener('load', loadHandler);

  // trigger loaded cues event
  htmlTrackElement.track.trigger('loadeddata');

  equal(changes, 1, 'a loadeddata event trigger addEventListener');
  equal(htmlTrackElement.readyState, 2, 'readyState is loaded');
});
