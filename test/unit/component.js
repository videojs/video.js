module("Component");

test('should create an element', function(){
  var comp = new _V_.Component({}, {});

  ok(comp.getEl().nodeName);
});

test('should init child coponents from options', function(){
  var comp = new _V_.Component({}, {
    components: {
      'component': true
    }
  });

  ok(comp.el.childNodes.length === 1);
});

test('should add a child component', function(){
  var comp = new _V_.Component({});

  comp.addChild("Component");

  ok(comp.el.childNodes.length === 1);
});





test('should show and hide an element', function(){
  var comp = new _V_.Component({}, {});

  comp.hide();
  ok(comp.el.style.display === 'none');
  comp.show();
  ok(comp.el.style.display === 'block');
});

test('should add and remove a CSS class', function(){
  var comp = new _V_.Component({}, {});

  comp.addClass('test-class');
  ok(comp.el.className.indexOf('test-class') !== -1);
  comp.removeClass('test-class');
  ok(comp.el.className.indexOf('test-class') === -1);
});

test('should add and remove event listeners to element', function(){
  var comp = new _V_.Component({}, {});

  // No need to make this async because we're triggering events inline.
  // We're going to trigger the event after removing the listener,
  // So if we get extra asserts that's a problem.
  expect(1);

  var testListener = function(){
    ok(true, 'fired event once');
  };

  comp.on('test-event', testListener);
  comp.trigger('test-event');
  comp.off('test-event', testListener);
  comp.trigger('test-event');
});

test('should trigger a listener once using one()', function(){
  var comp = new _V_.Component({}, {});

  expect(1);

  var testListener = function(){
    ok(true, 'fired event once');
  };

  comp.one('test-event', testListener);
  comp.trigger('test-event');
  comp.trigger('test-event');
});
