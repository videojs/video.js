- Promise Play
  In addition to making sure that a Promise is always returned from play(), if Promises are supported or polyfilled, we should be able to shim a play() promise if a promise isn't provided to us natively.
- vjs-fill being first class
  vjs-fluid is a first-class option now but vjs-fill is just as useful. We should have a fill() method and option just like fluid
- loadMedia: https://github.com/videojs/video.js/issues/4342
- refocus docs on handwritten docs rather than jsdoc using docusaurus or docz
- turn video.js into a monorepo and break it up into many modules
  especially with the addition of VHS, a lot of times you want just a piece of Video.js. We should slice video.js up into pieces and publish them as separate packages. This may make the need for "custom builds" obsolete
  For example, `@videojs/core`, `@videojs/tracks`, `@videojs/controls`, `@videojs/utils`.
- Focus ring changes
  This may not actually require changes to Video.js and may just be a documentation thing for how to use focus-visible polyfill
  https://github.com/videojs/video.js/issues/2993#issuecomment-387626945
- Make framework test pages and test apps
  Make react, angular, ember, phonegap test apps
- Custom builds
  May not be necessary if we split Video.js into packages. The idea is to make sure that it's possible to compile away pieces that are not wanted by the user.
- Retry after error
  This can get pretty involved if you consider any error but I think the MVP here is to retry after a MEDIA_ERR_SRC_NOT_SUPPORTED to basically waterfall the sources
- Menu and control bar usability
  lock-showing and whether it should prevent the control bar from hiding. Also, whether using the mouse should cancel lock-showing when exiting the menu or if it should require clicking the button again.
  how to do a better and job and make it less frustrating with auto-hiding the control bar. https://github.com/videojs/video.js/issues/5258
- Settings Menu
  It's probably time to revisit the settings menu and implement an accessible, good looking, and extensible settings menu for everyone
- Responsive sizing
  We already have some support for responsive sizing and we have an "adaptive" stylesheet but we still can do a much better job at handling different player sizing. Especially with the `playerresize` event.
  Things we can do:
    - make sure captions resize properly in relation to player size
    - hide and show control bar buttons as necessary when the player resizes
    - change the control bar sizes in relation to player size, for example, in fullscreen make the controls a lot larger
- Audio skin
  Currently, we support the audio element but it's feature support for it is confusing. The HTML spec differentiates between video elements and audio elements by whether they have a "canvas" to use for visual information, for things like the poster image, captions, and video. When using an audio element, we should make sure that we have just a control bar and no visual area around it.
  However, if audio is played with the video element, we should be smart and keep the poster showing along with the control bar and allow for captions to be shown as well.
- vtt.js updates
  - make parsing async: https://github.com/mozilla/vtt.js/pull/373
  - upgrade tests so they run in a modern node in a reasonable amount of time
  - make it a first class node/bundler citizen
- ClickableComponent
  Figure out what is the status of it currently and either mark it for removal and undeprecate it
- vdata errors
  We often have issues come up for errors relating to a `vdata12345` error in the console. We should put up a page explaining this issue and then log a warning with a link to it when it happens rather than crashing.
- iOS and multiple controls
  It's possible there are still cases where the native control bar shows up under ours in iOS, we should investigate and fix it
- Make our language files work with bundlers
- Investigate `type=module` script support for Video.js
