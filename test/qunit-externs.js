// https://github.com/lukeasrodgers/qunit-js-externs/blob/master/qunit-externs.js

/**
 * @param {string} name
 * @param {Object=} lifecycle
 */
function module(name, lifecycle) {}

/**
 * @param {string} title
 * @param {number|Function} expected
 * @param {Function=} test_func
 */
function test(title, expected, test_func){}

/**
 * @param {string} name
 * @param {number|Function} expected
 * @param {Function=} test_func
 */
function asyncTest(name, expected, test_func){}

/**
 * @param {number} amount
 */
function expect(amount){}

/**
 * @param {*} state
 * @param {string=} message
 */
function ok(state, message){}

/**
 * @param {*} actual
 * @param {*} expected
 * @param {string=} message
 */
function equal(actual, expected, message){}

/**
 * @param {*} actual
 * @param {*} expected
 * @param {string=} message
 */
function notEqual(actual, expected, message){}

/**
 * @param {*} actual
 * @param {*} expected
 * @param {string=} message
 */
function deepEqual(actual, expected, message){}

/**
 * @param {*} actual
 * @param {*} expected
 * @param {string=} message
 */
function notDeepEqual(actual, expected, message){}

/**
 * @param {*} actual
 * @param {*} expected
 * @param {string=} message
 */
function strictEqual(actual, expected, message){}

/**
 * @param {*} actual
 * @param {*} expected
 * @param {string=} message
 */
function notStrictEqual(actual, expected, message){}

/**
 * @param {number=} increment
 */
function start(increment){}

/**
 * @param {number=} increment
 */
function stop(increment){}
