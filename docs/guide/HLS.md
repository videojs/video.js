HLS
============
Thank you for using the beta version of HLS implementation in VideoJS. We have tried to make the usage of .m3u8 files similar to those of any other accepted technologies. As such, using HLS can be done via both the HTML <source> tag as well as setting the programmatic player.src setting.

Usage Notes
-----------
1. The accepted mimetype is "application/mpegURL".
2. The only accepted file extension is ".m3u8".
3. Bandwidth for adaptive behavior must be greater than 1.1 x rendition bandwidth value to account for switching overhead.
4. Serving domain MUST have a valid crossdomain.xml file as this is a Flash Player requirement to make GET requests for segments.

Currently Supported M3U8 Tags
-----------
1. #EXTM3U
2. #EXTINF
3. #EXT-X-TARGETDURATION
4. #EXT-X-MEDIA-SEQUENCE
5. #EXT-X-PLAYLIST-TYPE
6. #EXT-X-ENDLIST
7. #EXT-X-STREAM-INF

Tags Currently Ignored
-----------
1. #EXT-T-VERSION
2. #EXT-T-I-FRAME-STREAM-INF
3. #EXT-T-I-FRAMES-ONLY
4. #EXT-T-DISCONTINUITY
5. #EXT-T-MEDIA
6. #EXT-T-ALLOW-CACHE
7. #EXT-T-PROGRAM-DATE-TIME
8. #EXT-T-KEY
9. #EXT-T-BYTERANGE

Draft Specification
-----------
For reference, see draft-pantos-http-live-streaming-11

Known Issues
-----------
1. There is a known seeking issue where the player will seek to the beginning of the segment responsible for the seek time requested. We are aware of this issue and are working to resolve.
2. Currently adaptive behavior is based entirely on bandwidth being detected and averaged over 3 non-cached segments. Future iteration will include logic for including viewport dimensions to help refine 'appropriate' indexes.

To implement via VideoJS API:

```javascript
var myPlayer = videojs("example_video_1");
    myPlayer.src({src:"http://route/to/my_m3u8_url.m3u8", type: "application/mpegURL"});
```

To implement via HTML Tag:

```html
<video id="vid1" class="video-js vjs-default-skin" controls preload="auto" width="640" height="264"
      poster="http://video-js.zencoder.com/oceans-clip.png"
      data-setup='{}'>
    <source src="http://route/to/my_m3u8_url.m3u8" type='application/mpegURL'>
    <track kind="captions" src="../build/demo-files/demo.captions.vtt" srclang="en" label="English"></track><!-- Tracks need an ending tag thanks to IE9 -->
    <p>Video Playback Not Supported</p>
  </video>
```

API Methods
-----------
For HLS API methods, please see the documentation in the video-js-swf repository under docs/hls_api.md.


