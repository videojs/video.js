import HTMLTrackElement from '../../../src/js/tracks/html-track-element.js';
import HTMLTrackElementList from '../../../src/js/tracks/html-track-element-list.js';
import TextTrack from '../../../src/js/tracks/text-track.js';

let noop = Function.prototype;
let defaultTech = {
  textTracks: noop,
  on: noop,
  off: noop,
  currentTime: noop
};

let track1 = new TextTrack({
  id: 1,
  tech: defaultTech
});
let track2 = new TextTrack({
  id: 2,
  tech: defaultTech
});

var genericHtmlTrackElements = [{
  kind: 'captions',
  tech: noop,
  track: track1
}, {
  kind: 'chapters',
  tech: noop,
  track: track2
}];

q.module('HTML Track Element List');

test('HTMLTrackElementList\'s length is set correctly', function() {
  let htmlTrackElementList = new HTMLTrackElementList(genericHtmlTrackElements);

  equal(htmlTrackElementList.length, genericHtmlTrackElements.length, `the length is ${genericHtmlTrackElements.length}`);
});

test('can get html track element by track', function() {
  let htmlTrackElementList = new HTMLTrackElementList(genericHtmlTrackElements);

  equal(htmlTrackElementList.getTrackElementByTrack_(track1).kind, 'captions', 'track1 has kind of captions');
  equal(htmlTrackElementList.getTrackElementByTrack_(track2).kind, 'chapters', 'track2 has kind of captions');
});

test('length is updated when new tracks are added or removed', function() {
  let htmlTrackElementList = new HTMLTrackElementList(genericHtmlTrackElements);

  htmlTrackElementList.addTrackElement_({tech: noop});
  equal(htmlTrackElementList.length, genericHtmlTrackElements.length + 1, `the length is ${genericHtmlTrackElements.length + 1}`);
  htmlTrackElementList.addTrackElement_({tech: noop});
  equal(htmlTrackElementList.length, genericHtmlTrackElements.length + 2, `the length is ${genericHtmlTrackElements.length + 2}`);

  htmlTrackElementList.removeTrackElement_(htmlTrackElementList.getTrackElementByTrack_(track1));
  equal(htmlTrackElementList.length, genericHtmlTrackElements.length + 1, `the length is ${genericHtmlTrackElements.length + 1}`);
  htmlTrackElementList.removeTrackElement_(htmlTrackElementList.getTrackElementByTrack_(track2));
  equal(htmlTrackElementList.length, genericHtmlTrackElements.length, `the length is ${genericHtmlTrackElements.length}`);
});
