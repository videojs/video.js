<!-- GENERATED FROM SOURCE -->

# vjs.Player

__EXTENDS__: [vjs.Component](vjs.Component.md)  
__DEFINED IN__: [src/js/player.js#L21](https://github.com/videojs/video.js/blob/master/src/js/player.js#L21)  

An instance of the `vjs.Player` class is created when any of the Video.js setup methods are used to initialize a video.

```js
var myPlayer = videojs('example_video_1');
```

In the follwing example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.

```html
<video id="example_video_1" data-setup='{}' controls>
  <source src="my-source.mp4" type="video/mp4">
</video>
```

After an instance has been created it can be accessed globally using `Video('example_video_1')`.

---

## INDEX

- [METHODS](#methods)
  - [addTextTrack](#addtexttrack-kind-label-language-options-)
  - [addTextTracks](#addtexttracks-tracklist-)
  - [buffered](#buffered)
  - [bufferedPercent](#bufferedpercent)
  - [controls](#controls-controls-)
  - [currentTime](#currenttime-seconds-)
  - [duration](#duration-seconds-)
  - [init](#init-tag-options-ready-)
  - [pause](#pause)
  - [paused](#paused)
  - [play](#play)
  - [poster](#poster-src-)
  - [src](#src-source-)
  - [textTracks](#texttracks)
  - [usingNativeControls](#usingnativecontrols-bool-)
  - [addChild](#addchild-child-options-) _`inherited`_
  - [addClass](#addclass-classtoadd-) _`inherited`_
  - [buildCSSClass](#buildcssclass) _`inherited`_
  - [children](#children) _`inherited`_
  - [contentEl](#contentel) _`inherited`_
  - [createEl](#createel-tagname-attributes-) _`inherited`_
  - [dimension](#dimension-widthorheight-num-skiplisteners-) _`inherited`_
  - [dimensions](#dimensions-width-height-) _`inherited`_
  - [disable](#disable) _`inherited`_
  - [dispose](#dispose) _`inherited`_
  - [el](#el) _`inherited`_
  - [emitTapEvents](#emittapevents) _`inherited`_
  - [getChild](#getchild-name-) _`inherited`_
  - [getChildById](#getchildbyid-id-) _`inherited`_
  - [height](#height-num-skiplisteners-) _`inherited`_
  - [hide](#hide) _`inherited`_
  - [id](#id) _`inherited`_
  - [initChildren](#initchildren) _`inherited`_
  - [lockShowing](#lockshowing) _`inherited`_
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
  - [trigger](#trigger-type-event-) _`inherited`_
  - [triggerReady](#triggerready) _`inherited`_
  - [unlockShowing](#unlockshowing) _`inherited`_
  - [width](#width-num-skiplisteners-) _`inherited`_

- [EVENTS](#events)
  - [usingcustomcontrols](#usingcustomcontrols)
  - [usingnativecontrols](#usingnativecontrols)

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
>    var myButton = myComponent.addChild('MyButton', {
>      text: 'Press Me',
>      children: {
>        buttonChildExample: {
>          buttonChildOption: true
>        }
>      }
>    });

##### PARAMETERS: 
* __child__ `String|vjs.Component` The class name or instance of a child to add
* __options__ `Object` _(OPTIONAL)_ Options, including options to be passed to children of the child.

##### RETURNS: 
* `vjs.Component` The child component (created by this process if a string was used)

_inherited from_: [src/js/component.js#L335](https://github.com/videojs/video.js/blob/master/src/js/component.js#L335)

---

### addClass( classToAdd )
> Add a CSS class name to the component's element

##### PARAMETERS: 
* __classToAdd__ `String` Classname to add

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L608](https://github.com/videojs/video.js/blob/master/src/js/component.js#L608)

---

### addTextTrack( kind, [label], [language], [options] )
> Add a text track
> In addition to the W3C settings we allow adding additional info through options.
> http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack

##### PARAMETERS: 
* __kind__ `String` Captions, subtitles, chapters, descriptions, or metadata
* __label__ `String` _(OPTIONAL)_ Optional label
* __language__ `String` _(OPTIONAL)_ Optional language
* __options__ `Object` _(OPTIONAL)_ Additional track options, like src

_defined in_: [src/js/tracks.js#L38](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L38)

---

### addTextTracks( trackList )
> Add an array of text tracks. captions, subtitles, chapters, descriptions
> Track objects will be stored in the player.textTracks() array

##### PARAMETERS: 
* __trackList__ `Array` Array of track elements or objects (fake track elements)

_defined in_: [src/js/tracks.js#L71](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L71)

---

### buffered()
> Get a TimeRange object with the times of the video that have been downloaded
> 
> If you just want the percent of the video that's been downloaded,
> use bufferedPercent.
> 
> ##### EXAMPLE:
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

_defined in_: [src/js/player.js#L645](https://github.com/videojs/video.js/blob/master/src/js/player.js#L645)

---

### bufferedPercent()
> Get the percent (as a decimal) of the video that's been downloaded
> 
> ##### EXAMPLE:
> 
>     var howMuchIsDownloaded = myPlayer.bufferedPercent();
> 
> 0 means none, 1 means all.
> (This method isn't in the HTML5 spec, but it's very convenient)

##### RETURNS: 
* `Number` A decimal between 0 and 1 representing the percent

_defined in_: [src/js/player.js#L673](https://github.com/videojs/video.js/blob/master/src/js/player.js#L673)

---

### buildCSSClass()
> Allows sub components to stack CSS class names

##### RETURNS: 
* `String` The constructed class name

_inherited from_: [src/js/component.js#L463](https://github.com/videojs/video.js/blob/master/src/js/component.js#L463)

---

### children()
> Returns an array of all child components

##### RETURNS: 
* `Array` 

_inherited from_: [src/js/component.js#L269](https://github.com/videojs/video.js/blob/master/src/js/component.js#L269)

---

### contentEl()
> Return the component's DOM element for embedding content.
> Will either be el_ or a new element defined in createEl.

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L218](https://github.com/videojs/video.js/blob/master/src/js/component.js#L218)

---

### controls( controls )
> Get or set whether or not the controls are showing.

##### PARAMETERS: 
* __controls__ `Boolean` Set controls to showing or not

##### RETURNS: 
* `Boolean` Controls are showing

_defined in_: [src/js/player.js#L998](https://github.com/videojs/video.js/blob/master/src/js/player.js#L998)

---

### createEl( [tagName], [attributes] )
> Create the component's DOM element

##### PARAMETERS: 
* __tagName__ `String` _(OPTIONAL)_ Element's node type. e.g. 'div'
* __attributes__ `Object` _(OPTIONAL)_ An object of element attributes that should be set on the element

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L190](https://github.com/videojs/video.js/blob/master/src/js/component.js#L190)

---

### currentTime( [seconds] )
> Get or set the current time (in seconds)
> 
> ##### EXAMPLE:
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

_defined in_: [src/js/player.js#L571](https://github.com/videojs/video.js/blob/master/src/js/player.js#L571)

---

### dimension( widthOrHeight, [num], [skipListeners] )
> Get or set width or height
> 
> This is the shared code for the width() and height() methods.
> All for an integer, integer + 'px' or integer + '%';
> 
> Known issue: Hidden elements officially have a width of 0. We're defaulting
> to the style.width value and falling back to computedStyle which has the
> hidden element issue. Info, but probably not an efficient fix:
> http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/

##### PARAMETERS: 
* __widthOrHeight__ `String` 'width' or 'height'
* __num__ `Number|String` _(OPTIONAL)_ New dimension
* __skipListeners__ `Boolean` _(OPTIONAL)_ Skip resize event trigger

##### RETURNS: 
* `vjs.Component` The component if a dimension was set
* `Number|String` The dimension if nothing was set

_inherited from_: [src/js/component.js#L730](https://github.com/videojs/video.js/blob/master/src/js/component.js#L730)

---

### dimensions( width, height )
> Set both width and height at the same time

##### PARAMETERS: 
* __width__ `Number|String` 
* __height__ `Number|String` 

##### RETURNS: 
* `vjs.Component` The component

_inherited from_: [src/js/component.js#L708](https://github.com/videojs/video.js/blob/master/src/js/component.js#L708)

---

### disable()
> Disable component by making it unshowable

_inherited from_: [src/js/component.js#L669](https://github.com/videojs/video.js/blob/master/src/js/component.js#L669)

---

### dispose()
> Dispose of the component and all child components

_inherited from_: [src/js/component.js#L74](https://github.com/videojs/video.js/blob/master/src/js/component.js#L74)

---

### duration( seconds )
> Get the length in time of the video in seconds
> 
> **NOTE**: The video must have started loading before the duration can be
> known, and in the case of Flash, may not be known until the video starts
> playing.

##### PARAMETERS: 
* __seconds__ 

##### RETURNS: 
* `Number` The duration of the video in seconds

_defined in_: [src/js/player.js#L599](https://github.com/videojs/video.js/blob/master/src/js/player.js#L599)

---

### el()
> return the component's DOM element

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L199](https://github.com/videojs/video.js/blob/master/src/js/component.js#L199)

---

### emitTapEvents()
> Emit 'tap' events when touch events are supported
> 
> This is used to support toggling the controls through a tap on the video.
> 
> We're requireing them to be enabled because otherwise every component would
> have this extra overhead unnecessarily, on mobile devices where extra
> overhead is especially bad.

_inherited from_: [src/js/component.js#L791](https://github.com/videojs/video.js/blob/master/src/js/component.js#L791)

---

### getChild( name )
> Returns a child component with the provided ID

##### PARAMETERS: 
* __name__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L303](https://github.com/videojs/video.js/blob/master/src/js/component.js#L303)

---

### getChildById( id )
> Returns a child component with the provided ID

##### PARAMETERS: 
* __id__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L286](https://github.com/videojs/video.js/blob/master/src/js/component.js#L286)

---

### height( [num], [skipListeners] )
> Get or set the height of the component (CSS values)

##### PARAMETERS: 
* __num__ `Number|String` _(OPTIONAL)_ New component height
* __skipListeners__ `Boolean` _(OPTIONAL)_ Skip the resize event trigger

##### RETURNS: 
* `vjs.Component` The component if the height was set
* `Number|String` The height if it wasn't set

_inherited from_: [src/js/component.js#L697](https://github.com/videojs/video.js/blob/master/src/js/component.js#L697)

---

### hide()
> Hide the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L639](https://github.com/videojs/video.js/blob/master/src/js/component.js#L639)

---

### id()
> Returns the component's ID

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L235](https://github.com/videojs/video.js/blob/master/src/js/component.js#L235)

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

_inherited from_: [src/js/component.js#L431](https://github.com/videojs/video.js/blob/master/src/js/component.js#L431)

---

### lockShowing()
> Lock an item in its visible state
> To be used with fadeIn/fadeOut.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L650](https://github.com/videojs/video.js/blob/master/src/js/component.js#L650)

---

### name()
> Returns the component's name

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L252](https://github.com/videojs/video.js/blob/master/src/js/component.js#L252)

---

### off( [type], [fn] )
> Remove an event listener from the component's element

##### PARAMETERS: 
* __type__ `String` _(OPTIONAL)_ Event type. Without type it will remove all listeners.
* __fn__ `Function` _(OPTIONAL)_ Event listener. Without fn it will remove all listeners for a type.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L492](https://github.com/videojs/video.js/blob/master/src/js/component.js#L492)

---

### on( type, fn )
> Add an event listener to this component's element
> The context will be the component.

##### PARAMETERS: 
* __type__ `String` Event type e.g. 'click'
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L480](https://github.com/videojs/video.js/blob/master/src/js/component.js#L480)

---

### one( type, fn )
> Add an event listener to be triggered only once and then removed

##### PARAMETERS: 
* __type__ `String` Event type
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L504](https://github.com/videojs/video.js/blob/master/src/js/component.js#L504)

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
* __obj__ `Object` Object whose values will be overwritten

##### RETURNS: 
* `Object` NEW merged object. Does not return obj1.

_inherited from_: [src/js/component.js#L169](https://github.com/videojs/video.js/blob/master/src/js/component.js#L169)

---

### pause()
> Pause the video playback
> 
> ##### EXAMPLE:
> 
>     myPlayer.pause();

##### RETURNS: 
* `vjs.Player` self

_defined in_: [src/js/player.js#L536](https://github.com/videojs/video.js/blob/master/src/js/player.js#L536)

---

### paused()
> Check if the player is paused
> 
> ##### EXAMPLE:
> 
>     var isPaused = myPlayer.paused();
>     var isPlaying = !myPlayer.paused();

##### RETURNS: 
* `Boolean` false if the media is currently playing, or true otherwise

_defined in_: [src/js/player.js#L551](https://github.com/videojs/video.js/blob/master/src/js/player.js#L551)

---

### play()
> start media playback
> 
> ##### EXAMPLE:
> 
>     myPlayer.play();

##### RETURNS: 
* `vjs.Player` self

_defined in_: [src/js/player.js#L522](https://github.com/videojs/video.js/blob/master/src/js/player.js#L522)

---

### player()
> Return the component's player

##### RETURNS: 
* `vjs.Player` 

_inherited from_: [src/js/component.js#L116](https://github.com/videojs/video.js/blob/master/src/js/component.js#L116)

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

_defined in_: [src/js/player.js#L978](https://github.com/videojs/video.js/blob/master/src/js/player.js#L978)

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

_inherited from_: [src/js/component.js#L561](https://github.com/videojs/video.js/blob/master/src/js/component.js#L561)

---

### removeChild( component )
> Remove a child component from this component's list of children, and the
> child component's element from this component's element

##### PARAMETERS: 
* __component__ `vjs.Component` Component to remove

_inherited from_: [src/js/component.js#L393](https://github.com/videojs/video.js/blob/master/src/js/component.js#L393)

---

### removeClass( classToRemove )
> Remove a CSS class name from the component's element

##### PARAMETERS: 
* __classToRemove__ `String` Classname to remove

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L619](https://github.com/videojs/video.js/blob/master/src/js/component.js#L619)

---

### show()
> Show the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L629](https://github.com/videojs/video.js/blob/master/src/js/component.js#L629)

---

### src( source )
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
* __source__ `String|Object|Array` The source URL, object, or array of sources

##### RETURNS: 
* `vjs.Player` self

_defined in_: [src/js/player.js#L862](https://github.com/videojs/video.js/blob/master/src/js/player.js#L862)

---

### textTracks()
> Get an array of associated text tracks. captions, subtitles, chapters, descriptions
> http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks

##### RETURNS: 
* `Array` Array of track objects

_defined in_: [src/js/tracks.js#L24](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L24)

---

### trigger( type, event )
> Trigger an event on an element

##### PARAMETERS: 
* __type__ `String` Event type to trigger
* __event__ `Event|Object` Event object to be passed to the listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L516](https://github.com/videojs/video.js/blob/master/src/js/component.js#L516)

---

### triggerReady()
> Trigger the ready listeners

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L580](https://github.com/videojs/video.js/blob/master/src/js/component.js#L580)

---

### unlockShowing()
> Unlock an item to be hidden
> To be used with fadeIn/fadeOut.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L661](https://github.com/videojs/video.js/blob/master/src/js/component.js#L661)

---

### usingNativeControls( bool )
> Toggle native controls on/off. Native controls are the controls built into
> devices (e.g. default iPhone controls), Flash, or other techs
> (e.g. Vimeo Controls)
> 
> **This should only be set by the current tech, because only the tech knows
> if it can support native controls**

##### PARAMETERS: 
* __bool__ `Boolean` True signals that native controls are on

##### RETURNS: 
* `vjs.Player` Returns the player

_defined in_: [src/js/player.js#L1032](https://github.com/videojs/video.js/blob/master/src/js/player.js#L1032)

---

### width( [num], skipListeners )
> Set or get the width of the component (CSS values)
> 
> Video tag width/height only work in pixels. No percents.
> But allowing limited percents use. e.g. width() will return number+%, not computed width

##### PARAMETERS: 
* __num__ `Number|String` _(OPTIONAL)_ Optional width number
* __skipListeners__ `Boolean` Skip the 'resize' event trigger

##### RETURNS: 
* `vjs.Component` Returns 'this' if width was set
* `Number|String` Returns the width if nothing was set

_inherited from_: [src/js/component.js#L685](https://github.com/videojs/video.js/blob/master/src/js/component.js#L685)

---

## EVENTS

### usingcustomcontrols
> player is using the custom HTML controls

_defined in_: [src/js/player.js#L1059](https://github.com/videojs/video.js/blob/master/src/js/player.js#L1059)

---

### usingnativecontrols
> player is using the native device controls

_defined in_: [src/js/player.js#L1048](https://github.com/videojs/video.js/blob/master/src/js/player.js#L1048)

---

