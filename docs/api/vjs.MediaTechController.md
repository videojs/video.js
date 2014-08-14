<!-- GENERATED FROM SOURCE -->

# vjs.MediaTechController

__EXTENDS__: [vjs.Component](vjs.Component.md)  
__DEFINED IN__: [src/js/media/media.js#L12](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L12)  

Base class for media (HTML5 Video, Flash) controllers

---

## INDEX

- [METHODS](#methods)
  - [init](#init-player-options-ready-)
  - [initControlsListeners](#initcontrolslisteners)
  - [onClick](#onclick-event-)
  - [onTap](#ontap)
  - [removeControlsListeners](#removecontrolslisteners)
  - [setPoster](#setposter)
  - [addChild](#addchild-child-options-) _`inherited`_
  - [addClass](#addclass-classtoadd-) _`inherited`_
  - [buildCSSClass](#buildcssclass) _`inherited`_
  - [children](#children) _`inherited`_
  - [contentEl](#contentel) _`inherited`_
  - [createEl](#createel-tagname-attributes-) _`inherited`_
  - [dimensions](#dimensions-width-height-) _`inherited`_
  - [dispose](#dispose) _`inherited`_
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

### buildCSSClass()
> Allows sub components to stack CSS class names

##### RETURNS: 
* `String` The constructed class name

_inherited from_: [src/js/component.js#L515](https://github.com/videojs/video.js/blob/master/src/js/component.js#L515)

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

### createEl( [tagName], [attributes] )
> Create the component's DOM element

##### PARAMETERS: 
* __tagName__ `String` _(OPTIONAL)_ Element's node type. e.g. 'div'
* __attributes__ `Object` _(OPTIONAL)_ An object of element attributes that should be set on the element

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L194](https://github.com/videojs/video.js/blob/master/src/js/component.js#L194)

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
> Dispose of the component and all child components

_inherited from_: [src/js/component.js#L78](https://github.com/videojs/video.js/blob/master/src/js/component.js#L78)

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

### init( player, options, ready )

##### PARAMETERS: 
* __player__ 
* __options__ 
* __ready__ 

_defined in_: [src/js/media/media.js#L14](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L14)

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

### initControlsListeners()
> Set up click and touch listeners for the playback element
> On desktops, a click on the video itself will toggle playback,
> on a mobile device a click on the video toggles controls.
> (toggling controls is done by toggling the user state between active and
> inactive)
> 
> A tap can signal that a user has become active, or has become inactive
> e.g. a quick tap on an iPhone movie should reveal the controls. Another
> quick tap should hide them again (signaling the user is in an inactive
> viewing state)
> 
> In addition to this, we still want the user to be considered inactive after
> a few seconds of inactivity.
> 
> Note: the only part of iOS interaction we can't mimic with this setup
> is a touch and hold on the video element counting as activity in order to
> keep the controls showing, but that shouldn't be an issue. A touch and hold on
> any controls will still keep the user active

_defined in_: [src/js/media/media.js#L55](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L55)

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

### onClick( event )
> Handle a click on the media element. By default will play/pause the media.

##### PARAMETERS: 
* __event__ 

_defined in_: [src/js/media/media.js#L142](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L142)

---

### onTap()
> Handle a tap on the media element. By default it will toggle the user
> activity state, which hides and shows the controls.

_defined in_: [src/js/media/media.js#L162](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L162)

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

### player()
> Return the component's player

##### RETURNS: 
* `vjs.Player` 

_inherited from_: [src/js/component.js#L120](https://github.com/videojs/video.js/blob/master/src/js/component.js#L120)

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

### removeControlsListeners()
> Remove the listeners used for click and tap controls. This is needed for
> toggling to controls disabled, where a tap/touch should do nothing.

_defined in_: [src/js/media/media.js#L126](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L126)

---

### setPoster()
> Provide a default setPoster method for techs
> 
> Poster support for techs should be optional, so we don't want techs to
> break if they don't have a way to set a poster.

_defined in_: [src/js/media/media.js#L262](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L262)

---

### show()
> Show the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L693](https://github.com/videojs/video.js/blob/master/src/js/component.js#L693)

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

### resize `EVENT`
> Fired when the width and/or height of the component changes

_inherited from_: [src/js/component.js#L863](https://github.com/videojs/video.js/blob/master/src/js/component.js#L863)

---

