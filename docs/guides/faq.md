# FAQ

## Table of Contents

* [Q: What is Video.js?](#q-what-is-videojs)
* [Q: How do I install Video.js?](#q-how-do-i-install-videojs)
* [Q: Is Video.js on bower?](#q-is-videojs-on-bower)
* [Q: What do Video.js version numbers mean?](#q-what-do-videojs-version-numbers-mean)
* [Q: How can I troubleshoot playback issues?](#q-how-can-i-troubleshoot-playback-issues)
* [Q: A video does not play in a specific browser. Why?](#q-a-video-does-not-play-in-a-specific-browser-why)
* [Q: Why does the entire video download before playback? Why does the video load for a long time?](#q-why-does-the-entire-video-download-before-playback-why-does-the-video-load-for-a-long-time)
* [Q: I see an error thrown that mentions vdata12345. What is that?](#q-i-see-an-error-thrown-that-mentions-vdata12345-what-is-that)
* [Q: I think I found a bug with Video.js or I want to add a feature. What should I do?](#q-i-think-i-found-a-bug-with-videojs-or-i-want-to-add-a-feature-what-should-i-do)
  * [If you think that you can fix the issue or add the feature](#if-you-think-that-you-can-fix-the-issue-or-add-the-feature)
  * [If you don't think you can fix the issue or add the feature](#if-you-dont-think-you-can-fix-the-issue-or-add-the-feature)
* [Q: What is a reduced test case?](#q-what-is-a-reduced-test-case)
* [Q: What media formats does Video.js support?](#q-what-media-formats-does-videojs-support)
* [Q: How does Video.js choose which source to use?](#q-how-does-videojs-choose-which-source-to-use)
* [Q: How do I autoplay a video?](#q-how-do-i-autoplay-a-video)
  * [Q: How can I autoplay a video on a mobile device?](#q-how-can-i-autoplay-a-video-on-a-mobile-device)
* [Q: How can I play RTMP video in Video.js?](#q-how-can-i-play-rtmp-video-in-videojs)
* [Q: How can I hide the links to my video/subtitles/audio/tracks?](#q-how-can-i-hide-the-links-to-my-videosubtitlesaudiotracks)
* [Q: Can I turn off Video.js logging?](#q-can-i-turn-off-videojs-logging)
* [Q: What is a plugin?](#q-what-is-a-plugin)
* [Q: How do I make a plugin for Video.js?](#q-how-do-i-make-a-plugin-for-videojs)
* [Q: How do I add a button to Video.js?](#q-how-do-i-add-a-button-to-videojs)
* [Q: Where can I find a list of Video.js plugins?](#q-where-can-i-find-a-list-of-videojs-plugins)
* [Q: How can I get my plugin listed on the website?](#q-how-can-i-get-my-plugin-listed-on-the-website)
* [Q: Where can I find a list of Video.js skins?](#q-where-can-i-find-a-list-of-videojs-skins)
* [Q: Does Video.js work as an audio only player?](#q-does-videojs-work-as-an-audio-only-player)
* [Q: Does Video.js support audio tracks?](#q-does-videojs-support-audio-tracks)
* [Q: Does Video.js support video tracks?](#q-does-videojs-support-video-tracks)
* [Q: Does Video.js support text tracks (captions, subtitles, etc)?](#q-does-videojs-support-text-tracks-captions-subtitles-etc)
* [Q: Does Video.js support HLS (HTTP Live streaming) video?](#q-does-videojs-support-hls-http-live-streaming-video)
* [Q: Does Video.js support MPEG DASH video?](#q-does-videojs-support-mpeg-dash-video)
* [Q: Does Video.js support live video?](#q-does-videojs-support-live-video)
* [Q: Can Video.js play YouTube videos?](#q-can-videojs-play-youtube-videos)
* [Q: Can Video.js play Vimeo videos?](#q-can-videojs-play-vimeo-videos)
* [Q: Does Video.js support DRM video?](#q-does-videojs-support-drm-video)
* [Q: Does Video.js have any support for advertisement integrations?](#q-does-videojs-have-any-support-for-advertisement-integrations)
* [Q: Can Video.js be required in node.js?](#q-can-videojs-be-required-in-nodejs)
* [Q: Does Video.js work with webpack?](#q-does-videojs-work-with-webpack)
* [Q: Does Video.js work with react?](#q-does-videojs-work-with-react)

## Q: What is Video.js?

Video.js is an extendable framework/library around the native video element. It does the following:

* Offers a plugin API so that different types of video can be handed to the native
  video element (e.g. [HLS][hls], HTML5 video, etc).
* Unifies the native video API across browsers (polyfilling support for features
  if necessary)
* Offers an extendable and themable UI
* Ensures accessibility for keyboard and screen reader users
* Has a set of core plugins that offer support for additional video formats:
  * HLS and DASH are supported natively.
  * [videojs-contrib-dash][dash] can be used for more complete DASH support
* Supports  DRM video via a core plugin:
  * [videojs-contrib-eme][eme]
* Is extensible with lots of plugins offering support for all kinds of features. See the [plugin list on videojs.com][plugin-list]

## Q: How do I install Video.js?

Currently Video.js can be installed using npm, serving a release file from
a GitHub tag, or even using a CDN hosted version. For information on doing any of those
see the [setup guide][install-guide].

## Q: Is Video.js on bower?

Versions prior to Video.js 6 support bower, however, as of Video.js 6, bower is no
longer officially supported. Please see [issue #4012][issue-4012]
for more information.

## Q: What do Video.js version numbers mean?

Video.js follows [semver][semver] which means that the API should not change
out from under a user unless there is a major version increase.

## Q: How can I troubleshoot playback issues?

See the [troubleshooting guide][troubleshooting]. If troubleshooting does not
solve your issue, please ask in [Slack][slack] or submit an [issue][pr-issue-question].

When seeking help about a playback issue the problem is often specific to the video file used, the way the video is hosted or the browser, so make sure to include all of that information and a [reduced test case](#q-what-is-a-reduced-test-case).

## Q: A video does not play in a specific browser. Why?

See the [troubleshooting guide][troubleshooting]. If troubleshooting does not
solve your issue, please ask in [Slack][slack] or submit an [issue][pr-issue-question].

## Q: Why does the entire video download before playback? Why does the video load for a long time?

See the [troubleshooting guide][troubleshooting]. If troubleshooting does not
solve your issue, please ask in [Slack][slack] or submit an [issue][pr-issue-question].

## Q: I see an error thrown that mentions `vdata12345`. What is that?

See the [troubleshooting guide][troubleshooting]. If troubleshooting does not
solve your issue, please ask in [Slack][slack] or submit an [issue][pr-issue-question].

## Q: I think I found a bug with Video.js or I want to add a feature. What should I do?

### If you think that you can fix the issue or add the feature

A pull request would be very welcome in the [Video.js repo][vjs-prs].
Make sure to follow the [contributing guide][contributing-prs] and
the [pull request template][pr-template].

### If you don't think you can fix the issue or add the feature

Open an [issue on the Video.js repo][vjs-issues]. Make
sure that you follow the [issue template][issue-template] and the
[contributing guide][contributing-issues] so that we can better assist you
with your issue.

## Q: What is a reduced test case?

A reduced test case is an example of the problem that you are facing in isolation.
Think of it as example page that reproduces the issue in the least amount of possible code.

It's important to add a reduced case. Even if the problem seems obvious it may not be to
others. Having a example to refer to also makes the difference between somebody being able
to take a look and immediately see what's wrong, and needing to take time to recreate what
they think you are describing.

We have a [starter example][starter-example] for reduced test cases. To learn more
about reduced test cases visit [css-tricks][reduced-test-case]

## Q: What media formats does Video.js support?

This depends on the formats supported by the browser's HTML5 video element, and the playback
techs/plugins made available to Video.js. For more information on media formats see the [troubleshooting guide][troubleshooting].

## Q: How does Video.js choose which source to use?

When an array of sources is available, Video.js test each source in the order given. For each source, each tech in the [`techOrder`][techorder] will be checked to see if it can play it whether directly or via source handler (such as videojs-http-streaming). The first match will be chosen.

## Q: How do I autoplay a video?

Due to recent changes in autoplay behavior we no longer recommend using the `autoplay` attribute
on the `video` element. It's still supported by Video.js but, many browsers, including Chrome, are changing their
`autoplay` attribute behavior.

Instead we recommend using the `autoplay` option rather than the `autoplay` attribute, for more information on using that.
see the [autoplay option][autoplay-option] in the Video.js options guide.

For more information on the autoplay changes see our [blog post](https://videojs.com/blog/autoplay-best-practices-with-video-js/).

### Q: How can I autoplay a video on a mobile device?

Most mobile devices have blocked autoplaying videos until recently.
For mobile devices that don't support autoplaying, autoplay isn't supported by Video.js.
For those devices that support autoplaying, like iOS10 and Chrome for Android 53+,
you must mute the video or have a video without audio tracks to be able to play it.

We do not recommend doing this manually using attributes on the `video` element. Instead, you should pass the
[autoplay option][autoplay-option] with a value of `'any'` or `'muted'`. See the previous link for more information
on using that option.

> NOTE: At this point, the autoplay attribute and option are NOT a guarantee that your video will autoplay.

## Q: How can I play RTMP video in Video.js?

It is no longer possible to play RTMP as it requires Flash, and [Flash has reached end of life][flash-eol]. No browser supports it.

## Q: How can I hide the links to my video/subtitles/audio/tracks?

It's impossible to hide the network requests a browser makes and difficult to
sufficiently obfuscate URLs in the source. Techniques such as token authentication may
help but are outside of the scope of Video.js.

For content that must be highly secure [videojs-contrib-eme][eme] adds DRM support.

## Q: Can I turn off Video.js logging?

Yes! This can be achieved by adding the following code _after_ including Video.js, but _before_ creating any player(s):

```js
videojs.log.level('off');
```

For more information, including which logging levels are available, check out the [debugging guide][debug-guide].

## Q: What is a plugin?

A plugin is a group of reusable functionality that can be re-used by others. For instance a plugin could add
a button to Video.js that makes the video replay 10 times in a row before it stops playback for good. If such
a plugin existed and was published users could include it on their page to share that functionality.

## Q: How do I make a plugin for Video.js?

See the [plugin guide][plugin-guide] for information on making a plugin for Video.js.

## Q: How do I add a button to Video.js?

See the [components guide][components-guide] for an example of adding a button to Video.js.

## Q: Where can I find a list of Video.js plugins?

A list of plugins published to npm with the `videojs-plugin` keyword is maintained [on videojs.com][plugin-list].

## Q: How can I get my plugin listed on the website?

Add the 'videojs-plugin' [keyword to your array in package.json][npm-keywords]
and publish your package to npm. If you use the [plugin generator][generator] this will be done automatically for you. See
the [plugins guide][plugin-guide] for more information.

## Q: Where can I find a list of Video.js skins?

See the [Video.js GitHub wiki][skins-list].

## Q: Does Video.js work as an audio only player?

Yes! It can be used to play audio only files in a `<video>` or `<audio>` tag.

## Q: Does Video.js support audio tracks?

Yes! See the [audio tracks guide][audio-tracks] for information on using audio tracks.

## Q: Does Video.js support video tracks?

Alternate video tracks support is in development. See [video tracks guide][video-tracks]
for more information on using video tracks.

## Q: Does Video.js support text tracks (captions, subtitles, etc)?

Yes! See the [text tracks guide][text-tracks] for information on using text tracks.

## Q: Does Video.js support HLS (HTTP Live streaming) video?

Video.js supports HLS. It will play using native support if the HTML5 element supports HLS (e.g. Safari, iOS, legacy Edge, or Chrome for Android).
On other browsers, it will play using our playback engine [videojs-http-streaming][hls].

Note that for non-native playback of HLS it is essential that the server hosting the video sets [CORS headers][cors].

## Q: Does Video.js support MPEG DASH video?

Video.js provides support for some DASH streams with our playback engine [videojs-http-streaming][hls].

Alternatively, [videojs-contrib-dash][dash] package can be used.

Like HLS, DASH streams require [CORS headers][cors].

## Q: Does Video.js support live video?

Yes! Common formats for live are HLS or DASH. In the past RTMP was commonly used for live, but it is no longer possible to play in any browser.

## Q: Can Video.js play YouTube videos?

There is an official plugin that adds support, [videojs-youtube][youtube].

## Q: Can Video.js play Vimeo videos?

There is an official plugin that adds support, [videojs-vimeo][vimeo].

## Q: Does Video.js support DRM video?

There is an official plugin that adds support, [videojs-contrib-eme][eme].

## Q: Does Video.js have any support for advertisement integrations?

There is an official plugin that adds core advertising support, [videojs-contrib-ads][ads]. Further plugins build on this which handle the communication with the ad server and display of the ad, for instance [Google's IMA plugin][google-ima].

## Q: Can Video.js be required in node.js?

Yes! Video.js is [published on NPM][node].

## Q: Does Video.js work with webpack?

Yes! See the [Webpack and Video.js configuration guide][webpack-guide].

## Q: Does Video.js work with react?

Yes! See [ReactJS integration example][react-guide].

[ads]: https://github.com/videojs/videojs-contrib-ads

[audio-tracks]: /docs/guides/audio-tracks.md

[autoplay-option]: /docs/guides/options.md#autoplay

[contributing-issues]: https://github.com/videojs/video.js/blob/main/CONTRIBUTING.md#filing-issues

[contributing-prs]: https://github.com/videojs/video.js/blob/main/CONTRIBUTING.md#contributing-code

[components-guide]: /docs/guides/components.md

[cors]: https://enable-cors.org

[dash]: https://github.com/videojs/videojs-contrib-dash

[debug-guide]: /docs/guides/debugging.md

[eme]: https://github.com/videojs/videojs-contrib-eme

[flash-eol]: https://www.adobe.com/products/flashplayer/end-of-life.html

[generator]: https://github.com/videojs/generator-videojs-plugin

[google-ima]: https://github.com/googleads/videojs-ima

[hls]: https://github.com/videojs/http-streaming

[install-guide]: https://videojs.com/getting-started/

[issue-4012]: https://github.com/videojs/video.js/issues/4012

[issue-template]: https://github.com/videojs/video.js/blob/main/.github/ISSUE_TEMPLATE.md

[node]: https://www.npmjs.com/package/video.js

[npm-keywords]: https://docs.npmjs.com/files/package.json#keywords

[plugin-guide]: /docs/guides/plugins.md

[plugin-list]: https://videojs.com/plugins

[pr-issue-question]: #q-i-think-i-found-a-bug-with-videojs-or-i-want-to-add-a-feature-what-should-i-do

[pr-template]: https://github.com/videojs/video.js/blob/main/.github/PULL_REQUEST_TEMPLATE.md

[react-guide]: /docs/guides/react.md

[reduced-test-case]: https://css-tricks.com/reduced-test-cases/

[semver]: https://semver.org/

[skins-list]: https://github.com/videojs/video.js/wiki/Skins

[slack]: https://videojs.slack.com

[starter-example]: https://codepen.io/gkatsev/pen/GwZegv?editors=1000#0

[techorder]: /docs/guides/options.md#techorder

[cors]: /docs/guides/options.md#techorder

[text-tracks]: /docs/guides/text-tracks.md

[troubleshooting]: /docs/guides/troubleshooting.md

[video-tracks]: /docs/guides/video-tracks.md

[vimeo]: https://github.com/videojs/videojs-vimeo

[vjs-issues]: https://github.com/videojs/video.js/issues

[vjs-prs]: https://github.com/videojs/video.js/pulls

[webpack-guide]: /docs/guides/webpack.md

[youtube]: https://github.com/videojs/videojs-youtube
