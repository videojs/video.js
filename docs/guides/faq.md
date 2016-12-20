# FAQ

## Q: What is video.js?
video.js is an extendable framework/library around the native video element. It does the following:
  * Offers a plugin API so that different types of video can be handed to the native
    video element (e.g. HLS, Flash, HTML5 video, etc).
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
Currently video.js can be installed using bower, npm, serving a release file from
a github tag, or even using a CDN hosted version. For information on doing any of those
see the [install guide][install-guide].

## Q: Is video.js on bower?
Yes! See the [install guide][install-guide] for more information.

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
about reduced test cases visit: https://css-tricks.com/reduced-test-cases/

## Q: What media formats does video.js support?
This depends on the formats supported by the browser's HTML5 video element, and the playback
techs made available to video.js. For example, video.js 5 includes the Flash tech by default which
enables the playback of FLV video where the Flash plugin is available. For more information
on media formats see the [troubleshooting guide][troubleshooting].

## Q: How can I hide the links to my video/subtitles/audio/tracks?
It's impossible to hide the network requests a browser makes and difficult to
sufficiently obfuscate URLs in the source. Techniques such as token authentication may
help but are outside of the scope of video.js.

For content that must be highly secure [videojs-contrib-eme][eme] adds DRM support.

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
tag will. Note that audio only will not work with the Flash playback tech.

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
video.js itself does not support MPEG DASH, however an offical project called [videojs-contrib-dash][dash]
adds support for MPEG DASH video.

## Q: Does video.js support live video?
Yes! Video.js adds support for live videos via the Flash tech which supports RTMP streams.
The official HLS tech, [videojs-contrib-hls][hls], will add support for live HLS video
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

<!-- guides -->
[plugin-guide]: /docs/guides/plugins.md
[install-guide]: http://videojs.com/getting-started/
[troubleshooting]: /docs/guides/troubleshooting.md
[video-tracks]: /docs/guides/video-tracks.md
[audio-tracks]: /docs/guides/audio-tracks.md
[text-tracks]:  /docs/guides/text-tracks.md
[pr-issue-question]: /docs/guides/faq.md#q-i-think-i-found-a-bug-with-videojs-or-i-want-to-add-a-feature-what-should-i-do

<!-- official projects -->
[hls]: http://github.com/videojs/videojs-contrib-hls
[dash]: http://github.com/videojs/videojs-contrib-dash
[eme]: https://github.com/videojs/videojs-contrib-eme
[generator]: https://github.com/videojs/generator-videojs-plugin
[youtube]: https://github.com/videojs/videojs-youtube
[vimeo]: https://github.com/videojs/videojs-vimeo
[ads]: https://github.com/videojs/videojs-contrib-ads

<!-- website/github -->
[pr-template]: /.github/PULL_REQUEST_TEMPATLE.md
[issue-template]: /.github/ISSUE_TEMPLATE.md
[plugin-list]: http://videojs.com/plugins
[skins-list]: https://github.com/videojs/video.js/wiki/Skins
[contributing-issues]: /CONTRIBUTING.md#filing-issues
[contributing-prs]: /CONTRIBUTING.md#contributing-code
[vjs-issues]: https://github.com/videojs/video.js/issues
[vjs-prs]: https://github.com/videojs/video.js/pulls

<!-- external -->
[npm-keywords]: https://docs.npmjs.com/files/package.json#keywords
[semver]: http://semver.org/
[starter-example]: http://jsbin.com/axedog/edit?html,output
