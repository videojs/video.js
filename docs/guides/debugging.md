# Debugging

## Table of Contents

* [Logging](#logging)
  * [API Overview](#api-overview)
  * [Log Safely](#log-safely)
  * [Log Objects Usefully](#log-objects-usefully)
  * [Log Levels](#log-levels)
  * [Available Log Levels](#available-log-levels)
  * [History](#history)

## Logging

Video.js includes a lightweight wrapper - `videojs.log` - around a subset of [the `console` API][console]. The available methods are `videojs.log`, `videojs.log.warn`, and `videojs.log.error`.

### API Overview

Most of these methods should be fairly self-explanatory, but for complete details, see [the API docs][api].

| Method                          | Alias Of        | Matching Level(s) |
| ------------------------------- | --------------- | ----------------- |
| `videojs.log()`                 | `console.log`   | all               |
| `videojs.log.warn()`            | `console.warn`  | all, warn         |
| `videojs.log.error()`           | `console.error` | all, warn, error  |
| `videojs.log.level()`           | n/a             | n/a               |
| `videojs.log.history()`         | n/a             | n/a               |
| `videojs.log.history.clear()`   | n/a             | n/a               |
| `videojs.log.history.disable()` | n/a             | n/a               |
| `videojs.log.history.enable()`  | n/a             | n/a               |

For descriptions of these features, please refer to the sections below.

### Log Safely

Unlike the `console`, it's safe to leave `videojs.log` calls in your code. They won't throw errors when the `console` doesn't exist.

### Log Objects Usefully

Similar to the `console`, any number of mixed-type values can be passed to `videojs.log` methods:

```js
videojs.log('this is a string', {butThis: 'is an object'});
```

However, certain browser consoles (namely, IE10 and lower) do not support non-string values. Video.js improves on this situation by passing objects through `JSON.stringify` before logging them in IE10 and below. In other words, instead of the above producing this:

```txt
VIDEOJS: this is a string [object Object]
```

it will produce this:

```txt
VIDEOJS: this is a string {"butThis": "is an object"}
```

### Log Levels

Unlike the `console`, `videojs.log` includes the concept of logging levels. These levels toggle logging methods on or off.

Levels are exposed through the `videojs.log.level` method. This method acts as both a getter and setter for the current logging level. With no arguments, it returns the current logging level:

```js
videojs.log.level(); // "all"
```

By passing a string, the logging level can be changed to one of the available logging levels:

```js
videojs.log.level('error'); // show only error messages and suppress others
videojs.log('foo'); // does nothing
videojs.log.warn('foo'); // does nothing
videojs.log.error('foo'); // logs "foo" as an error
```

### Available Log Levels

* **all** (default): enables all logging methods
* **error**: only show `log.error` messages
* **off**: disable all logging methods
* **warn**: only show `log.warn` _and_ `log.error` messages

### History

> **Note:** In Video.js 5, `videojs.log.history` was an array. As of Video.js 6, it is a function which returns an array. This change was made to provide a richer, safer logging history API.

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

[api]: http://docs.videojs.com/

[console]: https://developer.mozilla.org/en-US/docs/Web/API/Console
