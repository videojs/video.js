# Middleware

Middleware is a Video.js feature that allows interaction with and modification of how the `Player` and `Tech` talk to each other. For more in-depth information, check out our [feature spotlight](https://videojs.com/blog/feature-spotlight-middleware/).

## Table of Contents

* [Understanding Middleware](#understanding-middleware)
  * [setSource](#setsource)
  * [setTech](#settech)
  * [Middleware Setters](#middleware-setters)
  * [Middleware Getters](#middleware-getters)
  * [Middleware Mediators](#middleware-mediators)
  * [Termination and Mediators](#termination-and-mediators)
* [Using Middleware](#using-middleware)
  * [Terminating Mediator Methods](#terminating-mediator-methods)

## Understanding Middleware

Middleware are functions that return an object, a class instance, a prototype, etc, scoped to the Player with methods matching those on the `Tech`. There are currently a limited set of allowed methods that will be understood by middleware. These are: `buffered`, `currentTime`, `setCurrentTime`, `setMuted`, `setVolume`, `duration`, `muted`, `seekable`, `played`, `play`, `pause`, `paused` and `volume`. These allowed methods are split into three categories: [getters](#middleware-getters), [setters](#middleware-setters), and [mediators](#middleware-mediators).

There are a few special methods that affect middleware: `setSource` and `setTech`. These are called internally by Video.js when you call `player.src()`.

### setSource

> _NOTE_: In versions of Video.js 7.0.5 and older, `setSource` was required for all middleware and had be included in the returned objects.

This method will setup the routing between a specific source and middleware and eventually sets the source on the `Tech`.

If your middleware is not manipulating, redirecting or rejecting the source, you may leave this method out on newer versions of Video.js. Doing so will select middleware implicitly.

In versions 7.0.5 and older, to get your middleware selected, you can pass along the source by doing the following:

```js
videojs.use('*', function(player) {
  return {
    setSource: function(srcObj, next) {
      // pass null as the first argument to indicate that the source is not rejected
      next(null, srcObj);
    }
  };
});
```

### setTech

`setTech` is a method that associates middleware with a specific `Tech` once it has been selected by the `Player`, after middleware make a decision on which source to set. This does not need to be included in your middleware.

### Middleware Setters

    +----------+                      +----------+
    |          |  setter middleware   |          |
    |          +---------------------->          |
    |  Player  |                      |   Tech   |
    |          <----------------------+          |
    |          |  getter middleware   |          |
    +----------+                      +----------+

Setters will be called on the `Player` first and run through middleware in the order they were registered in (from left to right in the diagram) before calling the method, with its arguments, on the `Tech`.

### Middleware Getters

Getters are called on the `Tech` first and are run though middleware in reverse of the order they were registered in (from right to left in the diagram) before returning the result to the `Player`.

### Middleware Mediators

Mediators are methods that not only change the state of the `Tech`, but also return some value back to the `Player`. Currently, these are `play` and `pause`.

Mediators are called on the `Player` first, run through middleware in the order they were registered (from left to right in the below diagram), then called on the `Tech`. The result is returned to the `Player` unchanged, while calling the middleware in the reverse order of how they were registered (from right to left in the diagram.) For more information on mediators, check out the [mediator section](#termination-and-mediators).

    +----------+                      +----------+
    |          |                      |          |
    |          +---mediate-to-tech---->          |
    |  Player  |                      |   Tech   |
    |          <--mediate-to-player---+          |
    |          |                      |          |
    +----------+                      +----------+

### Termination and Mediators

Mediators make a round trip: starting at the `Player`, mediating to the `Tech` and returning the result to the `Player` again. A `call{method}` method must be supplied by the middleware which is used when mediating to the `Tech`. On the way back to the `Player`, the `{method}` will be called instead, with 2 arguments: `terminated`, a Boolean indicating whether a middleware terminated during the mediation to the tech portion, and `value`, which is the value returned from the `Tech`.

    +----------+                      +----------+
    |          |                      |          |
    |          +----+call{method}+---->          |
    |  Player  |                      |   Tech   |
    |          <------+{method}+------+          |
    |          |                      |          |
    +----------+                      +----------+

A skeleton of a middleware with Mediator methods is given below:

```js
var myMiddleware = function(player) {
  return {
    callPlay: function() {
      // mediating to the Tech
      ...
    },
    play: function(terminated, value) {
      // mediating back to the Player
      ...
    },
    ...
  };
};
```

Middleware termination occurs when a middleware method decides to stop mediating to the `Tech`. We'll see more examples of this in the [next section](#terminating-mediator-methods).

## Using Middleware

Middleware are registered to a video MIME type, and will be run for any source with that type.

```js
videojs.use('video/mp4', myMiddleware);
```

You can also register a middleware on all sources by registering it on `*`.

```js
videojs.use('*', myMiddleware);
```

Your middleware should be a function that is scoped to a player and returns an object, class instance, etc, with methods on it that match those on the `Tech`. An example of a middleware that returns an object is below:

```js
var myMiddleware = function(player) {
  return {
    setSource: function(srcObj, next) {
      // pass null as the first argument to indicate that the source is not rejected
      next(null, srcObj);
    },
    currentTime: function(ct) {
      return ct / 2;
    },
    setCurrentTime: function(time) {
      return time * 2;
    }
  };
};

videojs.use('*', myMiddleware);
```

And the same example with `setSource` omitted:

```js
var myMiddleware = function(player) {
  return {
    currentTime: function(ct) {
      return ct / 2;
    },
    setCurrentTime: function(time) {
      return time * 2;
    }
  };
};

videojs.use('*', myMiddleware);
```

This middleware gives the appearance of the video source playing at double its speed, by halving the time we _get_ from the `Tech`, and doubling the time we _set_ on the `Tech`.

An example of a middleware that uses Mediator methods is below:

```js
var myMiddleware = function(player) {
  return {
    setSource: function(srcObj, next) {
      // pass null as the first argument to indicate that the source is not rejected
      next(null, srcObj);
    },
    callPlay: function() {
      // Do nothing, thereby allowing play() to be called on the Tech
    },
    play: function(terminated, value) {
      if (terminated) {
        console.log('The play was middleware terminated.');

      // the value is a play promise
      } else if (value && value.then) {
        value
          .then(function() {
            console.log('The play succeeded!')
          })
          .catch(function (err) {
            console.log('The play was rejected', err);
          });
      }
    }
  };
};

videojs.use('*', myMiddleware);
```

This middleware allows the call to `play()` to go through to the `Tech`, and checks in `play` whether the play succeeded or not. A more detailed example can be found in our [sandbox](https://github.com/videojs/video.js/blob/main/sandbox/middleware-play.html.example).

### Terminating Mediator Methods

Mediator methods can terminate, by doing the following:

```js
var myMiddleware = function(player) {
  return {
    setSource: function(srcObj, next) {
      // pass null as the first argument to indicate that the source is not rejected
      next(null, srcObj);
    },
    callPlay: function() {
      // Terminate by returning the middleware terminator
      return videojs.middleware.TERMINATOR;
    },
    play: function(terminated, value) {
      // the terminated argument should be true here.
      if (terminated) {
        console.log('The play was middleware terminated.');
      }
    }
  };
};

videojs.use('*', myMiddleware);
```

This middleware always terminates calls to `play()` by returning the `TERMINATOR` in `callPlay`. In `play` we are able to see that the call to `play()` was terminated and was never called on the `Tech`.
