# Middleware

Middleware is a Video.js feature that allows interaction with and modification of how the `Player` and `Tech` talk to each other. For more in-depth information, check out our [feature spotlight](http://blog.videojs.com/feature-spotlight-middleware/).

## Table of Contents

* [Understanding Middleware](#understanding-middleware)
  * [Middleware Setters](#middleware-setters)
  * [Middleware Getters](#middleware-getters)
  * [Middleware Mediators](#middleware-mediators)
  * [Termination and Mediators](#termination-and-mediators)
* [Using Middleware](#using-middleware)
  * [Terminating Mediator Methods](#terminating-mediator-methods)
* [setSource](#setsource)

## Understanding Middleware

Middleware are functions that return an object with methods matching those on the `Tech`. There are currently a limited set of allowed methods that will be understood by middleware. These are: `buffered`, `currentTime`, `setCurrentTime`, `duration`, `seekable`, `played`, `play`, `pause` and `paused`.

These allowed methods are split into three categories: `getters`, `setters`, and `mediators`.

### Middleware Setters
Setters will be called on the `Player` first and run through middleware (from left to right) before calling the method, with its arguments, on the `Tech`.

### Middleware Getters
Getters are called on the `Tech` first and are run though middleware (from right to left) before returning the result to the `Player`.

### Middleware Mediators
Mediators are called on the `Player` first, run through middleware (from left to right), then called on the `Tech`. The result is returned to the `Player` unchanged, while calling the middleware from right to left. For more information on mediators, check out the [mediator section](#termination-and-mediators).

```
+----------+                      +----------+
|          |  setter middleware   |          |
|          +---------------------->          |
|  Player  |                      |   Tech   |
|          <----------------------+          |
|          |  getter middleware   |          |
+----------+                      +----------+
```

### Termination and Mediators

Mediators are the third category of allowed methods. These are methods that not only change the state of the Tech, but also return some value back to the Player. Currently, these are `play` and `pause`.

```
               mediate to tech
               +------------->

+----------+                      +----------+
|          |                      |          |
|          +-----call{method}----->          |
|  Player  |                      |   Tech   |
|          <-------{method}-------+          |
|          |                      |          |
+----------+                      +----------+

              <---------------+
              mediate to player

```

Mediators make a round trip: starting at the `Player`, mediating to the `Tech` and returning the result to the `Player` again. A `call{method}` method must be supplied by the middleware which is used when mediating to the `Tech`. On the way back to the `Player`, the `{method}` will be called instead, with 2 arguments: `terminated`, a Boolean indicating whether a middleware terminated during the mediation to the tech portion, and `value`, which is the value returned from the `Tech`. A barebones example of a middleware with Mediator methods is:

```
var myMiddleware = function(player) {
  return {
    callPlay: function() {
      // mediating to the Tech
      ...
    },
    pause: function(terminated, value) {
      // mediating back to the Player
      ...
    },
    ...
  };
};
```

Middleware termination occurs when a middleware method decides to stop mediating to the Tech. We'll see more examples of this in the [next section](#terminating-mediator-methods).

## Using Middleware

Middleware are registered to a video MIME type, and will be run for any source with that type.

```javascript
videojs.use('video/mp4', myMiddleware);
```

You can also register a middleware on all sources by registering it on `*`.

```javascript
videojs.use('*', myMiddleware);
```

Your middleware should be a function that takes a player as an argument and returns an object with methods on it like below:

```javascript
var myMiddleware = function(player) {
  return {
    currentTime: function(ct) {
      return ct / 2;
    },
    setCurrentTime: function(time) {
      return time * 2;
    },
    ...
  };
};

videojs.use('*', myMiddleware);
```

### Terminating Mediator Methods

Mediator methods can terminate, by doing the following:

```javascript
var myMiddleware = function(player) {
  return {
    callPlay: function() {
      // Terminate by returning the middleware terminator
      return videojs.middleware.TERMINATOR;
    },
    play: function(terminated, value) {
      // the terminated argument should be true here.
    },
    ...
  };
};

videojs.use('*', myMiddleware);
```

## setSource

`setSource` is a required method for all middleware and must be included in the returned object. If your middlware is not manipulating or rejecting the source, you can pass along the source by doing the following:

```javascript
videojs.use('*', function(player) {
  return {
    setSource: function(srcObj, next) {
      // pass null as the first argument to indicate that the source is not rejected
      next(null, srcObj);
    }
  };
});
```
