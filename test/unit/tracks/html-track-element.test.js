/* eslint-env qunit */
import HTMLTrackElement from '../../../src/js/tracks/html-track-element.js';
import TechFaker from '../tech/tech-faker';

QUnit.module('HTML Track Element', {
  beforeEach() {
    this.tech = new TechFaker();
  },
  afterEach() {
    this.tech.dispose();
    this.tech = null;
  }
});

QUnit.test('html track element requires a tech', function(assert) {
  assert.throws(
    function() {
      return new HTMLTrackElement();
    },
    new Error('A tech was not provided.'),
    'a tech is required for html track element'
  );
});

QUnit.test('can create a html track element with various properties', function(assert) {
  const kind = 'chapters';
  const label = 'English';
  const language = 'en';

  const htmlTrackElement = new HTMLTrackElement({
    kind,
    label,
    language,
    tech: this.tech
  });

  assert.equal(typeof htmlTrackElement.default, 'undefined', 'we have a default');
  assert.equal(htmlTrackElement.kind, kind, 'we have a kind');
  assert.equal(htmlTrackElement.label, label, 'we have a label');
  assert.equal(htmlTrackElement.readyState, 0, 'we have a readyState');
  assert.equal(htmlTrackElement.srclang, language, 'we have a srclang');

  htmlTrackElement.track.off();
});

QUnit.test('defaults when items not provided', function(assert) {
  const htmlTrackElement = new HTMLTrackElement({
    tech: this.tech
  });

  assert.equal(typeof htmlTrackElement.default, 'undefined', 'we have a default');
  assert.equal(htmlTrackElement.kind, 'subtitles', 'we have a kind');
  assert.equal(htmlTrackElement.label, '', 'we have a label');
  assert.equal(htmlTrackElement.readyState, 0, 'we have a readyState');
  assert.equal(typeof htmlTrackElement.src, 'undefined', 'we have a src');
  assert.equal(htmlTrackElement.srclang, '', 'we have a srclang');
  assert.equal(htmlTrackElement.track.cues.length, 0, 'we have a track');

  htmlTrackElement.track.off();
});

QUnit.test('fires loadeddata when track cues become populated', function(assert) {
  let changes = 0;
  const loadHandler = function() {
    changes++;
  };
  const htmlTrackElement = new HTMLTrackElement({
    tech: this.tech
  });

  htmlTrackElement.addEventListener('load', loadHandler);

  // trigger loaded cues event
  htmlTrackElement.track.trigger('loadeddata');

  assert.equal(changes, 1, 'a loadeddata event trigger addEventListener');
  assert.equal(htmlTrackElement.readyState, 2, 'readyState is loaded');

  htmlTrackElement.track.off();
  htmlTrackElement.off('load');
});
