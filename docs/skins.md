Skins
=====

The default Video.js skin is made using HTML and CSS, so there's no need to learn a complicated skinning language to update colors or even create an entirely new skin. New in version 4.0 is the use of an icon font, which allows for the icons to be styled with CSS just like any other text.

You can modify the default stylesheet and see the changes live using the [Player Designer](http://designer.videojs.com/). If you prefer, you can also view the uncompressed CSS for the default skin by downloading the latest version of Video.js or viewing [the source version](https://github.com/videojs/video.js/blob/master/src/css/video-js.css) on Github.

If you'd like to choose your own icons, you can import the [Video.js font](src/css/font) into [IcoMoon](http://icomoon.io/) and use any of their icons or upload your own. You can avoid modifying the CSS a little if you make sure to keep each icon mapped to the same character as the original font. Different icon packs have different licensing, so make sure to keep that in mind when creating your new collection!

You can either override styles in the default skin:

```css
.vjs-default-skin .vjs-play-progress { background: #900; }
```

Or remove the 'vjs-default-skin' class from the video tag and create your own skin.

```html
<video class="video-js my-custom-skin" ...>
```

More custom skins will be available for download soon. If you have one you'd like to contribute back, please email it to skins at videojs.
