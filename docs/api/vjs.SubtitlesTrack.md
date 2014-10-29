<!-- GENERATED FROM SOURCE -->

# vjs.SubtitlesTrack

__EXTENDS__: [vjs.TextTrack](vjs.TextTrack.md)  
__DEFINED IN__: [src/js/tracks.js#L678](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L678)  

The track component for managing the hiding and showing of subtitles

---

## INDEX

- [METHODS](#methods)
  - [activate](#activate) _`inherited`_
  - [activeCues](#activecues) _`inherited`_
  - [addChild](#addchild-child-options-) _`inherited`_
  - [addClass](#addclass-classtoadd-) _`inherited`_
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
  - [enableTouchActivity](#enabletouchactivity) _`inherited`_
  - [getChild](#getchild-name-) _`inherited`_
  - [getChildById](#getchildbyid-id-) _`inherited`_
  - [hasClass](#hasclass-classtocheck-) _`inherited`_
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
  - [off](#off-first-second-third-) _`inherited`_
  - [on](#on-first-second-third-) _`inherited`_
  - [one](#one-first-second-third-) _`inherited`_
  - [options](#options-obj-) _`inherited`_
  - [player](#player) _`inherited`_
  - [ready](#ready-fn-) _`inherited`_
  - [readyState](#readystate) _`inherited`_
  - [removeChild](#removechild-component-) _`inherited`_
  - [removeClass](#removeclass-classtoremove-) _`inherited`_
  - [show](#show) _`inherited`_
  - [src](#src) _`inherited`_
  - [title](#title) _`inherited`_
  - [trigger](#trigger-event-) _`inherited`_
  - [triggerReady](#triggerready) _`inherited`_
  - [width](#width-num-skiplisteners-) _`inherited`_

- [EVENTS](#events)
  - [resize](#resize-event) _`inherited`_

---

## METHODS

### activate()
> Turn on cue tracking. Tracks that are showing OR hidden are active.

_inherited from_: [src/js/tracks.js#L373](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L373)

---

### activeCues()
> Get the track active cues

##### RETURNS: 
* `Array` 

_inherited from_: [src/js/tracks.js#L268](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L268)

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

_inherited from_: [src/js/component.js#L362](https://github.com/videojs/video.js/blob/master/src/js/component.js#L362)

---

### addClass( classToAdd )
> Add a CSS class name to the component's element

##### PARAMETERS: 
* __classToAdd__ `String` Classname to add

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L826](https://github.com/videojs/video.js/blob/master/src/js/component.js#L826)

---

### buildCSSClass()
> Allows sub components to stack CSS class names

##### RETURNS: 
* `String` The constructed class name

_inherited from_: [src/js/component.js#L536](https://github.com/videojs/video.js/blob/master/src/js/component.js#L536)

---

### children()
> Get an array of all child components
> 
>     var kids = myComponent.children();

##### RETURNS: 
* `Array` The children

_inherited from_: [src/js/component.js#L296](https://github.com/videojs/video.js/blob/master/src/js/component.js#L296)

---

### contentEl()
> Return the component's DOM element for embedding content.
> Will either be el_ or a new element defined in createEl.

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L239](https://github.com/videojs/video.js/blob/master/src/js/component.js#L239)

---

### createEl()
> Create basic div to hold cue text

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/tracks.js#L313](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L313)

---

### cues()
> Get the track cues

##### RETURNS: 
* `Array` 

_inherited from_: [src/js/tracks.js#L253](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L253)

---

### deactivate()
> Turn off cue tracking.

_inherited from_: [src/js/tracks.js#L396](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L396)

---

### dflt()
> Get the track default value. ('default' is a reserved keyword)

##### RETURNS: 
* `Boolean` 

_inherited from_: [src/js/tracks.js#L194](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L194)

---

### dimensions( width, height )
> Set both width and height at the same time

##### PARAMETERS: 
* __width__ `Number|String` 
* __height__ `Number|String` 

##### RETURNS: 
* `vjs.Component` The component

_inherited from_: [src/js/component.js#L938](https://github.com/videojs/video.js/blob/master/src/js/component.js#L938)

---

### disable()
> Disable: Mode Off/Disable (0)
> Indicates that the text track is not active. Other than for the purposes of exposing the track in the DOM, the user agent is ignoring the text track.
> No cues are active, no events are fired, and the user agent will not attempt to obtain the track's cues.

_inherited from_: [src/js/tracks.js#L359](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L359)

---

### dispose()
> Dispose of the component and all child components

_inherited from_: [src/js/component.js#L84](https://github.com/videojs/video.js/blob/master/src/js/component.js#L84)

---

### el()
> Get the component's DOM element
> 
>     var domEl = myComponent.el();

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L220](https://github.com/videojs/video.js/blob/master/src/js/component.js#L220)

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

_inherited from_: [src/js/component.js#L1120](https://github.com/videojs/video.js/blob/master/src/js/component.js#L1120)

---

### getChild( name )
> Returns a child component with the provided name

##### PARAMETERS: 
* __name__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L330](https://github.com/videojs/video.js/blob/master/src/js/component.js#L330)

---

### getChildById( id )
> Returns a child component with the provided ID

##### PARAMETERS: 
* __id__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L313](https://github.com/videojs/video.js/blob/master/src/js/component.js#L313)

---

### hasClass( classToCheck )
> Check if a component's element has a CSS class name

##### PARAMETERS: 
* __classToCheck__ `String` Classname to check

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L816](https://github.com/videojs/video.js/blob/master/src/js/component.js#L816)

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

_inherited from_: [src/js/component.js#L927](https://github.com/videojs/video.js/blob/master/src/js/component.js#L927)

---

### hide()
> Hide: Mode Hidden (1)
> Indicates that the text track is active, but that the user agent is not actively displaying the cues.
> If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
> The user agent is maintaining a list of which cues are active, and events are being fired accordingly.

_inherited from_: [src/js/tracks.js#L344](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L344)

---

### id()
> Get the component's ID
> 
>     var id = myComponent.id();

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L258](https://github.com/videojs/video.js/blob/master/src/js/component.js#L258)

---

### init( player, options )

##### PARAMETERS: 
* __player__ 
* __options__ 

_inherited from_: [src/js/tracks.js#L134](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L134)

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

_inherited from_: [src/js/component.js#L481](https://github.com/videojs/video.js/blob/master/src/js/component.js#L481)

---

### kind()
> Get the track kind value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L165](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L165)

---

### label()
> Get the track label value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L238](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L238)

---

### language()
> Get the track language value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L223](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L223)

---

### mode()
> Get the track mode

##### RETURNS: 
* `Number` 

_inherited from_: [src/js/tracks.js#L305](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L305)

---

### name()
> Get the component's name. The name is often used to reference the component.
> 
>     var name = myComponent.name();

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L277](https://github.com/videojs/video.js/blob/master/src/js/component.js#L277)

---

### off( [first], [second], [third] )
> Remove an event listener from this component's element
> 
>     myComponent.off('eventType', myFunc);
> 
> If myFunc is excluded, ALL listeners for the event type will be removed.
> If eventType is excluded, ALL listeners will be removed from the component.
> 
> Alternatively you can use `off` to remove listeners that were added to other
> elements or components using `myComponent.on(otherComponent...`.
> In this case both the event type and listener function are REQUIRED.
> 
>     myComponent.off(otherElement, 'eventType', myFunc);
>     myComponent.off(otherComponent, 'eventType', myFunc);

##### PARAMETERS: 
* __first__ `String|vjs.Component` _(OPTIONAL)_ The event type or other component
* __second__ `Function|String` _(OPTIONAL)_ The listener function or event type
* __third__ `Function` _(OPTIONAL)_ The listener for other component

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L646](https://github.com/videojs/video.js/blob/master/src/js/component.js#L646)

---

### on( first, second, third )
> Add an event listener to this component's element
> 
>     var myFunc = function(){
>       var myComponent = this;
>       // Do something when the event is fired
>     };
> 
>     myComponent.on('eventType', myFunc);
> 
> The context of myFunc will be myComponent unless previously bound.
> 
> Alternatively, you can add a listener to another element or component.
> 
>     myComponent.on(otherElement, 'eventName', myFunc);
>     myComponent.on(otherComponent, 'eventName', myFunc);
> 
> The benefit of using this over `vjs.on(otherElement, 'eventName', myFunc)`
> and `otherComponent.on('eventName', myFunc)` is that this way the listeners
> will be automatically cleaned up when either component is diposed.
> It will also bind myComponent as the context of myFunc.
> 
> **NOTE**: When using this on elements in the page other than window
> and document (both permanent), if you remove the element from the DOM
> you need to call `vjs.trigger(el, 'dispose')` on it to clean up
> references to it and allow the browser to garbage collect it.

##### PARAMETERS: 
* __first__ `String|vjs.Component` The event type or other component
* __second__ `Function|String` The event handler or event type
* __third__ `Function` The event handler

##### RETURNS: 
* `vjs.Component` self

_inherited from_: [src/js/component.js#L577](https://github.com/videojs/video.js/blob/master/src/js/component.js#L577)

---

### one( first, second, [third] )
> Add an event listener to be triggered only once and then removed
> 
>     myComponent.one('eventName', myFunc);
> 
> Alternatively you can add a listener to another element or component
> that will be triggered only once.
> 
>     myComponent.one(otherElement, 'eventName', myFunc);
>     myComponent.one(otherComponent, 'eventName', myFunc);

##### PARAMETERS: 
* __first__ `String|vjs.Component` The event type or other component
* __second__ `Function|String` The listener function or event type
* __third__ `Function` _(OPTIONAL)_ The listener function for other component

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L691](https://github.com/videojs/video.js/blob/master/src/js/component.js#L691)

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

_inherited from_: [src/js/component.js#L179](https://github.com/videojs/video.js/blob/master/src/js/component.js#L179)

---

### player()
> Return the component's player

##### RETURNS: 
* `vjs.Player` 

_inherited from_: [src/js/component.js#L126](https://github.com/videojs/video.js/blob/master/src/js/component.js#L126)

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

_inherited from_: [src/js/component.js#L769](https://github.com/videojs/video.js/blob/master/src/js/component.js#L769)

---

### readyState()
> Get the track readyState

##### RETURNS: 
* `Number` 

_inherited from_: [src/js/tracks.js#L287](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L287)

---

### removeChild( component )
> Remove a child component from this component's list of children, and the
> child component's element from this component's element

##### PARAMETERS: 
* __component__ `vjs.Component` Component to remove

_inherited from_: [src/js/component.js#L420](https://github.com/videojs/video.js/blob/master/src/js/component.js#L420)

---

### removeClass( classToRemove )
> Remove a CSS class name from the component's element

##### PARAMETERS: 
* __classToRemove__ `String` Classname to remove

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L837](https://github.com/videojs/video.js/blob/master/src/js/component.js#L837)

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

_inherited from_: [src/js/tracks.js#L329](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L329)

---

### src()
> Get the track src value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L179](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L179)

---

### title()
> Get the track title value

##### RETURNS: 
* `String` 

_inherited from_: [src/js/tracks.js#L208](https://github.com/videojs/video.js/blob/master/src/js/tracks.js#L208)

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

_inherited from_: [src/js/component.js#L724](https://github.com/videojs/video.js/blob/master/src/js/component.js#L724)

---

### triggerReady()
> Trigger the ready listeners

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L788](https://github.com/videojs/video.js/blob/master/src/js/component.js#L788)

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

_inherited from_: [src/js/component.js#L910](https://github.com/videojs/video.js/blob/master/src/js/component.js#L910)

---

## EVENTS

### resize `EVENT`
> Fired when the width and/or height of the component changes

_inherited from_: [src/js/component.js#L1020](https://github.com/videojs/video.js/blob/master/src/js/component.js#L1020)

---

