/**
 * Computes the median of an array.
 *
 * @param {number[]} arr
 *        Input array of numbers.
 *
 * @return {number}
 *        Median value.
 */
const median = arr => {
  const mid = Math.floor(arr.length / 2);
  const sortedList = [...arr].sort((a, b) => a - b);

  return arr.length % 2 !== 0 ? sortedList[mid] : (sortedList[mid - 1] + sortedList[mid]) / 2;
};

export default median;
