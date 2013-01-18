module('Step Addon');
test("step", 3, function () {
	QUnit.step(1, "step starts at 1");
	setTimeout(function () {
		start();
		QUnit.step(3);
	}, 100);
	QUnit.step(2, "before the setTimeout callback is run");
	stop();
});
test("step counter", 1, function () {
	QUnit.step(1, "each test has its own step counter");
});