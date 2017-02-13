# Playback Technology ("Tech")

Playback Technology refers to the specific browser or plugin technology used to play the video or audio.
When using HTML5, the playback technology is the video or audio element. When using Flash and the
[videojs-flash project](http://github.com/videojs/videojs-flash), the playback technology is the specific Flash player used,
e.g. Flowplayer, YouTube Player, video-js.swf, etc. (not just "Flash"). This could also include Silverlight,
Quicktime, or any other plugin that will play back video in the browser, as long as there is an API wrapper written for it.

Essentially we're using HTML5 and plugins only as video decoders, and using HTML and JavaScript to create a
consistent API and skinning experience across all of them.

## Table of Contents

* [Writing a new Tech](#writing-a-new-tech)
* [Proritizing Techs using techOrder](#proritizing-techs-using-techorder)
* [Resources](#resources)

## Writing a new Tech

When writing a Tech you will have to integrate your technology's API with the existing API. In the following examples
we are going to make a clone of the base `Tech` class which would not actually play back any media.

ES6 Example of a new Tech

```js
const Tech = videojs.getTech('Tech');
class MyTech extnds Tech {
  constructor(options, ready) {
    super(options, ready);
    console.log('My new Tech!');
  }
}

// Add our new Tech to the internal Tech list and to the back of the default tech order list
videojs.registerTech('MyTech', MyTech);
```

ES5 Example of a new Tech

```js
var Tech = videojs.getTech('Tech');
var MyTech = videojs.extend(Tech, {
  constructor: function(options, ready) {
    Tech.call(options, ready);
    console.log('My new Tech!');
  }
});

// Add our new Tech to the internal Tech list and to the back of the default tech order list
videojs.registerTech('MyTech', MyTech);
```

For more information on what methods and events a `Tech` is required to implement. See the [Html5 tech API](https://github.com/videojs/video.js/blob/master/src/js/tech/html5.js)

## Proritizing Techs using `techOrder`

By default Video.js performs "Tech-first" ordering when it searches for a source/tech combination to play videos.
This means that if you have two sources and two techs, video.js will try to play each video with the first tech in
the `techOrder` option property before moving on to try the next playback technology. By default Techs will be added
to the `techOrder` in the order in which they were registered to video.js. So in our `MyTech` example above it would
look something like this:

```json
['Html5', 'MyTech']
```

Tech-first is only a problem when you want to prioritize techs differently than the order of registration. To demonstrate how you would change that lets give some examples:

Example 1: Only use `MyTech`:

```js
var player = videojs('some-player-id', {techOrder: ['MyTech']});
```

Example 2: Use `MyTech` and fallback to `Html5` when `MyTech` cannot playback a video:

```html
var player = videojs('some-player-id', {techOrder: ['MyTech', 'Html5']});
```

> Note: each of these examples use JavaScript only, but it is possible to pass the `techOrder` using HTML by using the [`data-setup` attribute on a video](./setup.md#automatic-setup).

## Resources

Here are some examples of a `Tech` which you can use as resources when designing a new `Tech`:

* [The Html5 Tech](https://github.com/videojs/video.js/blob/master/src/js/tech/html5.js)
* [The videojs-flash project](http://github.com/videojs/videojs-flash/blob/master/src/index.js)
