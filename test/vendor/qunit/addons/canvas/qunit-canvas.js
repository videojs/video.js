QUnit.extend( QUnit, {
	pixelEqual: function(canvas, x, y, r, g, b, a, message) {
		var actual = Array.prototype.slice.apply(canvas.getContext('2d').getImageData(x, y, 1, 1).data), expected = [r, g, b, a];
		QUnit.push(QUnit.equiv(actual, expected), actual, expected, message);
	}
});
