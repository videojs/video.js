Skins
=====

The base Video.js skin is made using HTML and CSS (although we use the [Sass preprocessor](http://sass-lang.com)), and by default these styles are added to the dom for you! That means you can build a custom skin by simply taking advantage of the cascading aspect of CSS and overriding
the styles you'd like to change.

If you don't want Video.js to inject the base styles for you, you can disable it by setting `window.VIDEOJS_NO_BASE_THEME = true` before Video.js is loaded. Keep in mind that without these base styles
enabled, you'll need to manually include them.

## Default style elements
Video.js uses a couple of dynamically, specifically, there's a default styles element as well as a player dimensions style element.
They are used to provide extra default flexiblity with styling the player. However, in a lot of cases, users do not want this.
When `window.VIDEOJS_NO_BASE_THEME` is set to `true`, videojs will *not* include these element in the page.
This means that default dimensions and configured player dimensions will *not* be applied.
For example, the following player will end up having a width and height of 0 when initialized if `window.VIDEOJS_NO_BASE_THEME === true`:
```html
<video width=600 height=300></video>
```

## Icons

You can view all of the icons available in the base theme by renaming and viewing [`icons.html.example`](https://github.com/videojs/video.js/blob/master/sandbox/icons.html.example) in the sandbox directory.

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
