/* eslint-env qunit */
import window from 'global/window';
import Component from '../../src/js/component.js';
import * as Dom from '../../src/js/utils/dom.js';
import * as DomData from '../../src/js/utils/dom-data';
import * as Events from '../../src/js/utils/events.js';
import * as Obj from '../../src/js/utils/obj';
import * as browser from '../../src/js/utils/browser.js';
import document from 'global/document';
import sinon from 'sinon';
import TestHelpers from './test-helpers.js';

class TestComponent1 extends Component {}
class TestComponent2 extends Component {}
class TestComponent3 extends Component {}
class TestComponent4 extends Component {}

TestComponent1.prototype.options_ = {
  children: [
    'testComponent2',
    'testComponent3'
  ]
};

QUnit.module('Component', {
  before() {
    Component.registerComponent('TestComponent1', TestComponent1);
    Component.registerComponent('TestComponent2', TestComponent2);
    Component.registerComponent('TestComponent3', TestComponent3);
    Component.registerComponent('TestComponent4', TestComponent4);
  },
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
  },
  after() {
    delete Component.components_.TestComponent1;
    delete Component.components_.TestComponent2;
    delete Component.components_.TestComponent3;
    delete Component.components_.TestComponent4;
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

QUnit.test('registerComponent() throws with bad arguments', function(assert) {
  assert.throws(
    function() {
      Component.registerComponent(null);
    },
    new Error('Illegal component name, "null"; must be a non-empty string.'),
    'component names must be non-empty strings'
  );

  assert.throws(
    function() {
      Component.registerComponent('');
    },
    new Error('Illegal component name, ""; must be a non-empty string.'),
    'component names must be non-empty strings'
  );

  assert.throws(
    function() {
      Component.registerComponent('TestComponent5', function() {});
    },
    new Error('Illegal component, "TestComponent5"; must be a Component subclass.'),
    'components must be subclasses of Component'
  );

  assert.throws(
    function() {
      const Tech = Component.getComponent('Tech');

      class DummyTech extends Tech {}

      Component.registerComponent('TestComponent5', DummyTech);
    },
    new Error('Illegal component, "TestComponent5"; techs must be registered using Tech.registerTech().'),
    'components must be subclasses of Component'
  );
});

QUnit.test('should create an element', function(assert) {
  const comp = new Component(getFakePlayer(), {});

  assert.ok(comp.el().nodeName);

  comp.dispose();
});

QUnit.test('should add a child component', function(assert) {
  const comp = new Component(getFakePlayer());

  const child = comp.addChild('component');

  assert.ok(comp.children().length === 1);
  assert.ok(comp.children()[0] === child);
  assert.ok(comp.el().childNodes[0] === child.el());
  assert.ok(comp.getChild('component') === child);
  assert.ok(comp.getChildById(child.id()) === child);

  comp.dispose();
});

QUnit.test('should add a child component to an index', function(assert) {
  const comp = new Component(getFakePlayer());

  const child = comp.addChild('component');

  assert.ok(comp.children().length === 1);
  assert.ok(comp.children()[0] === child);

  const child0 = comp.addChild('component', {}, 0);

  assert.ok(comp.children().length === 2);
  assert.ok(comp.children()[0] === child0);
  assert.ok(comp.children()[1] === child);

  const child1 = comp.addChild('component', {}, '2');

  assert.ok(comp.children().length === 3);
  assert.ok(comp.children()[2] === child1);

  const child2 = comp.addChild('component', {}, undefined);

  assert.ok(comp.children().length === 4);
  assert.ok(comp.children()[3] === child2);

  const child3 = comp.addChild('component', {}, -1);

  assert.ok(comp.children().length === 5);
  assert.ok(comp.children()[3] === child3);
  assert.ok(comp.children()[4] === child2);

  comp.dispose();
});

QUnit.test('addChild should throw if the child does not exist', function(assert) {
  const comp = new Component(getFakePlayer());

  assert.throws(function() {
    comp.addChild('non-existent-child');
  }, new Error('Component Non-existent-child does not exist'), 'addChild threw');

  comp.dispose();
});

QUnit.test('addChild with instance should allow getting child correctly', function(assert) {
  const comp = new Component(getFakePlayer());
  const comp2 = new Component(getFakePlayer());

  comp2.name = function() {
    return 'foo';
  };

  comp.addChild(comp2);
  assert.ok(comp.getChild('foo'), 'we can get child with camelCase');
  assert.ok(comp.getChild('Foo'), 'we can get child with TitleCase');

  comp.dispose();
});

QUnit.test('should add a child component with title case name', function(assert) {
  const comp = new Component(getFakePlayer());

  const child = comp.addChild('Component');

  assert.ok(comp.children().length === 1);
  assert.ok(comp.children()[0] === child);
  assert.ok(comp.el().childNodes[0] === child.el());
  assert.ok(comp.getChild('Component') === child);
  assert.ok(comp.getChildById(child.id()) === child);

  comp.dispose();
});

QUnit.test('should init child components from options', function(assert) {
  const comp = new Component(getFakePlayer(), {
    children: {
      component: {}
    }
  });

  assert.ok(comp.children().length === 1);
  assert.ok(comp.el().childNodes.length === 1);

  comp.dispose();
});

QUnit.test('should init child components from simple children array', function(assert) {
  const comp = new Component(getFakePlayer(), {
    children: [
      'component',
      'component',
      'component'
    ]
  });

  assert.ok(comp.children().length === 3);
  assert.ok(comp.el().childNodes.length === 3);

  comp.dispose();
});

QUnit.test('should init child components from children array of objects', function(assert) {
  const comp = new Component(getFakePlayer(), {
    children: [
      { name: 'component' },
      { name: 'component' },
      { name: 'component' }
    ]
  });

  assert.ok(comp.children().length === 3);
  assert.ok(comp.el().childNodes.length === 3);

  comp.dispose();
});

QUnit.test('should do a deep merge of child options', function(assert) {
  // Create a default option for component
  const oldOptions = Component.prototype.options_;

  Component.prototype.options_ = {
    example: {
      childOne: { foo: 'bar', asdf: 'fdsa' },
      childTwo: {},
      childThree: {}
    }
  };

  const comp = new Component(getFakePlayer(), {
    example: {
      childOne: { foo: 'baz', abc: '123' },
      childThree: false,
      childFour: {}
    }
  });

  const mergedOptions = comp.options_;
  const children = mergedOptions.example;

  assert.strictEqual(children.childOne.foo, 'baz', 'value three levels deep overridden');
  assert.strictEqual(children.childOne.asdf, 'fdsa', 'value three levels deep maintained');
  assert.strictEqual(children.childOne.abc, '123', 'value three levels deep added');
  assert.ok(children.childTwo, 'object two levels deep maintained');
  assert.strictEqual(children.childThree, false, 'object two levels deep removed');
  assert.ok(children.childFour, 'object two levels deep added');

  assert.strictEqual(
    Component.prototype.options_.example.childOne.foo,
    'bar',
    'prototype options were not overridden'
  );

  // Reset default component options
  Component.prototype.options_ = oldOptions;
  comp.dispose();
});

QUnit.test('should init child components from component options', function(assert) {
  const player = TestHelpers.makePlayer();
  const testComp = new TestComponent1(player, {
    testComponent2: false,
    testComponent4: {}
  });

  assert.ok(!testComp.childNameIndex_.TestComponent2, 'we do not have testComponent2');
  assert.ok(testComp.childNameIndex_.TestComponent4, 'we have a testComponent4');

  player.dispose();
  testComp.dispose();
});

QUnit.test('should allows setting child options at the parent options level', function(assert) {
  let parent;

  // using children array
  let options = {
    children: [
      'component',
      'nullComponent'
    ],
    // parent-level option for child
    component: {
      foo: true
    },
    nullComponent: false
  };

  try {
    parent = new Component(getFakePlayer(), options);
  } catch (err) {
    assert.ok(false, 'Child with `false` option was initialized');
  }
  assert.equal(parent.children()[0].options_.foo, true, 'child options set when children array is used');
  assert.equal(parent.children().length, 1, 'we should only have one child');
  parent.dispose();

  // using children object
  options = {
    children: {
      component: {
        foo: false
      },
      nullComponent: {}
    },
    // parent-level option for child
    component: {
      foo: true
    },
    nullComponent: false
  };

  try {
    parent = new Component(getFakePlayer(), options);
  } catch (err) {
    assert.ok(false, 'Child with `false` option was initialized');
  }
  assert.equal(parent.children()[0].options_.foo, true, 'child options set when children object is used');
  assert.equal(parent.children().length, 1, 'we should only have one child');
  parent.dispose();
});

QUnit.test('should dispose of component and children', function(assert) {
  const comp = new Component(getFakePlayer());

  // Add a child
  const child = comp.addChild('Component');

  assert.ok(comp.children().length === 1);

  // Add a listener
  comp.on('click', function() {
    return true;
  });
  const el = comp.el();
  const data = DomData.getData(el);

  let hasDisposed = false;
  let bubbles = null;

  comp.on('dispose', function(event) {
    hasDisposed = true;
    bubbles = event.bubbles;
  });

  comp.dispose();
  child.dispose();

  assert.ok(hasDisposed, 'component fired dispose event');
  assert.ok(bubbles === false, 'dispose event does not bubble');
  assert.ok(!comp.children(), 'component children were deleted');
  assert.ok(!comp.el(), 'component element was deleted');
  assert.ok(!child.children(), 'child children were deleted');
  assert.ok(!child.el(), 'child element was deleted');
  assert.ok(!DomData.hasData(el), 'listener data nulled');
  assert.ok(
    !Object.getOwnPropertyNames(data).length,
    'original listener data object was emptied'
  );
});

QUnit.test('should add and remove event listeners to element', function(assert) {
  const comp = new Component(getFakePlayer(), {});

  // No need to make this async because we're triggering events inline.
  // We're going to trigger the event after removing the listener,
  // So if we get extra asserts that's a problem.
  assert.expect(2);

  const testListener = function() {
    assert.ok(true, 'fired event once');
    assert.ok(this === comp, 'listener has the component as context');
  };

  comp.on('test-event', testListener);
  comp.trigger('test-event');
  comp.off('test-event', testListener);
  comp.trigger('test-event');

  comp.dispose();
});

QUnit.test('should trigger a listener once using one()', function(assert) {
  const comp = new Component(getFakePlayer(), {});

  assert.expect(1);

  const testListener = function() {
    assert.ok(true, 'fired event once');
  };

  comp.one('test-event', testListener);
  comp.trigger('test-event');
  comp.trigger('test-event');

  comp.dispose();
});

QUnit.test('should be possible to pass data when you trigger an event', function(assert) {
  const comp = new Component(getFakePlayer(), {});
  const data1 = 'Data1';
  const data2 = {txt: 'Data2'};

  assert.expect(3);

  const testListener = function(evt, hash) {
    assert.ok(true, 'fired event once');
    assert.deepEqual(hash.d1, data1);
    assert.deepEqual(hash.d2, data2);
  };

  comp.one('test-event', testListener);
  comp.trigger('test-event', {d1: data1, d2: data2});
  comp.trigger('test-event');

  comp.dispose();
});

QUnit.test('should add listeners to other components and remove them', function(assert) {
  const player = getFakePlayer();
  const comp1 = new Component(player);
  const comp2 = new Component(player);
  let listenerFired = 0;

  const testListener = function() {
    assert.equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  assert.equal(listenerFired, 1, 'listener was fired once');

  listenerFired = 0;
  comp1.off(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  assert.equal(listenerFired, 0, 'listener was not fired after being removed');

  // this component is disposed first
  listenerFired = 0;
  comp1.on(comp2, 'test-event', testListener);
  comp1.dispose();
  comp2.trigger('test-event');
  assert.equal(listenerFired, 0, 'listener was removed when this component was disposed first');
  comp1.off = function() {
    throw new Error('Comp1 off called');
  };
  comp2.dispose();
  assert.ok(true, 'this component removed dispose listeners from other component');
});

QUnit.test('should add listeners to other components and remove when them other component is disposed', function(assert) {
  const player = getFakePlayer();
  const comp1 = new Component(player);
  const comp2 = new Component(player);

  const testListener = function() {
    assert.equal(this, comp1, 'listener has the first component as context');
  };

  comp1.on(comp2, 'test-event', testListener);
  comp2.dispose();
  comp2.off = function() {
    throw new Error('Comp2 off called');
  };
  comp1.dispose();
  assert.ok(true, 'this component removed dispose listener from this component that referenced other component');
});

QUnit.test('should add listeners to other components that are fired once', function(assert) {
  const player = getFakePlayer();
  const comp1 = new Component(player);
  const comp2 = new Component(player);
  let listenerFired = 0;

  const testListener = function() {
    assert.equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.one(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  assert.equal(listenerFired, 1, 'listener was executed once');
  comp2.trigger('test-event');
  assert.equal(listenerFired, 1, 'listener was executed only once');

  comp1.dispose();
  comp2.dispose();
});

QUnit.test('should add listeners to other element and remove them', function(assert) {
  const player = getFakePlayer();
  const comp1 = new Component(player);
  const el = document.createElement('div');
  let listenerFired = 0;

  const testListener = function() {
    assert.equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(el, 'test-event', testListener);
  Events.trigger(el, 'test-event');
  assert.equal(listenerFired, 1, 'listener was fired once');

  listenerFired = 0;
  comp1.off(el, 'test-event', testListener);
  Events.trigger(el, 'test-event');
  assert.equal(listenerFired, 0, 'listener was not fired after being removed from other element');

  // this component is disposed first
  listenerFired = 0;
  comp1.on(el, 'test-event', testListener);
  comp1.dispose();
  Events.trigger(el, 'test-event');
  assert.equal(listenerFired, 0, 'listener was removed when this component was disposed first');
  comp1.off = function() {
    throw new Error('Comp1 off called');
  };

  try {
    Events.trigger(el, 'dispose');
  } catch (e) {
    assert.ok(false, 'listener was not removed from other element');
  }
  Events.trigger(el, 'dispose');
  assert.ok(true, 'this component removed dispose listeners from other element');

  comp1.dispose();
});

QUnit.test('should add listeners to other components that are fired once', function(assert) {
  const player = getFakePlayer();
  const comp1 = new Component(player);
  const el = document.createElement('div');
  let listenerFired = 0;

  const testListener = function() {
    assert.equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.one(el, 'test-event', testListener);
  Events.trigger(el, 'test-event');
  assert.equal(listenerFired, 1, 'listener was executed once');
  Events.trigger(el, 'test-event');
  assert.equal(listenerFired, 1, 'listener was executed only once');

  comp1.dispose();
});

QUnit.test('should trigger a listener when ready', function(assert) {
  let initListenerFired;
  let methodListenerFired;
  let syncListenerFired;

  const comp = new Component(getFakePlayer(), {}, function() {
    initListenerFired = true;
  });

  comp.ready(function() {
    methodListenerFired = true;
  });

  comp.triggerReady();

  comp.ready(function() {
    syncListenerFired = true;
  }, true);

  assert.ok(!initListenerFired, 'init listener should NOT fire synchronously');
  assert.ok(!methodListenerFired, 'method listener should NOT fire synchronously');
  assert.ok(syncListenerFired, 'sync listener SHOULD fire synchronously if after ready');

  this.clock.tick(1);
  assert.ok(initListenerFired, 'init listener should fire asynchronously');
  assert.ok(methodListenerFired, 'method listener should fire asynchronously');

  // Listeners should only be fired once and then removed
  initListenerFired = false;
  methodListenerFired = false;
  syncListenerFired = false;

  comp.triggerReady();
  this.clock.tick(1);

  assert.ok(!initListenerFired, 'init listener should be removed');
  assert.ok(!methodListenerFired, 'method listener should be removed');
  assert.ok(!syncListenerFired, 'sync listener should be removed');

  comp.dispose();
});

QUnit.test('should not retrigger a listener when the listener calls triggerReady', function(assert) {
  let timesCalled = 0;
  let selfTriggered = false;
  const comp = new Component(getFakePlayer(), {});

  const readyListener = function() {
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

  assert.equal(timesCalled, 1, 'triggerReady from inside a ready handler does not result in an infinite loop');

  comp.dispose();
});

QUnit.test('should add and remove a CSS class', function(assert) {
  const comp = new Component(getFakePlayer(), {});

  comp.addClass('test-class');
  assert.ok(comp.el().className.indexOf('test-class') !== -1);
  comp.removeClass('test-class');
  assert.ok(comp.el().className.indexOf('test-class') === -1);
  comp.toggleClass('test-class');
  assert.ok(comp.el().className.indexOf('test-class') !== -1);
  comp.toggleClass('test-class');
  assert.ok(comp.el().className.indexOf('test-class') === -1);

  comp.dispose();
});

QUnit.test('should show and hide an element', function(assert) {
  const comp = new Component(getFakePlayer(), {});

  comp.hide();
  assert.ok(comp.hasClass('vjs-hidden') === true);
  comp.show();
  assert.ok(comp.hasClass('vjs-hidden') === false);

  comp.dispose();
});

QUnit.test('dimension() should treat NaN and null as zero', function(assert) {
  let newWidth;

  const width = 300;
  const height = 150;

  const comp = new Component(getFakePlayer(), {});
  // set component dimension

  comp.dimensions(width, height);

  newWidth = comp.dimension('width', null);

  assert.notEqual(newWidth, width, 'new width and old width are not the same');
  assert.equal(newWidth, undefined, 'we set a value, so, return value is undefined');
  assert.equal(comp.width(), 0, 'the new width is zero');

  const newHeight = comp.dimension('height', NaN);

  assert.notEqual(newHeight, height, 'new height and old height are not the same');
  assert.equal(newHeight, undefined, 'we set a value, so, return value is undefined');
  assert.equal(comp.height(), 0, 'the new height is zero');

  comp.width(width);
  newWidth = comp.dimension('width', undefined);

  assert.equal(newWidth, width, 'we did not set the width with undefined');

  comp.dispose();
});

QUnit.test('should change the width and height of a component', function(assert) {
  const container = document.createElement('div');
  const comp = new Component(getFakePlayer(), {});
  const el = comp.el();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(container);
  container.appendChild(el);
  // Container of el needs dimensions or the component won't have dimensions
  container.style.width = '1000px';
  container.style.height = '1000px';

  comp.width('50%');
  comp.height('123px');

  assert.ok(comp.width() === 500, 'percent values working');
  const compStyle = TestHelpers.getComputedStyle(el, 'width');

  assert.ok(compStyle === comp.width() + 'px', 'matches computed style');
  assert.ok(comp.height() === 123, 'px values working');

  comp.width(321);
  assert.ok(comp.width() === 321, 'integer values working');

  comp.width('auto');
  comp.height('auto');
  assert.ok(comp.width() === 1000, 'forced width was removed');
  assert.ok(comp.height() === 0, 'forced height was removed');

  comp.dispose();
});

QUnit.test('should get the computed dimensions', function(assert) {
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

  assert.equal(comp.currentWidth() + 'px', computedWidth, 'matches computed width');
  assert.equal(comp.currentHeight() + 'px', computedHeight, 'matches computed height');

  assert.equal(comp.currentDimension('width') + 'px', computedWidth, 'matches computed width');
  assert.equal(comp.currentDimension('height') + 'px', computedHeight, 'matches computed height');

  assert.equal(comp.currentDimensions().width + 'px', computedWidth, 'matches computed width');
  assert.equal(comp.currentDimensions().height + 'px', computedHeight, 'matches computed width');

  comp.dispose();
});

QUnit.test('should use a defined content el for appending children', function(assert) {
  class CompWithContent extends Component {
    createEl() {
      // Create the main component element
      const el = Dom.createEl('div');

      // Create the element where children will be appended
      this.contentEl_ = Dom.createEl('div', { id: 'contentEl' });
      el.appendChild(this.contentEl_);
      return el;
    }
  }

  const comp = new CompWithContent(getFakePlayer());
  const child = comp.addChild('component');

  assert.ok(comp.children().length === 1);
  assert.ok(comp.el().childNodes[0].id === 'contentEl');
  assert.ok(comp.el().childNodes[0].childNodes[0] === child.el());

  comp.removeChild(child);

  assert.ok(comp.children().length === 0, 'Length should now be zero');
  assert.ok(comp.el().childNodes[0].id === 'contentEl', 'Content El should still exist');
  assert.ok(
    comp.el().childNodes[0].childNodes[0] !== child.el(),
    'Child el should be removed.'
  );

  child.dispose();
  comp.dispose();
});

QUnit.test('should emit a tap event', function(assert) {
  const comp = new Component(getFakePlayer());
  let singleTouch = {};
  const origTouch = browser.TOUCH_ENABLED;

  assert.expect(3);
  // Fake touch support. Real touch support isn't needed for this test.
  browser.TOUCH_ENABLED = true;

  comp.emitTapEvents();
  comp.on('tap', function() {
    assert.ok(true, 'Tap event emitted');
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
  comp.dispose();
});

QUnit.test('should provide timeout methods that automatically get cleared on component disposal', function(assert) {
  const comp = new Component(getFakePlayer());
  let timeoutsFired = 0;
  const timeoutToClear = comp.setTimeout(function() {
    timeoutsFired++;
    assert.ok(false, 'Timeout should have been manually cleared');
  }, 500);

  assert.expect(4);

  comp.setTimeout(function() {
    timeoutsFired++;
    assert.equal(this, comp, 'Timeout fn has the component as its context');
    assert.ok(true, 'Timeout created and fired.');
  }, 100);

  comp.setTimeout(function() {
    timeoutsFired++;
    assert.ok(false, 'Timeout should have been disposed');
  }, 1000);

  this.clock.tick(100);

  assert.ok(timeoutsFired === 1, 'One timeout should have fired by this point');

  comp.clearTimeout(timeoutToClear);

  this.clock.tick(500);

  comp.dispose();

  this.clock.tick(1000);

  assert.ok(timeoutsFired === 1, 'One timeout should have fired overall');
});

QUnit.test('should provide interval methods that automatically get cleared on component disposal', function(assert) {
  const comp = new Component(getFakePlayer());

  let intervalsFired = 0;

  const interval = comp.setInterval(function() {
    intervalsFired++;
    assert.equal(this, comp, 'Interval fn has the component as its context');
    assert.ok(true, 'Interval created and fired.');
  }, 100);

  assert.expect(13);

  comp.setInterval(function() {
    intervalsFired++;
    assert.ok(false, 'Interval should have been disposed');
  }, 1200);

  this.clock.tick(500);

  assert.ok(intervalsFired === 5, 'Component interval fired 5 times');

  comp.clearInterval(interval);

  this.clock.tick(600);

  assert.ok(intervalsFired === 5, 'Interval was manually cleared');

  comp.dispose();

  this.clock.tick(1200);

  assert.ok(intervalsFired === 5, 'Interval was cleared when component was disposed');
});

QUnit.test('should provide *AnimationFrame methods that automatically get cleared on component disposal', function(assert) {
  const comp = new Component(getFakePlayer());
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  const spyRAF = sinon.spy();

  comp.requestAnimationFrame(spyRAF);

  assert.strictEqual(spyRAF.callCount, 0, 'rAF callback was not called immediately');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was called after a "repaint"');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was not called after a second "repaint"');

  comp.cancelAnimationFrame(comp.requestAnimationFrame(spyRAF));
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'second rAF callback was not called because it was cancelled');

  comp.requestAnimationFrame(spyRAF);
  comp.dispose();
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'third rAF callback was not called because the component was disposed');

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('*AnimationFrame methods fall back to timers if rAF not supported', function(assert) {
  const comp = new Component(getFakePlayer());
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  const rAF = window.requestAnimationFrame = sinon.spy();
  const cAF = window.cancelAnimationFrame = sinon.spy();

  // Make sure the component thinks it does not support rAF.
  comp.supportsRaf_ = false;

  sinon.spy(comp, 'setTimeout');
  sinon.spy(comp, 'clearTimeout');

  comp.cancelAnimationFrame(comp.requestAnimationFrame(() => {}));

  assert.strictEqual(rAF.callCount, 0, 'window.requestAnimationFrame was not called');
  assert.strictEqual(cAF.callCount, 0, 'window.cancelAnimationFrame was not called');
  assert.strictEqual(comp.setTimeout.callCount, 1, 'Component#setTimeout was called');
  assert.strictEqual(comp.clearTimeout.callCount, 1, 'Component#clearTimeout was called');

  comp.dispose();
  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('setTimeout should remove dispose handler on trigger', function(assert) {
  const comp = new Component(getFakePlayer());
  const el = comp.el();
  const data = DomData.getData(el);

  comp.setTimeout(() => {}, 1);

  assert.equal(data.handlers.dispose.length, 2, 'we got a new dispose handler');
  assert.ok(/vjs-timeout-\d/.test(data.handlers.dispose[1].guid), 'we got a new dispose handler');

  this.clock.tick(1);

  assert.equal(data.handlers.dispose.length, 1, 'we removed our dispose handle');

  comp.dispose();
});

QUnit.test('requestAnimationFrame should remove dispose handler on trigger', function(assert) {
  const comp = new Component(getFakePlayer());
  const el = comp.el();
  const data = DomData.getData(el);
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  const spyRAF = sinon.spy();

  comp.requestAnimationFrame(spyRAF);

  assert.equal(data.handlers.dispose.length, 2, 'we got a new dispose handler');
  assert.ok(/vjs-raf-\d/.test(data.handlers.dispose[1].guid), 'we got a new dispose handler');

  this.clock.tick(1);

  assert.equal(data.handlers.dispose.length, 1, 'we removed our dispose handle');

  comp.dispose();

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('$ and $$ functions', function(assert) {
  const comp = new Component(getFakePlayer());
  const contentEl = document.createElement('div');
  const children = [
    document.createElement('div'),
    document.createElement('div')
  ];

  comp.contentEl_ = contentEl;
  children.forEach(child => contentEl.appendChild(child));

  assert.strictEqual(comp.$('div'), children[0], '$ defaults to contentEl as scope');
  assert.strictEqual(comp.$$('div').length, children.length, '$$ defaults to contentEl as scope');

  comp.dispose();
});

QUnit.test('should use the stateful mixin', function(assert) {
  const comp = new Component(getFakePlayer(), {});

  assert.ok(Obj.isPlain(comp.state), '`state` is a plain object');
  assert.strictEqual(Object.prototype.toString.call(comp.setState), '[object Function]', '`setState` is a function');

  comp.setState({foo: 'bar'});
  assert.strictEqual(comp.state.foo, 'bar', 'the component passes a basic stateful test');

  comp.dispose();
});

QUnit.test('should remove child when the child moves to the other parent', function(assert) {
  const parentComponent1 = new Component(getFakePlayer(), {});
  const parentComponent2 = new Component(getFakePlayer(), {});
  const childComponent = new Component(getFakePlayer(), {});

  parentComponent1.addChild(childComponent);

  assert.strictEqual(parentComponent1.children().length, 1, 'the children number of `parentComponent1` is 1');
  assert.strictEqual(parentComponent1.children()[0], childComponent, 'the first child of `parentComponent1` is `childComponent`');
  assert.strictEqual(parentComponent1.el().childNodes[0], childComponent.el(), '`parentComponent1` contains the DOM element of `childComponent`');

  parentComponent2.addChild(childComponent);

  assert.strictEqual(parentComponent1.children().length, 0, 'the children number of `parentComponent1` is 0');
  assert.strictEqual(parentComponent1.el().childNodes.length, 0, 'the length of `childNodes` of `parentComponent1` is 0');

  assert.strictEqual(parentComponent2.children().length, 1, 'the children number of `parentComponent2` is 1');
  assert.strictEqual(parentComponent2.children()[0], childComponent, 'the first child of `parentComponent2` is `childComponent`');
  assert.strictEqual(parentComponent2.el().childNodes.length, 1, 'the length of `childNodes` of `parentComponent2` is 1');
  assert.strictEqual(parentComponent2.el().childNodes[0], childComponent.el(), '`parentComponent2` contains the DOM element of `childComponent`');

  parentComponent1.dispose();
  parentComponent2.dispose();
  childComponent.dispose();
});
