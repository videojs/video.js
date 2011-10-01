Close-Enough - A QUnit Addon For Number Approximations
================================

This addon for QUnit adds close and notClose assertion methods, to test that
numbers are close enough (or different enough) from an expected number, with
a specified accuracy.

Usage:

    close(actual, expected, maxDifference, message)
    notClose(actual, expected, minDifference, message)

Where:

  * maxDifference: the maximum inclusive difference allowed between the actual and expected numbers
  * minDifference: the minimum exclusive difference allowed between the actual and expected numbers
  * actual, expected, message: The usual
