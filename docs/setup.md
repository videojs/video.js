Setup
=====

Video.js is pretty easy to set up. It can take a matter of seconds to get the player up and working on your web page.

Step 1: Include the Video.js Javascript and CSS files in the head of your page.
------------------------------------------------------------------------------

You can download the Video.js source and host it on your own servers, or use the free CDN hosted version. It's often recommended now to put JavaScript before the end body tag (&lt;/body>) instead of the head (&lt;head>), but Video.js includes an 'HTML5 Shiv', which needs to be in the head for older IE versions to respect the video tag as a valid element.

> NOTE: If you're already using an HTML5 shiv like [Modernizr](http://modernizr.com/) you can include the Video.js JavaScript anywhere, however make sure your version of Modernizr includes the shiv for video.

### CDN Version ###
```html
<link href="http://vjs.zencdn.net/c/video-js.css" rel="stylesheet">
<script src="http://vjs.zencdn.net/c/video.js"></script>
```

### Self Hosted. ###
With the self hosted option you'll also want to update the location of the video-js.swf file.
```html
<link href="http://example.com/path/to/video-js.css" rel="stylesheet">
<script src="http://example.com/path/to/video.js"></script>
<script>
  _V_.options.flash.swf = "http://example.com/path/to/video-js.swf"
</script>
```


Step 2: Add an HTML5 video tag to your page.
--------------------------------------------
With Video.js you just use an HTML5 video tag to embed a video. Video.js will then read the tag and make it work in all browsers, not just ones that support HTML5 video. Beyond the basic markup, Video.js needs a few extra pieces.

  1. The 'data-setup' Atrribute tells Video.js to automatically set up the video when the page is ready, and read any options (in JSON format) from the attribute (see ['options'](options.md)). There are other methods for initializing the player, but this is the easiest.

  2. The 'id' Attribute: Should be used and unique for every video on the same page.

  3. The 'class' attribute contains two classes:
    - 'video-js' applies styles that are required for Video.js functionality, like fullscreen and subtitles.
    - 'vjs-default-skin' applies the default skin to the HTML controls, and can be removed or overridden to create your own controls design.

Otherwise include/exclude attributes, settings, sources, and tracks exactly as you would for HTML5 video.

```html
<video id="example_video_1" class="video-js vjs-default-skin"
  controls preload="auto" width="640" height="264"
  poster="http://video-js.zencoder.com/oceans-clip.png"
  data-setup='{"example_option":true}'>
 <source src="http://video-js.zencoder.com/oceans-clip.mp4" type='video/mp4' />
 <source src="http://video-js.zencoder.com/oceans-clip.webm" type='video/webm' />
 <source src="http://video-js.zencoder.com/oceans-clip.ogv" type='video/ogg' />
</video>
```


Alternative Setup for Dynamically Loaded HTML
---------------------------------------------
If your web page or application loads the video tag dynamically (ajax, appendChild, etc.), so that it may not exist when the page loads, you'll want to manually set up the player instead of relying on the data-setup attribute. To do this, first remove the data-setup attribute from the tag so there's no confusion around when the player is initialized. Next, run the following javascript some time after the Video.js javascript library has loaded, and after the video tag has been loaded into the DOM.
```js
_V_("example_video_1", {}, function(){
  // Player (this) is initialized and ready.
});
```

The first argument in the \_V_ function is the ID of your video tag. Replace it with your own.

The second argument is an options object. It allows you to set additional options like you can with the data-setup attribute.

The third argument is a 'ready' callback. Once Video.js has initialized it will call this function.

