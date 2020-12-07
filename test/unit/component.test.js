/* eslint-env qunit */
import window from 'global/window';
import Component from '../../src/js/component.js';
import * as Dom from '../../src/js/utils/dom.js';
import DomData from '../../src/js/utils/dom-data';
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
    this.player = TestHelpers.makePlayer();
  },
  afterEach() {
    this.player.dispose();
    this.clock.restore();
  },
  after() {
    delete Component.components_.TestComponent1;
    delete Component.components_.TestComponent2;
    delete Component.components_.TestComponent3;
    delete Component.components_.TestComponent4;
  }
});

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
  const comp = new Component(this.player, {});

  assert.ok(comp.el().nodeName);

  comp.dispose();
});

QUnit.test('should add a child component', function(assert) {
  const comp = new Component(this.player);

  const child = comp.addChild('component');

  assert.ok(comp.children().length === 1);
  assert.ok(comp.children()[0] === child);
  assert.ok(comp.el().childNodes[0] === child.el());
  assert.ok(comp.getChild('component') === child);
  assert.ok(comp.getChildById(child.id()) === child);

  comp.dispose();
});

QUnit.test('should add a child component to an index', function(assert) {
  const comp = new Component(this.player);

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

QUnit.test('should insert element relative to the element of the component to insert before', function(assert) {

  // for legibility of the test itself:
  /* eslint-disable no-unused-vars */

  const comp = new Component(this.player);

  const child0 = comp.addChild('component', {el: Dom.createEl('div', {}, {class: 'c0'})});
  const child1 = comp.addChild('component', {createEl: false});
  const child2 = comp.addChild('component', {el: Dom.createEl('div', {}, {class: 'c2'})});
  const child3 = comp.addChild('component', {el: Dom.createEl('div', {}, {class: 'c3'})});
  const child4 = comp.addChild('component', {el: Dom.createEl('div', {}, {class: 'c4'})}, comp.children_.indexOf(child2));

  assert.ok(child2.el_.previousSibling === child4.el_, 'addChild should insert el before its next sibling\'s element');

  /* eslint-enable no-unused-vars */
});

QUnit.test('should allow for children that are elements', function(assert) {

  // for legibility of the test itself:
  /* eslint-disable no-unused-vars */

  const comp = new Component(this.player);
  const testEl = Dom.createEl('div');

  // Add element as video el gets added to player
  comp.el().appendChild(testEl);
  comp.children_.unshift(testEl);

  const child1 = comp.addChild('component', {el: Dom.createEl('div', {}, {class: 'c1'})});
  const child2 = comp.addChild('component', {el: Dom.createEl('div', {}, {class: 'c4'})}, 0);

  assert.ok(child2.el_.nextSibling === testEl, 'addChild should insert el before a sibling that is an element');

  /* eslint-enable no-unused-vars */
});

QUnit.test('addChild should throw if the child does not exist', function(assert) {
  const comp = new Component(this.player);

  assert.throws(function() {
    comp.addChild('non-existent-child');
  }, new Error('Component Non-existent-child does not exist'), 'addChild threw');

  comp.dispose();
});

QUnit.test('addChild with instance should allow getting child correctly', function(assert) {
  const comp = new Component(this.player);
  const comp2 = new Component(this.player);

  comp2.name = function() {
    return 'foo';
  };

  comp.addChild(comp2);
  assert.ok(comp.getChild('foo'), 'we can get child with camelCase');
  assert.ok(comp.getChild('Foo'), 'we can get child with TitleCase');

  comp.dispose();
});

QUnit.test('should add a child component with title case name', function(assert) {
  const comp = new Component(this.player);

  const child = comp.addChild('Component');

  assert.ok(comp.children().length === 1);
  assert.ok(comp.children()[0] === child);
  assert.ok(comp.el().childNodes[0] === child.el());
  assert.ok(comp.getChild('Component') === child);
  assert.ok(comp.getChildById(child.id()) === child);

  comp.dispose();
});

QUnit.test('should init child components from options', function(assert) {
  const comp = new Component(this.player, {
    children: {
      component: {}
    }
  });

  assert.ok(comp.children().length === 1);
  assert.ok(comp.el().childNodes.length === 1);

  comp.dispose();
});

QUnit.test('should init child components from simple children array', function(assert) {
  const comp = new Component(this.player, {
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
  const comp = new Component(this.player, {
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

  const comp = new Component(this.player, {
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
    parent = new Component(this.player, options);
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
    parent = new Component(this.player, options);
  } catch (err) {
    assert.ok(false, 'Child with `false` option was initialized');
  }
  assert.equal(parent.children()[0].options_.foo, true, 'child options set when children object is used');
  assert.equal(parent.children().length, 1, 'we should only have one child');
  parent.dispose();
});

QUnit.test('should dispose of component and children', function(assert) {
  const comp = new Component(this.player);

  // Add a child
  const child = comp.addChild('Component');

  assert.ok(comp.children().length === 1);
  assert.notOk(comp.isDisposed(), 'the component reports that it is not disposed');

  // Add a listener
  comp.on('click', function() {
    return true;
  });
  const el = comp.el();
  const data = DomData.get(el);

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
  assert.ok(!DomData.has(el), 'listener data nulled');
  assert.ok(
    !Object.getOwnPropertyNames(data).length,
    'original listener data object was emptied'
  );
  assert.ok(comp.isDisposed(), 'the component reports that it is disposed');
});

QUnit.test('should add and remove event listeners to element', function(assert) {
  const comp = new Component(this.player, {});

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
  const comp = new Component(this.player, {});

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
  const comp = new Component(this.player, {});
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
  const player = this.player;
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
  const player = this.player;
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
  const player = this.player;
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
  const player = this.player;
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
  const player = this.player;
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

  const comp = new Component(this.player, {}, function() {
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
  const comp = new Component(this.player, {});

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
  const comp = new Component(this.player, {});

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
  const comp = new Component(this.player, {});

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

  const comp = new Component(this.player, {});
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
  const comp = new Component(this.player, {});
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
  const comp = new Component(this.player, {});
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

  const comp = new CompWithContent(this.player);
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
  const comp = new Component(this.player);
  let singleTouch = {};
  const origTouch = browser.TOUCH_ENABLED;

  assert.expect(3);
  // Fake touch support. Real touch support isn't needed for this test.
  browser.stub_TOUCH_ENABLED(true);

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
  browser.stub_TOUCH_ENABLED(origTouch);
  comp.dispose();
});

QUnit.test('should provide timeout methods that automatically get cleared on component disposal', function(assert) {
  const comp = new Component(this.player);
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
  const comp = new Component(this.player);

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

QUnit.test('should provide a requestAnimationFrame method that is cleared on disposal', function(assert) {
  const comp = new Component(this.player);
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  const spyRAF = sinon.spy();

  comp.requestNamedAnimationFrame('testing', spyRAF);

  assert.strictEqual(spyRAF.callCount, 0, 'rAF callback was not called immediately');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was called after a "repaint"');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was not called after a second "repaint"');

  comp.cancelNamedAnimationFrame(comp.requestNamedAnimationFrame('testing', spyRAF));
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'second rAF callback was not called because it was cancelled');

  comp.requestNamedAnimationFrame('testing', spyRAF);
  comp.dispose();
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'third rAF callback was not called because the component was disposed');

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('should provide a requestNamedAnimationFrame method that is cleared on disposal', function(assert) {
  const comp = new Component(this.player);
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  const spyRAF = sinon.spy();

  comp.requestNamedAnimationFrame('testing', spyRAF);

  assert.strictEqual(spyRAF.callCount, 0, 'rAF callback was not called immediately');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was called after a "repaint"');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was not called after a second "repaint"');

  comp.cancelNamedAnimationFrame(comp.requestNamedAnimationFrame('testing', spyRAF));
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'second rAF callback was not called because it was cancelled');

  comp.requestNamedAnimationFrame('testing', spyRAF);
  comp.dispose();
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'third rAF callback was not called because the component was disposed');

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('requestAnimationFrame falls back to timers if rAF not supported', function(assert) {
  const comp = new Component(this.player);
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
  const comp = new Component(this.player);

  comp.setTimeout(() => {}, 1);

  assert.equal(comp.setTimeoutIds_.size, 1, 'we removed our dispose handle');

  this.clock.tick(1);

  assert.equal(comp.setTimeoutIds_.size, 0, 'we removed our dispose handle');

  comp.dispose();
});

QUnit.test('requestNamedAnimationFrame should remove dispose handler on trigger', function(assert) {
  const comp = new Component(this.player);
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  const spyRAF = sinon.spy();

  comp.requestNamedAnimationFrame('testFrame', spyRAF);

  assert.equal(comp.rafIds_.size, 1, 'we got a new raf dispose handler');
  assert.equal(comp.namedRafs_.size, 1, 'we got a new named raf dispose handler');

  this.clock.tick(1);

  assert.equal(comp.rafIds_.size, 0, 'we removed our raf dispose handle');
  assert.equal(comp.namedRafs_.size, 0, 'we removed our named raf dispose handle');

  comp.dispose();

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('requestAnimationFrame should remove dispose handler on trigger', function(assert) {
  const comp = new Component(this.player);
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

  assert.equal(comp.rafIds_.size, 1, 'we got a new dispose handler');

  this.clock.tick(1);

  assert.equal(comp.rafIds_.size, 0, 'we removed our dispose handle');

  comp.dispose();

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('setTimeout should be canceled on dispose', function(assert) {
  const comp = new Component(this.player);
  let called = false;
  let clearId;
  const setId = comp.setTimeout(() => {
    called = true;
  }, 1);

  const clearTimeout = comp.clearTimeout;

  comp.clearTimeout = (id) => {
    clearId = id;
    return clearTimeout.call(comp, id);
  };

  assert.equal(comp.setTimeoutIds_.size, 1, 'we added a timeout id');

  comp.dispose();

  assert.equal(comp.setTimeoutIds_.size, 0, 'we removed our timeout id');
  assert.equal(clearId, setId, 'clearTimeout was called');

  this.clock.tick(1);

  assert.equal(called, false, 'setTimeout was never called');
});

QUnit.test('requestAnimationFrame should be canceled on dispose', function(assert) {
  const comp = new Component(this.player);
  let called = false;
  let clearId;
  const setId = comp.requestAnimationFrame(() => {
    called = true;
  });

  const cancelAnimationFrame = comp.cancelAnimationFrame;

  comp.cancelAnimationFrame = (id) => {
    clearId = id;
    return cancelAnimationFrame.call(comp, id);
  };

  assert.equal(comp.rafIds_.size, 1, 'we added a raf id');

  comp.dispose();

  assert.equal(comp.rafIds_.size, 0, 'we removed a raf id');
  assert.equal(clearId, setId, 'clearAnimationFrame was called');

  this.clock.tick(1);

  assert.equal(called, false, 'requestAnimationFrame was never called');
});

QUnit.test('setInterval should be canceled on dispose', function(assert) {
  const comp = new Component(this.player);
  let called = false;
  let clearId;
  const setId = comp.setInterval(() => {
    called = true;
  });

  const clearInterval = comp.clearInterval;

  comp.clearInterval = (id) => {
    clearId = id;
    return clearInterval.call(comp, id);
  };

  assert.equal(comp.setIntervalIds_.size, 1, 'we added an interval id');

  comp.dispose();

  assert.equal(comp.setIntervalIds_.size, 0, 'we removed a raf id');
  assert.equal(clearId, setId, 'clearInterval was called');

  this.clock.tick(1);

  assert.equal(called, false, 'setInterval was never called');
});

QUnit.test('requestNamedAnimationFrame should be canceled on dispose', function(assert) {
  const comp = new Component(this.player);
  let called = false;
  let clearName;
  const setName = comp.requestNamedAnimationFrame('testing', () => {
    called = true;
  });

  const cancelNamedAnimationFrame = comp.cancelNamedAnimationFrame;

  comp.cancelNamedAnimationFrame = (name) => {
    clearName = name;
    return cancelNamedAnimationFrame.call(comp, name);
  };

  assert.equal(comp.namedRafs_.size, 1, 'we added a named raf');
  assert.equal(comp.rafIds_.size, 1, 'we added a raf id');

  comp.dispose();

  assert.equal(comp.namedRafs_.size, 0, 'we removed a named raf');
  assert.equal(comp.rafIds_.size, 0, 'we removed a raf id');
  assert.equal(clearName, setName, 'cancelNamedAnimationFrame was called');

  this.clock.tick(1);

  assert.equal(called, false, 'requestNamedAnimationFrame was never called');
});

QUnit.test('requestNamedAnimationFrame should only allow one raf of a specific name at a time', function(assert) {
  const comp = new Component(this.player);
  const calls = {
    one: 0,
    two: 0,
    three: 0
  };
  const cancelNames = [];
  const name = 'testing';
  const handlerOne = () => {
    assert.equal(comp.namedRafs_.size, 1, 'named raf still exists while function runs');
    assert.equal(comp.rafIds_.size, 0, 'raf id does not exist during run');

    calls.one++;
  };
  const handlerTwo = () => {
    assert.equal(comp.namedRafs_.size, 1, 'named raf still exists while function runs');
    assert.equal(comp.rafIds_.size, 0, 'raf id does not exist during run');
    calls.two++;
  };
  const handlerThree = () => {
    assert.equal(comp.namedRafs_.size, 1, 'named raf still exists while function runs');
    assert.equal(comp.rafIds_.size, 0, 'raf id does not exist during run');
    calls.three++;
  };

  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  const cancelNamedAnimationFrame = comp.cancelNamedAnimationFrame;

  comp.cancelNamedAnimationFrame = (_name) => {
    cancelNames.push(_name);
    return cancelNamedAnimationFrame.call(comp, _name);
  };

  comp.requestNamedAnimationFrame(name, handlerOne);

  assert.equal(comp.namedRafs_.size, 1, 'we added a named raf');
  assert.equal(comp.rafIds_.size, 1, 'we added a raf id');

  comp.requestNamedAnimationFrame(name, handlerTwo);

  assert.deepEqual(cancelNames, [], 'no named cancels');
  assert.equal(comp.namedRafs_.size, 1, 'still only one named raf');
  assert.equal(comp.rafIds_.size, 1, 'still only one raf id');

  this.clock.tick(1);

  assert.equal(comp.namedRafs_.size, 0, 'we removed a named raf');
  assert.equal(comp.rafIds_.size, 0, 'we removed a raf id');
  assert.deepEqual(calls, {
    one: 1,
    two: 0,
    three: 0
  }, 'only handlerOne was called');

  comp.requestNamedAnimationFrame(name, handlerOne);
  comp.requestNamedAnimationFrame(name, handlerTwo);
  comp.requestNamedAnimationFrame(name, handlerThree);

  assert.deepEqual(cancelNames, [], 'no named cancels for testing');
  assert.equal(comp.namedRafs_.size, 1, 'only added one named raf');
  assert.equal(comp.rafIds_.size, 1, 'only added one named raf');

  this.clock.tick(1);

  assert.equal(comp.namedRafs_.size, 0, 'we removed a named raf');
  assert.equal(comp.rafIds_.size, 0, 'we removed a raf id');
  assert.deepEqual(calls, {
    one: 2,
    two: 0,
    three: 0
  }, 'only the handlerOne called');

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('$ and $$ functions', function(assert) {
  const comp = new Component(this.player);
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
  const comp = new Component(this.player, {});

  assert.ok(Obj.isPlain(comp.state), '`state` is a plain object');
  assert.strictEqual(Object.prototype.toString.call(comp.setState), '[object Function]', '`setState` is a function');

  comp.setState({foo: 'bar'});
  assert.strictEqual(comp.state.foo, 'bar', 'the component passes a basic stateful test');

  comp.dispose();
});

QUnit.test('should remove child when the child moves to the other parent', function(assert) {
  const parentComponent1 = new Component(this.player, {});
  const parentComponent2 = new Component(this.player, {});
  const childComponent = new Component(this.player, {});

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

QUnit.test('getDescendant should work as expected', function(assert) {
  const comp = new Component(this.player, {name: 'component'});
  const descendant1 = new Component(this.player, {name: 'descendant1'});
  const descendant2 = new Component(this.player, {name: 'descendant2'});
  const descendant3 = new Component(this.player, {name: 'descendant3'});

  comp.addChild(descendant1);
  descendant1.addChild(descendant2);
  descendant2.addChild(descendant3);

  assert.equal(comp.getDescendant('descendant1', 'descendant2', 'descendant3'), descendant3, 'can pass as args');
  assert.equal(comp.getDescendant(['descendant1', 'descendant2', 'descendant3']), descendant3, 'can pass as array');
  assert.equal(comp.getDescendant('descendant1'), descendant1, 'can pass as single string');
  assert.equal(comp.getDescendant(), comp, 'no args returns base component');
  assert.notOk(comp.getDescendant('descendant5'), 'undefined descendant returned');
  assert.notOk(comp.getDescendant('descendant1', 'descendant5'), 'undefined descendant returned');
  assert.notOk(comp.getDescendant(['descendant1', 'descendant5']), 'undefined descendant returned');

  comp.dispose();
});

QUnit.test('ready queue should not run after dispose', function(assert) {
  let option = false;
  let callback = false;

  const comp = new Component(this.player, {name: 'component'}, () => {
    option = true;
  });

  comp.ready(() => {
    callback = true;
  });

  comp.dispose();
  comp.triggerReady();
  // TODO: improve this error. It is a variant of:
  // "Cannot read property 'parentNode' of null"
  //
  // but on some browsers such as IE 11 and safari 9 other errors are thrown,
  // I think any error at all works for our purposes here.
  assert.throws(() => this.clock.tick(1), /.*/, 'throws trigger error');

  assert.notOk(option, 'ready option not run');
  assert.notOk(callback, 'ready callback not run');

});
