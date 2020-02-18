/* eslint-env qunit */
import median from '../../../src/js/utils/median.js';

QUnit.module('median');

QUnit.test('should compute the median', function(assert) {
  let data;
  let expected;

  data = [2, 4, 5, 3, 8, 2];
  expected = 3.5;

  assert.equal(median(data), expected, 'median is correct for the first not sorted array');

  data = [2, 4, 5, 3, 8, 2, 9];
  expected = 4;

  assert.equal(median(data), expected, 'median is correct for the second not sorted array');

  data = [2, 2, 3, 4, 5, 8, 9];
  expected = 4;

  assert.equal(median(data), expected, 'median is correct for the sorted array');
});
