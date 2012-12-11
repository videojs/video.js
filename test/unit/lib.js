module("Lib");

test('should merge two objects', function(){
  var obj1 = { a:1, b:2 };
  var obj2 = { b:3, c:4 };

  _V_.merge(obj1, obj2);

  deepEqual(obj1, {a:1,b:3,c:4} );
});

test('should create an element with attributes', function(){
  var el = _V_.createElement('div', { className: 'test-class', 'data-test': 'asdf' })
  ok(el.className === 'test-class');
  ok(el.getAttribute('data-test') === 'asdf' );
});

test('should insert an element first', function(){
  var el1 = document.createElement('div');
  var el2 = document.createElement('div');
  var el3 = document.createElement('div');

  _V_.insertFirst(el2, el1);
  ok(el1.childNodes[0] === el2);
  _V_.insertFirst(el3, el1);
  ok(el1.childNodes[0] === el3);
});

test('should add and remove a CSS class', function(){
  var el = document.createElement('div');

  _V_.addClass(el, 'test-class')
  ok(el.className.indexOf('test-class') !== -1);
  _V_.removeClass(el, 'test-class')
  ok(el.className.indexOf('test-class') === -1);
});

test('should format the time', function(){
  ok(_V_.formatTime(120) === "2:00");
  ok(_V_.formatTime(18121) === "5:02:01");
});

test('should uppercase a word', function(){
  ok(_V_.uc('asdf') === "Asdf");
});

test('should trim a string', function(){
  ok(_V_.trim(' asdf ') === "asdf");
});

test('should round a number', function(){
  ok(_V_.round(1.01) === 1);
  ok(_V_.round(1.01, 1) === 1.0);
  ok(_V_.round(1.01, 2) === 1.01);
  ok(_V_.round(1.05, 1) === 1.1);
});

test('should test that an object is empty', function(){
  ok(_V_.isEmpty({}) === true);
  ok(_V_.isEmpty({ asdf: 'asdf' }) === false);
});

test('should create a fake timerange', function(){
  var tr = _V_.createTimeRange(0, 100);

  ok(tr.start() === 0);
  ok(tr.end() === 100);
  ok(tr.length === 1);
});