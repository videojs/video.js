# Middleware

Middleware is a Video.js feature that allows interaction with and modification of how the `Player` and `Tech` talk to each other. For more in-depth information, check out our [feature spotlight](http://blog.videojs.com/feature-spotlight-middleware/).

## Table of Contents

* [Understanding Middleware](#understanding-middleware)
* [Using Middleware](#using-middleware)
* [setSource](#set-source)

## Understanding Middleware

Middleware are functions that return an object with methods matching those on the `Tech`. There are currently a limited set of allowed methods that will be understood by middleware, and can be referenced in the [middleware source](https://github.com/videojs/video.js/blob/master/src/js/tech/middleware.js).

These allowed methods are split into two categories: `getters` and `setters`. Setters will be called on the `Player` first and run through middleware(from left to right) before calling the method, with its arguments, on the `Tech`. Setters are called on the `Tech` first and are run though middleware(from right to left) before returning the result to the `Player`.

```
+----------+                      +----------+
|          |  setter middleware   |          |
|          +---------------------->          |
|  Player  |                      |   Tech   |
|          <----------------------+          |
|          |  getter middleware   |          |
+----------+                      +----------+
```

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
  currentTime: function(ct) {
    return ct / 2;
  },
  setCurrentTime: function(time) {
    return time * 2;
  },
  ...
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

