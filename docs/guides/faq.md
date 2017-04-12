# FAQ

## Table of Contents

* [Q: What is video.js?](#q-what-is-videojs)
* [Q: How do I install video.js?](#q-how-do-i-install-videojs)
* [Q: Is video.js on bower?](#q-is-videojs-on-bower)
* [Q: What do video.js version numbers mean?](#q-what-do-videojs-version-numbers-mean)
* [Q: How can I troubleshoot playback issues?](#q-how-can-i-troubleshoot-playback-issues)
* [Q: A video does not play in a specific browser. Why?](#q-a-video-does-not-play-in-a-specific-browser-why)
* [Q: Why does the entire video download before playback? Why does the video load for a long time?](#q-why-does-the-entire-video-download-before-playback-why-does-the-video-load-for-a-long-time)
* [Q: I see an error thrown that mentions vdata12345. What is that?](#q-i-see-an-error-thrown-that-mentions-vdata12345-what-is-that)
* [Q: I think I found a bug with video.js or I want to add a feature. What should I do?](#q-i-think-i-found-a-bug-with-videojs-or-i-want-to-add-a-feature-what-should-i-do)
  * [if you think that you can fix the issue or add the feature](#if-you-think-that-you-can-fix-the-issue-or-add-the-feature)
  * [If you don't think you can fix the issue or add the feature](#if-you-dont-think-you-can-fix-the-issue-or-add-the-feature)
* [Q: What is a reduced test case?](#q-what-is-a-reduced-test-case)
* [Q: What media formats does video.js support?](#q-what-media-formats-does-videojs-support)
* [Q: How to I autoplay the video?](#q-how-to-i-autoplay-the-video)
  * [Q: How can I autoplay a video on a mobile device?](#q-how-can-i-autoplay-a-video-on-a-mobile-device)
* [Q: How can I play RTMP video in video.js?](#q-how-can-i-play-rtmp-video-in-videojs)
* [Q: How can I hide the links to my video/subtitles/audio/tracks?](#q-how-can-i-hide-the-links-to-my-videosubtitlesaudiotracks)
* [Q: Can I turn off video.js logging?](#q-can-i-turn-off-videojs-logging)
* [Q: What is a plugin?](#q-what-is-a-plugin)
* [Q: How do I make a plugin for video.js?](#q-how-do-i-make-a-plugin-for-videojs)
* [Q: Where can I find a list of video.js plugins?](#q-where-can-i-find-a-list-of-videojs-plugins)
* [Q: How can I get my plugin listed on the website?](#q-how-can-i-get-my-plugin-listed-on-the-website)
* [Q: Where can I find a list of video.js skins?](#q-where-can-i-find-a-list-of-videojs-skins)
* [Q: Does video.js work as an audio only player?](#q-does-videojs-work-as-an-audio-only-player)
* [Q: Does video.js support audio tracks?](#q-does-videojs-support-audio-tracks)
* [Q: Does video.js support video tracks?](#q-does-videojs-support-video-tracks)
* [Q: Does video.js support text tracks (captions, subtitles, etc)?](#q-does-videojs-support-text-tracks-captions-subtitles-etc)
* [Q: Does video.js support HLS (HTTP Live streaming) video?](#q-does-videojs-support-hls-http-live-streaming-video)
* [Q: Does video.js support MPEG Dash video?](#q-does-videojs-support-mpeg-dash-video)
* [Q: Does video.js support live video?](#q-does-videojs-support-live-video)
* [Q: Can video.js wrap around YouTube videos?](#q-can-videojs-wrap-around-youtube-videos)
* [Q: Can video.js wrap around Vimeo videos?](#q-can-videojs-wrap-around-vimeo-videos)
* [Q: Does video.js support DRM video?](#q-does-videojs-support-drm-video)
* [Q: Does video.js have any support for advertisement integrations?](#q-does-videojs-have-any-support-for-advertisement-integrations)
* [Q: Can video.js be required in node.js?](#q-can-videojs-be-required-in-nodejs)
* [Q: Does video.js work with webpack?](#q-does-videojs-work-with-webpack)
* [Q: Does video.js work with react?](#q-does-videojs-work-with-react)

## Q: What is video.js?

video.js is an extendable framework/library around the native video element. It does the following:

* Offers a plugin API so that different types of video can be handed to the native
  video element (e.g. [HLS][hls], [Flash][flash], HTML5 video, etc).
* Unifies the native video api across browsers (polyfilling support for features
  if necessary)
* Offers an extendable and themable UI
* Takes care of accessibility for the user (in-progress)
* Has a set of core plugins that offer support for tons of additional video formats.
  * [videojs-contrib-hls][hls]
  * [videojs-contrib-dash][dash]
* Support for DRM video via a core plugin
  * [videojs-contrib-eme][eme]
* Lots of plugins which offer support for all kinds of features. See the [plugin list on videojs.com][plugin-list]

## Q: How do I install video.js?

Currently video.js can be installed using npm, serving a release file from
a github tag, or even using a CDN hosted version. For information on doing any of those
see the [install guide][install-guide].

## Q: Is video.js on bower?

Versions prior to video.js 6 do support bower, however, as of video.js 6, bower is no
longer officially supported. Please see https://github.com/videojs/video.js/issues/4012
for more information.

## Q: What do video.js version numbers mean?

video.js follows [semver][semver] which means that the API should not change
out from under a user unless there is a major version increase.

## Q: How can I troubleshoot playback issues?

See the [troubleshooting guide][troubleshooting]. If troubleshooting does not
solve your issue, please submit a [pull request or an issue][pr-issue-question].

## Q: A video does not play in a specific browser. Why?

See the [troubleshooting guide][troubleshooting]. If troubleshooting does not
solve your issue, please submit a [pull request or an issue][pr-issue-question].

## Q: Why does the entire video download before playback? Why does the video load for a long time?

See the [troubleshooting guide][troubleshooting]. If troubleshooting does not
solve your issue, please submit a [pull request or an issue][pr-issue-question].

## Q: I see an error thrown that mentions `vdata12345`. What is that?

See the [troubleshooting guide][troubleshooting]. If troubleshooting does not
solve your issue, please submit a [pull request or an issue][pr-issue-question].

## Q: I think I found a bug with video.js or I want to add a feature. What should I do?

### if you think that you can fix the issue or add the feature

Submit a pull request to the [video.js repo][vjs-prs].
Make sure to follow the [contributing guide][contributing-prs] and
the [pull request template][pr-template].

### If you don't think you can fix the issue or add the feature

Open an [issue on the video.js repo][vjs-issues]. Make
sure that you follow the [issue template][issue-template] and the
[contributing guide][contributing-issues] so that we can better assist you
with your issue.

## Q: What is a reduced test case?

A reduced test case is an example of the problem that you are facing in isolation.
Think of it as example page that reproduces the issue in the least amount of possible code.
We have a [starter example][starter-example] for reduced test cases. To learn more
about reduced test cases visit [css-tricks][reduced-test-case]

## Q: What media formats does video.js support?

This depends on the formats supported by the browser's HTML5 video element, and the playback
techs/plugins made available to video.js. For more information on media formats see the [troubleshooting guide][troubleshooting].

## Q: How to I autoplay the video?

Video.js supports the standard html5 `autoplay` attribute on the video element.
It also supports it as an option to video.js or as a method invocation on the player.

```html
<video autoplay controls class="video-js">
```

```js
var player = videojs('my-video', {
  autoplay: true
});

// or

player.autoplay(true);
```

### Q: How can I autoplay a video on a mobile device?

Most mobile devices have blocked autoplaying videos until recently.
For mobile devices that don't support autoplaying, autoplay isn't supported by video.js.
For those devices that support autoplaying, like iOS10 and Chrome for Android 53+,
you must mute the video or have a video without audio tracks to be able to play it.
For example:

```html
<video muted autoplay playsinline>
```

Will make an inline, muted, autoplaying video on an iPhone with iOS10.

## Q: How can I play RTMP video in video.js?

Make sure that the Flash tech is available -- RTMP is not playable on browsers without Flash including mobile. Flash will only be available on video.js 6 with the [videojs-flash package][flash], in previous versions it was builtin to video.js. Then, just set the rtmp source with an appropriate type -- `rtmp/mp4` or `rtmp/flv`.
The main thing to be aware of is that video.js splits the connection url and stream name with the `&` character.
So, you'd want to update the url to follow that format. For example: `rtmp://example.com/live&foo` or `rtmp://example.com/fms&mp4:path/to/file.mp4`.

If the server requires query parameters for authentication, these should be added to the connection part url, for example `rtmp://example.com/live?token=1234&foo`.

## Q: How can I hide the links to my video/subtitles/audio/tracks?

It's impossible to hide the network requests a browser makes and difficult to
sufficiently obfuscate URLs in the source. Techniques such as token authentication may
help but are outside of the scope of video.js.

For content that must be highly secure [videojs-contrib-eme][eme] adds DRM support.

## Q: Can I turn off video.js logging?

Yes! This can be achieved by adding the following code _after_ including Video.js, but _before_ creating any player(s):

```js
videojs.log.level('off');
```

For more information, including which logging levels are available, check out the [debugging guide][debug-guide].

## Q: What is a plugin?

A plugin is a group of reusable functionality that can be re-used by others. For instance a plugin could add
a button to video.js that makes the video replay 10 times in a row before it stops playback for good. If such
a plugin existed and was published users could include it on their page to share that functionality.

## Q: How do I make a plugin for video.js?

See the [plugin guide][plugin-guide] for information on making a plugin for video.js.

<!-- TODO: Once these is a button guide, add this back in
## Q: How do I add a button to video.js?
See the [button guide][button-guide] for information on adding a button to video.js.
-->

## Q: Where can I find a list of video.js plugins?

The official [list of plugins on videojs.com][plugin-list].

## Q: How can I get my plugin listed on the website?

Add the 'videojs-plugin' [keyword to your array in package.json][npm-keywords]
and publish your package to npm. If you use the [plugin generator][generator] this will be done automatically for you. See
the [plugins guide][plugin-guide] for more information.

## Q: Where can I find a list of video.js skins?

See the [video.js github wiki][skins-list].

## Q: Does video.js work as an audio only player?

Yes! It can be used to play audio only files in a `<video>` or `<audio>` tag. The
difference being that the `<audio>` tag will not have a blank display area and the `<video>`
tag will. Note that audio only will not work with the Flash playback tech. The Flash playback tech will only be included in versions of video.js before 6. In Video.js 6 you will need to use the [videojs-flash package][flash].

## Q: Does video.js support audio tracks?

Yes! See the [audio tracks guide][audio-tracks] for information on using audio tracks.

## Q: Does video.js support video tracks?

The code for video tracks exists but it has not been tested. See the [video tracks guide][video-tracks]
for more information on using video tracks.

## Q: Does video.js support text tracks (captions, subtitles, etc)?

Yes! See the [text tracks guide][text-tracks] for information on using text tracks.

## Q: Does video.js support HLS (HTTP Live streaming) video?

video.js supports HLS video if the native HTML5 element supports HLS (e.g. Safari, Edge,
Chrome for Android, and iOS). For browsers without native support see the [videojs-contrib-hls][hls]
project which adds support.

## Q: Does video.js support MPEG Dash video?

video.js itself does not support MPEG DASH, however an official project called [videojs-contrib-dash][dash]
adds support for MPEG DASH video.

## Q: Does video.js support live video?

Yes! Video.js adds support for live videos via the Flash tech tech which supports RTMP streams. In Video.js 6 you will have to use [videojs-flash][flash] to get this. In previous versions the Flash tech was builtin. The official HLS tech, [videojs-contrib-hls][hls], will add support for live HLS video
if you add it to your page with video.js.

## Q: Can video.js wrap around YouTube videos?

No. There is an official plugin that adds support. It is called [videojs-youtube][youtube].

## Q: Can video.js wrap around Vimeo videos?

No. There is an official plugin that adds support. It is called [videojs-vimeo][vimeo].

## Q: Does video.js support DRM video?

No. There is an official plugin that adds support. It is called [videojs-contrib-eme][eme].

## Q: Does video.js have any support for advertisement integrations?

No. There is an official plugin that adds support. It is called [videojs-contrib-ads][ads].

## Q: Can video.js be required in node.js?

Yes! Please [submit an issue or open a pull request][pr-issue-question] if this does not work.

## Q: Does video.js work with webpack?

Yes! Please [submit an issue or open a pull request][pr-issue-question] if this does not work.

We have a short guide that deals with small configurations that you will need to do. [Webpack and Videojs Configuration][webpack-guide].

## Q: Does video.js work with react?

Yes! See [ReactJS integration example][react-guide].

[ads]: https://github.com/videojs/videojs-contrib-ads

[audio-tracks]: /docs/guides/audio-tracks.md

[contributing-issues]: http://github.com/videojs/video.js/blob/master/CONTRIBUTING.md#filing-issues

[contributing-prs]: http://github.com/videojs/video.js/blob/master/CONTRIBUTING.md#contributing-code

[dash]: http://github.com/videojs/videojs-contrib-dash

[debug-guide]: /docs/guides/debugging.md

[eme]: https://github.com/videojs/videojs-contrib-eme

[flash]: https://github.com/videojs/videojs-flash

[generator]: https://github.com/videojs/generator-videojs-plugin

[hls]: http://github.com/videojs/videojs-contrib-hls

[install-guide]: http://videojs.com/getting-started/

[issue-template]: http://github.com/videojs/video.js/blob/master/.github/ISSUE_TEMPLATE.md

[npm-keywords]: https://docs.npmjs.com/files/package.json#keywords

[plugin-guide]: /docs/guides/plugins.md

[plugin-list]: http://videojs.com/plugins

[pr-issue-question]: #q-i-think-i-found-a-bug-with-videojs-or-i-want-to-add-a-feature-what-should-i-do

[pr-template]: http://github.com/videojs/video.js/blob/master/.github/PULL_REQUEST_TEMPLATE.md

[react-guide]: /docs/guides/react.md

[reduced-test-case]: https://css-tricks.com/reduced-test-cases/

[semver]: http://semver.org/

[skins-list]: https://github.com/videojs/video.js/wiki/Skins

[starter-example]: http://jsbin.com/axedog/edit?html,output

[text-tracks]: /docs/guides/text-tracks.md

[troubleshooting]: /docs/guides/troubleshooting.md

[video-tracks]: /docs/guides/video-tracks.md

[vimeo]: https://github.com/videojs/videojs-vimeo

[vjs-issues]: https://github.com/videojs/video.js/issues

[vjs-prs]: https://github.com/videojs/video.js/pulls

[webpack-guide]: /docs/guides/webpack.md

[youtube]: https://github.com/videojs/videojs-youtube
