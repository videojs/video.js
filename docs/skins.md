Skins
=====

The default Video.js skin is made using HTML and CSS, so there's no need to learn a complicated skinning language to update colors or even create an entirely new skin. New in version 3.0 is the use of a sprites image file (video-js.png). The image allows for a little bit more classy design, as well as compatibility with older versions of IE now that the HTML skin also shows when Flash is used for those browsers.

You can view the uncompressed CSS for the default skin by downloading the latest version of Video.js or viewing [the source version](https://github.com/zencoder/video-js/blob/master/design/video-js.css) on Github.

You can either override styles in the default skin:

```css
.vjs-default-skin .vjs-play-progress { background: #900; }
```

Or remove the 'vjs-default-skin' class from the video tag and create your own skin.

```html
<video class="video-js my-custom-skin" ...>
```

More custom skins will be available for download soon. If you have one you'd like to contribute back, please email it to skins at videojs.

