# FAQ

## Q: What is video.js?
video.js is an extendable framework/library around the native video element. It does the following:
  * Offers a plugin API so that different types of video can be handed to the native
    video element. IE:  HLS, Flash, or HTML5 video.
  * Unifies the native video api across browsers (polyfilling support for features
    if necessary)
  * Offers an extendable and themable UI
  * Takes care of accessibility for the user (in-progress)
  * Has a set of core plugins that offer support for tons of additional video formats.
    * [videojs-contrib-hls](http://github.com/videojs/videojs-contrib-hls)
    * [videojs-contrib-dash](http://github.com/videojs/videojs-contrib-hls)
  * Support for DRM video via a core plugin
    * [videojs-contrib-eme](https://github.com/videojs/videojs-contrib-eme)
  * Lots of plugins which offer support for all kinds of features. See the [plugin list on videojs.com](http://videojs.com/plugins)

## Q: How do I install video.js?
Currently video.js can be installed using bower, npm, serving a release file from
a github tag, or even using a CDN hosted version. For information on doing any of those
see the [install guide](http://videojs.com/getting-started/).

## Q: What do video.js version numbers mean?
video.js follows [semver](http://semver.org/) which means that the API should not change
out from under a user unless there is a major version increase.

## Q: How can I troubleshoot playback issues?
See the [troubleshooting guide](/docs/guides/troubleshooting.md) for information on troubleshooting playback issues

## Q: A video does not play in a specific browser. Why?
See the [troubleshooting guide](/docs/guides/troubleshooting.md) for information on
why this might be happening. Open an [issue on the video.js repo](https://github.com/videojs/video.js/issues).
Make sure that you follow the [issue template](/.github/ISSUE_TEMPLATE.md) and the
[contributing guide](/CONTRIBUTING.md#filing-issues) so that we can better assist you
with your issue.

## Q: Why does the entire video download before playback? Why does the video load for a long time?
See the [troubleshooting guide](/docs/guides/troubleshooting.md) for information on
why this might be happening. Open an [issue on the video.js repo](https://github.com/videojs/video.js/issues).
Make sure that you follow the [issue template](/.github/ISSUE_TEMPLATE.md) and the
[contributing guide](/CONTRIBUTING.md#filing-issues) so that we can better assist you

## Q: I see an error thrown that mentions `vdata12345`. What is that?
See the [troubleshooting guide](/docs/guides/troubleshooting.md) for information on
why this might be happening. Open an [issue on the video.js repo](https://github.com/videojs/video.js/issues).
Make sure that you follow the [issue template](/.github/ISSUE_TEMPLATE.md) and the
[contributing guide](/CONTRIBUTING.md#filing-issues) so that we can better assist you

## Q: What media formats does video.js support?
This depends on the formats supported by the browser's HTML5 video element, and the playback
techs made available to video.js. For example, video.js 5 includes the Flash tech by default which
enables the playback of FLV video where the Flash plugin is available.

## Q: How can I hide the links to my video/subtitles/audio/tracks?
It's impossible to hide the network requests a browser makes and difficult to
sufficiently obfuscate URLs in the source. Techniques such as token authentication may
help but are outside of the scope of video.js.

For content that must be highly secure [videojs-contrib-eme](https://github.com/videojs/videojs-contrib-eme) adds DRM support.

## Q: I think I found a bug with video.js or I want to add a feature. What should I do?
### if you think that you can fix the issue or add the feature
Submit a pull request to the [video.js repo](https://github.com/videojs/video.js/pulls).
Make sure to follow the [contributing guide](/CONTRIBUTING.md#contributing-code) and
the [pull request template](/.github/PULL_REQUEST_TEMPLATE.md).

### If you don't think you can fix the issue or add the feature
Open an [issue on the video.js repo](https://github.com/videojs/video.js/issues). Make
sure that you follow the [issue template](/.github/ISSUE_TEMPLATE.md) and the
[contributing guide](/CONTRIBUTING.md#filing-issues) so that we can better assist you
with your issue.

## Q: What is a [reduced test case](https://css-tricks.com/reduced-test-cases/)?
A [reduced test case](https://css-tricks.com/reduced-test-cases/) is an example of the
problem that you are facing in isolation. Think of it as example page that reproduces
the issue in the least amount of possible code. We have a [starter example](http://jsbin.com/axedog/edit?html,output)
for reduced test cases.

## Q: What is a plugin?
A plugin is a group of reusable functionality that can be re-used by others. For instance a plugin could add
a button to video.js that makes the video replay 10 times in a row before it stops playback for good. If such
a plugin existed and was published users could include it on their page to share that functionality.

## Q: How do I make a plugin for video.js?
See the [plugin guide](/docs/guides/plugins.md) for information on making a plugin for video.js.

## Q: How do I add a button to video.js?
See the [button guide](/docs/guides/button.md) for information on adding a button to video.js.

## Q: Where can I find a list of video.js plugins?
A list of plugins is avialable on [videojs.com](http://videojs.com/plugins).

## Q: How can I get my plugin listend on the website?
Add the 'videojs-plugin' [keyword to your array in package.json](https://docs.npmjs.com/files/package.json#keywords)
and publish your package to npm.

## Q: Where can I find a list of video.js skins?
See the [video.js github wiki](https://github.com/videojs/video.js/wiki/Skins).

## Q: Does video.js work as an audio only player?
Yes! It can be used to play audio only files in a `<video>` or `<audio>` tag. The
difference being that the `<audio>` tag will not have a blank display area and the `<video>`
tag will. Note that audio only will not work with the Flash playback tech.

## Q: Does video.js support audio tracks?
Yes! See the [audio tracks guide](/docs/guides/audio-tracks.md) for information on using audio tracks.

## Q: Does video.js support video tracks?
The code for video tracks exists but it has not been tested. See the [video tracks guide](/docs/guides/video-tracks.md)
for more information on using video tracks.

### Q: Does video.js support text tracks (captions, subtitles, etc)?
Yes! See the [text tracks guide](/docs/guides/text-track.md) for information on using text tracks.

## Q: Does video.js support HLS (HTTP Live streaming) video?
video.js supports HLS video if the native HTML5 element supports HLS (e.g. Safari, Edge,
Chrome for Android, and iOS). For browsers without native support see the [videojs-contrib-hls](https://github.com/videojs/videojs-contrib-hls)
project which adds support.

## Q: Does video.js support MPEG Dash video?
video.js itself does not support MPEG DASH, but a project called [videojs-contrib-dash](https://github.com/videojs/videojs-contrib-dash)
which is maintained by the video.js organization.

## Q: Does video.js support live video?
Yes! Video.js adds support for live videos via the Flash tech which supports RTMP streams.
[videojs-contrib-hls](http://github.com/videojs/videojs-contrib-hls) will add support for live HLS video
if you add it to your page with video.js.

## Q: Can video.js be required in node.js?
Yes! Please submit an issue if this does not work. See the question on submiting issues
to find out how.

## Q: Does video.js work with webpack?
Yes! Please submit an issue if this does not work. See the question on submiting issues
to find out how.

## Q: Is video.js on bower?
Yes! See the [install guide](http://videojs.com/getting-started/) for more information.

