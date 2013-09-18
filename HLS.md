HLS
============
Thank you for using the beta version of HLS implementation in VideoJS. We have tried to make the usage of .m3u8 files similar to those of any other accepted technologies. As such, using HLS can be done via both the HTML <source> tag as well as setting the programmatic player.src setting.

KNOWN ISSUES
============
1. There is a known seeking issue where the player will seek to the beginning of the segment responsible for the seek time requested. We are aware of this issue and are working to resolve.
2. Currently adaptive behavior is based entirely on bandwidth being detected and averaged over 3 non-cached segments. Future iteration will include logic for including viewport dimensions to help refine 'appropriate' indexes.

USAGE NOTES
============
1. The accepted mimetype is "application/mpegURL".
2. The only accepted file extension is ".m3u8".
3. Bandwidth for adaptive behavior must be greater than 1.1 x rendition bandwidth value to account for switching overhead.

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
    <source src="http://route/to/my_m3u8_url.m3u8" type='video/mp4'>
    <track kind="captions" src="../build/demo-files/demo.captions.vtt" srclang="en" label="English"></track><!-- Tracks need an ending tag thanks to IE9 -->
    <p>Video Playback Not Supported</p>
  </video>
```

API Methods
-----------
Now that you have access to a ready player, you can control the video, get values, or respond to video events using the following functions. The Video.js API function names follow the [HTML5 media API](http://www.w3.org/TR/html5/video.html). The main difference is that attributes which you would get or set on a video element using the equals sign ( `myVideoElement.currentTime = "120";` ), you would use a function argument syntax for Video.js ( `myPlayer.currentTime(120);` )

### src(newSource) ###
The source function updates the video source. There are three types of variables you can pass as the argument.

**URL String**: A URL to the the video file. Use this method if you're sure the current playback technology (HTML5/Flash) can support the source you provide. Currently only MP4 files can be used in both HTML5 and Flash.
```js
myPlayer.src("http://www.example.com/path/to/manifest.m3u8");
```

**Source Object (or element):** A javascript object containing information about the source file. Use this method if you want the player to determine if it can support the file using the type information.
```js
myPlayer.src({ type: "application/mpegURL", src: "http://www.example.com/path/to/manifest.m3u8" });
```

**Array of Source Objects:** To provide multiple versions of the source so that it can be played using HTML5 across browsers you can use an array of source objects. Video.js will detect which version is supported and load that file.
```js
myPlayer.src([
  { type: "application/mpegURL", src: "http://www.example.com/path/to/manifest.m3u8" },
  { type: "video/webm", src: "http://www.example.com/path/to/video.webm" },
  { type: "video/ogg", src: "http://www.example.com/path/to/video.ogv" }
]);
```

Returns the player object.

### currentBitrate() // Type: Number ###
Returns the current rendition bitrate.
```js
var renditionBitrate = myPlayer.currentBitrate();
```

### currentIndex() // Type: Integer ###
Returns the current rendition index.
```js
var renditionIndex = myPlayer.currentIndex();
```

### maxAllowedIndex() // Type: Integer ###
Returns the maximum allowed rendition index to switch to.
```js
var maxAllowedIndex = myPlayer.maxAllowedIndex();
```

### currentRendition() // Type: Rendition JSON Object ###
Returns the current rendition information object.
Rendition
    .index:int
    .bandwidth:int
    .url:String
```js
var currentRendition = myPlayer.currentRendition();
```

### isDynamicStream() // Type: Boolean ###
Returns whether the currently loaded .m3u8 manifest is a playlist with multiple renditions.
```js
var isDynamicStream = myPlayer.isDynamicStream();
```

### numDynamicStreams() // Type: Integer ###
Returns the number of renditions available.
```js
var numDynamicStreams = myPlayer.numDynamicStreams();
```

### switchTo(index) // Type: Integer ###
Switch to the supplied rendition by array index (zero based). Returns the player object.
```js
myPlayer.swtichTo(2); // Switches to the 3rd index (zero based) in the manifest array.
```

Returns the index switched to (either the value selected or -1 if out of range)



