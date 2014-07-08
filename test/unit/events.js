module('Events');

test('should add and remove an event listener to an element', function(){
  expect(1);

  var el = document.createElement('div');
  var listener = function(){
    ok(true, 'Click Triggered');
  };

  vjs.on(el, 'click', listener);
  vjs.trigger(el, 'click'); // 1 click
  vjs.off(el, 'click', listener);
  vjs.trigger(el, 'click'); // No click should happen.
});

test('should add and remove multiple event listeners to an element with a single call', function(){
  expect(6);

  var el = document.createElement('div');
  var listener = function(){
    ok(true, 'Callback triggered');
  };

  vjs.on(el, ['click', 'event1', 'event2'], listener);

  vjs.trigger(el, 'click');
  vjs.trigger(el, 'click');
  vjs.off(el, 'click', listener);
  vjs.trigger(el, 'click'); // No click should happen.

  vjs.trigger(el, 'event1');
  vjs.trigger(el, 'event1');
  vjs.off(el, 'event1', listener);
  vjs.trigger(el, 'event1'); // No event1 should happen.

  vjs.trigger(el, 'event2');
  vjs.trigger(el, 'event2');
  vjs.off(el, 'event2', listener);
  vjs.trigger(el, 'event2'); // No event2 should happen.
});

test('should remove all listeners of a type', function(){
  var el = document.createElement('div');
  var clicks = 0;
  var listener = function(){
    clicks++;
  };
  var listener2 = function(){
    clicks++;
  };

  vjs.on(el, 'click', listener);
  vjs.on(el, 'click', listener2);
  vjs.trigger(el, 'click'); // 2 clicks

  ok(clicks === 2, 'both click listeners fired');

  vjs.off(el, 'click');
  vjs.trigger(el, 'click'); // No click should happen.

  ok(clicks === 2, 'no click listeners fired');
});

test('should remove all listeners of an array of types', function(){
  var el = document.createElement('div');
  var calls = 0;
  var listener = function(){
    calls++;
  };
  var listener2 = function(){
    calls++;
  };

  vjs.on(el, ['click', 'event1'], listener);
  vjs.on(el, ['click', 'event1'], listener2);
  vjs.trigger(el, 'click'); // 2 calls
  vjs.trigger(el, 'event1'); // 2 calls

  ok(calls === 4, 'both click listeners fired');

  vjs.off(el, ['click', 'event1']);
  vjs.trigger(el, 'click'); // No click should happen.
  vjs.trigger(el, 'event1'); // No event1 should happen.

  ok(calls === 4, 'no event listeners fired');
});

test('should remove all listeners from an element', function(){
  expect(2);

  var el = document.createElement('div');
  var listener = function(){
    ok(true, 'Fake1 Triggered');
  };
  var listener2 = function(){
    ok(true, 'Fake2 Triggered');
  };

  vjs.on(el, 'fake1', listener);
  vjs.on(el, 'fake2', listener2);

  vjs.trigger(el, 'fake1');
  vjs.trigger(el, 'fake2');

  vjs.off(el);

  // No listener should happen.
  vjs.trigger(el, 'fake1');
  vjs.trigger(el, 'fake2');
});

test('should listen only once', function(){
  expect(1);

  var el = document.createElement('div');
  var listener = function(){
    ok(true, 'Click Triggered');
  };

  vjs.one(el, 'click', listener);
  vjs.trigger(el, 'click'); // 1 click
  vjs.trigger(el, 'click'); // No click should happen.
});

test( 'should listen only once in multiple events from a single call', function(){
  expect(3);

  var el = document.createElement('div');
  var listener = function(){
    ok(true, 'Callback Triggered');
  };

  vjs.one(el, ['click', 'event1', 'event2'], listener);
  vjs.trigger(el, 'click'); // 1 click
  vjs.trigger(el, 'click'); // No click should happen.
  vjs.trigger(el, 'event1'); // event1 must be handled.
  vjs.trigger(el, 'event1'); // No event1 should be handled.
  vjs.trigger(el, 'event2'); // event2 must be handled. 
  vjs.trigger(el, 'event2'); // No event2 should be handled.
});

test('should stop immediate propagtion', function(){
  expect(1);

  var el = document.createElement('div');

  vjs.on(el, 'test', function(e){
    ok(true, 'First listener fired');
    e.stopImmediatePropagation();
  });

  vjs.on(el, 'test', function(e){
    ok(false, 'Second listener fired');
  });

  vjs.trigger(el, 'test');
});

test('should bubble up DOM unless bubbles == false', function(){
  expect(3);

  var outer = document.createElement('div');
  var inner = outer.appendChild(document.createElement('div'));

  // Verify that if bubbles === true, event bubbles up dom.
  vjs.on(inner, 'bubbles', function(e){
    ok(true, 'Inner listener fired');
  });
  vjs.on(outer, 'bubbles', function(e){
    ok(true, 'Outer listener fired');
  });
  vjs.trigger(inner, { type:'bubbles', target:inner, bubbles:true });

  // Only change 'bubbles' to false, and verify only inner handler is called.
  vjs.on(inner, 'nobub', function(e){
    ok(true, 'Inner listener fired');
  });
  vjs.on(outer, 'nobub', function(e){
    ok(false, 'Outer listener fired');
  });
  vjs.trigger(inner, { type:'nobub', target:inner, bubbles:false });
});

test('should have a defaultPrevented property on an event that was prevent from doing default action', function() {
  expect(2);

  var el = document.createElement('div');

  vjs.on(el, 'test', function(e){
    ok(true, 'First listener fired');
    e.preventDefault();
  });

  vjs.on(el, 'test', function(e){
    ok(e.defaultPrevented, 'Should have `defaultPrevented` to signify preventDefault being called');
  });

  vjs.trigger(el, 'test');
});
