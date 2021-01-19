# Playback Technology ("Tech")

Playback Technology refers to the specific browser or plugin technology used to play the video or audio. When using HTML5, the playback technology is the video or audio element. When using the [videojs-youtube][youtube] tech, the playback technology is the YouTube player. The tech also includes an API wrapper to translate between the Video.js controls and API to the specific playback technology used.

Essentially we're using html5 and plugins only as video decoders, and using HTML and JavaScript to create a consistent API and skinning experience across all of them.

In addition to techs there are source handlers. Source handlers add the capability to play additional source types to techs. For example, the [http-streaming][http-streaming] source handler (included with Video.js 7+ by default) enables the HTML5 tech to play HLS and DASH.

## Building an API Wrapper

We'll write a more complete guide on writing a wrapper soon, but for now the best resource is the [Video.js](https://github.com/videojs/video.js/tree/main/src/js/tech) source where you can see how the HTML5 API wrapper is created.

## Required Methods

canPlayType
play
pause
currentTime
volume
duration
buffered
supportsFullScreen

## Required Events

loadstart
play
pause
playing
ended
volumechange
durationchange
error

## Optional Events (include if supported)

timeupdate
progress
enterFullScreen
exitFullScreen

## Adding Playback Technology

When additional techs are added they are automatically added to the `techOrder`. You can modify the `techOrder` to change the priority of each tech.

### Tag Method:

```html
<video data-setup='{"techOrder": ["html5", "other supported tech"]}'>
```

### Object Method:

```js
videojs("videoID", {
  techOrder: ["html5", "other supported tech"]
});
```

### Posters

By default, techs will have to handle their own posters and are somewhat locked out of the player's poster lifecycle.
However, when the player is initialized with the `techCanOverridePoster` option
it will be possible for techs to integrate into that lifecycle  and the player's `PosterImage` component to be used.

Techs can check if they have this capability by checking the `canOverridePoster` boolean in their options.

**`techCanOverridePoster` requirements**

* `poster()` which returns the tech's current poster url
* `setPoster()` which updates the tech's poster url and triggers a `posterchange` event
  which the player will handle

## Technology Ordering

When Video.js is given an array of sources, which to use is determined by finding the first supported source / tech combination. Each tech will be queried in the order specified in `techOrder` whether it can play the first source. The first match wins. If no tech can play the first source, then the next will be tested. It's important to set the `type` of each source correctly for this test to be accurate.

> These example use the obsolete [Flash tech][flash-eol], for illustration of tech ordering with techs which have a greater degree of overlap in sources they can play

For example, given the following video element, assuming the [videojs-flash][flash] tech and [videojs-contrib-hls][hls] source handler are available:

```html
<!-- "techOrder": ["html5", "flash"] -->
<video
  <source src="http://your.static.provider.net/path/to/video.m3u8" type="application/x-mpegURL">
  <source src="http://your.static.provider.net/path/to/video.mp4" type="video/mp4">
</video>
```

The HLS source will be tested first. The first tech is html5.

* Safari can play HLS in a standard HTML5 video element, so HLS will be played using the html5 tech
* Chrome can't play HLS in the standard HTML5 video element on its own, but the videojs-contrib-hls source handler _can_ play HLS via [Media Source Extensions][mse] in HTML5. So HLS will be played in the html5 tech
* IE 10 can't play HLS natively, and doesn't support Media Source Extensions. As the source cannot be played in HTML5, the Flash tech can be tested. The videojs-contrib-hls source handler can play HLS in the Flash tech, so HLS will be played in the Flash tech.

Now take the same sources again with videojs-contrib-hls but without videojs-flash:

```html
<!-- "techOrder": ["html5"] -->
<video
  <source src="http://your.static.provider.net/path/to/video.m3u8" type="application/x-mpegURL">
  <source src="http://your.static.provider.net/path/to/video.mp4" type="video/mp4">
</video>
```

* Safari will play HLS in the html5 tech
* Chrome will play HLS in the html5 tech by means of videojs-contrib-hls
* IE 10 can't play HLS in either the html5 or Flash tech. Next the MP4 source will be tested. MP4 can be played by HTML5, so that source-tech pair will be used.

This time, we have videojs-flash but not videojs-contrib-hls:

```html
<!-- "techOrder": ["html5", "flash"] -->
<video
  <source src="http://your.static.provider.net/path/to/video.m3u8" type="application/x-mpegURL">
  <source src="http://your.static.provider.net/path/to/video.mp4" type="video/mp4">
</video>
```

* Safari will play HLS in the html5 tech
* Chrome can't play HLS in the html5 or flash tech, so will play MP4 in the html5 tech.
* IE 10 also can't play HLS in either the html5 or Flash tech and will also play MP4 in the html5 tech.

## Flash Technology

Flash is no longer supported as it has reached [flash-eol][end of life]

[flash-eol]: https://www.adobe.com/products/flashplayer/end-of-life.html

[hls]: https://github.com/videojs/videojs-contrib-hls

[http-streaming]: https://github.com/videojs/http-streaming

[mse]: https://en.wikipedia.org/wiki/Media_Source_Extensions

[youtube]: https://github.com/videojs/videojs-youtube
