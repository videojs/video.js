QUnit.step() - A QUnit Addon For Testing execution in order
============================================================

This addon for QUnit adds a step method that allows you to assert
the proper sequence in which the code should execute.

Example:

    test("example test", function () {
      function x() {
        QUnit.step(2, "function y should be called first");
      }
      function y() {
        QUnit.step(1);
      }
      y();
      x();
    });