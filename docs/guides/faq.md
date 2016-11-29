## FAQ

**Q: What is video.js?**
> video.js is an extendable wrapper around the native video element. It does the following:
>  * Offers a plugin API so that different types of video can be handed to the native video element. IE:  HLS, Flash, or HTML5 video.
>  * Polyfills and unifies the native video api across browsers
>  * Offers an extendable and themable UI
>  * Takes care of accessibility for the user (in-progress)

**Q: How do I install video.js?**
> Currently video.js can be installed using bower, npm, or by serving a release file
> from a github tag. For information on doing any of those see the [install guide](http://videojs.com/getting-started/).

**Q: What do video.js version numbers mean?**
> video.js follows [semver](http://semver.org/)

**Q: How can I troubleshoot playback issues?**
> See the [troubleshooting guide](/docs/guides/troubleshooting.md)

**Q: What media formats does video.js support?**
> This depends on the browsers support, video.js will work off of that. If Flash is avialable Flash videos
> can also be played but only if the Flash tech is included with video.js.

**Q: How can I hide the links to my video?**
> This is outside of the scope of video.js and there are things that can be done to make it harder, but it will
> never be completely possible.

**Q: I think I found a bug with video.js. What should I do?**
> If you know how to code and feel comfortable looking into the issue, we will
> gladly review a pull request if you open one on the [video.js repo](https://github.com/videojs/video.js/pulls).
> If you don’t have any idea what that means, please open an [issue on the video.js repo](https://github.com/videojs/video.js/issues)
> and make sure that you follow the issue template so that we can better assist you.
> If the bug relates to a plugin, please file the issue against the plugin’s repository.

**Q: What is a [reduced test case](https://css-tricks.com/reduced-test-cases/)?**
> A [reduced test case](https://css-tricks.com/reduced-test-cases/) is an example of the problem that you
> are facing in isolation. Basically it is an example page that reproduces the issue in the least amount
> of possible code. We have a [starter example](http://jsbin.com/axedog/edit?html,output)

**Q: How do a make a plugin for video.js?**
> See the [plugin guide](/docs/guides/plugins.md) for information on making a plugin for video.js

**Q: How do I add a button to video.js?**
> See the [button guide](/docs/guides/button.md) for information on adding a button to video.js

**Q: Where can I find a list of video.js plugins?**
> A list of plugins is avialable on [videojs.com](http://videojs.com/plugins).

**Q: How can I get my plugin listend on the website?**
> Add the 'videojs-plugin' keyword to your package.json and publish your package to npm.

**Q: Where can I find a list of video.js skins?**
> See the [video.js github wiki](https://github.com/videojs/video.js/wiki/Skins).

**Q: Does video.js work as an audio only player?**
> Yes! Video.js can be used with an `<audio>` tag the same way that it is used with a `<video>` tag.

**Q: Does video.js support multiple audio tracks?**
> Yes! See the guide for [audio tracks](/docs/guides/audio-track.md)

**Q: Does video.js support multiple video tracks?**
> Theoretically it does but the code has yet to be tested, if it works or you find an
> issues feel free to open a pull request or submit an issue. The guide for video tracks is
> [here](/docs/guides/video-track.md)

**Q: Does video.js support multiple text tracks?**
> Yes! See the guide for [text tracks](/docs/guides/text-track.md)

**Q: Does video.js support HLS (HTTP Live streaming) video?**
> video.js supports HLS video if the native HTML5 element supports HLS
> (e.g. Safari, Edge, Android Chrome and iOS). For browsers without native
> support see the [videojs-contrib-hls](https://github.com/videojs/videojs-contrib-hls) project
> which adds support.

**Q: Does video.js support MPEG Dash video?**
> video.js itself does not support MPEG DASH, but a project called
> [videojs-contrib-dash](https://github.com/videojs/videojs-contrib-dash) which is maintained by
> the video.js organization does.

**Q: Does video.js support live video?**
> Yes! Video.js adds support for live videos.

**Q: Can video.js be required in node.js?**
> Yes! Please submit an issue if this does not work.

**Q: Does video.js work with webpack?**
> Yes! Please submit an issue if this does not work.

**Q: is video.js on bower?**
> Yes! See the [install guide](http://videojs.com/getting-started/) for more information.

