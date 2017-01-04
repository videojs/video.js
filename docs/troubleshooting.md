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

Most browsers now play MP4 with h264 video. If you want to have a single source, and neither live streaming
nor adaptive streaming is a consideration, MP4 with h264 video and acc audio is a good choice.

#### I need adaptive streaming or live streaming

Use HLS with [videojs-contrib-hls][hls] or
Use Dash with [videojs-contrib-dash][dash].
HLS is more convenient as mobile browsers have native support.

### Make sure you are using formats that Video.js can play:

* Does your browser/OS support the type of media that you are trying to play?
* Do you have a Video.js plugin that will add support for a media format to Video.js? For example:
  * [videojs-youtube][youtube]
  * [videojs-contrib-hls][hls]
  * [videojs-contrib-dash][dash]
* Verify that you are using the correct [mime-type/content-type][media-types] for your videos.
  This is used to determine if Video.js can play a certain type of media.

### Make sure that the codec used in the file container is supported:

* MP4 in browsers typically only supports h264 video and MP3 or AAC audio
* Some low end phones save video in 3GP format but give it an MP4 extension. These files will not play.

### If you are using Flash videos:

* Make sure that Flash is installed
* Make sure the Flash tech is included with Video.js (in `video.js >= v6.0.0` it won't be by default, see [videojs-flash][flash])
* Flash media include RTMP streams and FLV format media.
* SWF is not a media format

## Problems when hosting media

* Your server must support byte-range requests as Chrome and Safari rely on them:
  * Most servers support this by default.
  * If you are proxying the media files via a server side script (PHP), this script must implement ranges. PHP does not do this by default.
  * The impact of not doing this ranges from seeking being broken to no playback at all (on iOS).
* Your server must return the correct [mime-type/content-type][media-types] for the media being sent.
* Your server must implement [CORS (cross-origin resource)][cors] headers if:
  * You are using [videojs-contrib-hls][hls], [videojs-contrib-dash][dash] and your media is served from a different domain than your page.
  * You are using [text tracks][text-tracks] (captions, subtitles, etc.) and they are being served from a different domain than your page.

## Problems with fullscreen

* If your player is in an iframe, the parent iframes must have the following attributes for fullscreen to be allowed:
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

[text-tracks]: text-tracks.md

[hls]: https://github.com/videojs/videojs-contrib-hls

[dash]: https://github.com/videojs/videojs-contrib-dash

[youtube]: https://github.com/videojs/videojs-youtube

[flash]: https://github.com/videojs/videojs-flash

[media-types]: http://www.iana.org/assignments/media-types/media-types.xhtml#video

[cors]: http://enable-cors.org/
