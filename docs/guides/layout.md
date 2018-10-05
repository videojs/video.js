# Layout

Video.js generally lays out the player to the dimensions that are set as attributes or via CSS, like other DOM elements. However, we provide a few ways to make the player be more fluid.

## Fluid mode

Video.js has a fluid mode that keeps the player sized to a particular aspect ratio.
By default, fluid mode will use the intrinsic size of the video once loaded but you can change it with classes or with the `aspectRatio` option.
Enabling fluid mode will disable fill mode. If both are enabled, fluid mode takes precedence.

You can enable fluid in a few ways:

- Add `vjs-fluid`, `vjs-16-9`, or `vjs-4-3` as a class to the player element.
- pass `fluid` option to the player.
- call `player.fluid(true)`.
- pass `aspectRatio` option to the player.
- call `player.aspectRatio('16:9')`.

### Classes

There are three classes associated with fluid mode, `vjs-fluid`, `vjs-16-9`, and `vjs-4-3`.
`vjs-fluid` turns on the general fluid mode which will wait for the video to load to calculate the aspect ratio of the video.
Alternatively, because 16:9 and 4:3 aspect ratios are so common, we provided them as classes by default for you to use if you know that your videos are 16:9 or 4:3.

### Enabling fluid mode

You can pass in the `fluid` option to the player or call `player.fluid(true)`. This will enable the generic fluid mode.

```js
var player = videojs('vid1', {
  fluid: true
});
```

```js
var player = videojs('vid2');

player.fluid(true);
```

#### Setting Aspect Ratio

You can specify an aspect ratio for us to use if you don't want to use the intrinsic values from the video element or if you have a specific ratio in mind. It works as either a method call or an option to the player.

This option is in the form of two integers separated by a colon like so `16:9` or `4:3`.

```js
// make a vertical video
var player = videojs('vid1', {
  aspectRatio: '9:16'
});
```

```js
var player = videojs('vid2');

// make a square video
player.aspectRatio('1:1');
```


### Disabling fluid mode

You can disable fluid mode by remove the associated classes or by calling passing in `false` to the method.

```js
player.fluid(false);
```

## Fill mode

Fill mode will make the player fit and fill out its container. This is often useful if you have a responsive website and already have a container for Video.js that resizes properly to your design. It can be set either via a class or an option.

If fill is enabled, it'll turn off fluid mode. If the player is configured with both fluid and fill options, fluid mode takes precedence.

## Class

There's just one class for this one: `vjs-fill`. When available, Video.js will enter fill mode.

## Enabling fill mode

You can pass in the `fill` option to the player or call `player.fill(true)`. This will enable fill mode.

```js
var player = videojs('vid1', {
  fill: true
});
```

```js
var player = videojs('vid2');

player.fill(true);
```

## Disabling fill mode

You can disable fill mode by removing the associated class or by passing `false` in to the method.

```js
player.fill(false);
```
