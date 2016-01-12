Options
=======

Setting Options
---------------

The Video.js embed code is simply an HTML5 video tag, so for many of the options you can use the standard tag attributes to set the options.

```html
<video controls autoplay preload="auto" ...>
```

Alternatively, you can use the data-setup attribute to provide options in the [JSON](http://json.org/example.html) format. This is also how you would set options that aren't standard to the video tag.

```html
<video data-setup='{ "controls": true, "autoplay": false, "preload": "auto" }'...>
```

Finally, if you're not using the data-setup attribute to trigger the player setup, you can pass in an object with the player options as the second argument in the javascript setup function.

```js
videojs("example_video_1", { "controls": true, "autoplay": false, "preload": "auto" });
```


Individual Options
------------------

> ### Note on Video Tag Attributes ###
> With HTML5 video tag attributes that can only be true or false (boolean), you simply include the attribute (no equals sign) to turn it on, or exclude it to turn it off. For example, to turn controls on:

WRONG
```html
<video controls="true" ...>
```

RIGHT
```html
<video controls ...>
```

> The biggest issue people run into is trying to set these values to false using false as the value (e.g. controls="false") which actually does the opposite and sets the value to true because the attribute is still included. If you need the attribute to include an equals sign for XHTML validation, you can set the attribute's value to the same as its name (e.g. controls="controls").


### controls ###
The controls option sets whether or not the player has controls that the user can interact with. Without controls the only way to start the video playing is with the autoplay attribute or through the API.

```html
<video controls ...>
or
{ "controls": true }
```


### autoplay ###
If autoplay is true, the video will start playing as soon as page is loaded (without any interaction from the user).
NOT SUPPORTED BY APPLE iOS DEVICES. Apple blocks the autoplay functionality in an effort to protect it's customers from unwillingly using a lot of their (often expensive) monthly data plans. A user touch/click is required to start the video in this case.
```html
<video autoplay ...>
or
{ "autoplay": true }
```


### preload ###
The preload attribute informs the browser whether or not the video data should begin downloading as soon as the video tag is loaded. The options are auto, metadata, and none.

'auto': Start loading the video immediately (if the browser agrees). Some mobile devices like iPhones and iPads will not preload the video in order to protect their users' bandwidth. This is why the value is called 'auto' and not something more final like 'true'.

'metadata': Load only the meta data of the video, which includes information like the duration and dimensions of the video.

'none': Don't preload any of the video data. This will wait until the user clicks play to begin downloading.

```html
<video preload ...>
or
{ "preload": "auto" }
```


### poster ###
The poster attribute sets the image that displays before the video begins playing. This is often a frame of the video or a custom title screen. As soon as the user clicks play the image will go away.
```html
<video poster="myPoster.jpg" ...>
or
{ "poster": "myPoster.jpg" }
```


### loop ###
The loop attribute causes the video to start over as soon as it ends. This could be used for a visual effect like clouds in the background.
```html
<video loop ...>
or
{ "loop": true }
```


### width ###
The width attribute sets the display width of the video.
```html
<video width="640" ...>
or
{ "width": 640 }
```


### height ###
The height attribute sets the display height of the video.
```html
<video height="480" ...>
or
{ "height": 480 }
```

Component Options
-----------------

You can set the options for any single player component. For instance, if you wanted to remove the `muteToggle` button, which
is a child of `controlBar`, you can just set that component to false:

```javascript
var player = videojs('video-id', {
  controlBar: {
    muteToggle: false
  }
});
```

This also works using the `data-setup` attribute on the video element, just remember the options need to use proper JSON
notation.

```html
<video ... data-setup='{ "controlBar": { "muteToggle": false } }'></video>
```

The [components guide](components.md) has an excellent breakdown of the structure of a player, you
just need to remember to nest child components in a `children` array for each level.
