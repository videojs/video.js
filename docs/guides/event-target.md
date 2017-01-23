# Event Target

## Table of Contents

* [Overview](#overview)
* [on() and addEventListener()](#on-and-addeventlistener)
* [off() and removeEventListener()](#off-and-removeeventlistener)
* [one()](#one)
* [trigger() and dispatchEvent()](#trigger-and-dispatchevent)

## Overview

Events in video.js are setup so that they mimic the DOM API that is used on object, but also have helpful shorthand functions with the same functionality.

## `on()` and `addEventListener()`

This function is used to add an event listener to an EventTarget.

```js
var foo = new EventTarget();
var handleBar = function() {
  console.log('bar was triggered');
};

foo.on('bar', handleBar);

// This causes any `event listeners` for the `bar` event to get called
// see {@link EventTarget#trigger} for more information
foo.trigger('bar');
// logs 'bar was triggered'
```

## `off()` and `removeEventListener()`

This function is used to remove an listener function from an EventTarget.

```js
var foo = new EventTarget();
var handleBar = function() {
  console.log('bar was triggered');
};

// adds an `event listener` for the `bar` event
// see {@link EventTarget#on} for more info
foo.on('bar', handleBar);

// runs all `event listeners` for the `bar` event
// see {@link EventTarget#trigger} for more info
foo.trigger('bar');
// logs 'bar was triggered'

foo.off('bar', handleBar);
foo.trigger('bar');
// does nothing
```

## `one()`

This function is used to only have an event listener called once and never again.

Using `on()` and `off()` to mimic `one()` (not recommended)

```js
var foo = new EventTarget();
var handleBar = function() {
  console.log('bar was triggered');
  // after the first trigger remove this handler
  foo.off('bar', handleBar);
};

foo.on('bar', handleBar);
foo.trigger('bar');
// logs 'bar was triggered'

foo.trigger('bar');
// does nothing
```

Using `one()`

```js
var foo = new EventTarget();
var handleBar = function() {
  console.log('bar was triggered');
};

// removed after the first trigger
foo.one('bar', handleBar);
foo.trigger('bar');
// logs 'bar was triggered'

foo.trigger('bar');
// does nothing
```

## `trigger()` and `dispatchEvent()`

This function is used to trigger an event on an EventTarget which will cause all listeners to run.

> Note: if 'click' is in `EventTarget.allowedEvents_`, trigger will attempt to call the
>       `onClick` function if it exists.

```js
var foo = new EventTarget();
var handleBar = function() {
  console.log('bar was triggered');
};

foo.on('bar', handleBar);
foo.trigger('bar');
// logs 'bar was triggered'

foo.trigger('bar');
// logs 'bar was triggered'

foo.trigger('foo');
// does nothing
```
