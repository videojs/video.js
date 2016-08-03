/* eslint-env qunit */
import HTMLTrackElement from '../../../src/js/tracks/html-track-element.js';
import window from 'global/window';

const defaultTech = {
  textTracks() {},
  on() {},
  off() {},
  currentTime() {}
};

QUnit.module('HTML Track Element');

QUnit.test('html track element requires a tech', function() {
  window.throws(
    function() {
      return new HTMLTrackElement();
    },
    new Error('A tech was not provided.'),
    'a tech is required for html track element'
  );
});

QUnit.test('can create a html track element with various properties', function() {
  const kind = 'chapters';
  const label = 'English';
  const language = 'en';
  const src = 'http://www.example.com';

  const htmlTrackElement = new HTMLTrackElement({
    kind,
    label,
    language,
    src,
    tech: defaultTech
  });

  QUnit.equal(typeof htmlTrackElement.default, 'undefined', 'we have a default');
  QUnit.equal(htmlTrackElement.kind, kind, 'we have a kind');
  QUnit.equal(htmlTrackElement.label, label, 'we have a label');
  QUnit.equal(htmlTrackElement.readyState, 0, 'we have a readyState');
  QUnit.equal(htmlTrackElement.src, src, 'we have a src');
  QUnit.equal(htmlTrackElement.srclang, language, 'we have a srclang');
  QUnit.equal(htmlTrackElement.track.cues, null, 'we have a track');
});

QUnit.test('defaults when items not provided', function() {
  const htmlTrackElement = new HTMLTrackElement({
    tech: defaultTech
  });

  QUnit.equal(typeof htmlTrackElement.default, 'undefined', 'we have a default');
  QUnit.equal(htmlTrackElement.kind, 'subtitles', 'we have a kind');
  QUnit.equal(htmlTrackElement.label, '', 'we have a label');
  QUnit.equal(htmlTrackElement.readyState, 0, 'we have a readyState');
  QUnit.equal(typeof htmlTrackElement.src, 'undefined', 'we have a src');
  QUnit.equal(htmlTrackElement.srclang, '', 'we have a srclang');
  QUnit.equal(htmlTrackElement.track.cues.length, 0, 'we have a track');
});

QUnit.test('fires loadeddata when track cues become populated', function() {
  let changes = 0;
  const loadHandler = function() {
    changes++;
  };
  const htmlTrackElement = new HTMLTrackElement({
    tech() {}
  });

  htmlTrackElement.addEventListener('load', loadHandler);

  // trigger loaded cues event
  htmlTrackElement.track.trigger('loadeddata');

  QUnit.equal(changes, 1, 'a loadeddata event trigger addEventListener');
  QUnit.equal(htmlTrackElement.readyState, 2, 'readyState is loaded');
});
