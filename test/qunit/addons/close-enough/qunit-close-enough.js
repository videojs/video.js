QUnit.extend( QUnit, {
	/**
	 * Checks that the first two arguments are equal, or are numbers close enough to be considered equal
	 * based on a specified maximum allowable difference.
	 *
	 * @example close(3.141, Math.PI, 0.001);
	 *
	 * @param Number actual
	 * @param Number expected
	 * @param Number maxDifference (the maximum inclusive difference allowed between the actual and expected numbers)
	 * @param String message (optional)
	 */
	close: function(actual, expected, maxDifference, message) {
		var passes = (actual === expected) || Math.abs(actual - expected) <= maxDifference;
		QUnit.push(passes, actual, expected, message);
	},
	
	/**
	 * Checks that the first two arguments are numbers with differences greater than the specified 
	 * minimum difference.
	 *
	 * @example notClose(3.1, Math.PI, 0.001);
	 *
	 * @param Number actual
	 * @param Number expected
	 * @param Number minDifference (the minimum exclusive difference allowed between the actual and expected numbers)
	 * @param String message (optional)
	 */
	notClose: function(actual, expected, minDifference, message) {
		QUnit.push(Math.abs(actual - expected) > minDifference, actual, expected, message);
	}
});