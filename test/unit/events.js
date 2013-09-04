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
