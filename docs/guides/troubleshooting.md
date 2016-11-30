# Troubleshooting

## Problems with media formats
Make sure you are using formats that video.js can play:
* Does your browser/OS support the type of video that you are trying to play?
* Do you have a plugin that will add support for that video format?
* Verify that you are using the correct mime-type/content-type for your videos. This used to determine if video.js can play a video.

Make sure that the codec for that is being used in the file container is supported:
* MP4 in browsers typically only supports h264 video and MP3 or AAC audio
* Some low end phones save video in 3GP format but give it an MP4 extension. These files will not play.


Make sure that Flash is installed and that the Flash tech is included with video.js:
* Flash videos include RTMP streams and FLV format videos.
* SWF is not a video format

### Commonly used formats:

#### I want to have a single source and don't care about live/adaptive streaming:
Most browsers now play MP4 with h264 video. If you want to have a single source, and neither live streaming
nor adaptive streaming is a consideration, MP4 is a good choice.

#### I need adaptive streaming or live streaming
Use HLS with [videojs-contrib-hls]()https://github.com/videojs/videojs-contrib-dash or
Use Dash with [videojs-contrib-dash](https://github.com/videojs/videojs-contrib-dash).
HLS is more convenient as mobile browsers have native support.

## Problems when hosting video
* Your server must support byte-range requests as Chrome and Safari rely on it. Most servers support this by default, but we have seen many issues with PHP as it does not support byte-range by default.
* If you are proxying the media files via a server side script (PHP), this script must implement ranges. The impact of not doing this ranges from seeking being broken to no playback at all (on iOS).
* Your server must return the correct mime-type/content-type for the video formats.
* If you are using HLS or DASH your server must implement CORS headers if the video is served from a different domain than your page. This is also true for text tracks such as captions.

## Problems with Fullscreen
* If your player is in an iframe, make sure it and any parent iframes have the fullscreen attributes allowfullscreen webkitallowfullscreen mozallowfullscreen. Without these, the browser will not allow fullscreen mode.

## Problems with playback
* Make sure that the video host supports byte-range requests, this could be breaking playback.
* If your video is taking a long time to start playback or the entire video downloads before playback:
  * It is likely that metadata for the video has not been included at the start of the video. In MP4 terms this is called
    the "moov atom". Many encoders are configured to do this by default, others may require you to choose
    a "fast start" or "optimize for streaming" option.

## video.js Errors
### vdata123456 errors
This error is thrown when an element that is associated with a component is removed
from the DOM but the event handlers associated with the element are not removed. This
is almost always due to event listeners not being disposed when dispose is called on
a component.

To fix this issue please make sure that all event listeners are cleaned up on dispose.

