<!-- GENERATED FROM SOURCE -->

# vjs.ChaptersTrack

__EXTENDS__: [vjs.TextTrack](vjs.TextTrack.md)  
__DEFINED IN__: [src/js/tracks.js#L697](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L697)  

The track component for managing the hiding and showing of chapters

---

## INDEX

- [METHODS](#methods)
  - [activate](#activate) _`inherited`_
  - [activeCues](#activecues) _`inherited`_
  - [addChild](#addchild-child-options-) _`inherited`_
  - [addClass](#addclass-classtoadd-) _`inherited`_
  - [adjustFontSize](#adjustfontsize) _`inherited`_
  - [buildCSSClass](#buildcssclass) _`inherited`_
  - [children](#children) _`inherited`_
  - [contentEl](#contentel) _`inherited`_
  - [createEl](#createel) _`inherited`_
  - [cues](#cues) _`inherited`_
  - [deactivate](#deactivate) _`inherited`_
  - [dflt](#dflt) _`inherited`_
  - [dimensions](#dimensions-width-height-) _`inherited`_
  - [disable](#disable) _`inherited`_
  - [dispose](#dispose) _`inherited`_
  - [el](#el) _`inherited`_
  - [getChild](#getchild-name-) _`inherited`_
  - [getChildById](#getchildbyid-id-) _`inherited`_
  - [height](#height-num-skiplisteners-) _`inherited`_
  - [hide](#hide) _`inherited`_
  - [id](#id) _`inherited`_
  - [init](#init-player-options-) _`inherited`_
  - [initChildren](#initchildren) _`inherited`_
  - [kind](#kind) _`inherited`_
  - [label](#label) _`inherited`_
  - [language](#language) _`inherited`_
  - [mode](#mode) _`inherited`_
  - [name](#name) _`inherited`_
  - [off](#off-type-fn-) _`inherited`_
  - [on](#on-type-fn-) _`inherited`_
  - [one](#one-type-fn-) _`inherited`_
  - [options](#options-obj-) _`inherited`_
  - [player](#player) _`inherited`_
  - [ready](#ready-fn-) _`inherited`_
  - [readyState](#readystate) _`inherited`_
  - [removeChild](#removechild-component-) _`inherited`_
  - [removeClass](#removeclass-classtoremove-) _`inherited`_
  - [show](#show) _`inherited`_
  - [src](#src) _`inherited`_
  - [title](#title) _`inherited`_
  - [trigger](#trigger-type-event-) _`inherited`_
  - [triggerReady](#triggerready) _`inherited`_
  - [width](#width-num-skiplisteners-) _`inherited`_

- [EVENTS](#events)
  - [resize](#resize-event) _`inherited`_

---

## METHODS

### activate()
> Turn on cue tracking. Tracks that are showing OR hidden are active.

_inherited from_: [src/js/tracks.js#L385](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L385)

---

### activeCues()
> Get the track active cues

##### RETURNS: 
* `Array` 

_inherited from_: [src/js/tracks.js#L264](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L264)

---

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

_inherited from_: [src/js/component.js#L343](https://github.com/videojs/video.js/blob/master/src/js/component.js#L343)

---

### addClass( classToAdd )
> Add a CSS class name to the component's element

##### PARAMETERS: 
* __classToAdd__ `String` Classname to add

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L628](https://github.com/videojs/video.js/blob/master/src/js/component.js#L628)

---

### adjustFontSize()
> Change the font size of the text track to make it larger when playing in fullscreen mode
> and restore it to its normal size when not in fullscreen mode.

_inherited from_: [src/js/tracks.js#L309](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L309)

---

### buildCSSClass()
> Allows sub components to stack CSS class names

##### RETURNS: 
* `String` The constructed class name

_inherited from_: [src/js/component.js#L471](https://github.com/videojs/video.js/blob/master/src/js/component.js#L471)

---

### children()
> Get an array of all child components
> 
>     var kids = myComponent.children();

##### RETURNS: 
* `Array` The children

_inherited from_: [src/js/component.js#L277](https://github.com/videojs/video.js/blob/master/src/js/component.js#L277)

---

### contentEl()
> Return the component's DOM element for embedding content.
> Will either be el_ or a new element defined in createEl.

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L220](https://github.com/videojs/video.js/blob/master/src/js/component.js#L220)

---

### createEl()
> Create basic div to hold cue text

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/tracks.js#L325](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L325)

---

### cues()
> Get the track cues

##### RETURNS: 
* `Array` 

_inherited from_: [src/js/tracks.js#L249](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L249)

---

### deactivate()
> Turn off cue tracking.

_inherited from_: [src/js/tracks.js#L408](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L408)

---

### dflt()
> Get the track default value. ('default' is a reserved keyword)

##### RETURNS: 
* `Boolean` 

_inherited from_: [src/js/tracks.js#L190](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L190)

---

### dimensions( width, height )
> Set both width and height at the same time

##### PARAMETERS: 
* __width__ `Number|String` 
* __height__ `Number|String` 

##### RETURNS: 
* `vjs.Component` The component

_inherited from_: [src/js/component.js#L737](https://github.com/videojs/video.js/blob/master/src/js/component.js#L737)

---

### disable()
> Disable: Mode Off/Disable (0)
> Indicates that the text track is not active. Other than for the purposes of exposing the track in the DOM, the user agent is ignoring the text track.
> No cues are active, no events are fired, and the user agent will not attempt to obtain the track's cues.

_inherited from_: [src/js/tracks.js#L371](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L371)

---

### dispose()
> Dispose of the component and all child components

_inherited from_: [src/js/component.js#L74](https://github.com/videojs/video.js/blob/master/src/js/component.js#L74)

---

### el()
> Get the component's DOM element
> 
>     var domEl = myComponent.el();

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L201](https://github.com/videojs/video.js/blob/master/src/js/component.js#L201)

---

### getChild( name )
> Returns a child component with the provided name

##### PARAMETERS: 
* __name__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L311](https://github.com/videojs/video.js/blob/master/src/js/component.js#L311)

---

### getChildById( id )
> Returns a child component with the provided ID

##### PARAMETERS: 
* __id__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L294](https://github.com/videojs/video.js/blob/master/src/js/component.js#L294)

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

_inherited from_: [src/js/component.js#L726](https://github.com/videojs/video.js/blob/master/src/js/component.js#L726)

---

### hide()
> Hide: Mode Hidden (1)
> Indicates that the text track is active, but that the user agent is not actively displaying the cues.
> If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
> The user agent is maintaining a list of which cues are active, and events are being fired accordingly.

_inherited from_: [src/js/tracks.js#L356](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L356)

---

### id()
> Get the component's ID
> 
>     var id = myComponent.id();

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L239](https://github.com/videojs/video.js/blob/master/src/js/component.js#L239)

---

### init( player, options )

##### PARAMETERS: 
* __player__ 
* __options__ 

_inherited from_: [src/js/tracks.js#L128](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L128)

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

_inherited from_: [src/js/component.js#L439](https://github.com/videojs/video.js/blob/master/src/js/component.js#L439)

---

### kind()
> Get the track kind value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L161](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L161)

---

### label()
> Get the track label value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L234](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L234)

---

### language()
> Get the track language value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L219](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L219)

---

### mode()
> Get the track mode

##### RETURNS: 
* `Number` 

_inherited from_: [src/js/tracks.js#L301](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L301)

---

### name()
> Get the component's name. The name is often used to reference the component.
> 
>     var name = myComponent.name();

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L258](https://github.com/videojs/video.js/blob/master/src/js/component.js#L258)

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

_inherited from_: [src/js/component.js#L510](https://github.com/videojs/video.js/blob/master/src/js/component.js#L510)

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

_inherited from_: [src/js/component.js#L496](https://github.com/videojs/video.js/blob/master/src/js/component.js#L496)

---

### one( type, fn )
> Add an event listener to be triggered only once and then removed

##### PARAMETERS: 
* __type__ `String` Event type
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L522](https://github.com/videojs/video.js/blob/master/src/js/component.js#L522)

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

_inherited from_: [src/js/component.js#L169](https://github.com/videojs/video.js/blob/master/src/js/component.js#L169)

---

### player()
> Return the component's player

##### RETURNS: 
* `vjs.Player` 

_inherited from_: [src/js/component.js#L116](https://github.com/videojs/video.js/blob/master/src/js/component.js#L116)

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

_inherited from_: [src/js/component.js#L581](https://github.com/videojs/video.js/blob/master/src/js/component.js#L581)

---

### readyState()
> Get the track readyState

##### RETURNS: 
* `Number` 

_inherited from_: [src/js/tracks.js#L283](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L283)

---

### removeChild( component )
> Remove a child component from this component's list of children, and the
> child component's element from this component's element

##### PARAMETERS: 
* __component__ `vjs.Component` Component to remove

_inherited from_: [src/js/component.js#L401](https://github.com/videojs/video.js/blob/master/src/js/component.js#L401)

---

### removeClass( classToRemove )
> Remove a CSS class name from the component's element

##### PARAMETERS: 
* __classToRemove__ `String` Classname to remove

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L639](https://github.com/videojs/video.js/blob/master/src/js/component.js#L639)

---

### show()
> Show: Mode Showing (2)
> Indicates that the text track is active. If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
> The user agent is maintaining a list of which cues are active, and events are being fired accordingly.
> In addition, for text tracks whose kind is subtitles or captions, the cues are being displayed over the video as appropriate;
> for text tracks whose kind is descriptions, the user agent is making the cues available to the user in a non-visual fashion;
> and for text tracks whose kind is chapters, the user agent is making available to the user a mechanism by which the user can navigate to any point in the media resource by selecting a cue.
> The showing by default state is used in conjunction with the default attribute on track elements to indicate that the text track was enabled due to that attribute.
> This allows the user agent to override the state if a later track is discovered that is more appropriate per the user's preferences.

_inherited from_: [src/js/tracks.js#L341](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L341)

---

### src()
> Get the track src value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L175](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L175)

---

### title()
> Get the track title value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L204](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L204)

---

### trigger( type, event )
> Trigger an event on an element
> 
>     myComponent.trigger('eventName');

##### PARAMETERS: 
* __type__ `String` The event type to trigger, e.g. 'click'
* __event__ `Event|Object` The event object to be passed to the listener

##### RETURNS: 
* `vjs.Component` self

_inherited from_: [src/js/component.js#L536](https://github.com/videojs/video.js/blob/master/src/js/component.js#L536)

---

### triggerReady()
> Trigger the ready listeners

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L600](https://github.com/videojs/video.js/blob/master/src/js/component.js#L600)

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

_inherited from_: [src/js/component.js#L709](https://github.com/videojs/video.js/blob/master/src/js/component.js#L709)

---

## EVENTS

### resize `EVENT`
> Fired when the width and/or height of the component changes

_inherited from_: [src/js/component.js#L816](https://github.com/videojs/video.js/blob/master/src/js/component.js#L816)

---

