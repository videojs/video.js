import * as Lib from '../../src/js/lib.js';
import window from 'global/window';
import document from 'global/document';

q.module('Lib', {
  'setup': function() {
    // Allow for stubbing createElement, should replace with sinon now
    this.createElement = document.createElement;
  },
  'teardown': function() {
    document.createElement = this.createElement;
  }
});

test('should create an element', function(){
  var div = Lib.createEl();
  var span = Lib.createEl('span', { 'data-test': 'asdf', innerHTML:'fdsa' });
  ok(div.nodeName === 'DIV');
  ok(span.nodeName === 'SPAN');
  ok(span['data-test'] === 'asdf');
  ok(span.innerHTML === 'fdsa');
});

test('should make a string start with an uppercase letter', function(){
  var foo = Lib.capitalize('bar');
  ok(foo === 'Bar');
});

test('should loop through each property on an object', function(){
  var asdf = {
    a: 1,
    b: 2,
    'c': 3
  };

  // Add 3 to each value
  Lib.obj.each(asdf, function(key, value){
    asdf[key] = value + 3;
  });

  deepEqual(asdf,{a:4,b:5,'c':6});
});

test('should copy an object', function(){
  var asdf = {
    a: 1,
    b: 2,
    'c': 3
  };

  var fdsa = Lib.obj.copy(asdf);

  deepEqual(asdf,fdsa);
});

test('should check if an object is an Array', function(){
  var arr = ['a', 'b', 'c'];
  ok(Lib.obj.isArray(arr) === true, 'Arr object is an Array');

  var obj = {};
  ok(Lib.obj.isArray(obj) === false, 'Obj is not an Array');
});

test('should check if an object is plain', function(){
  var empty = {};
  ok(Lib.obj.isPlain(empty) === true, 'Empty object is plain');

  var node = document.createElement('div');
  ok(Lib.obj.isPlain(node) === false, 'DOM node is not plain');

  var fn = function(){};
  ok(Lib.obj.isPlain(fn) === false, 'Function is not plain');
});

test('should add context to a function', function(){
  var newContext = { test: 'obj'};
  var asdf = function(){
    ok(this === newContext);
  };
  var fdsa = Lib.bind(newContext, asdf);

  fdsa();
});

test('should add and remove a class name on an element', function(){
  var el = document.createElement('div');
  Lib.addClass(el, 'test-class');
  ok(el.className === 'test-class', 'class added');
  Lib.addClass(el, 'test-class');
  ok(el.className === 'test-class', 'same class not duplicated');
  Lib.addClass(el, 'test-class2');
  ok(el.className === 'test-class test-class2', 'added second class');
  Lib.removeClass(el, 'test-class');
  ok(el.className === 'test-class2', 'removed first class');
});

test('should read class names on an element', function(){
  var el = document.createElement('div');
  Lib.addClass(el, 'test-class1');
  ok(Lib.hasClass(el, 'test-class1') === true, 'class detected');
  ok(Lib.hasClass(el, 'test-class') === false, 'substring correctly not detected');

});

test('should get and remove data from an element', function(){
  var el = document.createElement('div');
  var data = Lib.getData(el);
  var id = el[Lib.expando];

  ok(typeof data === 'object', 'data object created');

  // Add data
  var testData = { asdf: 'fdsa' };
  data.test = testData;
  ok(Lib.getData(el).test === testData, 'data added');

  // Remove all data
  Lib.removeData(el);

  ok(!Lib.cache[id], 'cached item nulled');
  ok(el[Lib.expando] === null || el[Lib.expando] === undefined, 'element data id removed');
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

  var vid1Vals = Lib.getElementAttributes(document.getElementById('vid1'));
  var vid2Vals = Lib.getElementAttributes(document.getElementById('vid2'));
  var sourceVals = Lib.getElementAttributes(document.getElementById('source'));
  var trackVals = Lib.getElementAttributes(document.getElementById('track'));

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

test('should set element attributes from object', function(){
  var el, vid1Vals;

  el = document.createElement('div');
  el.id = 'el1';

  Lib.setElementAttributes(el, { controls: true, 'data-test': 'asdf' });

  equal(el.getAttribute('id'), 'el1');
  equal(el.getAttribute('controls'), '');
  equal(el.getAttribute('data-test'), 'asdf');
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
  equal(Math.round(parseFloat(Lib.getComputedDimension(el, 'height'))), 1000, 'the computed height is equal');
  equal(Math.round(parseFloat(Lib.getComputedDimension(el, 'width'))), 123, 'the computed width is equal');
});

test('should insert an element first in another', function(){
  var el1 = document.createElement('div');
  var el2 = document.createElement('div');
  var parent = document.createElement('div');

  Lib.insertFirst(el1, parent);
  ok(parent.firstChild === el1, 'inserts first into empty parent');

  Lib.insertFirst(el2, parent);
  ok(parent.firstChild === el2, 'inserts first into parent with child');
});

test('should return the element with the ID', function(){
  var el1 = document.createElement('div');
  var el2 = document.createElement('div');
  var fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(el1);
  fixture.appendChild(el2);

  el1.id = 'test_id1';
  el2.id = 'test_id2';

  ok(Lib.el('test_id1') === el1, 'found element for ID');
  ok(Lib.el('#test_id2') === el2, 'found element for CSS ID');
});

test('should trim whitespace from a string', function(){
  ok(Lib.trim(' asdf asdf asdf   \t\n\r') === 'asdf asdf asdf');
});

test('should round a number', function(){
  ok(Lib.round(1.01) === 1);
  ok(Lib.round(1.5) === 2);
  ok(Lib.round(1.55, 2) === 1.55);
  ok(Lib.round(10.551, 2) === 10.55);
});

test('should format time as a string', function(){
  ok(Lib.formatTime(1) === '0:01');
  ok(Lib.formatTime(10) === '0:10');
  ok(Lib.formatTime(60) === '1:00');
  ok(Lib.formatTime(600) === '10:00');
  ok(Lib.formatTime(3600) === '1:00:00');
  ok(Lib.formatTime(36000) === '10:00:00');
  ok(Lib.formatTime(360000) === '100:00:00');

  // Using guide should provide extra leading zeros
  ok(Lib.formatTime(1,1) === '0:01');
  ok(Lib.formatTime(1,10) === '0:01');
  ok(Lib.formatTime(1,60) === '0:01');
  ok(Lib.formatTime(1,600) === '00:01');
  ok(Lib.formatTime(1,3600) === '0:00:01');
  // Don't do extra leading zeros for hours
  ok(Lib.formatTime(1,36000) === '0:00:01');
  ok(Lib.formatTime(1,360000) === '0:00:01');
});

test('should format invalid times as dashes', function(){
  equal(Lib.formatTime(Infinity, 90), '-:-');
  equal(Lib.formatTime(NaN), '-:-');
  // equal(Lib.formatTime(NaN, 216000), '-:--:--');
  equal(Lib.formatTime(10, Infinity), '0:00:10');
  equal(Lib.formatTime(90, NaN), '1:30');
});

test('should create a fake timerange', function(){
  var tr = Lib.createTimeRange(0, 10);
  ok(tr.start() === 0);
  ok(tr.end() === 10);
});

test('should get an absolute URL', function(){
  // Errors on compiled tests that don't use unit.html. Need a better solution.
  // ok(Lib.getAbsoluteURL('unit.html') === window.location.href);
  ok(Lib.getAbsoluteURL('http://asdf.com') === 'http://asdf.com');
  ok(Lib.getAbsoluteURL('https://asdf.com/index.html') === 'https://asdf.com/index.html');
});

test('should parse the details of a url correctly', function(){
  equal(Lib.parseUrl('#').protocol, window.location.protocol, 'parsed relative url protocol');
  equal(Lib.parseUrl('#').host, window.location.host, 'parsed relative url host');

  equal(Lib.parseUrl('http://example.com').protocol, 'http:', 'parsed example url protocol');
  equal(Lib.parseUrl('http://example.com').hostname, 'example.com', 'parsed example url hostname');

  equal(Lib.parseUrl('http://example.com:1234').port, '1234', 'parsed example url port');
});

test('should strip port from hosts using http or https', function() {
  var url;

  // attempts to create elements will return an anchor tag that
  // misbehaves like IE9
  document.createElement = function() {
    return {
      hostname: 'example.com',
      host: 'example.com:80',
      protocol: 'http:',
      port: '80',
      pathname: '/domain/relative/url',
      hash: ''
    };
  };

  url = Lib.parseUrl('/domain/relative/url');
  ok(!(/.*:80$/).test(url.host), ':80 is not appended to the host');
});


test('Lib.findPosition should find top and left position', function() {
  var d = document.createElement('div'),
    position = Lib.findPosition(d);
  d.style.top = '10px';
  d.style.left = '20px';
  d.style.position = 'absolute';

  deepEqual(position, {left: 0, top: 0}, 'If element isn\'t in the DOM, we should get zeros');

  document.body.appendChild(d);
  position = Lib.findPosition(d);
  deepEqual(position, {left: 20, top: 10}, 'The position was not correct');

  d.getBoundingClientRect = null;
  position = Lib.findPosition(d);
  deepEqual(position, {left: 0, top: 0}, 'If there is no gBCR, we should get zeros');
});

// LOG TESTS
test('should confirm logging functions work', function() {
  var console, log, error, warn, origConsole, origLog, origWarn, origError;

  origConsole = window['console'];
  // replace the native console for testing
  // in ie8 console.log is apparently not a 'function' so sinon chokes on it
  // https://github.com/cjohansen/Sinon.JS/issues/386
  // instead we'll temporarily replace them with no-op functions
  console = window['console'] = {
    log: function(){},
    warn: function(){},
    error: function(){}
  };

  // stub the global log functions
  log = sinon.stub(console, 'log');
  error = sinon.stub(console, 'error');
  warn = sinon.stub(console, 'warn');

  Lib.log('log1', 'log2');
  Lib.log.warn('warn1', 'warn2');
  Lib.log.error('error1', 'error2');

  ok(log.called, 'log was called');
  equal(log.firstCall.args[0], 'VIDEOJS:');
  equal(log.firstCall.args[1], 'log1');
  equal(log.firstCall.args[2], 'log2');

  ok(warn.called, 'warn was called');
  equal(warn.firstCall.args[0], 'VIDEOJS:');
  equal(warn.firstCall.args[1], 'WARN:');
  equal(warn.firstCall.args[2], 'warn1');
  equal(warn.firstCall.args[3], 'warn2');

  ok(error.called, 'error was called');
  equal(error.firstCall.args[0], 'VIDEOJS:');
  equal(error.firstCall.args[1], 'ERROR:');
  equal(error.firstCall.args[2], 'error1');
  equal(error.firstCall.args[3], 'error2');

  ok(Lib.log.history.length === 3, 'there should be three messages in the log history');

  // tear down sinon
  log.restore();
  error.restore();
  warn.restore();

  // restore the native console
  window['console'] = origConsole;
});

test('should loop through each element of an array', function() {
  expect(10);
  var a = [1, 2, 3];
  var sum = 0;
  var i = 0;
  var thisArg = {};

  Lib.arr.forEach(a, function(item, iterator, array) {
    sum += item;
    deepEqual(array, a, 'The array arg should match the original array');
    equal(i++, iterator, 'The indexes should match');
    equal(this, thisArg, 'The context should equal the thisArg');

    if (this !== thisArg) {
      ok(false, 'should allow setting the context');
    }
  }, thisArg);

  ok(sum, 6);
});

//getFileExtension tests
test('should get the file extension of the passed path', function() {
  equal(Lib.getFileExtension('/foo/bar/test.video.wgg'), 'wgg');
  equal(Lib.getFileExtension('test./video.mp4'), 'mp4');
  equal(Lib.getFileExtension('.bar/test.video.m4v'), 'm4v');
  equal(Lib.getFileExtension('foo/.bar/test.video.flv'), 'flv');
  equal(Lib.getFileExtension('foo/.bar/test.video.flv?foo=bar'), 'flv');
  equal(Lib.getFileExtension('http://www.test.com/video.mp4'), 'mp4');
  equal(Lib.getFileExtension('http://foo/bar/test.video.wgg'), 'wgg');

  //edge cases
  equal(Lib.getFileExtension('http://...'), '');
  equal(Lib.getFileExtension('foo/.bar/testvideo'), '');
  equal(Lib.getFileExtension(''), '');
  equal(Lib.getFileExtension(null), '');
  equal(Lib.getFileExtension(undefined), '');

  //with capital letters
  equal(Lib.getFileExtension('test.video.MP4'), 'mp4');
  equal(Lib.getFileExtension('test.video.FLV'), 'flv');
});
