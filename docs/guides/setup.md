Setup
=====

Video.js is pretty easy to set up. It can take a matter of seconds to get the player up and working on your web page.

Step 1: Include the Video.js Javascript and CSS files in the head of your page.
------------------------------------------------------------------------------

You can download the Video.js source and host it on your own servers, or use the free CDN hosted version. As of Video.js 5.0, the source is [transpiled from ES2015](http://babeljs.io/) (formerly known as ES6) to [ES5](https://es5.github.io/), but IE8 only supports ES3. In order to continue to support IE8, we've bundled an [ES5 shim and sham](https://github.com/es-shims/es5-shim) together and hosted it on the CDN.

```html
<script src="//vjs.zencdn.net/ie8/1.1.1/videojs-ie8.min.js"></script>
```

### CDN Version ###
```html
<link href="//vjs.zencdn.net/5.4.6/video-js.min.css" rel="stylesheet">
<script src="//vjs.zencdn.net/5.4.6/video.min.js"></script>
```

We include a stripped down Google Analytics pixel that tracks a random percentage (currently 1%) of players loaded from the CDN. This allows us to see (roughly) what browsers are in use in the wild, along with other useful metrics such as OS and device. If you'd like to disable analytics, you can simply include the following global **before** including Video.js:

```js
window.HELP_IMPROVE_VIDEOJS = false;
```

## Install via package manager

### NPM
```
$ npm install --save video.js
```

### Bower
```
$ bower install --save video.js
```


### Self Hosted. ###
To entirely self-host, you'll need to pull in the font files and let Video.js know where the swf is located. If you simply copy the dist folder or zip file contents into your project everything
should Just Work™, but the paths can easily be changed by editing the LESS file and re-building, or by modifying the generated CSS file.

```html
<link href="//example.com/path/to/video-js.min.css" rel="stylesheet">
<script src="//example.com/path/to/video.min.js"></script>
<script>
  videojs.options.flash.swf = "http://example.com/path/to/video-js.swf"
</script>
```


Step 2: Add an HTML5 video tag to your page.
--------------------------------------------
With Video.js you just use an HTML5 video tag to embed a video. Video.js will then read the tag and make it work in all browsers, not just ones that support HTML5 video. Beyond the basic markup, Video.js needs a few extra pieces.

> Note: The `data-setup` attribute described here should not be used if you use the alternative setup described in the next section.

  1. The 'data-setup' Attribute tells Video.js to automatically set up the video when the page is ready, and read any options (in JSON format) from the attribute (see [options](./options.md)). There are other methods for initializing the player, but this is the easiest.

  2. The 'id' Attribute: Should be used and unique for every video on the same page.

  3. The 'class' attribute contains two classes:
    - `video-js` applies styles that are required for Video.js functionality, like fullscreen and subtitles.
    - `vjs-default-skin` applies the default skin to the HTML controls, and can be removed or overridden to create your own controls design.

Otherwise include/exclude attributes, settings, sources, and tracks exactly as you would for HTML5 video.*
```html
<video id="example_video_1" class="video-js vjs-default-skin"
  controls preload="auto" width="640" height="264"
  poster="http://video-js.zencoder.com/oceans-clip.png"
  data-setup='{"example_option":true}'>
 <source src="http://video-js.zencoder.com/oceans-clip.mp4" type='video/mp4' />
 <source src="http://video-js.zencoder.com/oceans-clip.webm" type='video/webm' />
 <source src="http://video-js.zencoder.com/oceans-clip.ogv" type='video/ogg' />
 <p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a></p>
</video>
```

By default, the big play button is located in the upper left hand corner so it doesn't cover up the interesting parts of the poster. If you'd prefer to center the big play button, you can add an additional `vjs-big-play-centered` class to your video element. For example:

```html
<video id="example_video_1" class="video-js vjs-default-skin vjs-big-play-centered"
  controls preload="auto" width="640" height="264"
  poster="http://video-js.zencoder.com/oceans-clip.png"
  data-setup='{"example_option":true}'>
  ...
</video>
```

Alternative Setup for Dynamically Loaded HTML
---------------------------------------------
If your web page or application loads the video tag dynamically (ajax, appendChild, etc.), so that it may not exist when the page loads, you'll want to manually set up the player instead of relying on the data-setup attribute. To do this, first remove the data-setup attribute from the tag so there's no confusion around when the player is initialized. Next, run the following javascript some time after the Video.js javascript library has loaded, and after the video tag has been loaded into the DOM.
```js
videojs("example_video_1", {}, function(){
  // Player (this) is initialized and ready.
});
```

The first argument in the `videojs` function is the ID of your video tag. Replace it with your own.

The second argument is an options object. It allows you to set additional options like you can with the data-setup attribute.

The third argument is a 'ready' callback. Once Video.js has initialized it will call this function.

Instead of using an element ID, you can also pass a reference to the element itself.

```js
videojs(document.getElementById('example_video_1'), {}, function() {
  // This is functionally the same as the previous example.
});
```

```js
videojs(document.getElementsByClassName('awesome_video_class')[0], {}, function() {
  // You can grab an element by class if you'd like, just make sure
  // if it's an array that you pick one (here we chose the first).
});
```

\* If you have trouble playing back content you know is in the [correct format](http://blog.zencoder.com/2013/09/13/what-formats-do-i-need-for-html5-video/), your HTTP server might not be delivering the content with the correct [MIME type](http://en.wikipedia.org/wiki/Internet_media_type#Type_video). Please double check your content's headers before opening an [issue](https://github.com/videojs/video.js/blob/master/CONTRIBUTING.md).
