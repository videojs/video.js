![Video.js logo](https://i.cloudup.com/C3nAUZ-l4c.png)

# [Video.js - HTML5 Video Player](http://videojs.com)  [![Build Status](https://travis-ci.org/videojs/video.js.png?branch=master)](https://travis-ci.org/videojs/video.js)

> Video.js is a web video player built from the ground up for an HTML5 world. It supports HTML5 and Flash video, as well as YouTube and Vimeo (through [plugins](https://github.com/videojs/video.js/wiki/Plugins)). It supports video playback on desktops and mobile devices. This project was started mid 2010, and the player is now used on over ~~50,000~~ 100,000 websites.

## Quick start
Thanks to the awesome folks over at [Fastly](http://www.fastly.com/), there's a free, CDN hosted version of Video.js that anyone can use. Simply add these includes to your document's
`<head>`:

```html
<link href="http://vjs.zencdn.net/4.9/video-js.css" rel="stylesheet">
<script src="http://vjs.zencdn.net/4.9/video.js"></script>
```

Then, whenever you want to use Video.js you can simply use the `<video>` element as your normally would, but with an additional `data-setup` attribute containing any Video.js options. These options
can include any Video.js option plus potential [plugin](https://github.com/videojs/video.js/wiki/Plugins) options, just make sure they're valid JSON!

```html
<video id="really-cool-video" class="video-js vjs-default-skin" controls
 preload="auto" width="640" height="264" poster="really-cool-video-poster.jpg"
 data-setup='{}'>
  <source src="really-cool-video.mp4" type='video/mp4'>
  <source src="really-cool-video.webm" type='video/webm'>
  <p class="vjs-no-js">
    To view this video please enable JavaScript, and consider upgrading to a web browser
    that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
  </p>
</video>
```

If you don't want to use auto-setup, you can leave off the `data-setup` attribute and initialize a video element manually.

```javascript
var player = videojs('really-cool-video', { /* Options */ }, function() {
  console.log('Good to go!');

  this.play(); // if you don't trust autoplay for some reason

  // How about an event listener?
  this.on('ended', function() {
    console.log('awww...over so soon?');
  });
});
```

If you're ready to dive in, the [documentation](/blob/master/docs/index.md) is the first place to go for more information. Generally the
[player API docs](/blob/master/docs/api/vjs.Player.md) are the most pertinent.

## Contributing
Video.js is a free and open source library, and we appreciate any help you're willing to give. Check out the [contributing guide](CONTRIBUTING.md).

## Building your own Video.js from source
To build your own custom version read the section on [contributing code](CONTRIBUTING.md#contributing-code) and ["Building your own copy"](CONTRIBUTING.md#building-your-own-copy-of-videojs) in the contributing guide.

## License

Video.js is licensed under the Apache License, Version 2.0. [View the license file](LICENSE)

Copyright 2014 Brightcove, Inc.
