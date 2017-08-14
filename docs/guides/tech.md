# Playback Technology ("Tech")

Playback Technology refers to the specific browser or plugin technology used to play the video or audio. When using HTML5, the playback technology is the video or audio element. When using Flash from [videojs-flash][flash], the playback technology is the video-js.swf Flash object. When using the [videojs-youtube][youtube] tech, the playback technology is the You Tube player. The tech also includes an API wrapper to translate between the Video.js controls and API to the specific playback technology used.

Essentially we're using html5 and plugins only as video decoders, and using HTML and JavaScript to create a consistent API and skinning experience across all of them.

In addition to techs there are source handlers. Source handlers add the capability to play additional source types to techs. For example, the [videojs-contrib-hls][hls] source handler enables the HTML5 and Flash techs to play HLS.

## Building an API Wrapper

We'll write a more complete guide on writing a wrapper soon, but for now the best resource is the [Video.js](https://github.com/videojs/video.js/tree/master/src/js/tech) source where you can see how the HTML5 API wrapper is created.

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
<video data-setup='{"techOrder": ["html5", "flash", "other supported tech"]}'>
```

### Object Method:

```js
videojs("videoID", {
  techOrder: ["html5", "flash", "other supported tech"]
});
```

## Technology Ordering

When Video.js is given an array of sources, which to use is determined by finding the first supported source / tech combination. Each tech will be queried in the order specified in `techOrder` whether it can play the first source. The first match wins. If no tech can play the first source, then the next will be tested. It's important to set the `type` of each source correctly for this test to be accurate.

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

The Flash playback tech was previously included in Video.js core and was included in the default `techOrder`. As of version 6, the Flash tech was moved to a separate [videojs-flash plugin][flash] which you would need to include if you still need to use Flash.

It's increasingly likely that end users don't have Flash or their browser has either disabled it or puts a click-to-play or other barrier to using it, so it's strongly recommended to use an alternative such as HLS.

### Enabling RTMP Streaming Playback

In order to force the Flash tech to choose streaming playback, you need to provide a valid streaming source **before other valid Flash video sources**. This is necessary because of the source selection algorithm, where playback tech chooses the first possible source object with a valid type. Valid streaming `type` values include `rtmp/mp4` and `rtmp/flv`. The streaming `src` value requires valid connection and stream strings, separated by an `&`. An example of supplying a streaming source through your HTML markup might look like:

```html
<source src="rtmp://your.streaming.provider.net/cfx/st/&mp4:path/to/video.mp4" type="rtmp/mp4">
<source src="http://your.static.provider.net/path/to/video.mp4" type="video/mp4">
<source src="http://your.static.provider.net/path/to/video.webm" type="video/webm">
```

You may optionally use the last `/` as the separator between connection and stream strings, for example:

```html
<source src="rtmp://your.streaming.provider.net/cfx/st/mp4:video.mp4" type="rtmp/mp4">
```

All four RTMP protocols are valid in the `src` (RTMP, RTMPT, RTMPE, and RTMPS).

#### A note on sandboxing and security

In some environments, such as Electron and NW.js apps, stricter policies are enforced, and `.swf` files won’t be able to communicate with the outside world out of the box. To stream media, you have to add them to a special manifest of trusted files. [nw-flash-trust](https://github.com/szwacz/nw-flash-trust) makes this job easy.

Browsers also prevent the Flash tech from working when you load a page from the filesystem (with the `file:` protocol) and also in sandboxed iframes.

[flash]: https://github.com/videojs/videojs-flash

[hls]: https://github.com/videojs/videojs-contrib-hls

[mse]: https://en.wikipedia.org/wiki/Media_Source_Extensions

[youtube]: https://github.com/videojs/videojs-youtube
