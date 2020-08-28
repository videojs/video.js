/* eslint-env qunit */
import document from 'global/document';
import sinon from 'sinon';
import * as Dom from '../../../src/js/utils/dom.js';
import TestHelpers from '../test-helpers.js';

QUnit.module('dom');

QUnit.test('should create an element', function(assert) {
  const div = Dom.createEl();
  const span = Dom.createEl('span', {
    innerHTML: 'fdsa'
  }, {
    'data-test': 'asdf'
  });

  assert.strictEqual(div.nodeName, 'DIV');
  assert.strictEqual(span.nodeName, 'SPAN');
  assert.strictEqual(span.getAttribute('data-test'), 'asdf');
  assert.strictEqual(span.innerHTML, 'fdsa');
});

QUnit.test('should create an element, supporting textContent', function(assert) {
  const span = Dom.createEl('span', {textContent: 'howdy'});

  if (span.textContent) {
    assert.strictEqual(span.textContent, 'howdy', 'works in browsers that support textContent');
  } else {
    assert.strictEqual(span.innerText, 'howdy', 'works in browsers that DO NOT support textContent');
  }
});

QUnit.test('should create an element with content', function(assert) {
  const span = Dom.createEl('span');
  const div = Dom.createEl('div', undefined, undefined, span);

  assert.strictEqual(div.firstChild, span);
});

QUnit.test('should insert an element first in another', function(assert) {
  const el1 = document.createElement('div');
  const el2 = document.createElement('div');
  const parent = document.createElement('div');

  Dom.prependTo(el1, parent);
  assert.strictEqual(parent.firstChild, el1, 'inserts first into empty parent');

  Dom.prependTo(el2, parent);
  assert.strictEqual(parent.firstChild, el2, 'inserts first into parent with child');
});

QUnit.test('addClass()', function(assert) {
  const el = document.createElement('div');

  assert.expect(5);

  Dom.addClass(el, 'test-class');
  assert.strictEqual(el.className, 'test-class', 'adds a single class');

  Dom.addClass(el, 'test-class');
  assert.strictEqual(el.className, 'test-class', 'does not duplicate classes');

  assert.throws(function() {
    Dom.addClass(el, 'foo foo-bar');
  }, 'throws when attempting to add a class with whitespace');

  Dom.addClass(el, 'test2_className');
  assert.strictEqual(el.className, 'test-class test2_className', 'adds second class');

  Dom.addClass(el, 'FOO');
  assert.strictEqual(el.className, 'test-class test2_className FOO', 'adds third class');
});

QUnit.test('removeClass()', function(assert) {
  const el = document.createElement('div');

  el.className = 'test-class test2_className FOO bar';

  assert.expect(4);

  Dom.removeClass(el, 'test-class');
  assert.strictEqual(el.className, 'test2_className FOO bar', 'removes one class');

  assert.throws(function() {
    Dom.removeClass(el, 'test2_className bar');
  }, 'throws when attempting to remove a class with whitespace');

  Dom.removeClass(el, 'test2_className');
  assert.strictEqual(el.className, 'FOO bar', 'removes another class');

  Dom.removeClass(el, 'FOO');
  assert.strictEqual(el.className, 'bar', 'removes another class');
});

QUnit.test('hasClass()', function(assert) {
  const el = document.createElement('div');

  el.className = 'test-class foo foo test2_className FOO bar';

  assert.strictEqual(Dom.hasClass(el, 'test-class'), true, 'class detected');
  assert.strictEqual(Dom.hasClass(el, 'foo'), true, 'class detected');
  assert.strictEqual(Dom.hasClass(el, 'test2_className'), true, 'class detected');
  assert.strictEqual(Dom.hasClass(el, 'FOO'), true, 'class detected');
  assert.strictEqual(Dom.hasClass(el, 'bar'), true, 'class detected');
  assert.strictEqual(
    Dom.hasClass(el, 'test2'),
    false,
    'valid substring - but not a class - correctly not detected'
  );
  assert.strictEqual(
    Dom.hasClass(el, 'className'),
    false,
    'valid substring - but not a class - correctly not detected'
  );

  assert.throws(function() {
    Dom.hasClass(el, 'FOO bar');
  }, 'throws when attempting to detect a class with whitespace');
});

QUnit.test('toggleClass()', function(assert) {
  const el = Dom.createEl('div', {className: 'foo bar'});

  const predicateToggles = [
    {
      toggle: 'foo',
      predicate: true,
      className: 'foo bar',
      message: 'if predicate `true` matches state of the element, do nothing'
    },
    {
      toggle: 'baz',
      predicate: false,
      className: 'foo bar',
      message: 'if predicate `false` matches state of the element, do nothing'
    },
    {
      toggle: 'baz',
      predicate: true,
      className: 'foo bar baz',
      message: 'if predicate `true` differs from state of the element, add the class'
    },
    {
      toggle: 'foo',
      predicate: false,
      className: 'bar baz',
      message: 'if predicate `false` differs from state of the element, remove the class'
    },
    {
      toggle: 'bar',
      predicate: () => true,
      className: 'bar baz',
      message: 'if a predicate function returns `true`, ' +
               'matching the state of the element, do nothing'
    },
    {
      toggle: 'foo',
      predicate: () => false,
      className: 'bar baz',
      message: 'if a predicate function returns `false`, matching ' +
               'the state of the element, do nothing'
    },
    {
      toggle: 'foo',
      predicate: () => true,
      className: 'bar baz foo',
      message: 'if a predicate function returns `true`, ' +
               'differing from state of the element, add the class'
    },
    {
      toggle: 'foo',
      predicate: () => false,
      className: 'bar baz',
      message: 'if a predicate function returns `false`, differing ' +
               'from state of the element, remove the class'
    },
    {
      toggle: 'foo',
      predicate: Function.prototype,
      className: 'bar baz foo',
      message: 'if a predicate function returns `undefined` and ' +
               'the element does not have the class, add the class'
    },
    {
      toggle: 'bar',
      predicate: Function.prototype,
      className: 'baz foo',
      message: 'if a predicate function returns `undefined` and the ' +
               'element has the class, remove the class'
    },
    {
      toggle: 'bar',
      predicate: () => [],
      className: 'baz foo bar',
      message: 'if a predicate function returns a defined non-boolean ' +
               'value and the element does not have the class, add the class'
    },
    {
      toggle: 'baz',
      predicate: () => 'this is incorrect',
      className: 'foo bar',
      message: 'if a predicate function returns a defined non-boolean value ' +
               'and the element has the class, remove the class'
    }
  ];

  assert.expect(3 + predicateToggles.length);

  Dom.toggleClass(el, 'bar');
  assert.strictEqual(el.className, 'foo', 'toggles a class off, if present');

  Dom.toggleClass(el, 'bar');
  assert.strictEqual(el.className, 'foo bar', 'toggles a class on, if absent');

  assert.throws(function() {
    Dom.toggleClass(el, 'foo bar');
  }, 'throws when attempting to toggle a class with whitespace');

  predicateToggles.forEach(x => {
    Dom.toggleClass(el, x.toggle, x.predicate);
    assert.strictEqual(el.className, x.className, x.message);
  });
});

QUnit.test('should set element attributes from object', function(assert) {
  const el = document.createElement('div');

  el.id = 'el1';
  Dom.setAttributes(el, {'controls': true, 'data-test': 'asdf'});

  assert.equal(el.getAttribute('id'), 'el1');
  assert.equal(el.getAttribute('controls'), '');
  assert.equal(el.getAttribute('data-test'), 'asdf');
});

QUnit.test('should read tag attributes from elements, including HTML5 in all browsers', function(assert) {
  // Creating the source/track tags outside of the video tag prevents log errors
  const tags = `
  <video id="vid1" controls autoplay loop muted preload="none" src="http://google.com" poster="http://www2.videojs.com/img/video-js-html5-video-player.png" data-test="asdf" data-empty-string="">
    <source id="source" src="http://google.com" type="video/mp4" media="fdsa" title="test" >
  </video>
  <track id="track" default src="http://google.com" kind="captions" srclang="en" label="testlabel" title="test" >
  `;

  const fixture = document.getElementById('qunit-fixture');

  // Have to use innerHTML to append for IE8. AppendChild doesn't work.
  // Also it must be added to the page body, not just in memory.
  fixture.innerHTML += tags;

  const vid1Vals = Dom.getAttributes(fixture.getElementsByTagName('video')[0]);
  const sourceVals = Dom.getAttributes(fixture.getElementsByTagName('source')[0]);
  const trackVals = Dom.getAttributes(fixture.getElementsByTagName('track')[0]);

  // vid1
  // was using deepEqual, but ie8 would send all properties as attributes
  assert.equal(vid1Vals.autoplay, true);
  assert.equal(vid1Vals.controls, true);
  assert.equal(vid1Vals['data-test'], 'asdf');
  assert.equal(vid1Vals['data-empty-string'], '');
  assert.equal(vid1Vals.id, 'vid1');
  assert.equal(vid1Vals.loop, true);
  assert.equal(vid1Vals.muted, true);
  assert.equal(vid1Vals.poster, 'http://www2.videojs.com/img/video-js-html5-video-player.png');
  assert.equal(vid1Vals.preload, 'none');
  assert.equal(vid1Vals.src, 'http://google.com');

  // sourceVals
  assert.equal(sourceVals.title, 'test');
  assert.equal(sourceVals.media, 'fdsa');
  assert.equal(sourceVals.type, 'video/mp4');
  assert.equal(sourceVals.src, 'http://google.com');
  assert.equal(sourceVals.id, 'source');

  // trackVals
  assert.equal(trackVals.default, true);
  assert.equal(trackVals.id, 'track');
  assert.equal(trackVals.kind, 'captions');
  assert.equal(trackVals.label, 'testlabel');
  assert.equal(trackVals.src, 'http://google.com');
  assert.equal(trackVals.srclang, 'en');
  assert.equal(trackVals.title, 'test');
});

QUnit.test('Dom.findPosition should find top and left position', function(assert) {
  const d = document.createElement('div');
  let position = Dom.findPosition(d);

  d.style.width = '100px';
  d.style.height = '50px';
  d.style.top = '10px';
  d.style.left = '20px';
  d.style.position = 'absolute';

  assert.deepEqual(
    position,
    {left: 0, top: 0, width: 0, height: 0},
    'If element isn\'t in the DOM, we should get zeros'
  );

  document.body.appendChild(d);
  position = Dom.findPosition(d);
  assert.deepEqual(position.left, 20, 'The position left was not correct');
  assert.deepEqual(position.top, 10, 'The position top was not correct');
  assert.deepEqual(position.width, 100, 'The dimension width was not correct');
  assert.deepEqual(position.height, 50, 'The dimension height was not correct');

  d.style.display = 'none';
  position = Dom.findPosition(d);
  assert.deepEqual(
    position,
    {left: 0, top: 0, width: 0, height: 0},
    'If there is no offsetParent, we should get zeros'
  );
});

QUnit.test('Dom.isEl', function(assert) {
  assert.expect(7);
  assert.notOk(Dom.isEl(), 'undefined is not an element');
  assert.notOk(Dom.isEl(true), 'booleans are not elements');
  assert.notOk(Dom.isEl({}), 'objects are not elements');
  assert.notOk(Dom.isEl([]), 'arrays are not elements');
  assert.notOk(Dom.isEl('<h1></h1>'), 'strings are not elements');
  assert.ok(Dom.isEl(document.createElement('div')), 'elements are elements');
  assert.ok(Dom.isEl({nodeType: 1}), 'duck typing is imperfect');
});

QUnit.test('Dom.isTextNode', function(assert) {
  assert.expect(7);
  assert.notOk(Dom.isTextNode(), 'undefined is not a text node');
  assert.notOk(Dom.isTextNode(true), 'booleans are not text nodes');
  assert.notOk(Dom.isTextNode({}), 'objects are not text nodes');
  assert.notOk(Dom.isTextNode([]), 'arrays are not text nodes');
  assert.notOk(Dom.isTextNode('hola mundo'), 'strings are not text nodes');
  assert.ok(
    Dom.isTextNode(document.createTextNode('hello, world!')),
    'text nodes are text nodes'
  );
  assert.ok(Dom.isTextNode({nodeType: 3}), 'duck typing is imperfect');
});

QUnit.test('Dom.emptyEl', function(assert) {
  const el = Dom.createEl();

  el.appendChild(Dom.createEl('span'));
  el.appendChild(Dom.createEl('span'));
  el.appendChild(document.createTextNode('hola mundo'));
  el.appendChild(Dom.createEl('span'));

  Dom.emptyEl(el);

  assert.expect(1);
  assert.notOk(el.firstChild, 'the element was emptied');
});

QUnit.test('Dom.normalizeContent: strings and elements/nodes', function(assert) {
  assert.expect(8);

  const str = Dom.normalizeContent('hello');

  assert.strictEqual(str[0].data, 'hello', 'single string becomes a text node');

  const elem = Dom.normalizeContent(Dom.createEl());

  assert.ok(Dom.isEl(elem[0]), 'an element is passed through');

  const node = Dom.normalizeContent(document.createTextNode('goodbye'));

  assert.strictEqual(node[0].data, 'goodbye', 'a text node is passed through');

  assert.strictEqual(Dom.normalizeContent(null).length, 0, 'falsy values are ignored');
  assert.strictEqual(Dom.normalizeContent(false).length, 0, 'falsy values are ignored');
  assert.strictEqual(Dom.normalizeContent().length, 0, 'falsy values are ignored');
  assert.strictEqual(Dom.normalizeContent(123).length, 0, 'numbers are ignored');
  assert.strictEqual(Dom.normalizeContent({}).length, 0, 'objects are ignored');
});

QUnit.test('Dom.normalizeContent: functions returning strings and elements/nodes', function(assert) {
  assert.expect(9);

  const str = Dom.normalizeContent(() => 'hello');

  assert.strictEqual(
    str[0].data,
    'hello',
    'a function can return a string, which becomes a text node'
  );

  const elem = Dom.normalizeContent(() => Dom.createEl());

  assert.ok(Dom.isEl(elem[0]), 'a function can return an element');

  const node = Dom.normalizeContent(() => document.createTextNode('goodbye'));

  assert.strictEqual(node[0].data, 'goodbye', 'a function can return a text node');

  assert.strictEqual(
    Dom.normalizeContent(() => null).length,
    0,
    'a function CANNOT return falsy values'
  );
  assert.strictEqual(
    Dom.normalizeContent(() => false).length,
    0,
    'a function CANNOT return falsy values'
  );
  assert.strictEqual(
    Dom.normalizeContent(() => undefined).length,
    0,
    'a function CANNOT return falsy values'
  );
  assert.strictEqual(
    Dom.normalizeContent(() => 123).length,
    0,
    'a function CANNOT return numbers'
  );
  assert.strictEqual(
    Dom.normalizeContent(() => {}).length,
    0,
    'a function CANNOT return objects'
  );
  assert.strictEqual(
    Dom.normalizeContent(() => (() => null)).length,
    0,
    'a function CANNOT return a function'
  );
});

QUnit.test('Dom.normalizeContent: arrays of strings and objects', function(assert) {
  assert.expect(7);

  const source = [
    'hello',
    {},
    Dom.createEl(),
    ['oops'],
    null,
    document.createTextNode('goodbye'),
    () => 'it works'
  ];
  const result = Dom.normalizeContent(source);

  assert.strictEqual(
    result[0].data,
    'hello',
    'an array can include a string normalized to a text node'
  );
  assert.ok(Dom.isEl(result[1]), 'an array can include an element');
  assert.strictEqual(result[2].data, 'goodbye', 'an array can include a text node');
  assert.strictEqual(
    result[3].data,
    'it works',
    'an array can include a function, which is invoked'
  );
  assert.strictEqual(result.indexOf(source[1]), -1, 'an array CANNOT include an object');
  assert.strictEqual(result.indexOf(source[3]), -1, 'an array CANNOT include an array');
  assert.strictEqual(
    result.indexOf(source[4]),
    -1,
    'an array CANNOT include falsy values'
  );
});

QUnit.test('Dom.normalizeContent: functions returning arrays', function(assert) {
  assert.expect(3);

  const arr = [];
  const result = Dom.normalizeContent(() => ['hello', Function.prototype, arr]);

  assert.strictEqual(result[0].data, 'hello', 'a function can return an array');
  assert.strictEqual(
    result.indexOf(Function.prototype),
    -1,
    'a function can return an array, but it CANNOT include a function'
  );
  assert.strictEqual(
    result.indexOf(arr),
    -1,
    'a function can return an array, but it CANNOT include an array'
  );
});

QUnit.test('Dom.insertContent', function(assert) {
  const p = Dom.createEl('p');
  const text = document.createTextNode('hello');
  const el = Dom.insertContent(Dom.createEl(), [p, text]);

  assert.expect(2);
  assert.strictEqual(el.firstChild, p, 'the paragraph was inserted first');
  assert.strictEqual(el.firstChild.nextSibling, text, 'the text node was inserted last');
});

QUnit.test('Dom.appendContent', function(assert) {
  const p1 = Dom.createEl('p');
  const p2 = Dom.createEl('p');
  const el = Dom.insertContent(Dom.createEl(), [p1]);

  Dom.appendContent(el, p2);

  assert.expect(2);
  assert.strictEqual(el.firstChild, p1, 'the first paragraph is the first child');
  assert.strictEqual(el.firstChild.nextSibling, p2, 'the second paragraph was appended');
});

QUnit.test('$() and $$()', function(assert) {
  const fixture = document.getElementById('qunit-fixture');
  const container = document.createElement('div');
  const children = [
    document.createElement('div'),
    document.createElement('div'),
    document.createElement('div')
  ];

  children.forEach(child => container.appendChild(child));
  fixture.appendChild(container);

  const totalDivCount = document.getElementsByTagName('div').length;

  assert.expect(12);

  assert.strictEqual(
    Dom.$('#qunit-fixture'),
    fixture,
    'can find an element in the document context'
  );
  assert.strictEqual(
    Dom.$$('div').length,
    totalDivCount,
    'finds elements in the document context'
  );

  assert.strictEqual(
    Dom.$('div', container),
    children[0],
    'can find an element in a DOM element context'
  );
  assert.strictEqual(
    Dom.$$('div', container).length,
    children.length,
    'finds elements in a DOM element context'
  );

  assert.strictEqual(
    Dom.$('#qunit-fixture', document.querySelector('unknown')),
    fixture,
    'falls back to document given a bad context element'
  );
  assert.strictEqual(
    Dom.$$('div', document.querySelector('unknown')).length,
    totalDivCount,
    'falls back to document given a bad context element'
  );

  assert.strictEqual(
    Dom.$('#qunit-fixture', 'body'),
    fixture,
    'can find an element in a selector context'
  );
  assert.strictEqual(
    Dom.$$('div', '#qunit-fixture').length,
    1 + children.length,
    'finds elements in a selector context'
  );

  assert.strictEqual(
    Dom.$('#qunit-fixture', 'unknown'),
    fixture,
    'falls back to document given a bad context selector'
  );
  assert.strictEqual(
    Dom.$$('div', 'unknown').length,
    totalDivCount,
    'falls back to document given a bad context selector'
  );

  assert.strictEqual(Dom.$('div', children[0]), null, 'returns null for missing elements');
  assert.strictEqual(
    Dom.$$('div', children[0]).length,
    0,
    'returns 0 for missing elements'
  );
});

QUnit.test('getBoundingClientRect() returns an object for elements that support it', function(assert) {
  const mockEl = {
    getBoundingClientRect: sinon.spy(() => {
      return {
        bottom: 3,
        height: 10,
        left: 4,
        right: 2,
        top: 1,
        width: 20
      };
    }),
    parentNode: true
  };

  const actual = Dom.getBoundingClientRect(mockEl);

  // The expected result is what is returned by the mock element.
  const expected = mockEl.getBoundingClientRect.firstCall.returnValue;

  assert.notStrictEqual(actual, expected, 'the object returned by the mock element was cloned and not returned directly');

  Object.keys(expected).forEach(k => {
    assert.strictEqual(actual[k], expected[k], `the "${k}" returned by the Dom util matches what was returned by the mock element`);
  });
});

QUnit.test('isSingleLeftClick() returns false for mousemove event', function(assert) {
  const mouseEvent = TestHelpers.createEvent('mousemove');

  mouseEvent.button = 0;
  mouseEvent.buttons = 0;

  assert.notOk(Dom.isSingleLeftClick(mouseEvent), 'a mousemove event is not a single left click');
});

QUnit.test('isSingleLeftClick() returns true for mouseup event', function(assert) {
  const mouseEvent = TestHelpers.createEvent('mouseup');

  mouseEvent.button = 0;
  mouseEvent.buttons = 0;

  assert.ok(Dom.isSingleLeftClick(mouseEvent), 'a mouseup event is a single left click');
});

QUnit.test('isSingleLeftClick() checks return values for mousedown event', function(assert) {
  const mouseEvent = TestHelpers.createEvent('mousedown');

  // Left mouse click
  mouseEvent.button = 0;
  mouseEvent.buttons = 0;

  assert.notOk(Dom.isSingleLeftClick(mouseEvent), 'a left mouse click on an older browser (Safari) is a single left click');

  // Left mouse click
  mouseEvent.button = 0;
  mouseEvent.buttons = 1;

  assert.ok(Dom.isSingleLeftClick(mouseEvent), 'a left mouse click on browsers that supporting buttons property is a single left click');

  // Right mouse click
  mouseEvent.button = 2;
  mouseEvent.buttons = 2;

  assert.notOk(Dom.isSingleLeftClick(mouseEvent), 'a right mouse click is not a single left click');

  // Touch event on some mobiles
  mouseEvent.button = 0;
  mouseEvent.buttons = undefined;

  assert.ok(Dom.isSingleLeftClick(mouseEvent), 'a touch event on mobiles is a single left click');

  // Chrome simulates mobile devices
  mouseEvent.button = undefined;
  mouseEvent.buttons = undefined;

  assert.ok(Dom.isSingleLeftClick(mouseEvent), 'a touch event on simulated mobiles is a single left click');
});
