# Troubleshooting

## Table of Contents

* [Problems with media formats](#problems-with-media-formats)
  * [Choosing a video format](#choosing-a-video-format)
    * [I want to have a single source and don't care about live/adaptive streaming:](#i-want-to-have-a-single-source-and-dont-care-about-liveadaptive-streaming)
    * [I need adaptive streaming or live streaming](#i-need-adaptive-streaming-or-live-streaming)
  * [Make sure you are using formats that Video.js can play:](#make-sure-you-are-using-formats-that-videojs-can-play)
  * [Make sure that the codec used in the file container is supported:](#make-sure-that-the-codec-used-in-the-file-container-is-supported)
  * [If you are using Flash videos:](#if-you-are-using-flash-videos)
* [Problems when hosting media](#problems-when-hosting-media)
* [Problems with fullscreen](#problems-with-fullscreen)
* [Problems with playback](#problems-with-playback)
* [Video.js Errors](#videojs-errors)
  * [vdata123456 errors](#vdata123456-errors)

## Problems with media formats

### Choosing a video format

#### I want to have a single source and don't care about live/adaptive streaming:

Most browsers now play [MP4 with h264][can-mp4] video. If you want to have a single source, and neither live streaming
nor adaptive streaming is a consideration, MP4 with h264 video and acc audio is a good choice.

The most common browsers which do not support MP4 are found on Linux, where the user might need to install additional codec support, and in some cases won't want to.
You can supply an array of alternate sources. [webm][can-webm] and/or [ogv][can-ogv] are useful as fallback, but neither are supported by all browsers that support MP4.

#### I need adaptive streaming or live streaming

Video.js 7+ supports HLS and MPEG-DASH as standard as it includes [http-streaming][http-streaming], which uses [Media Source Extensions][can-mse] to play these formats in modern browsers.
If choosing a single format, HLS is more convenient as iOS and some Android browsers which do not support MSE do have native HLS support.

HLS is not possible on IE 11 on Windows 7, which does not support MSE. It was possible to play HLS on this browser with Flash.

For older Video.js versions, [http-streaming][http-streaming] or its predecessors [videojs-contrib-hls][hls] and [videojs-contrib-dash][dash] add similar support, but for best results use the latest Video.js.

### Make sure you are using formats that Video.js can play:

* Does your browser/OS support the type of media that you are trying to play?
* Do you have a Video.js plugin that will add support for a media format to Video.js? For example [videojs-youtube][youtube]
* Verify that you are using the correct [mime-type/content-type][media-types] for your videos.
  This is used to determine if Video.js can play a certain type of media.

### Make sure that the codec used in the file container is supported:

* The MP4 format can contain video and audio data in many codecs, but MP4 playback in browsers typically only supports h264 video and MP3 or AAC audio.
* The file extension does not always reflect the file contents. For example some low end phones save video in 3GP format but give it an MP4 extension. These files will not play.

### If you are using Flash videos:

* [Flash has reached end of life][flash-eol] and is no longer supported in browsers.

## Problems when hosting media

* Your server _must_ properly support byte-range requests as Chrome and Safari rely on them:
  * Most servers support this by default.
  * If you are proxying the media files via a server side script (PHP), this script must implement ranges. PHP does not do this by default.
  * The impact of not doing this ranges from seeking being broken to no playback at all (on iOS).
* Your server must return the correct [mime-type/content-type][media-types] header for the media being sent.
* Your server must implement [CORS (cross-origin resource)][cors] headers if:
  * You are using formats like HLS or MPEG-DASH and your media is served from a different domain than your page.
  * You are using [text tracks][text-tracks] (captions, subtitles, etc.) and they are being served from a different domain than your page.

## Problems with fullscreen

* If your player is in an iframe, that iframe _and_ any parent iframes must have the following attributes for fullscreen to be allowed:
  * `allowfullscreen`
  * `webkitallowfullscreen`
  * `mozallowfullscreen`

## Problems with playback

* Make sure that the media host supports byte-range requests, this could be breaking playback. See [Problems when hosting media][hosting-media] for more info.
* If your media is taking a long time to start playback or the entire mediadownloads before playback:
  * It is likely that metadata for the media has not been included at the start of the media. In MP4 terms this is called
    the "moov atom". Many encoders are configured to do this by default, others may require you to choose
    a "fast start" or "optimize for streaming" option.

## Video.js Errors

### vdata123456 errors

This error is thrown when an element that is associated with a component is removed
from the DOM but the event handlers associated with the element are not removed. This
is almost always due to event listeners not being disposed when dispose is called on
a component.

To fix this issue please make sure that all event listeners are cleaned up on dispose.

[hosting-media]: #problems-when-hosting-media

[text-tracks]: /docs/guides/text-tracks.md

[hls]: https://github.com/videojs/videojs-contrib-hls

[dash]: https://github.com/videojs/videojs-contrib-dash

[http-streaming]: https://github.com/videojs/http-streaming

[youtube]: https://github.com/videojs/videojs-youtube

[media-types]: https://www.iana.org/assignments/media-types/media-types.xhtml#video

[cors]: https://enable-cors.org/

[can-mp4]: https://caniuse.com/#feat=mpeg4

[can-webm]: https://caniuse.com/#feat=webm

[can-ogv]: https://caniuse.com/#feat=ogv

[can-mse]: https://caniuse.com/#feat=mediasource

[flash-eol]: https://www.adobe.com/products/flashplayer/end-of-life.html
