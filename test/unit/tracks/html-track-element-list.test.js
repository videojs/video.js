/* eslint-env qunit */
import HTMLTrackElementList from '../../../src/js/tracks/html-track-element-list.js';
import TextTrack from '../../../src/js/tracks/text-track.js';

const defaultTech = {
  textTracks() {},
  on() {},
  off() {},
  currentTime() {}
};

const track1 = new TextTrack({
  id: 1,
  tech: defaultTech
});
const track2 = new TextTrack({
  id: 2,
  tech: defaultTech
});

const genericHtmlTrackElements = [{
  tech() {},
  kind: 'captions',
  track: track1
}, {
  tech() {},
  kind: 'chapters',
  track: track2
}];

QUnit.module('HTML Track Element List');

QUnit.test('HTMLTrackElementList\'s length is set correctly', function(assert) {
  const htmlTrackElementList = new HTMLTrackElementList(genericHtmlTrackElements);

  assert.equal(htmlTrackElementList.length,
               genericHtmlTrackElements.length,
               `the length is ${genericHtmlTrackElements.length}`);
});

QUnit.test('can get html track element by track', function(assert) {
  const htmlTrackElementList = new HTMLTrackElementList(genericHtmlTrackElements);

  assert.equal(htmlTrackElementList.getTrackElementByTrack_(track1).kind,
               'captions',
               'track1 has kind of captions');
  assert.equal(htmlTrackElementList.getTrackElementByTrack_(track2).kind,
               'chapters',
               'track2 has kind of captions');
});

QUnit.test('length is updated when new tracks are added or removed', function(assert) {
  const htmlTrackElementList = new HTMLTrackElementList(genericHtmlTrackElements);

  htmlTrackElementList.addTrackElement_({tech() {}});
  assert.equal(htmlTrackElementList.length,
               genericHtmlTrackElements.length + 1,
               `the length is ${genericHtmlTrackElements.length + 1}`);
  htmlTrackElementList.addTrackElement_({tech() {}});
  assert.equal(htmlTrackElementList.length,
               genericHtmlTrackElements.length + 2,
               `the length is ${genericHtmlTrackElements.length + 2}`);

  htmlTrackElementList.removeTrackElement_(
    htmlTrackElementList.getTrackElementByTrack_(track1));
  assert.equal(htmlTrackElementList.length,
               genericHtmlTrackElements.length + 1,
               `the length is ${genericHtmlTrackElements.length + 1}`);
  htmlTrackElementList.removeTrackElement_(
    htmlTrackElementList.getTrackElementByTrack_(track2));
  assert.equal(htmlTrackElementList.length,
               genericHtmlTrackElements.length,
               `the length is ${genericHtmlTrackElements.length}`);
});
