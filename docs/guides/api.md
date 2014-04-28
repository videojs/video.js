API
===

The Video.js API allows you to interact with the video through JavaScript, whether the browser is playing the video through HTML5 video, Flash, or any other supported playback technologies.

Referencing the Player
----------------------
To use the API functions, you need access to the player object. Luckily this is easy to get. You just need to make sure your video tag has an ID. The example embed code has an ID of "example\_video_1". If you have multiple videos on one page, make sure every video tag has a unique ID.

```js
var myPlayer = videojs('example_video_1');
```

(If the player hasn't been initialized yet via the data-setup attribute or another method, this will also initialize the player.)

Wait Until the Player is Ready
------------------------------
The time it takes Video.js to set up the video and API will vary depending on the playback technology being used (HTML5 will often be much faster to load than Flash). For that reason we want to use the player's 'ready' function to trigger any code that requires the player's API.

```javascript
videojs("example_video_1").ready(function(){
  var myPlayer = this;

  // EXAMPLE: Start playing the video.
  myPlayer.play();

});
```

API Methods
-----------
Now that you have access to a ready player, you can control the video, get values, or respond to video events. The Video.js API function names follow the [HTML5 media API](http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html). The main difference is that getter/setter functions are used for video properties.

```js

// setting a property on a bare HTML5 video element
myVideoElement.currentTime = "120";

// setting a property on a Video.js player
myPlayer.currentTime(120);

```

The full list of player API methods and events can be found in the [player API docs](../api/vjs.Player.md).
