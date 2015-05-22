import document from 'global/document';
import * as Dom from '../../../src/js/utils/dom.js';
import TestHelpers from '../test-helpers.js';

test('should return the element with the ID', function(){
  var el1 = document.createElement('div');
  var el2 = document.createElement('div');
  var fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(el1);
  fixture.appendChild(el2);

  el1.id = 'test_id1';
  el2.id = 'test_id2';

  ok(Dom.getEl('test_id1') === el1, 'found element for ID');
  ok(Dom.getEl('#test_id2') === el2, 'found element for CSS ID');
});

test('should create an element', function(){
  var div = Dom.createEl();
  var span = Dom.createEl('span', { 'data-test': 'asdf', innerHTML:'fdsa' });
  ok(div.nodeName === 'DIV');
  ok(span.nodeName === 'SPAN');
  ok(span['data-test'] === 'asdf');
  ok(span.innerHTML === 'fdsa');
});

test('should insert an element first in another', function(){
  var el1 = document.createElement('div');
  var el2 = document.createElement('div');
  var parent = document.createElement('div');

  Dom.insertElFirst(el1, parent);
  ok(parent.firstChild === el1, 'inserts first into empty parent');

  Dom.insertElFirst(el2, parent);
  ok(parent.firstChild === el2, 'inserts first into parent with child');
});

test('should get and remove data from an element', function(){
  var el = document.createElement('div');
  var data = Dom.getElData(el);

  ok(typeof data === 'object', 'data object created');

  // Add data
  var testData = { asdf: 'fdsa' };
  data.test = testData;
  ok(Dom.getElData(el).test === testData, 'data added');

  // Remove all data
  Dom.removeElData(el);

  ok(!Dom.hasElData(el), 'cached item emptied');
});

test('should add and remove a class name on an element', function(){
  var el = document.createElement('div');
  Dom.addElClass(el, 'test-class');
  ok(el.className === 'test-class', 'class added');
  Dom.addElClass(el, 'test-class');
  ok(el.className === 'test-class', 'same class not duplicated');
  Dom.addElClass(el, 'test-class2');
  ok(el.className === 'test-class test-class2', 'added second class');
  Dom.removeElClass(el, 'test-class');
  ok(el.className === 'test-class2', 'removed first class');
});

test('should read class names on an element', function(){
  var el = document.createElement('div');
  Dom.addElClass(el, 'test-class1');
  ok(Dom.hasElClass(el, 'test-class1') === true, 'class detected');
  ok(Dom.hasElClass(el, 'test-class') === false, 'substring correctly not detected');
});

test('should set element attributes from object', function(){
  var el, vid1Vals;

  el = document.createElement('div');
  el.id = 'el1';

  Dom.setElAttributes(el, { controls: true, 'data-test': 'asdf' });

  equal(el.getAttribute('id'), 'el1');
  equal(el.getAttribute('controls'), '');
  equal(el.getAttribute('data-test'), 'asdf');
});

test('should read tag attributes from elements, including HTML5 in all browsers', function(){
  var tags = '<video id="vid1" controls autoplay loop muted preload="none" src="http://google.com" poster="http://www2.videojs.com/img/video-js-html5-video-player.png" data-test="asdf" data-empty-string=""></video>';
  tags += '<video id="vid2">';
  // Not putting source and track inside video element because
  // oldIE needs the HTML5 shim to read tags inside HTML5 tags.
  // Still may not work in oldIE.
  tags += '<source id="source" src="http://google.com" type="video/mp4" media="fdsa" title="test" >';
  tags += '<track id="track" default src="http://google.com" kind="captions" srclang="en" label="testlabel" title="test" >';
  tags += '</video>';

  document.getElementById('qunit-fixture').innerHTML += tags;

  var vid1Vals = Dom.getElAttributes(document.getElementById('vid1'));
  var vid2Vals = Dom.getElAttributes(document.getElementById('vid2'));
  var sourceVals = Dom.getElAttributes(document.getElementById('source'));
  var trackVals = Dom.getElAttributes(document.getElementById('track'));

  // was using deepEqual, but ie8 would send all properties as attributes

  // vid1
  equal(vid1Vals['autoplay'], true);
  equal(vid1Vals['controls'], true);
  equal(vid1Vals['data-test'], 'asdf');
  equal(vid1Vals['data-empty-string'], '');
  equal(vid1Vals['id'], 'vid1');
  equal(vid1Vals['loop'], true);
  equal(vid1Vals['muted'], true);
  equal(vid1Vals['poster'], 'http://www2.videojs.com/img/video-js-html5-video-player.png');
  equal(vid1Vals['preload'], 'none');
  equal(vid1Vals['src'], 'http://google.com');

  // vid2
  equal(vid2Vals['id'], 'vid2');

  // sourceVals
  equal(sourceVals['title'], 'test');
  equal(sourceVals['media'], 'fdsa');
  equal(sourceVals['type'], 'video/mp4');
  equal(sourceVals['src'], 'http://google.com');
  equal(sourceVals['id'], 'source');

  // trackVals
  equal(trackVals['default'], true);
  equal(trackVals['id'], 'track');
  equal(trackVals['kind'], 'captions');
  equal(trackVals['label'], 'testlabel');
  equal(trackVals['src'], 'http://google.com');
  equal(trackVals['srclang'], 'en');
  equal(trackVals['title'], 'test');
});

test('Dom.findElPosition should find top and left position', function() {
  const d = document.createElement('div');
  let position = Dom.findElPosition(d);
  d.style.top = '10px';
  d.style.left = '20px';
  d.style.position = 'absolute';

  deepEqual(position, {left: 0, top: 0}, 'If element isn\'t in the DOM, we should get zeros');

  document.body.appendChild(d);
  position = Dom.findElPosition(d);
  deepEqual(position, {left: 20, top: 10}, 'The position was not correct');

  d.getBoundingClientRect = null;
  position = Dom.findElPosition(d);
  deepEqual(position, {left: 0, top: 0}, 'If there is no gBCR, we should get zeros');
});
