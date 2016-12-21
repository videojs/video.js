# Skins

## Table of Contents

* [Default Skin](#default-skin)
* [Additional &lt;style> Elements](#additional-style-elements)
  * [Disabling Additional &lt;style> Elements](#disabling-additional-style-elements)
    * [Effect on Player#width() and Player#height()](#effect-on-playerwidth-and-playerheight)
* [Icons](#icons)
* [Creating a Skin](#creating-a-skin)
  * [Add a Custom Class to the Player](#add-a-custom-class-to-the-player)
  * [Customize Styles](#customize-styles)

## Default Skin

When you include the Video.js CSS file (`video-js.min.css`), the default Video.js skin is applied. That means that customizing the look of a Video.js player is a matter of taking advantage of the cascading aspect of CSS to override styles.

## Additional `<style>` Elements

In addition to the Video.js CSS file, there are some styles generated automatically by JavaScript and included in the `<head>` as `<style>` elements.

* The `"vjs-styles-defaults"` element sets default dimensions for all Video.js players on the page.
* A `"vjs-styles-dimensions"` element is created for _each_ player on the page and is used to adjust its size. This styling is handled in this manner to allow you to override it with custom CSS without relying on scripting or `!important` to overcome inline styles.

### Disabling Additional `<style>` Elements

In some cases, particularly with web applications using frameworks that may manage the `<head>` element (e.g. React, Ember, Angular, etc), these `<style>` elements are not desirable. They can be suppressed by setting `window.VIDEOJS_NO_DYNAMIC_STYLE = true` before including Video.js.

_This disables all CSS-based player sizing. Players will have no `height` or `width` by default!_ Even dimensional attributes, such as `width="600" height="300"` will be _ignored_. When using this global, you will need to set their own dimensions in a way that makes sense for their website or web app.

#### Effect on `Player#width()` and `Player#height()`

When `VIDEOJS_NO_DYNAMIC_STYLE` is set, `Player#width()` and `Player#height()` will apply any width and height that is set directly to the `<video>` element (or whichever element the current tech uses).

## Icons

Video.js ships with a number of icons built into the skin via an icon font.

You can view all of the icons available in the default skin by renaming [`sandbox/icons.html.example`](https://github.com/videojs/video.js/blob/master/sandbox/icons.html.example) to `sandbox/icons.html`, building Video.js with `npm run build`, and opening `sandbox/icons.html` in your browser of choice.

## Creating a Skin

The recommended process for creating a skin is to override the styles provided by the default skin. In this way, you don't need to start from scratch.

### Add a Custom Class to the Player

The most convenient way to create a hook in the player for your skin is to add a class to it. You can do this by adding a class to the initial `<video>` element:

```html
<video class="vjs-matrix video-js">...</video>
```

Or via JavaScript:

```js
var player = videojs('my-player');

player.addClass('vjs-matrix');
```

> **Note:** The `vjs-` prefix is a convention for all classes that are contained in a Video.js player.

### Customize Styles

The first step in overriding default styles with custom ones is to determine which selectors and properties need overriding. As an example, let's say we don't like the default color of controls (white) and we want to change them to a bright green (say, `#00ff00`).

To do this, we'll use your browser's developer tools to inspect the player and figure out which selectors we need to use to adjust those styles - and we'll add our custom `.vjs-matrix` selector to ensure our final selectors are specific enough to override the default skin.

In this case, we'll need the following:

```css
/* Change all text and icon colors in the player. */
.vjs-matrix.video-js {
  color: #00ff00;
}

/* Change the border of the big play button. */
.vjs-matrix .vjs-big-play-button {
  border-color: #00ff00;
}

/* Change the color of various "bars". */
.vjs-matrix .vjs-volume-level,
.vjs-matrix .vjs-play-progress,
.vjs-matrix .vjs-slider-bar {
  background: #00ff00;
}
```

Finally, we can save that as a `videojs-matrix.css` file and include it _after_ the Video.js CSS:

```html
<link rel="stylesheet" type="text/css" href="path/to/video-js.min.css">
<link rel="stylesheet" type="text/css" href="path/to/videojs-matrix.css">
```

If you create a skin you're particularly proud of, you can share it by adding a link on the [Skins wiki page](https://github.com/videojs/video.js/wiki/Skins). One way to create shareable skins is by forking [this example on CodePen](http://codepen.io/heff/pen/EarCt).
