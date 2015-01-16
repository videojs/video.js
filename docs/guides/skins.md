Skins
=====

The base Video.js skin is made using HTML and CSS (although we use the [Sass preprocessor](http://sass-lang.com)), and by default these styles are added to the dom for you! That means you can build a custom skin by simply taking advantage of the cascading aspect of CSS and overriding
the styles you'd like to change.

If you don't want Video.js to inject the base styles for you, you can disable it by setting `window.VIDEOJS_NO_BASE_THEME = false` before Video.js is loaded. Keep in mind that without these base styles
enabled, you'll need to manually include them.

## Icons

You can view all of the icons available in the base theme by renaming and viewing [`icons.html.example`](../../sandbox/icons.html.example) in the sandbox directory.

## Customization

When you create a new skin, the easiest way to get started is to simply override the base Video.js theme. You should include a new class matching the
name of your theme, then just start overriding!

```css
.vjs-skin-hotdog-stand { color: #FF0000; }
.vjs-skin-hotdog-stand .vjs-control-bar { background: #FFFF00; }
.vjs-skin-hotdog-stand .vjs-play-progress { background: #FF0000; }
```

This would take care of the major areas of the skin (play progress, the control bar background, and icon colors), but you can skin any other aspect.
Our suggestion is to use a browser such as Firefox and Chrome, and use the developer tools to inspect the different elements and see what you'd like to change and what classes
to target when you do so.

More custom skins will be available for download soon. If you have one you like you can share it by forking [this example on CodePen.io](http://codepen.io/heff/pen/EarCt), and adding a link on the [Skins wiki page](https://github.com/videojs/video.js/wiki/Skins).
