test("Close Numbers", function () {

	QUnit.close(7, 7, 0);
	QUnit.close(7, 7.1, 0.1);
	QUnit.close(7, 7.1, 0.2);
	
	QUnit.close(3.141, Math.PI, 0.001);
	QUnit.close(3.1, Math.PI, 0.1);
	
	var halfPi = Math.PI / 2;
	QUnit.close(halfPi, 1.57, 0.001);
	
	var sqrt2 = Math.sqrt(2);
	QUnit.close(sqrt2, 1.4142, 0.0001);
	
	QUnit.close(Infinity, Infinity, 1);	
	
});

test("Distant Numbers", function () {

	QUnit.notClose(6, 7, 0);
	QUnit.notClose(7, 7.2, 0.1);
	QUnit.notClose(7, 7.2, 0.19999999999);
	
	QUnit.notClose(3.141, Math.PI, 0.0001);
	QUnit.notClose(3.1, Math.PI, 0.001);
	
	var halfPi = Math.PI / 2;
	QUnit.notClose(halfPi, 1.57, 0.0001);
	
	var sqrt2 = Math.sqrt(2);
	QUnit.notClose(sqrt2, 1.4142, 0.00001);
	
	QUnit.notClose(Infinity, -Infinity, 5);

});