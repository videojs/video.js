module('Component', {
  'setup': function() {
    this.clock = sinon.useFakeTimers();
  },
  'teardown': function() {
    this.clock.restore();
  }
});

var getFakePlayer = function(){
  return {
    // Fake player requries an ID
    id: function(){ return 'player_1'; },
    reportUserActivity: function(){}
  };
};

test('should create an element', function(){
  var comp = new vjs.Component(getFakePlayer(), {});

  ok(comp.el().nodeName);
});

test('should add a child component', function(){
  var comp = new vjs.Component(getFakePlayer());

  var child = comp.addChild('component');

  ok(comp.children().length === 1);
  ok(comp.children()[0] === child);
  ok(comp.el().childNodes[0] === child.el());
  ok(comp.getChild('component') === child);
  ok(comp.getChildById(child.id()) === child);
});

test('should init child components from options', function(){
  var comp = new vjs.Component(getFakePlayer(), {
    children: {
      'component': true
    }
  });

  ok(comp.children().length === 1);
  ok(comp.el().childNodes.length === 1);
});

test('should init child components from simple children array', function(){
  var comp = new vjs.Component(getFakePlayer(), {
    children: [
      'component',
      'component',
      'component'
    ]
  });

  ok(comp.children().length === 3);
  ok(comp.el().childNodes.length === 3);
});

test('should init child components from children array of objects', function(){
  var comp = new vjs.Component(getFakePlayer(), {
    children: [
      { 'name': 'component' },
      { 'name': 'component' },
      { 'name': 'component' }
    ]
  });

  ok(comp.children().length === 3);
  ok(comp.el().childNodes.length === 3);
});

test('should do a deep merge of child options', function(){
  // Create a default option for component
  vjs.Component.prototype.options_ = {
    'example': {
      'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
      'childTwo': {},
      'childThree': {}
    }
  };

  var comp = new vjs.Component(getFakePlayer(), {
    'example': {
      'childOne': { 'foo': 'baz', 'abc': '123' },
      'childThree': false,
      'childFour': {}
    }
  });

  var mergedOptions = comp.options();
  var children = mergedOptions['example'];

  ok(children['childOne']['foo'] === 'baz', 'value three levels deep overridden');
  ok(children['childOne']['asdf'] === 'fdsa', 'value three levels deep maintained');
  ok(children['childOne']['abc'] === '123', 'value three levels deep added');
  ok(children['childTwo'], 'object two levels deep maintained');
  ok(children['childThree'] === false, 'object two levels deep removed');
  ok(children['childFour'], 'object two levels deep added');

  ok(vjs.Component.prototype.options_['example']['childOne']['foo'] === 'bar', 'prototype options were not overridden');

  // Reset default component options to none
  vjs.Component.prototype.options_ = null;
});

test('should allows setting child options at the parent options level', function(){
  var parent, options;

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
    parent = new vjs.Component(getFakePlayer(), options);
  } catch(err) {
    ok(false, 'Child with `false` option was initialized');
  }
  equal(parent.children()[0].options()['foo'], true, 'child options set when children array is used');

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
    parent = new vjs.Component(getFakePlayer(), options);
  } catch(err) {
    ok(false, 'Child with `false` option was initialized');
  }
  equal(parent.children()[0].options()['foo'], true, 'child options set when children object is used');
});

test('should dispose of component and children', function(){
  var comp = new vjs.Component(getFakePlayer());

  // Add a child
  var child = comp.addChild('Component');
  ok(comp.children().length === 1);

  // Add a listener
  comp.on('click', function(){ return true; });
  var data = vjs.getData(comp.el());
  var id = comp.el()[vjs.expando];

  var hasDisposed = false;
  var bubbles = null;
  comp.on('dispose', function(event){
    hasDisposed = true;
    bubbles = event.bubbles;
  });

  comp.dispose();

  ok(hasDisposed, 'component fired dispose event');
  ok(bubbles === false, 'dispose event does not bubble');
  ok(!comp.children(), 'component children were deleted');
  ok(!comp.el(), 'component element was deleted');
  ok(!child.children(), 'child children were deleted');
  ok(!child.el(), 'child element was deleted');
  ok(!vjs.cache[id], 'listener cache nulled');
  ok(vjs.isEmpty(data), 'original listener cache object was emptied');
});

test('should add and remove event listeners to element', function(){
  var comp = new vjs.Component(getFakePlayer(), {});

  // No need to make this async because we're triggering events inline.
  // We're going to trigger the event after removing the listener,
  // So if we get extra asserts that's a problem.
  expect(2);

  var testListener = function(){
    ok(true, 'fired event once');
    ok(this === comp, 'listener has the component as context');
  };

  comp.on('test-event', testListener);
  comp.trigger('test-event');
  comp.off('test-event', testListener);
  comp.trigger('test-event');
});

test('should trigger a listener once using one()', function(){
  var comp = new vjs.Component(getFakePlayer(), {});

  expect(1);

  var testListener = function(){
    ok(true, 'fired event once');
  };

  comp.one('test-event', testListener);
  comp.trigger('test-event');
  comp.trigger('test-event');
});

test('should add listeners to other components and remove them', function(){
  var player = getFakePlayer(),
      comp1 = new vjs.Component(player),
      comp2 = new vjs.Component(player),
      listenerFired = 0,
      testListener;

  testListener = function(){
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  equal(listenerFired, 1, 'listener was fired once');

  listenerFired = 0;
  comp1.off(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  equal(listenerFired, 0, 'listener was not fired after being removed');

  // this component is disposed first
  listenerFired = 0;
  comp1.on(comp2, 'test-event', testListener);
  comp1.dispose();
  comp2.trigger('test-event');
  equal(listenerFired, 0, 'listener was removed when this component was disposed first');
  comp1.off = function(){ throw 'Comp1 off called'; };
  comp2.dispose();
  ok(true, 'this component removed dispose listeners from other component');
});

test('should add listeners to other components and remove when them other component is disposed', function(){
  var player = getFakePlayer(),
      comp1 = new vjs.Component(player),
      comp2 = new vjs.Component(player),
      listenerFired = 0,
      testListener;

  testListener = function(){
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(comp2, 'test-event', testListener);
  comp2.dispose();
  comp2.off = function(){ throw 'Comp2 off called'; };
  comp1.dispose();
  ok(true, 'this component removed dispose listener from this component that referenced other component');
});

test('should add listeners to other components that are fired once', function(){
  var player = getFakePlayer(),
      comp1 = new vjs.Component(player),
      comp2 = new vjs.Component(player),
      listenerFired = 0,
      testListener;

  testListener = function(){
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.one(comp2, 'test-event', testListener);
  comp2.trigger('test-event');
  equal(listenerFired, 1, 'listener was executed once');
  comp2.trigger('test-event');
  equal(listenerFired, 1, 'listener was executed only once');
});

test('should add listeners to other element and remove them', function(){
  var player = getFakePlayer(),
      comp1 = new vjs.Component(player),
      el = document.createElement('div'),
      listenerFired = 0,
      testListener;

  testListener = function(){
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.on(el, 'test-event', testListener);
  vjs.trigger(el, 'test-event');
  equal(listenerFired, 1, 'listener was fired once');

  listenerFired = 0;
  comp1.off(el, 'test-event', testListener);
  vjs.trigger(el, 'test-event');
  equal(listenerFired, 0, 'listener was not fired after being removed from other element');

  // this component is disposed first
  listenerFired = 0;
  comp1.on(el, 'test-event', testListener);
  comp1.dispose();
  vjs.trigger(el, 'test-event');
  equal(listenerFired, 0, 'listener was removed when this component was disposed first');
  comp1.off = function(){ throw 'Comp1 off called'; };
  try {
    vjs.trigger(el, 'dispose');
  } catch(e) {
    ok(false, 'listener was not removed from other element');
  }
  vjs.trigger(el, 'dispose');
  ok(true, 'this component removed dispose listeners from other element');
});

test('should add listeners to other components that are fired once', function(){
  var player = getFakePlayer(),
      comp1 = new vjs.Component(player),
      el = document.createElement('div'),
      listenerFired = 0,
      testListener;

  testListener = function(){
    equal(this, comp1, 'listener has the first component as context');
    listenerFired++;
  };

  comp1.one(el, 'test-event', testListener);
  vjs.trigger(el, 'test-event');
  equal(listenerFired, 1, 'listener was executed once');
  vjs.trigger(el, 'test-event');
  equal(listenerFired, 1, 'listener was executed only once');
});

test('should trigger a listener when ready', function(){
  expect(2);

  var optionsReadyListener = function(){
    ok(true, 'options listener fired');
  };
  var methodReadyListener = function(){
    ok(true, 'ready method listener fired');
  };

  var comp = new vjs.Component(getFakePlayer(), {}, optionsReadyListener);

  comp.triggerReady();

  comp.ready(methodReadyListener);

  // First two listeners should only be fired once and then removed
  comp.triggerReady();
});

test('should not retrigger a listener when the listener calls triggerReady', function(){
  var timesCalled = 0;
  var selfTriggered = false;

  var readyListener = function(){
    timesCalled++;

    // Don't bother calling again if we have
    // already failed
    if (!selfTriggered) {
      selfTriggered = true;
      comp.triggerReady();
    }
  };

  var comp = new vjs.Component(getFakePlayer(), {});

  comp.ready(readyListener);
  comp.triggerReady();

  equal(timesCalled, 1, 'triggerReady from inside a ready handler does not result in an infinite loop');
});

test('should add and remove a CSS class', function(){
  var comp = new vjs.Component(getFakePlayer(), {});

  comp.addClass('test-class');
  ok(comp.el().className.indexOf('test-class') !== -1);
  comp.removeClass('test-class');
  ok(comp.el().className.indexOf('test-class') === -1);
});

test('should show and hide an element', function(){
  var comp = new vjs.Component(getFakePlayer(), {});

  comp.hide();
  ok(comp.hasClass('vjs-hidden') === true);
  comp.show();
  ok(comp.hasClass('vjs-hidden') === false);
});

test('dimension() should treat NaN and null as zero', function() {
  var comp, width, height, newWidth, newHeight;
  width = 300;
  height = 150;

  comp = new vjs.Component(getFakePlayer(), {}),
  // set component dimension

  comp.dimensions(width, height);

  newWidth = comp.dimension('width', null);

  notEqual(newWidth, width, 'new width and old width are not the same');
  equal(newWidth, comp, 'we set a value, so, return value is component');
  equal(comp.width(), 0, 'the new width is zero');

  newHeight = comp.dimension('height', NaN);

  notEqual(newHeight, height, 'new height and old height are not the same');
  equal(newHeight, comp, 'we set a value, so, return value is component');
  equal(comp.height(), 0, 'the new height is zero');

  comp.width(width);
  newWidth = comp.dimension('width', undefined);

  equal(newWidth, width, 'we did not set the width with undefined');
});

test('should change the width and height of a component', function(){
  var container = document.createElement('div');
  var comp = new vjs.Component(getFakePlayer(), {});
  var el = comp.el();
  var fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(container);
  container.appendChild(el);
  // Container of el needs dimensions or the component won't have dimensions
  container.style.width = '1000px';
  container.style.height = '1000px';

  comp.width('50%');
  comp.height('123px');

  ok(comp.width() === 500, 'percent values working');
  var compStyle = vjs.getComputedDimension(el, 'width');
  ok(compStyle === comp.width() + 'px', 'matches computed style');
  ok(comp.height() === 123, 'px values working');

  comp.width(321);
  ok(comp.width() === 321, 'integer values working');

  comp.width('auto');
  comp.height('auto');
  ok(comp.width() === 1000, 'forced width was removed');
  ok(comp.height() === 0, 'forced height was removed');
});


test('should use a defined content el for appending children', function(){
  var CompWithContent = vjs.Component.extend();
  CompWithContent.prototype.createEl = function(){
    // Create the main componenent element
    var el = vjs.createEl('div');
    // Create the element where children will be appended
    this.contentEl_ = vjs.createEl('div', { 'id': 'contentEl' });
    el.appendChild(this.contentEl_);
    return el;
  };

  var comp = new CompWithContent(getFakePlayer());
  var child = comp.addChild('component');

  ok(comp.children().length === 1);
  ok(comp.el().childNodes[0]['id'] === 'contentEl');
  ok(comp.el().childNodes[0].childNodes[0] === child.el());

  comp.removeChild(child);

  ok(comp.children().length === 0, 'Length should now be zero');
  ok(comp.el().childNodes[0]['id'] === 'contentEl', 'Content El should still exist');
  ok(comp.el().childNodes[0].childNodes[0] !== child.el(), 'Child el should be removed.');
});

test('should emit a tap event', function(){
  expect(3);

  // Fake touch support. Real touch support isn't needed for this test.
  var origTouch = vjs.TOUCH_ENABLED;
  vjs.TOUCH_ENABLED = true;

  var comp = new vjs.Component(getFakePlayer());
  var singleTouch = {};

  comp.emitTapEvents();
  comp.on('tap', function(){
    ok(true, 'Tap event emitted');
  });

  // A touchstart followed by touchend should trigger a tap
  vjs.trigger(comp.el(), {type: 'touchstart', touches: [{}]});
  comp.trigger('touchend');

  // A touchmove with a lot of movement should not trigger a tap
  vjs.trigger(comp.el(), {type: 'touchstart', touches: [
    { pageX: 0, pageY: 0 }
  ]});
  vjs.trigger(comp.el(), {type: 'touchmove', touches: [
    { pageX: 100, pageY: 100 }
  ]});
  comp.trigger('touchend');

  // A touchmove with not much movement should still allow a tap
  vjs.trigger(comp.el(), {type: 'touchstart', touches: [
    { pageX: 0, pageY: 0 }
  ]});
  vjs.trigger(comp.el(), {type: 'touchmove', touches: [
    { pageX: 7, pageY: 7 }
  ]});
  comp.trigger('touchend');

  // A touchmove with a lot of movement by modifying the exisiting touch object
  // should not trigger a tap
  singleTouch = { pageX: 0, pageY: 0 };
  vjs.trigger(comp.el(), {type: 'touchstart', touches: [singleTouch]});
  singleTouch.pageX = 100;
  singleTouch.pageY = 100;
  vjs.trigger(comp.el(), {type: 'touchmove', touches: [singleTouch]});
  comp.trigger('touchend');

  // A touchmove with not much movement by modifying the exisiting touch object
  // should still allow a tap
  singleTouch = { pageX: 0, pageY: 0 };
  vjs.trigger(comp.el(), {type: 'touchstart', touches: [singleTouch]});
  singleTouch.pageX = 7;
  singleTouch.pageY = 7;
  vjs.trigger(comp.el(), {type: 'touchmove', touches: [singleTouch]});
  comp.trigger('touchend');

  // Reset to orignial value
  vjs.TOUCH_ENABLED = origTouch;
});

test('should provide timeout methods that automatically get cleared on component disposal', function() {
  expect(4);

  var comp = new vjs.Component(getFakePlayer());
  var timeoutsFired = 0;

  comp.setTimeout(function() {
    timeoutsFired++;
    equal(this, comp, 'Timeout fn has the component as its context');
    ok(true, 'Timeout created and fired.');
  }, 100);

  var timeoutToClear = comp.setTimeout(function() {
    timeoutsFired++;
    ok(false, 'Timeout should have been manually cleared');
  }, 500);

  comp.setTimeout(function() {
    timeoutsFired++;
    ok(false, 'Timeout should have been disposed');
  }, 1000);

  this.clock.tick(100);

  ok(timeoutsFired === 1, 'One timeout should have fired by this point');

  comp.clearTimeout(timeoutToClear);

  this.clock.tick(500);

  comp.dispose();

  this.clock.tick(1000);

  ok(timeoutsFired === 1, 'One timeout should have fired overall');
});

test('should provide interval methods that automatically get cleared on component disposal', function() {
  expect(13);

  var comp = new vjs.Component(getFakePlayer());
  var intervalsFired = 0;

  var interval = comp.setInterval(function() {
    intervalsFired++;
    equal(this, comp, 'Interval fn has the component as its context');
    ok(true, 'Interval created and fired.');
  }, 100);

  comp.setInterval(function() {
    intervalsFired++;
    ok(false, 'Interval should have been disposed');
  }, 1200);

  this.clock.tick(500);

  ok(intervalsFired === 5, 'Component interval fired 5 times');

  comp.clearInterval(interval);

  this.clock.tick(600);

  ok(intervalsFired === 5, 'Interval was manually cleared');

  comp.dispose();

  this.clock.tick(1200);

  ok(intervalsFired === 5, 'Interval was cleared when component was disposed');
});
