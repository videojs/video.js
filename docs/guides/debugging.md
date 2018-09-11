# Debugging

## Table of Contents

* [Logging](#logging)
  * [API Overview](#api-overview)
  * [Log Safely](#log-safely)
  * [Log Objects Usefully](#log-objects-usefully)
  * [Creating new Loggers](#creating-new-loggers)
  * [Log Levels](#log-levels)
  * [Available Log Levels](#available-log-levels)
  * [Debug Logging](#debug-logging)
  * [History](#history)
    * [History filtering](#history-filtering)

## Logging

Video.js includes `videojs.log`, a lightweight wrapper around a subset of [the `console` API][console]. The available methods are `videojs.log`, `videojs.log.debug`, `videojs.log.warn`, and `videojs.log.error`.

### API Overview

Most of these methods should be fairly self-explanatory, but for complete details, see [the API docs][api].

| Method                          | Alias Of        | Matching Level(s)             |
| ------------------------------- | --------------- | ----------------------------- |
| `videojs.log()`                 | `console.log`   | all, debug, info              |
| `videojs.log.debug()`           | `console.debug` | all, debug                    |
| `videojs.log.warn()`            | `console.warn`  | all, debug, info, warn        |
| `videojs.log.error()`           | `console.error` | all, debug, info, warn, error |
| `videojs.log.createLogger()`    | n/a             | n/a                           |
| `videojs.log.level()`           | n/a             | n/a                           |
| `videojs.log.history()`         | n/a             | n/a                           |
| `videojs.log.history.clear()`   | n/a             | n/a                           |
| `videojs.log.history.disable()` | n/a             | n/a                           |
| `videojs.log.history.enable()`  | n/a             | n/a                           |
| `videojs.log.history.filter()`  | n/a             | n/a                           |

For descriptions of these features, please refer to the sections below.

### Log Safely

Unlike the `console`, it's safe to leave `videojs.log` calls in your code. They won't throw errors when the `console` doesn't exist.

### Log Objects Usefully

Similar to the `console`, any number of mixed-type values can be passed to `videojs.log` methods:

```js
videojs.log('this is a string', {butThis: 'is an object'});
```

### Creating new Loggers

Sometimes, you want to make a new module or plugin and log messages with a label. Kind of how all these logs are prepended with `VIDEOJS:`. You can do that via the `createLogger` method. It takes a name and gives you back a log object like `videojs.log`. Here's an example:

```js
const mylogger = videojs.log.createLogger('mylogger');

mylogger('hello world!');
// > VIDEOJS: mylogger: hello world!

// We can even chain it further
const anotherlogger = mylogger.createLogger('anotherlogger');

anotherlogger('well, hello there');
// > VIDEOJS: mylogger: anotherlogger: well, hello there
```

### Log Levels

Unlike the `console`, `videojs.log` includes the concept of logging levels. These levels toggle logging methods on or off.

Levels are exposed through the `videojs.log.level` method. This method acts as both a getter and setter for the current logging level. With no arguments, it returns the current logging level:

```js
videojs.log.level(); // "info"
```

By passing a string, the logging level can be changed to one of the available logging levels:

```js
videojs.log.level('error'); // show only error messages and suppress others
videojs.log('foo'); // does nothing
videojs.log.warn('foo'); // does nothing
videojs.log.error('foo'); // logs "foo" as an error
```

### Available Log Levels

* **info** (default): only show `log`, `log.warn`, and `log.error` messages
* **all**: enables all logging methods
* **error**: only show `log.error` messages
* **off**: disable all logging methods
* **warn**: only show `log.warn` _and_ `log.error` messages
* **debug**: show `log`, `log.debug`, `log.warn`, and `log.error` messages

### Debug Logging

Although the log levels attempt to match their `window.console` counterparts, `window.console.debug` is not available on all platforms. As such, it will use the closest comparable method, falling back from `window.console.debug` to `window.console.info` to `window.console.log`, and ultimately to nothing if none of those methods are available.

### History

> **Note:** In Video.js 5, `videojs.log.history` was an array. As of Video.js 6, it is a function which returns an array. This change was made to provide a richer, safer logging history API. You can also filter the history based on the name of the logger.

By default, the `videojs.log` module tracks a history of _everything_ passed to it regardless of logging level:

```js
videojs.log.history(); // an array of everything that's been logged up to now
```

This will work even when logging is set to **off**.

This can be useful, but it can also be a source of memory leaks. For example, logged objects will be retained in history even if references are removed everywhere else!

To avoid this problem, history can be disabled or enabled via method calls (using the `disable` and `enable` methods respectively). Disabling history is as easy as:

```js
videojs.log.history.disable();
```

Finally, the history (if enabled) can be cleared at any time via:

```js
videojs.log.history.clear();
```

#### History filtering

If you want to find all the history that was created by a particular logger, you can do so via `history.filter()`.
Given a specific logger with name `foo`, you can pass `foo` to `history.filter()` and get all items logger by foo.
Let me show you an example:

```js
const mylogger = videojs.log.createLogger('mylogger');
const anotherlogger = mylogger.createLogger('anotherlogger');

videojs.log('hello');
mylogger('how are you');
anotherlogger('today');

videojs.log.history.filter('VIDEOJS');
// > [['VIDEOJS:', 'hello'], ['VIDEOJS: mylogger:', 'how are you'], ['VIDEOJS: mylogger: anotherlogger:', 'today']]
videojs.log.history.filter('mylogger');
// > [['VIDEOJS:    mylogger:', 'how are you'], ['VIDEOJS: mylogger: anotherlogger:', 'today']]
videojs.log.history.filter('anotherlogger');
// > [['VIDEOJS: mylogger: anotherlogger:', 'today']]
```

[api]: https://docs.videojs.com/

[console]: https://developer.mozilla.org/en-US/docs/Web/API/Console
