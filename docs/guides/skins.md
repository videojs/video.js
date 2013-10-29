Skins
=====

The default Video.js skin is made using HTML and CSS, so there's no need to learn a complicated skinning language to update colors or even create an entirely new skin.

## Icons

New in version 4.0 is the use of font icons. All of the icons (play, pause, etc.) use the new custom font, which allows the icons to be scaled and colored just like any other text font.

All of the icons are available as variables in the [LESS](https://github.com/videojs/video.js/blob/master/src/css/video-js.less#L87-L99) source, making it easy to replace icons (such as the loading spinner). The easiest way to try this out is by using the [player skin designer](http://designer.videojs.com/).

![available icons](https://i.cloudup.com/wb51GGDDnJ.png)

## Customization

When you create a new skin, you can either override styles in the default skin:

```css
.vjs-default-skin .vjs-play-progress { background: #900; }
```

Or remove the 'vjs-default-skin' class from the video tag and create a new skin from scratch.

```html
<video class="video-js my-custom-skin" ...>
```

More custom skins will be available for download soon. If you have one you like you can share it by forking [this example on CodePen.io](http://codepen.io/heff/pen/EarCt), and adding a link on the [Skins wiki page](https://github.com/videojs/video.js/wiki/Skins).
