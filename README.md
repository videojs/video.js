[![Video.js logo][logo]][vjs]

# Video.js - Web Video Player & Framework

[![NPM][npm-icon]][npm-link]

**Update:** Big changes coming in Video.js 10, early 2026! [Read the discussion.](https://github.com/videojs/video.js/discussions/9035)

Video.js is a full featured, open source video player for all web-based platforms.

Right out of the box, Video.js supports all common media formats used on the web including streaming formats like HLS and DASH. It works on desktops, mobile devices, tablets, and web-based Smart TVs. It can be further extended and customized by a robust ecosystem of [plugins][plugins].

Video.js was started in May 2010 and since then:

* Millions of websites have used VideoJS over time (source [Builtwith][builtwith])
* Billions of end-users every month of just the CDN-hosted copy (source Fastly stats)
* 900+ amazing contributors to the video.js core
* Hundreds of [plugins](https://videojs.com/plugins/)

## Table of Contents

* [Quick Start](#quick-start)
* [Contributing](#contributing)
* [Code of Conduct](#code-of-conduct)
* [License](#license)
* [Sponsorship](#sponsorship)

## [Quick Start][getting-started]

Thanks to the awesome folks over at [Fastly][fastly], there's a free, CDN hosted version of Video.js that anyone can use. Add these tags to your document's `<head>`:

```html
<link href="//vjs.zencdn.net/8.23.6/video-js.min.css" rel="stylesheet">
<script src="//vjs.zencdn.net/8.23.6/video.min.js"></script>
```

Alternatively, you can include Video.js by getting it from [npm](https://videojs.com/getting-started/#install-via-npm), downloading it from [GitHub releases](https://github.com/videojs/video.js/releases) or by including it via [unpkg](https://unpkg.com) or another JavaScript CDN, like CDNjs.

```html
<!-- unpkg : use the latest version of Video.js -->
<link href="https://unpkg.com/video.js/dist/video-js.min.css" rel="stylesheet">
<script src="https://unpkg.com/video.js/dist/video.min.js"></script>

<!-- unpkg : use a specific version of Video.js (change the version numbers as necessary) -->
<link href="https://unpkg.com/video.js@8.23.6/dist/video-js.min.css" rel="stylesheet">
<script src="https://unpkg.com/video.js@8.23.6/dist/video.min.js"></script>

<!-- cdnjs : use a specific version of Video.js (change the version numbers as necessary) -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/video.js/8.23.6/video-js.min.css" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/video.js/8.23.6/video.min.js"></script>
```

Next, using Video.js is as simple as creating a `<video>` element, but with an additional `data-setup` attribute. At a minimum, this attribute must have a value of `'{}'`, but it can include any Video.js [options][options] - just make sure it contains valid JSON!

```html
<video
    id="my-player"
    class="video-js"
    controls
    preload="auto"
    poster="//vjs.zencdn.net/v/oceans.png"
    data-setup='{}'>
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4"></source>
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm"></source>
  <source src="//vjs.zencdn.net/v/oceans.ogv" type="video/ogg"></source>
  <p class="vjs-no-js">
    To view this video please enable JavaScript, and consider upgrading to a
    web browser that
    <a href="https://videojs.com/html5-video-support/" target="_blank">
      supports HTML5 video
    </a>
  </p>
</video>
```

When the page loads, Video.js will find this element and automatically setup a player in its place.

If you don't want to use automatic setup, you can leave off the `data-setup` attribute and initialize a `<video>` element manually using the `videojs` function:

```js
var player = videojs('my-player');
```

The `videojs` function also accepts an `options` object and a callback to be invoked when the player is ready:

```js
var options = {};

var player = videojs('my-player', options, function onPlayerReady() {
  videojs.log('Your player is ready!');

  // In this context, `this` is the player that was created by Video.js.
  this.play();

  // How about an event listener?
  this.on('ended', function() {
    videojs.log('Awww...over so soon?!');
  });
});
```

If you're ready to dive in, the [Getting Started][getting-started] page and [documentation][docs] are the best places to go for more information. If you get stuck, head over to our [Slack][slack-link]!

## [Contributing][contributing]

Video.js is a free and open source library, and we appreciate any help you're willing to give - whether it's fixing bugs, improving documentation, or suggesting new features. Check out the [contributing guide][contributing] for more! Contributions and project decisions are overseen by the
[Video.js Technical Steering Committee (TSC)](https://github.com/videojs/admin/blob/main/GOVERNANCE.md).

By submitting a pull request, you agree that your contribution is provided under the
[Apache 2.0 License](LICENSE) and may be included in future releases. No contributor license agreement (CLA) has ever been required for contributions to Video.js. See the [Developer's Certificate of Origin 1.1
](https://github.com/videojs/admin/blob/main/CONTRIBUTING.md#developers-certificate-of-origin-11).

## [Code of Conduct][coc]

Please note that this project is released with a [Contributor Code of Conduct][coc]. By participating in this project you agree to abide by its terms.

## [License][license]

Video.js is [licensed][license] under the Apache License, Version 2.0. "Video.js" is a registered trademark of [Brightcove, Inc][bc].

## Sponsorship

Project development is sponsored by the role of [Corporate Shepherd](https://github.com/videojs/admin/blob/main/GOVERNANCE.md#corporate-shepherd), held by various companies throughout the project history:

* 2010-2012: Zencoder Inc.
* 2013-2025: [Brightcove Inc.][bc]
* 2025-present: [Mux Inc.][mux]

Video.js uses [BrowserStack][browserstack] for compatibility testing.

The free CDN-hosted copy of the libray is sponsored by [Fastly][fastly].

Website hosting is sponsored by [Netlify][netlify]

[bc]: https://www.brightcove.com/

[browserstack]: https://browserstack.com

[builtwith]: https://trends.builtwith.com/media/VideoJS

[contributing]: https://github.com/videojs/admin/blob/main/CONTRIBUTING.md

[docs]: https://docs.videojs.com

[fastly]: https://www.fastly.com/

[getting-started]: https://videojs.com/getting-started/

[license]: LICENSE

[logo]: https://videojs.com/logo-white.png

[mux]: https://www.mux.com/

[netlify]: https://www.netlify.com

[npm-icon]: https://nodei.co/npm/video.js.png?downloads=true&downloadRank=true

[npm-link]: https://nodei.co/npm/video.js/

[options]: https://videojs.com/guides/options/

[plugins]: https://videojs.com/plugins/

[slack-link]: https://slack.videojs.com

[vjs]: https://videojs.com

[coc]: https://github.com/videojs/admin/blob/main/CODE_OF_CONDUCT.md
