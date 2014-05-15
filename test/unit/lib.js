module('Lib');

test('should create an element', function(){
  var div = vjs.createEl();
  var span = vjs.createEl('span', { 'data-test': 'asdf', innerHTML:'fdsa' });
  ok(div.nodeName === 'DIV');
  ok(span.nodeName === 'SPAN');
  ok(span['data-test'] === 'asdf');
  ok(span.innerHTML === 'fdsa');
});

test('should make a string start with an uppercase letter', function(){
  var foo = vjs.capitalize('bar');
  ok(foo === 'Bar');
});

test('should loop through each property on an object', function(){
  var asdf = {
    a: 1,
    b: 2,
    'c': 3
  };

  // Add 3 to each value
  vjs.obj.each(asdf, function(key, value){
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

  var fdsa = vjs.obj.copy(asdf);

  deepEqual(asdf,fdsa);
});

test('should check if an object is plain', function(){
  var empty = {};
  ok(vjs.obj.isPlain(empty) === true, 'Empty object is plain');

  var node = document.createElement('div');
  ok(vjs.obj.isPlain(node) === false, 'DOM node is not plain');

  var fn = function(){};
  ok(vjs.obj.isPlain(fn) === false, 'Function is not plain');
});

test('should add context to a function', function(){
  var newContext = { test: 'obj'};
  var asdf = function(){
    ok(this === newContext);
  };
  var fdsa = vjs.bind(newContext, asdf);

  fdsa();
});

test('should add and remove a class name on an element', function(){
  var el = document.createElement('div');
  vjs.addClass(el, 'test-class');
  ok(el.className === 'test-class', 'class added');
  vjs.addClass(el, 'test-class');
  ok(el.className === 'test-class', 'same class not duplicated');
  vjs.addClass(el, 'test-class2');
  ok(el.className === 'test-class test-class2', 'added second class');
  vjs.removeClass(el, 'test-class');
  ok(el.className === 'test-class2', 'removed first class');
});

test('should get and remove data from an element', function(){
  var el = document.createElement('div');
  var data = vjs.getData(el);
  var id = el[vjs.expando];

  ok(typeof data === 'object', 'data object created');

  // Add data
  var testData = { asdf: 'fdsa' };
  data.test = testData;
  ok(vjs.getData(el).test === testData, 'data added');

  // Remove all data
  vjs.removeData(el);

  ok(!vjs.cache[id], 'cached item nulled');
  ok(el[vjs.expando] === null || el[vjs.expando] === undefined, 'element data id removed');
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

  var vid1Vals = vjs.getAttributeValues(document.getElementById('vid1'));
  var vid2Vals = vjs.getAttributeValues(document.getElementById('vid2'));
  var sourceVals = vjs.getAttributeValues(document.getElementById('source'));
  var trackVals = vjs.getAttributeValues(document.getElementById('track'));

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
  equal(Math.round(parseFloat(vjs.getComputedDimension(el, 'height'))), 1000, 'the computed height is equal');
  equal(Math.round(parseFloat(vjs.getComputedDimension(el, 'width'))), 123, 'the computed width is equal');
});

test('should insert an element first in another', function(){
  var el1 = document.createElement('div');
  var el2 = document.createElement('div');
  var parent = document.createElement('div');

  vjs.insertFirst(el1, parent);
  ok(parent.firstChild === el1, 'inserts first into empty parent');

  vjs.insertFirst(el2, parent);
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

  ok(vjs.el('test_id1') === el1, 'found element for ID');
  ok(vjs.el('#test_id2') === el2, 'found element for CSS ID');
});

test('should trim whitespace from a string', function(){
  ok(vjs.trim(' asdf asdf asdf   \t\n\r') === 'asdf asdf asdf');
});

test('should round a number', function(){
  ok(vjs.round(1.01) === 1);
  ok(vjs.round(1.5) === 2);
  ok(vjs.round(1.55, 2) === 1.55);
  ok(vjs.round(10.551, 2) === 10.55);
});

test('should format time as a string', function(){
  ok(vjs.formatTime(1) === '0:01');
  ok(vjs.formatTime(10) === '0:10');
  ok(vjs.formatTime(60) === '1:00');
  ok(vjs.formatTime(600) === '10:00');
  ok(vjs.formatTime(3600) === '1:00:00');
  ok(vjs.formatTime(36000) === '10:00:00');
  ok(vjs.formatTime(360000) === '100:00:00');

  // Using guide should provide extra leading zeros
  ok(vjs.formatTime(1,1) === '0:01');
  ok(vjs.formatTime(1,10) === '0:01');
  ok(vjs.formatTime(1,60) === '0:01');
  ok(vjs.formatTime(1,600) === '00:01');
  ok(vjs.formatTime(1,3600) === '0:00:01');
  // Don't do extra leading zeros for hours
  ok(vjs.formatTime(1,36000) === '0:00:01');
  ok(vjs.formatTime(1,360000) === '0:00:01');
});

test('should format invalid times as dashes', function(){
  equal(vjs.formatTime(Infinity, 90), '-:-');
  equal(vjs.formatTime(NaN), '-:-');
  // equal(vjs.formatTime(NaN, 216000), '-:--:--');
  equal(vjs.formatTime(10, Infinity), '0:00:10');
  equal(vjs.formatTime(90, NaN), '1:30');
});

test('should create a fake timerange', function(){
  var tr = vjs.createTimeRange(0, 10);
  ok(tr.start() === 0);
  ok(tr.end() === 10);
});

test('should get an absolute URL', function(){
  // Errors on compiled tests that don't use unit.html. Need a better solution.
  // ok(vjs.getAbsoluteURL('unit.html') === window.location.href);
  ok(vjs.getAbsoluteURL('http://asdf.com') === 'http://asdf.com');
  ok(vjs.getAbsoluteURL('https://asdf.com/index.html') === 'https://asdf.com/index.html');
});

test('should parse the details of a url correctly', function(){
  equal(vjs.parseUrl('#').protocol, window.location.protocol, 'parsed relative url protocol');
  equal(vjs.parseUrl('#').host, window.location.host, 'parsed relative url host');

  equal(vjs.parseUrl('http://example.com').protocol, 'http:', 'parsed example url protocol');
  equal(vjs.parseUrl('http://example.com').hostname, 'example.com', 'parsed example url hostname');

  equal(vjs.parseUrl('http://example.com:1234').port, '1234', 'parsed example url port');
});

test('vjs.findPosition should find top and left position', function() {
  var d = document.createElement('div'),
    position = vjs.findPosition(d);
  d.style.top = '10px';
  d.style.left = '20px';
  d.style.position = 'absolute';

  deepEqual(position, {left: 0, top: 0}, 'If element isn\'t in the DOM, we should get zeros');

  document.body.appendChild(d);
  position = vjs.findPosition(d);
  deepEqual(position, {left: 20, top: 10}, 'The position was not correct');

  d.getBoundingClientRect = null;
  position = vjs.findPosition(d);
  deepEqual(position, {left: 0, top: 0}, 'If there is no gBCR, we should get zeros');
});

// LOG TESTS
test('should confirm logging functions work', function() {
  var console = window['console'];
  var origLog = console.log;
  var origWarn = console.warn;
  var origError = console.error;

  // in ie8 console.log is apparently not a 'function' so sinon chokes on it
  // https://github.com/cjohansen/Sinon.JS/issues/386
  // instead we'll temporarily replace them with functions
  if (typeof origLog === 'object') {
    console.log = function(){};
    console.warn = function(){};
    console.error = function(){};
  }

  // stub the global log functions
  var log = sinon.stub(console, 'log');
  var error = sinon.stub(console, 'error');
  var warn = sinon.stub(console, 'warn');

  vjs.log('asdf', 'fdsa');
  ok(log.called, 'log was called');
  equal(log.firstCall.args[0], 'VIDEOJS:');
  equal(log.firstCall.args[1], 'asdf');
  equal(log.firstCall.args[2], 'fdsa');

  vjs.log.warn('asdf', 'fdsa');
  ok(warn.called, 'warn was called');
  equal(warn.firstCall.args[0], 'VIDEOJS:');
  equal(warn.firstCall.args[1], 'WARN:');
  equal(warn.firstCall.args[2], 'asdf');
  equal(warn.firstCall.args[3], 'fdsa');

  vjs.log.error('asdf', 'fdsa');
  ok(error.called, 'error was called');
  equal(error.firstCall.args[0], 'VIDEOJS:');
  equal(error.firstCall.args[1], 'ERROR:');
  equal(error.firstCall.args[2], 'asdf');
  equal(error.firstCall.args[3], 'fdsa');

  // tear down sinon
  log.restore();
  error.restore();
  warn.restore();

  // restore ie8
  if (typeof origLog === 'object') {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  }
});
