import document from 'global/document';
import * as Dom from '../../../src/js/utils/dom.js';

test('should return the element with the ID', function(){
  var el1 = document.createElement('div');
  var el2 = document.createElement('div');
  var fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(el1);
  fixture.appendChild(el2);

  el1.id = 'test_id1';
  el2.id = 'test_id2';

  ok(Dom.el('test_id1') === el1, 'found element for ID');
  ok(Dom.el('#test_id2') === el2, 'found element for CSS ID');
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

  Dom.insertFirst(el1, parent);
  ok(parent.firstChild === el1, 'inserts first into empty parent');

  Dom.insertFirst(el2, parent);
  ok(parent.firstChild === el2, 'inserts first into parent with child');
});

test('should get and remove data from an element', function(){
  var el = document.createElement('div');
  var data = Dom.getData(el);
  var id = el[Dom.expando];

  ok(typeof data === 'object', 'data object created');

  // Add data
  var testData = { asdf: 'fdsa' };
  data.test = testData;
  ok(Dom.getData(el).test === testData, 'data added');

  // Remove all data
  Dom.removeData(el);

  ok(!Dom.cache[id], 'cached item nulled');
  ok(el[Dom.expando] === null || el[Dom.expando] === undefined, 'element data id removed');
});

test('should add and remove a class name on an element', function(){
  var el = document.createElement('div');
  Dom.addClass(el, 'test-class');
  ok(el.className === 'test-class', 'class added');
  Dom.addClass(el, 'test-class');
  ok(el.className === 'test-class', 'same class not duplicated');
  Dom.addClass(el, 'test-class2');
  ok(el.className === 'test-class test-class2', 'added second class');
  Dom.removeClass(el, 'test-class');
  ok(el.className === 'test-class2', 'removed first class');
});

test('should read class names on an element', function(){
  var el = document.createElement('div');
  Dom.addClass(el, 'test-class1');
  ok(Dom.hasClass(el, 'test-class1') === true, 'class detected');
  ok(Dom.hasClass(el, 'test-class') === false, 'substring correctly not detected');
});

test('should set element attributes from object', function(){
  var el, vid1Vals;

  el = document.createElement('div');
  el.id = 'el1';

  Dom.setElementAttributes(el, { controls: true, 'data-test': 'asdf' });

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

  var vid1Vals = Dom.getElementAttributes(document.getElementById('vid1'));
  var vid2Vals = Dom.getElementAttributes(document.getElementById('vid2'));
  var sourceVals = Dom.getElementAttributes(document.getElementById('source'));
  var trackVals = Dom.getElementAttributes(document.getElementById('track'));

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

test('should get the right style values for an element', function(){
  var el = document.createElement('div');
  var container = document.createElement('div');
  var fixture = document.getElementById('qunit-fixture');

  container.appendChild(el);
  fixture.appendChild(container);

  container.style.width = '1000px';
  container.style.height = '1000px';

  el.style.height = '100%';
  el.style.width = '123px';

  // integer px values may get translated int very-close floats in Chrome/OS X
  // so round the dimensions to ignore this
  equal(Math.round(parseFloat(Dom.getComputedDimension(el, 'height'))), 1000, 'the computed height is equal');
  equal(Math.round(parseFloat(Dom.getComputedDimension(el, 'width'))), 123, 'the computed width is equal');
});

test('Dom.findPosition should find top and left position', function() {
  const d = document.createElement('div');
  let position = Dom.findPosition(d);
  d.style.top = '10px';
  d.style.left = '20px';
  d.style.position = 'absolute';

  deepEqual(position, {left: 0, top: 0}, 'If element isn\'t in the DOM, we should get zeros');

  document.body.appendChild(d);
  position = Dom.findPosition(d);
  deepEqual(position, {left: 20, top: 10}, 'The position was not correct');

  d.getBoundingClientRect = null;
  position = Dom.findPosition(d);
  deepEqual(position, {left: 0, top: 0}, 'If there is no gBCR, we should get zeros');
});
