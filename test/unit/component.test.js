/* eslint-env qunit */
import Component from '../../src/js/component.js';
import * as Dom from '../../src/js/utils/dom.js';
import * as Events from '../../src/js/utils/events.js';
import * as browser from '../../src/js/utils/browser.js';
import document from 'global/document';
import sinon from 'sinon';
import TestHelpers from './test-helpers.js';

class TestComponent1 extends Component {}
class TestComponent2 extends Component {}
c
    this.clock.restore();
  }
});

const getFakePlayer = function() {
  return {
    // Fake player requries an ID
    id() {
      return 'player_1';
    },
    reportUserActivity() {}
  };
};

QUnit.test('should create an element', function() {
  let comp = new Component(getFakePlayer(), {});

  QUnit.ok(comp.el().nodeName);
});

QUnit.test('should add a child component', function() {
  let comp = new Component(getFakePlayer());

  let child = comp.addChild('component');

  QUnit.ok(comp.children().length === 1);
  QUnit.ok(comp.children()[0] === child);
  QUnit.ok(comp.el().childNodes[0] === child.el());
  QUnit.ok(comp.getChild('component') === child);
  QUnit.ok(comp.getChildById(child.id()) === child);
});

QUnit.test('should add a child component to an index', function() {
  let comp = new Component(getFakePlayer());

  let child = comp.addChild('component');

  QUnit.ok(comp.children().length === 1);
  QUnit.ok(comp.children()[0] === child);

  let child0 = comp.addChild('component', {}, 0);

  QUnit.ok(comp.children().length === 2);
  QUnit.ok(comp.children()[0] === child0);
  QUnit.ok(comp.children()[1] === child);

  let child1 = comp.addChild('component', {}, '2');

  QUnit.ok(comp.children().length === 3);
  QUnit.ok(comp.children()[2] === child1);

  let child2 = comp.addChild('component', {}, undefined);

  QUnit.ok(comp.children().length === 4);
  QUnit.ok(comp.children()[3] === child2);

  let child3 = comp.addChild('component', {}, -1);

  QUnit.ok(comp.children().length === 5);
  QUnit.ok(comp.children()[3] === child3);
  QUnit.ok(comp.children()[4] === child2);
});

QUnit.test('addChild should throw if the child does not exist', function() {
  let comp = new Component(getFakePlayer());

  throws(function() {
    comp.addChild('non-existent-child');
  }, new Error('Component Non-existent-child does not exist'), 'addChild threw');

});

QUnit.test('should init child components from options', function() {
  let comp = new Component(getFakePlayer(), {
    children: {
      component: {}
    }
  });

  QUnit.ok(comp.children().length === 1);
  QUnit.ok(comp.el().childNodes.length === 1);
});

QUnit.test('should init child components from simple children array', function()  {
  let comp = new Component(getFakePlayer(), {
    children: [
      'component',
      'component',
      'component'
    ]
  });

  QUnit.ok(comp.children().length === 3);
  QUnit.ok(comp.el().childNodes.length === 3);
});

QUnit.test('should init child components from children array of objects', function() {
  let comp = new Component(getFakePlayer(), {
    children: [
      { name: 'component' },
      { name: 'component' },
      { name: 'component' }
    ]
  });

  QUnit.ok(comp.children().length === 3);
  QUnit.ok(comp.el().childNodes.length === 3);
});

QUnit.test('should do a deep merge of child options', function() {
  // Create a default option for component
  Component.prototype.options_ = {
    'example': {
      'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
      'childTwo': {},
      'childThree': {}
    }
  };

  let comp = new Component(getFakePlayer(), {
    'example': {
      'childOne': { 'foo': 'baz', 'abc': '123' },
      'childThree': false,
      'childFour': {}
    }
  });

  let mergedOptions = comp.options_;
  let children = mergedOptions['example'];

  QUnit.strictEqual(children['childOne']['foo'], 'baz', 'value three levels deep overridden');
  QUnit.strictEqual(children['childOne']['asdf'], 'fdsa', 'value three levels deep maintained');
  QUnit.strictEqual(children['childOne']['abc'], '123', 'value three levels deep added');
  QUnit.ok(children['childTwo'], 'object two levels deep maintained');
  QUnit.strictEqual(children['childThree'], false, 'object two levels deep removed');
  QUnit.ok(children['childFour'], 'object two levels deep added');

  QUnit.strictEqual(Component.prototype.options_['example']['childOne']['foo'], 'bar', 'prototype options were not overridden');

  // Reset default component options to none
  Component.prototype.options_ = null;
});

QUnit.test('should init child components from component options', function(){
  let testComp = new TestComponent1(TestHelpers.makePlayer(), {
    testComponent2: false,
    testComponent4: {}
  });

  QUnit.ok(!testComp.childNameIndex_.testComponent2, 'we do not have testComponent2');
  QUnit.ok(testComp.childNameIndex_.testComponent4, 'we have a testComponent4');
});

QUnit.test('should allows setting child options at the parent options level', function(){
  let parent, options;

  // using children array
  options = {
    'children': [
      'component',
      'nullComponent'
    ],
    // parent-level option for child
    'component': {
      'foo': true
    },
    'nullComponent': false
  };

  try {
    parent = new Component(getFakePlayer(), options);
  } catch(err) {
    QUnit.ok(false, 'Child with `false` option was initialized');
  }
  QUnit.equal(parent.children()[0].options_['foo'], true, 'child options set when children array is used');
  QUnit.equal(parent.children().length, 1, 'we should only have one child');

  // using children object
  options = {
    'children': {
      'component': {
        'foo': false
      },
      'nullComponent': {}
    },
    // parent-level option for child
    'component': {
      'foo': true
    },
    'nullComponent': false
  };

  try {
    parent = new Component(getFakePlayer(), options);
  } catch(err) {
    QUnit.ok(false, 'Child with `false` option was initialized');
  }
  QUnit.equal(parent.children()[0].options_['foo'], true, 'child options set when children object is used');
  QUnit.equal(parent.children().length, 1, 'we should only have one child');
});

QUnit.test('should dispose of component and children', function(){
  let comp = new Component(getFakePlayer());

  // Add a child
  let child = comp.addChild('Component');
  QUnit.ok(comp.children().length === 1);

  // Add a listener
  comp.on('click', function(){ return true; });
  let el = comp.el();
  let data = Dom.getElData(el);

  let hasDisposed = false;
  let bubbles = null;
  comp.on('dispose', function(event){
    hasDisposed = true;
    bubbles = event.bubbles;
  });

  comp.dispose();

  QUnit.ok(hasDisposed, 'component fired dispose event');
  QUnit.ok(bubbles === false, 'dispose event does not bubble');
  QUnit.ok(!comp.children(), 'component children were deleted');
  QUnit.ok(!comp.el(), 'component element was deleted');
  QUnit.ok(!child.children(), 'child children were deleted');
  QUnit.ok(!child.el(), 'child element was deleted');
  QUnit.ok(!Dom.hasElData(el), 'listener data nulled');
  QUnit.ok(!Object.getOwnPropertyNames(data).length, 'original listener data object was emptied');
});

QUnit.test('should add and remove event listeners to element', function(){
  let comp = new Component(getFakePlayer(), {});

  // No need to make this async because we're triggering events inline.
  // We're going to trigger the event after removing the listener,
  // So if we get extra asserts that's a problem.
  QUnit.expect(2);

  let testListener = function(){
    QUnit.ok(true, 'fired event once');
    QUnit.ok(this === comp, 'listener has the component as context');
  };

  comp.on('test-event', testListener);
  comp.trigger('test-event');
  comp.off('test-event', testListener);
  comp.trigger('test-event');
});

QUnit.test('should trigger a listener once using one()', function(){
  let comp = new Component(getFakePlayer(), {});

  QUnit.expect(1);

  let testListener = function(){
    QUnit.ok(true, 'fired event once');
  };

  comp.one('test-event', testListener);
  comp.trigger('test-event');
  comp.trigger('test-event');
});

QUnit.test('should be possible to pass data when you trigger an event', function () {
  let comp = new Component(getFakePlayer(), {});
  let data1 = 'Data1';
  let data2 = {txt: 'Data2'};
  QUnit.expect(3);

  let testListener = function(evt, hash){
    QUnit.ok(true, 'fired event once');
    deepEqual(hash.d1, data1);
    deepEqual(hash.d2, data2);
  };

  comp.one('test-event', testListener);
  comp.trigger('test-event', {d1: data1, d2: data2});
  comp.trigger('test-event');
});

QUnit.test('should add listeners to other components and remove them', function(){
  let player = getFakePlayer(),
      comp1 = new Component(player),
      comp2 = new Component(player),
      listenerFired = 0,
      testListener;

  testListener = function(){
    QUnit.equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  QUnit.equal(listenerFired, 1, 'listener was fired once');

  listenerFired = 0;
  comp1.off(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  QUnit.equal(listenerFired, 0, 'listener was not fired after being removed');

  // this component is disposed first
  listenerFired = 0;
  comp1.on(comp2, 'test-event', testListener);
  comp1.dispose();
  comp2.trigger('test-event');
  QUnit.equal(listenerFired, 0, 'listener was removed when this component was disposed first');
  comp1.off = function(){ throw 'Comp1 off called'; };
  comp2.dispose();
  QUnit.ok(true, 'this component removed dispose listeners from other component');
});

QUnit.test('should add listeners to other components and remove when them other component is disposed', function() {
  let player = getFakePlayer();
  let comp1 = new Component(player);
  let comp2 = new Component(player);
  let listenerFired = 0;
  let testListener;

  testListener = function(){
    QUnit.equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(comp2, 'test-event', testListener);
  comp2.dispose();
  comp2.off = function() {
    throw 'Comp2 off called';
  };
  comp1.dispose();
  QUnit.ok(true, 'this component removed dispose listener from this component that referenced other component');
});

QUnit.test('should add listeners to other components that are fired once', function() {
  let player = getFakePlayer();
  let comp1 = new Component(player);
  let comp2 = new Component(player);
  let listenerFired = 0;
  let testListener;

  testListener = function(){
    QUnit.equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.one(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  QUnit.equal(listenerFired, 1, 'listener was executed once');
  comp2.trigger('test-event');
  QUnit.equal(listenerFired, 1, 'listener was executed only once');
});

QUnit.test('should add listeners to other element and remove them', function(){
  let player = getFakePlayer();
  let comp1 = new Component(player);
  let el = document.createElement('div');
  let listenerFired = 0;
  let testListener;

  testListener = function(){
    QUnit.equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(el, 'test-event', testListener);
  Events.trigger(el, 'test-event');
  QUnit.equal(listenerFired, 1, 'listener was fired once');

  listenerFired = 0;
  comp1.off(el, 'test-event', testListener);
  Events.trigger(el, 'test-event');
  QUnit.equal(listenerFired, 0, 'listener was not fired after being removed from other element');

  // this component is disposed first
  listenerFired = 0;
  comp1.on(el, 'test-event', testListener);
  comp1.dispose();
  Events.trigger(el, 'test-event');
  QUnit.equal(listenerFired, 0, 'listener was removed when this component was disposed first');
  comp1.off = function() {
    throw 'Comp1 off called';
  };

  try {
    Events.trigger(el, 'dispose');
  } catch (e) {
    QUnit.ok(false, 'listener was not removed from other element');
  }
  Events.trigger(el, 'dispose');
  QUnit.ok(true, 'this component removed dispose listeners from other element');
});

QUnit.test('should add listeners to other components that are fired once', function() {
  let player = getFakePlayer();
  let comp1 = new Component(player);
  let el = document.createElement('div');
  let listenerFired = 0;
  let testListener;

  testListener = function() {
    QUnit.equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.one(el, 'test-event', testListener);
  Events.trigger(el, 'test-event');
  QUnit.equal(listenerFired, 1, 'listener was executed once');
  Events.trigger(el, 'test-event');
  QUnit.equal(listenerFired, 1, 'listener was executed only once');
});

QUnit.test('should trigger a listener when ready', function() {
  let initListenerFired;
  let methodListenerFired;
  let syncListenerFired;

  let comp = new Component(getFakePlayer(), {}, function() {
    initListenerFired = true;
  });

  comp.ready(function() {
    methodListenerFired = true;
  });

  comp.triggerReady();

  comp.ready(function() {
    syncListenerFired = true;
  }, true);

  QUnit.ok(!initListenerFired, 'init listener should NOT fire synchronously');
  QUnit.ok(!methodListenerFired, 'method listener should NOT fire synchronously');
  QUnit.ok(syncListenerFired, 'sync listener SHOULD fire synchronously if after ready');

  this.clock.tick(1);
  QUnit.ok(initListenerFired, 'init listener should fire asynchronously');
  QUnit.ok(methodListenerFired, 'method listener should fire asynchronously');

  // Listeners should only be fired once and then removed
  initListenerFired = false;
  methodListenerFired = false;
  syncListenerFired = false;

  comp.triggerReady();
  this.clock.tick(1);

  QUnit.ok(!initListenerFired, 'init listener should be removed');
  QUnit.ok(!methodListenerFired, 'method listener should be removed');
  QUnit.ok(!syncListenerFired, 'sync listener should be removed');
});

QUnit.test('should not retrigger a listener when the listener calls triggerReady', function() {
  let timesCalled = 0;
  let selfTriggered = false;
  let comp = new Component(getFakePlayer(), {});

  let readyListener = function() {
    timesCalled++;

    // Don't bother calling again if we have
    // already failed
    if (!selfTriggered) {
      selfTriggered = true;
      comp.triggerReady();
    }
  };

  comp.ready(readyListener);
  comp.triggerReady();

  this.clock.tick(100);

  QUnit.equal(timesCalled, 1,
    'triggerReady from inside a ready handler does not result in an infinite loop');
});

QUnit.test('should add and remove a CSS class', function() {
  let comp = new Component(getFakePlayer(), {});

  comp.addClass('test-class');
  QUnit.ok(comp.el().className.indexOf('test-class') !== -1);
  comp.removeClass('test-class');
  QUnit.ok(comp.el().className.indexOf('test-class') === -1);
  comp.toggleClass('test-class');
  QUnit.ok(comp.el().className.indexOf('test-class') !== -1);
  comp.toggleClass('test-class');
  QUnit.ok(comp.el().className.indexOf('test-class') === -1);
});

QUnit.test('should show and hide an element', function() {
  let comp = new Component(getFakePlayer(), {});

  comp.hide();
  QUnit.ok(comp.hasClass('vjs-hidden') === true);
  comp.show();
  QUnit.ok(comp.hasClass('vjs-hidden') === false);
});

QUnit.test('dimension() should treat NaN and null as zero', function() {
  let comp;
  let width;
  let height;
  let newWidth;
  let newHeight;

  width = 300;
  height = 150;

  comp = new Component(getFakePlayer(), {});
  // set component dimension

  comp.dimensions(width, height);

  newWidth = comp.dimension('width', null);

  notEqual(newWidth, width, 'new width and old width are not the same');
  QUnit.equal(newWidth, comp, 'we set a value, so, return value is component');
  QUnit.equal(comp.width(), 0, 'the new width is zero');

  newHeight = comp.dimension('height', NaN);

  notEqual(newHeight, height, 'new height and old height are not the same');
  QUnit.equal(newHeight, comp, 'we set a value, so, return value is component');
  QUnit.equal(comp.height(), 0, 'the new height is zero');

  comp.width(width);
  newWidth = comp.dimension('width', undefined);

  QUnit.equal(newWidth, width, 'we did not set the width with undefined');
});

QUnit.test('should change the width and height of a component', function() {
  let container = document.createElement('div');
  let comp = new Component(getFakePlayer(), {});
  let el = comp.el();
  let fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(container);
  container.appendChild(el);
  // Container of el needs dimensions or the component won't have dimensions
  container.style.width = '1000px';
  container.style.height = '1000px';

  comp.width('50%');
  comp.height('123px');

  QUnit.ok(comp.width() === 500, 'percent values working');
  let compStyle = TestHelpers.getComputedStyle(el, 'width');

  QUnit.ok(compStyle === comp.width() + 'px', 'matches computed style');
  QUnit.ok(comp.height() === 123, 'px values working');

  comp.width(321);
  QUnit.ok(comp.width() === 321, 'integer values working');

  comp.width('auto');
  comp.height('auto');
  QUnit.ok(comp.width() === 1000, 'forced width was removed');
  QUnit.ok(comp.height() === 0, 'forced height was removed');
});

QUnit.test('should get the computed dimensions', function() {
  const container = document.createElement('div');
  const comp = new Component(getFakePlayer(), {});
  const el = comp.el();
  const fixture = document.getElementById('qunit-fixture');

  const computedWidth = '500px';
  const computedHeight = '500px';

  fixture.appendChild(container);
  container.appendChild(el);
  // Container of el needs dimensions or the component won't have dimensions
  container.style.width = '1000px';
  container.style.height = '1000px';

  comp.width('50%');
  comp.height('50%');

  QUnit.equal(comp.currentWidth() + 'px', computedWidth, 'matches computed width');
  QUnit.equal(comp.currentHeight() + 'px', computedHeight, 'matches computed height');

  QUnit.equal(comp.currentDimension('width') + 'px', computedWidth,
  'matches computed width');
  QUnit.equal(comp.currentDimension('height') + 'px', computedHeight,
  'matches computed height');

  QUnit.equal(comp.currentDimensions().width + 'px', computedWidth,
  'matches computed width');
  QUnit.equal(comp.currentDimensions().height + 'px', computedHeight,
  'matches computed width');

});

QUnit.test('should use a defined content el for appending children', function() {
  class CompWithContent extends Component {}

  CompWithContent.prototype.createEl = function() {
    // Create the main componenent element
    let el = Dom.createEl('div');

    // Create the element where children will be appended
    this.contentEl_ = Dom.createEl('div', { id: 'contentEl' });
    el.appendChild(this.contentEl_);
    return el;
  };

  let comp = new CompWithContent(getFakePlayer());
  let child = comp.addChild('component');

  QUnit.ok(comp.children().length === 1);
  QUnit.ok(comp.el().childNodes[0].id === 'contentEl');
  QUnit.ok(comp.el().childNodes[0].childNodes[0] === child.el());

  comp.removeChild(child);

  QUnit.ok(comp.children().length === 0, 'Length should now be zero');
  QUnit.ok(comp.el().childNodes[0].id === 'contentEl', 'Content El should still exist');
  QUnit.ok(comp.el().childNodes[0].childNodes[0] !== child.el(),
  'Child el should be removed.');
});

QUnit.test('should emit a tap event', function() {
  let comp = new Component(getFakePlayer());
  let singleTouch = {};
  let origTouch = browser.TOUCH_ENABLED;

  QUnit.expect(3);
  // Fake touch support. Real touch support isn't needed for this test.
  browser.TOUCH_ENABLED = true;

  comp.emitTapEvents();
  comp.on('tap', function() {
    QUnit.ok(true, 'Tap event emitted');
  });

  // A touchstart followed by touchend should trigger a tap
  Events.trigger(comp.el(), {type: 'touchstart', touches: [{}]});
  comp.trigger('touchend');

  // A touchmove with a lot of movement should not trigger a tap
  Events.trigger(comp.el(), {type: 'touchstart', touches: [
    { pageX: 0, pageY: 0 }
  ]});
  Events.trigger(comp.el(), {type: 'touchmove', touches: [
    { pageX: 100, pageY: 100 }
  ]});
  comp.trigger('touchend');

  // A touchmove with not much movement should still allow a tap
  Events.trigger(comp.el(), {type: 'touchstart', touches: [
    { pageX: 0, pageY: 0 }
  ]});
  Events.trigger(comp.el(), {type: 'touchmove', touches: [
    { pageX: 7, pageY: 7 }
  ]});
  comp.trigger('touchend');

  // A touchmove with a lot of movement by modifying the exisiting touch object
  // should not trigger a tap
  singleTouch = { pageX: 0, pageY: 0 };
  Events.trigger(comp.el(), {type: 'touchstart', touches: [singleTouch]});
  singleTouch.pageX = 100;
  singleTouch.pageY = 100;
  Events.trigger(comp.el(), {type: 'touchmove', touches: [singleTouch]});
  comp.trigger('touchend');

  // A touchmove with not much movement by modifying the exisiting touch object
  // should still allow a tap
  singleTouch = { pageX: 0, pageY: 0 };
  Events.trigger(comp.el(), {type: 'touchstart', touches: [singleTouch]});
  singleTouch.pageX = 7;
  singleTouch.pageY = 7;
  Events.trigger(comp.el(), {type: 'touchmove', touches: [singleTouch]});
  comp.trigger('touchend');

  // Reset to orignial value
  browser.TOUCH_ENABLED = origTouch;
});

QUnit.test('should provide timeout methods that automatically get cleared on component disposal',
function() {
  let comp = new Component(getFakePlayer());
  let timeoutsFired = 0;
  let timeoutToClear = comp.setTimeout(function() {
    timeoutsFired++;
    QUnit.ok(false, 'Timeout should have been manually cleared');
  }, 500);

  QUnit.expect(4);

  comp.setTimeout(function() {
    timeoutsFired++;
    QUnit.equal(this, comp, 'Timeout fn has the component as its context');
    QUnit.ok(true, 'Timeout created and fired.');
  }, 100);

  comp.setTimeout(function() {
    timeoutsFired++;
    QUnit.ok(false, 'Timeout should have been disposed');
  }, 1000);

  this.clock.tick(100);

  QUnit.ok(timeoutsFired === 1, 'One timeout should have fired by this point');

  comp.clearTimeout(timeoutToClear);

  this.clock.tick(500);

  comp.dispose();

  this.clock.tick(1000);

  QUnit.ok(timeoutsFired === 1, 'One timeout should have fired overall');
});

QUnit.test('should provide interval methods that automatically get cleared on component disposal',
function() {
  let comp = new Component(getFakePlayer());

  let intervalsFired = 0;

  let interval = comp.setInterval(function() {
    intervalsFired++;
    QUnit.equal(this, comp, 'Interval fn has the component as its context');
    QUnit.ok(true, 'Interval created and fired.');
  }, 100);

  QUnit.expect(13);

  comp.setInterval(function() {
    intervalsFired++;
    QUnit.ok(false, 'Interval should have been disposed');
  }, 1200);

  this.clock.tick(500);

  QUnit.ok(intervalsFired === 5, 'Component interval fired 5 times');

  comp.clearInterval(interval);

  this.clock.tick(600);

  QUnit.ok(intervalsFired === 5, 'Interval was manually cleared');

  comp.dispose();

  this.clock.tick(1200);

  QUnit.ok(intervalsFired === 5, 'Interval was cleared when component was disposed');
});

QUnit.test('$ and $$ functions', function() {
  let comp = new Component(getFakePlayer());
  let contentEl = document.createElement('div');
  let children = [
    document.createElement('div'),
    document.createElement('div')
  ];

  comp.contentEl_ = contentEl;
  children.forEach(child => contentEl.appendChild(child));

  QUnit.strictEqual(comp.$('div'), children[0], '$ defaults to contentEl as scope');
  QUnit.strictEqual(comp.$$('div').length, children.length,
  '$$ defaults to contentEl as scope');
});
