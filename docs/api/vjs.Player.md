<!-- GENERATED FROM SOURCE -->

# vjs.Player

__EXTENDS__: [vjs.Component](vjs.Component.md)  
__DEFINED IN__: [src/js/player.js#L21](https://github.com/videojs/video.js/blob/master/src/js/player.js#L21)  

An instance of the `vjs.Player` class is created when any of the Video.js setup methods are used to initialize a video.

```js
var myPlayer = videojs('example_video_1');
```

In the following example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.

```html
<video id="example_video_1" data-setup='{}' controls>
  <source src="my-source.mp4" type="video/mp4">
</video>
```

After an instance has been created it can be accessed globally using `Video('example_video_1')`.

---

## INDEX

- [METHODS](#methods)
  - [buffered](#buffered)
  - [bufferedEnd](#bufferedend)
  - [bufferedPercent](#bufferedpercent)
  - [cancelFullScreen](#cancelfullscreen) _`deprecated`_
  - [controls](#controls-controls-)
  - [currentTime](#currenttime-seconds-)
  - [currentType](#currenttype)
  - [dispose](#dispose)
  - [duration](#duration-seconds-)
  - [error](#error-err-)
  - [exitFullscreen](#exitfullscreen)
  - [init](#init-tag-options-ready-)
  - [isFullScreen](#isfullscreen-isfs-) _`deprecated`_
  - [isFullscreen](#isfullscreen-isfs-)
  - [language](#language-languagecode-)
  - [muted](#muted-muted-)
  - [onWaitEnd](#onwaitend)
  - [pause](#pause)
  - [paused](#paused)
  - [play](#play)
  - [poster](#poster-src-)
  - [requestFullScreen](#requestfullscreen) _`deprecated`_
  - [requestFullscreen](#requestfullscreen)
  - [src](#src-source-)
  - [volume](#volume-percentasdecimal-)
  - [addChild](#addchild-child-options-) _`inherited`_
  - [addClass](#addclass-classtoadd-) _`inherited`_
  - [buildCSSClass](#buildcssclass) _`inherited`_
  - [children](#children) _`inherited`_
  - [contentEl](#contentel) _`inherited`_
  - [createEl](#createel-tagname-attributes-) _`inherited`_
  - [dimensions](#dimensions-width-height-) _`inherited`_
  - [el](#el) _`inherited`_
  - [enableTouchActivity](#enabletouchactivity) _`inherited`_
  - [getChild](#getchild-name-) _`inherited`_
  - [getChildById](#getchildbyid-id-) _`inherited`_
  - [height](#height-num-skiplisteners-) _`inherited`_
  - [hide](#hide) _`inherited`_
  - [id](#id) _`inherited`_
  - [initChildren](#initchildren) _`inherited`_
  - [name](#name) _`inherited`_
  - [off](#off-type-fn-) _`inherited`_
  - [on](#on-type-fn-) _`inherited`_
  - [one](#one-type-fn-) _`inherited`_
  - [options](#options-obj-) _`inherited`_
  - [player](#player) _`inherited`_
  - [ready](#ready-fn-) _`inherited`_
  - [removeChild](#removechild-component-) _`inherited`_
  - [removeClass](#removeclass-classtoremove-) _`inherited`_
  - [show](#show) _`inherited`_
  - [trigger](#trigger-event-) _`inherited`_
  - [triggerReady](#triggerready) _`inherited`_
  - [width](#width-num-skiplisteners-) _`inherited`_

- [EVENTS](#events)
  - [durationchange](#durationchange-event)
  - [ended](#ended-event)
  - [firstplay](#firstplay-event)
  - [fullscreenchange](#fullscreenchange-event)
  - [loadedalldata](#loadedalldata-event)
  - [loadeddata](#loadeddata-event)
  - [loadedmetadata](#loadedmetadata-event)
  - [loadstart](#loadstart-event)
  - [pause](#pause-event)
  - [play](#play-event)
  - [progress](#progress-event)
  - [seeked](#seeked-event)
  - [seeking](#seeking-event)
  - [timeupdate](#timeupdate-event)
  - [volumechange](#volumechange-event)
  - [waiting](#waiting-event)
  - [resize](#resize-event) _`inherited`_

---

## METHODS

### addChild( child, [options] )
> Adds a child component inside this component
> 
>     myComponent.el();
>     // -> <div class='my-component'></div>
>     myComonent.children();
>     // [empty array]
> 
>     var myButton = myComponent.addChild('MyButton');
>     // -> <div class='my-component'><div class="my-button">myButton<div></div>
>     // -> myButton === myComonent.children()[0];
> 
> Pass in options for child constructors and options for children of the child
> 
>     var myButton = myComponent.addChild('MyButton', {
>       text: 'Press Me',
>       children: {
>         buttonChildExample: {
>           buttonChildOption: true
>         }
>       }
>     });

##### PARAMETERS: 
* __child__ `String|vjs.Component` The class name or instance of a child to add
* __options__ `Object` _(OPTIONAL)_ Options, including options to be passed to children of the child.

##### RETURNS: 
* `vjs.Component` The child component (created by this process if a string was used)

_inherited from_: [src/js/component.js#L356](https://github.com/videojs/video.js/blob/master/src/js/component.js#L356)

---

### addClass( classToAdd )
> Add a CSS class name to the component's element

##### PARAMETERS: 
* __classToAdd__ `String` Classname to add

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L672](https://github.com/videojs/video.js/blob/master/src/js/component.js#L672)

---

### buffered()
> Get a TimeRange object with the times of the video that have been downloaded
> 
> If you just want the percent of the video that's been downloaded,
> use bufferedPercent.
> 
>     // Number of different ranges of time have been buffered. Usually 1.
>     numberOfRanges = bufferedTimeRange.length,
> 
>     // Time in seconds when the first range starts. Usually 0.
>     firstRangeStart = bufferedTimeRange.start(0),
> 
>     // Time in seconds when the first range ends
>     firstRangeEnd = bufferedTimeRange.end(0),
> 
>     // Length in seconds of the first time range
>     firstRangeLength = firstRangeEnd - firstRangeStart;

##### RETURNS: 
* `Object` A mock TimeRange object (following HTML spec)

_defined in_: [src/js/player.js#L743](https://github.com/videojs/video.js/blob/master/src/js/player.js#L743)

---

### bufferedEnd()
> Get the ending time of the last buffered time range
> 
> This is used in the progress bar to encapsulate all time ranges.

##### RETURNS: 
* `Number` The end of the last buffered time range

_defined in_: [src/js/player.js#L794](https://github.com/videojs/video.js/blob/master/src/js/player.js#L794)

---

### bufferedPercent()
> Get the percent (as a decimal) of the video that's been downloaded
> 
>     var howMuchIsDownloaded = myPlayer.bufferedPercent();
> 
> 0 means none, 1 means all.
> (This method isn't in the HTML5 spec, but it's very convenient)

##### RETURNS: 
* `Number` A decimal between 0 and 1 representing the percent

_defined in_: [src/js/player.js#L763](https://github.com/videojs/video.js/blob/master/src/js/player.js#L763)

---

### buildCSSClass()
> Allows sub components to stack CSS class names

##### RETURNS: 
* `String` The constructed class name

_inherited from_: [src/js/component.js#L515](https://github.com/videojs/video.js/blob/master/src/js/component.js#L515)

---

### cancelFullScreen()
> Old naming for exitFullscreen
**Deprecated** true

_defined in_: [src/js/player.js#L999](https://github.com/videojs/video.js/blob/master/src/js/player.js#L999)

---

### children()
> Get an array of all child components
> 
>     var kids = myComponent.children();

##### RETURNS: 
* `Array` The children

_inherited from_: [src/js/component.js#L290](https://github.com/videojs/video.js/blob/master/src/js/component.js#L290)

---

### contentEl()
> Return the component's DOM element for embedding content.
> Will either be el_ or a new element defined in createEl.

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L233](https://github.com/videojs/video.js/blob/master/src/js/component.js#L233)

---

### controls( controls )
> Get or set whether or not the controls are showing.

##### PARAMETERS: 
* __controls__ `Boolean` Set controls to showing or not

##### RETURNS: 
* `Boolean` Controls are showing

_defined in_: [src/js/player.js#L1274](https://github.com/videojs/video.js/blob/master/src/js/player.js#L1274)

---

### createEl( [tagName], [attributes] )
> Create the component's DOM element

##### PARAMETERS: 
* __tagName__ `String` _(OPTIONAL)_ Element's node type. e.g. 'div'
* __attributes__ `Object` _(OPTIONAL)_ An object of element attributes that should be set on the element

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L194](https://github.com/videojs/video.js/blob/master/src/js/component.js#L194)

---

### currentTime( [seconds] )
> Get or set the current time (in seconds)
> 
>     // get
>     var whereYouAt = myPlayer.currentTime();
> 
>     // set
>     myPlayer.currentTime(120); // 2 minutes into the video

##### PARAMETERS: 
* __seconds__ `Number|String` _(OPTIONAL)_ The time to seek to

##### RETURNS: 
* `Number` The time in seconds, when not setting
* `vjs.Player` self, when the current time is set

_defined in_: [src/js/player.js#L670](https://github.com/videojs/video.js/blob/master/src/js/player.js#L670)

---

### currentType()
> Get the current source type e.g. video/mp4
> This can allow you rebuild the current source object so that you could load the same
> source and tech later

##### RETURNS: 
* `String` The source MIME type

_defined in_: [src/js/player.js#L1195](https://github.com/videojs/video.js/blob/master/src/js/player.js#L1195)

---

### dimensions( width, height )
> Set both width and height at the same time

##### PARAMETERS: 
* __width__ `Number|String` 
* __height__ `Number|String` 

##### RETURNS: 
* `vjs.Component` The component

_inherited from_: [src/js/component.js#L784](https://github.com/videojs/video.js/blob/master/src/js/component.js#L784)

---

### dispose()
> Destroys the video player and does any necessary cleanup
> 
>     myPlayer.dispose();
> 
> This is especially helpful if you are dynamically adding and removing videos
> to/from the DOM.

_defined in_: [src/js/player.js#L156](https://github.com/videojs/video.js/blob/master/src/js/player.js#L156)

---

### duration( seconds )
> Get the length in time of the video in seconds
> 
>     var lengthOfVideo = myPlayer.duration();
> 
> **NOTE**: The video must have started loading before the duration can be
> known, and in the case of Flash, may not be known until the video starts
> playing.

##### PARAMETERS: 
* __seconds__ 

##### RETURNS: 
* `Number` The duration of the video in seconds

_defined in_: [src/js/player.js#L698](https://github.com/videojs/video.js/blob/master/src/js/player.js#L698)

---

### el()
> Get the component's DOM element
> 
>     var domEl = myComponent.el();

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L214](https://github.com/videojs/video.js/blob/master/src/js/component.js#L214)

---

### enableTouchActivity()
> Report user touch activity when touch events occur
> 
> User activity is used to determine when controls should show/hide. It's
> relatively simple when it comes to mouse events, because any mouse event
> should show the controls. So we capture mouse events that bubble up to the
> player and report activity when that happens.
> 
> With touch events it isn't as easy. We can't rely on touch events at the
> player level, because a tap (touchstart + touchend) on the video itself on
> mobile devices is meant to turn controls off (and on). User activity is
> checked asynchronously, so what could happen is a tap event on the video
> turns the controls off, then the touchend event bubbles up to the player,
> which if it reported user activity, would turn the controls right back on.
> (We also don't want to completely block touch events from bubbling up)
> 
> Also a touchmove, touch+hold, and anything other than a tap is not supposed
> to turn the controls back on on a mobile device.
> 
> Here we're setting the default component behavior to report user activity
> whenever touch events happen, and this can be turned off by components that
> want touch events to act differently.

_inherited from_: [src/js/component.js#L963](https://github.com/videojs/video.js/blob/master/src/js/component.js#L963)

---

### error( err )
> Set or get the current MediaError

##### PARAMETERS: 
* __err__ `*` A MediaError or a String/Number to be turned into a MediaError

##### RETURNS: 
* `vjs.MediaError|null` when getting
* `vjs.Player` when setting

_defined in_: [src/js/player.js#L1359](https://github.com/videojs/video.js/blob/master/src/js/player.js#L1359)

---

### exitFullscreen()
> Return the video to its normal size after having been in full screen mode
> 
>     myPlayer.exitFullscreen();

##### RETURNS: 
* `vjs.Player` self

_defined in_: [src/js/player.js#L978](https://github.com/videojs/video.js/blob/master/src/js/player.js#L978)

---

### getChild( name )
> Returns a child component with the provided name

##### PARAMETERS: 
* __name__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L324](https://github.com/videojs/video.js/blob/master/src/js/component.js#L324)

---

### getChildById( id )
> Returns a child component with the provided ID

##### PARAMETERS: 
* __id__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L307](https://github.com/videojs/video.js/blob/master/src/js/component.js#L307)

---

### height( [num], [skipListeners] )
> Get or set the height of the component (CSS values)
> 
> Setting the video tag dimension values only works with values in pixels.
> Percent values will not work.
> Some percents can be used, but width()/height() will return the number + %,
> not the actual computed width/height.

##### PARAMETERS: 
* __num__ `Number|String` _(OPTIONAL)_ New component height
* __skipListeners__ `Boolean` _(OPTIONAL)_ Skip the resize event trigger

##### RETURNS: 
* `vjs.Component` This component, when setting the height
* `Number|String` The height, when getting

_inherited from_: [src/js/component.js#L773](https://github.com/videojs/video.js/blob/master/src/js/component.js#L773)

---

### hide()
> Hide the component element if currently showing

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L703](https://github.com/videojs/video.js/blob/master/src/js/component.js#L703)

---

### id()
> Get the component's ID
> 
>     var id = myComponent.id();

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L252](https://github.com/videojs/video.js/blob/master/src/js/component.js#L252)

---

### init( tag, [options], [ready] )
> player's constructor function

##### PARAMETERS: 
* __tag__ `Element` The original video tag used for configuring options
* __options__ `Object` _(OPTIONAL)_ Player options
* __ready__ `Function` _(OPTIONAL)_ Ready callback function

_defined in_: [src/js/player.js#L32](https://github.com/videojs/video.js/blob/master/src/js/player.js#L32)

---

### initChildren()
> Add and initialize default child components from options
> 
>     // when an instance of MyComponent is created, all children in options
>     // will be added to the instance by their name strings and options
>     MyComponent.prototype.options_.children = {
>       myChildComponent: {
>         myChildOption: true
>       }
>     }
> 
>     // Or when creating the component
>     var myComp = new MyComponent(player, {
>       children: {
>         myChildComponent: {
>           myChildOption: true
>         }
>       }
>     });
> 
> The children option can also be an Array of child names or
> child options objects (that also include a 'name' key).
> 
>     var myComp = new MyComponent(player, {
>       children: [
>         'button',
>         {
>           name: 'button',
>           someOtherOption: true
>         }
>       ]
>     });

_inherited from_: [src/js/component.js#L475](https://github.com/videojs/video.js/blob/master/src/js/component.js#L475)

---

### isFullScreen( isFS )
> Old naming for isFullscreen()
**Deprecated** true

##### PARAMETERS: 
* __isFS__ 

_defined in_: [src/js/player.js#L901](https://github.com/videojs/video.js/blob/master/src/js/player.js#L901)

---

### isFullscreen( [isFS] )
> Check if the player is in fullscreen mode
> 
>     // get
>     var fullscreenOrNot = myPlayer.isFullscreen();
> 
>     // set
>     myPlayer.isFullscreen(true); // tell the player it's in fullscreen
> 
> NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
> property and instead document.fullscreenElement is used. But isFullscreen is
> still a valuable property for internal player workings.

##### PARAMETERS: 
* __isFS__ `Boolean` _(OPTIONAL)_ Update the player's fullscreen state

##### RETURNS: 
* `Boolean` true if fullscreen, false if not
* `vjs.Player` self, when setting

_defined in_: [src/js/player.js#L889](https://github.com/videojs/video.js/blob/master/src/js/player.js#L889)

---

### language( languageCode )
> The player's language code

##### PARAMETERS: 
* __languageCode__ `String` The locale string

##### RETURNS: 
* `String` The locale string when getting
* `vjs.Player` self, when setting

_defined in_: [src/js/player.js#L116](https://github.com/videojs/video.js/blob/master/src/js/player.js#L116)

---

### muted( [muted] )
> Get the current muted state, or turn mute on or off
> 
>     // get
>     var isVolumeMuted = myPlayer.muted();
> 
>     // set
>     myPlayer.muted(true); // mute the volume

##### PARAMETERS: 
* __muted__ `Boolean` _(OPTIONAL)_ True to mute, false to unmute

##### RETURNS: 
* `Boolean` True if mute is on, false if not, when getting
* `vjs.Player` self, when setting mute

_defined in_: [src/js/player.js#L851](https://github.com/videojs/video.js/blob/master/src/js/player.js#L851)

---

### name()
> Get the component's name. The name is often used to reference the component.
> 
>     var name = myComponent.name();

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L271](https://github.com/videojs/video.js/blob/master/src/js/component.js#L271)

---

### off( [type], [fn] )
> Remove an event listener from the component's element
> 
>     myComponent.off("eventName", myFunc);

##### PARAMETERS: 
* __type__ `String` _(OPTIONAL)_ Event type. Without type it will remove all listeners.
* __fn__ `Function` _(OPTIONAL)_ Event listener. Without fn it will remove all listeners for a type.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L554](https://github.com/videojs/video.js/blob/master/src/js/component.js#L554)

---

### on( type, fn )
> Add an event listener to this component's element
> 
>     var myFunc = function(){
>       var myPlayer = this;
>       // Do something when the event is fired
>     };
> 
>     myPlayer.on("eventName", myFunc);
> 
> The context will be the component.

##### PARAMETERS: 
* __type__ `String` The event type e.g. 'click'
* __fn__ `Function` The event listener

##### RETURNS: 
* `vjs.Component` self

_inherited from_: [src/js/component.js#L540](https://github.com/videojs/video.js/blob/master/src/js/component.js#L540)

---

### onWaitEnd()
> A handler for events that signal that waiting has eneded
> which is not consistent between browsers. See #1351

_defined in_: [src/js/player.js#L439](https://github.com/videojs/video.js/blob/master/src/js/player.js#L439)

---

### one( type, fn )
> Add an event listener to be triggered only once and then removed

##### PARAMETERS: 
* __type__ `String` Event type
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L566](https://github.com/videojs/video.js/blob/master/src/js/component.js#L566)

---

### options( obj )
> Deep merge of options objects
> 
> Whenever a property is an object on both options objects
> the two properties will be merged using vjs.obj.deepMerge.
> 
> This is used for merging options for child components. We
> want it to be easy to override individual options on a child
> component without having to rewrite all the other default options.
> 
>     Parent.prototype.options_ = {
>       children: {
>         'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
>         'childTwo': {},
>         'childThree': {}
>       }
>     }
>     newOptions = {
>       children: {
>         'childOne': { 'foo': 'baz', 'abc': '123' }
>         'childTwo': null,
>         'childFour': {}
>       }
>     }
> 
>     this.options(newOptions);
> 
> RESULT
> 
>     {
>       children: {
>         'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
>         'childTwo': null, // Disabled. Won't be initialized.
>         'childThree': {},
>         'childFour': {}
>       }
>     }

##### PARAMETERS: 
* __obj__ `Object` Object of new option values

##### RETURNS: 
* `Object` A NEW object of this.options_ and obj merged

_inherited from_: [src/js/component.js#L173](https://github.com/videojs/video.js/blob/master/src/js/component.js#L173)

---

### pause()
> Pause the video playback
> 
>     myPlayer.pause();

##### RETURNS: 
* `vjs.Player` self

_defined in_: [src/js/player.js#L639](https://github.com/videojs/video.js/blob/master/src/js/player.js#L639)

---

### paused()
> Check if the player is paused
> 
>     var isPaused = myPlayer.paused();
>     var isPlaying = !myPlayer.paused();

##### RETURNS: 
* `Boolean` false if the media is currently playing, or true otherwise

_defined in_: [src/js/player.js#L652](https://github.com/videojs/video.js/blob/master/src/js/player.js#L652)

---

### play()
> start media playback
> 
>     myPlayer.play();

##### RETURNS: 
* `vjs.Player` self

_defined in_: [src/js/player.js#L627](https://github.com/videojs/video.js/blob/master/src/js/player.js#L627)

---

### player()
> Return the component's player

##### RETURNS: 
* `vjs.Player` 

_inherited from_: [src/js/component.js#L120](https://github.com/videojs/video.js/blob/master/src/js/component.js#L120)

---

### poster( [src] )
> get or set the poster image source url
> 
> ##### EXAMPLE:
> 
>     // getting
>     var currentPoster = myPlayer.poster();
> 
>     // setting
>     myPlayer.poster('http://example.com/myImage.jpg');

##### PARAMETERS: 
* __src__ `String` _(OPTIONAL)_ Poster image source URL

##### RETURNS: 
* `String` poster URL when getting
* `vjs.Player` self when setting

_defined in_: [src/js/player.js#L1247](https://github.com/videojs/video.js/blob/master/src/js/player.js#L1247)

---

### ready( fn )
> Bind a listener to the component's ready state
> 
> Different from event listeners in that if the ready event has already happend
> it will trigger the function immediately.

##### PARAMETERS: 
* __fn__ `Function` Ready listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L625](https://github.com/videojs/video.js/blob/master/src/js/component.js#L625)

---

### removeChild( component )
> Remove a child component from this component's list of children, and the
> child component's element from this component's element

##### PARAMETERS: 
* __component__ `vjs.Component` Component to remove

_inherited from_: [src/js/component.js#L414](https://github.com/videojs/video.js/blob/master/src/js/component.js#L414)

---

### removeClass( classToRemove )
> Remove a CSS class name from the component's element

##### PARAMETERS: 
* __classToRemove__ `String` Classname to remove

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L683](https://github.com/videojs/video.js/blob/master/src/js/component.js#L683)

---

### requestFullScreen()
> Old naming for requestFullscreen
**Deprecated** true

_defined in_: [src/js/player.js#L965](https://github.com/videojs/video.js/blob/master/src/js/player.js#L965)

---

### requestFullscreen()
> Increase the size of the video to full screen
> 
>     myPlayer.requestFullscreen();
> 
> In some browsers, full screen is not supported natively, so it enters
> "full window mode", where the video fills the browser window.
> In browsers and devices that support native full screen, sometimes the
> browser's default controls will be shown, and not the Video.js custom skin.
> This includes most mobile devices (iOS, Android) and older versions of
> Safari.

##### RETURNS: 
* `vjs.Player` self

_defined in_: [src/js/player.js#L920](https://github.com/videojs/video.js/blob/master/src/js/player.js#L920)

---

### show()
> Show the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L693](https://github.com/videojs/video.js/blob/master/src/js/component.js#L693)

---

### src( [source] )
> The source function updates the video source
> 
> There are three types of variables you can pass as the argument.
> 
> **URL String**: A URL to the the video file. Use this method if you are sure
> the current playback technology (HTML5/Flash) can support the source you
> provide. Currently only MP4 files can be used in both HTML5 and Flash.
> 
>     myPlayer.src("http://www.example.com/path/to/video.mp4");
> 
> **Source Object (or element):** A javascript object containing information
> about the source file. Use this method if you want the player to determine if
> it can support the file using the type information.
> 
>     myPlayer.src({ type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" });
> 
> **Array of Source Objects:** To provide multiple versions of the source so
> that it can be played using HTML5 across browsers you can use an array of
> source objects. Video.js will detect which version is supported and load that
> file.
> 
>     myPlayer.src([
>       { type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" },
>       { type: "video/webm", src: "http://www.example.com/path/to/video.webm" },
>       { type: "video/ogg", src: "http://www.example.com/path/to/video.ogv" }
>     ]);

##### PARAMETERS: 
* __source__ `String|Object|Array` _(OPTIONAL)_ The source URL, object, or array of sources

##### RETURNS: 
* `String` The current video source when getting
* `String` The player when setting

_defined in_: [src/js/player.js#L1109](https://github.com/videojs/video.js/blob/master/src/js/player.js#L1109)

---

### trigger( event )
> Trigger an event on an element
> 
>     myComponent.trigger('eventName');
>     myComponent.trigger({'type':'eventName'});

##### PARAMETERS: 
* __event__ `Event|Object|String` A string (the type) or an event object with a type attribute

##### RETURNS: 
* `vjs.Component` self

_inherited from_: [src/js/component.js#L580](https://github.com/videojs/video.js/blob/master/src/js/component.js#L580)

---

### triggerReady()
> Trigger the ready listeners

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L644](https://github.com/videojs/video.js/blob/master/src/js/component.js#L644)

---

### volume( percentAsDecimal )
> Get or set the current volume of the media
> 
>     // get
>     var howLoudIsIt = myPlayer.volume();
> 
>     // set
>     myPlayer.volume(0.5); // Set volume to half
> 
> 0 is off (muted), 1.0 is all the way up, 0.5 is half way.

##### PARAMETERS: 
* __percentAsDecimal__ `Number` The new volume as a decimal percent

##### RETURNS: 
* `Number` The current volume, when getting
* `vjs.Player` self, when setting

_defined in_: [src/js/player.js#L821](https://github.com/videojs/video.js/blob/master/src/js/player.js#L821)

---

### width( [num], skipListeners )
> Set or get the width of the component (CSS values)
> 
> Setting the video tag dimension values only works with values in pixels.
> Percent values will not work.
> Some percents can be used, but width()/height() will return the number + %,
> not the actual computed width/height.

##### PARAMETERS: 
* __num__ `Number|String` _(OPTIONAL)_ Optional width number
* __skipListeners__ `Boolean` Skip the 'resize' event trigger

##### RETURNS: 
* `vjs.Component` This component, when setting the width
* `Number|String` The width, when getting

_inherited from_: [src/js/component.js#L756](https://github.com/videojs/video.js/blob/master/src/js/component.js#L756)

---

## EVENTS

### durationchange `EVENT`
> Fired when the duration of the media resource is first known or changed

_defined in_: [src/js/player.js#L522](https://github.com/videojs/video.js/blob/master/src/js/player.js#L522)

---

### ended `EVENT`
> Fired when the end of the media resource is reached (currentTime == duration)

_defined in_: [src/js/player.js#L511](https://github.com/videojs/video.js/blob/master/src/js/player.js#L511)

---

### firstplay `EVENT`
> Fired the first time a video is played
> 
> Not part of the HLS spec, and we're not sure if this is the best
> implementation yet, so use sparingly. If you don't have a reason to
> prevent playback, use `myPlayer.one('play');` instead.

_defined in_: [src/js/player.js#L468](https://github.com/videojs/video.js/blob/master/src/js/player.js#L468)

---

### fullscreenchange `EVENT`
> Fired when the player switches in or out of fullscreen mode

_defined in_: [src/js/player.js#L551](https://github.com/videojs/video.js/blob/master/src/js/player.js#L551)

---

### loadedalldata `EVENT`
> Fired when the player has finished downloading the source data

_defined in_: [src/js/player.js#L416](https://github.com/videojs/video.js/blob/master/src/js/player.js#L416)

---

### loadeddata `EVENT`
> Fired when the player has downloaded data at the current playback position

_defined in_: [src/js/player.js#L410](https://github.com/videojs/video.js/blob/master/src/js/player.js#L410)

---

### loadedmetadata `EVENT`
> Fired when the player has initial duration and dimension information

_defined in_: [src/js/player.js#L404](https://github.com/videojs/video.js/blob/master/src/js/player.js#L404)

---

### loadstart `EVENT`
> Fired when the user agent begins looking for media data

_defined in_: [src/js/player.js#L360](https://github.com/videojs/video.js/blob/master/src/js/player.js#L360)

---

### pause `EVENT`
> Fired whenever the media has been paused

_defined in_: [src/js/player.js#L482](https://github.com/videojs/video.js/blob/master/src/js/player.js#L482)

---

### play `EVENT`
> Fired whenever the media begins or resumes playback

_defined in_: [src/js/player.js#L422](https://github.com/videojs/video.js/blob/master/src/js/player.js#L422)

---

### progress `EVENT`
> Fired while the user agent is downloading media data

_defined in_: [src/js/player.js#L500](https://github.com/videojs/video.js/blob/master/src/js/player.js#L500)

---

### resize `EVENT`
> Fired when the width and/or height of the component changes

_inherited from_: [src/js/component.js#L863](https://github.com/videojs/video.js/blob/master/src/js/component.js#L863)

---

### seeked `EVENT`
> Fired when the player has finished jumping to a new time

_defined in_: [src/js/player.js#L455](https://github.com/videojs/video.js/blob/master/src/js/player.js#L455)

---

### seeking `EVENT`
> Fired whenever the player is jumping to a new time

_defined in_: [src/js/player.js#L447](https://github.com/videojs/video.js/blob/master/src/js/player.js#L447)

---

### timeupdate `EVENT`
> Fired when the current playback position has changed
> 
> During playback this is fired every 15-250 milliseconds, depnding on the
> playback technology in use.

_defined in_: [src/js/player.js#L494](https://github.com/videojs/video.js/blob/master/src/js/player.js#L494)

---

### volumechange `EVENT`
> Fired when the volume changes

_defined in_: [src/js/player.js#L545](https://github.com/videojs/video.js/blob/master/src/js/player.js#L545)

---

### waiting `EVENT`
> Fired whenever the media begins wating

_defined in_: [src/js/player.js#L431](https://github.com/videojs/video.js/blob/master/src/js/player.js#L431)

---

