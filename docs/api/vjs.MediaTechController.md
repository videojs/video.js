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
  - [removeControlsListeners](#removecontrolslisteners)
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

_inherited from_: [src/js/component.js#L314](https://github.com/videojs/video.js/blob/master/src/js/component.js#L314)

---

### addClass( classToAdd )
> Add a CSS class name to the component's element

##### PARAMETERS: 
* __classToAdd__ `String` Classname to add

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L587](https://github.com/videojs/video.js/blob/master/src/js/component.js#L587)

---

### buildCSSClass()
> Allows sub components to stack CSS class names

##### RETURNS: 
* `String` The constructed class name

_inherited from_: [src/js/component.js#L442](https://github.com/videojs/video.js/blob/master/src/js/component.js#L442)

---

### children()
> Returns an array of all child components

##### RETURNS: 
* `Array` 

_inherited from_: [src/js/component.js#L248](https://github.com/videojs/video.js/blob/master/src/js/component.js#L248)

---

### contentEl()
> Return the component's DOM element for embedding content.
> Will either be el_ or a new element defined in createEl.

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L197](https://github.com/videojs/video.js/blob/master/src/js/component.js#L197)

---

### createEl( [tagName], [attributes] )
> Create the component's DOM element

##### PARAMETERS: 
* __tagName__ `String` _(OPTIONAL)_ Element's node type. e.g. 'div'
* __attributes__ `Object` _(OPTIONAL)_ An object of element attributes that should be set on the element

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L169](https://github.com/videojs/video.js/blob/master/src/js/component.js#L169)

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

_inherited from_: [src/js/component.js#L709](https://github.com/videojs/video.js/blob/master/src/js/component.js#L709)

---

### dimensions( width, height )
> Set both width and height at the same time

##### PARAMETERS: 
* __width__ `Number|String` 
* __height__ `Number|String` 

##### RETURNS: 
* `vjs.Component` The component

_inherited from_: [src/js/component.js#L687](https://github.com/videojs/video.js/blob/master/src/js/component.js#L687)

---

### disable()
> Disable component by making it unshowable

_inherited from_: [src/js/component.js#L648](https://github.com/videojs/video.js/blob/master/src/js/component.js#L648)

---

### dispose()
> Dispose of the component and all child components

_inherited from_: [src/js/component.js#L53](https://github.com/videojs/video.js/blob/master/src/js/component.js#L53)

---

### el()
> return the component's DOM element

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L178](https://github.com/videojs/video.js/blob/master/src/js/component.js#L178)

---

### emitTapEvents()
> Emit 'tap' events when touch events are supported
> 
> This is used to support toggling the controls through a tap on the video.
> 
> We're requireing them to be enabled because otherwise every component would
> have this extra overhead unnecessarily, on mobile devices where extra
> overhead is especially bad.

_inherited from_: [src/js/component.js#L770](https://github.com/videojs/video.js/blob/master/src/js/component.js#L770)

---

### getChild( name )
> Returns a child component with the provided ID

##### PARAMETERS: 
* __name__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L282](https://github.com/videojs/video.js/blob/master/src/js/component.js#L282)

---

### getChildById( id )
> Returns a child component with the provided ID

##### PARAMETERS: 
* __id__ 

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L265](https://github.com/videojs/video.js/blob/master/src/js/component.js#L265)

---

### height( [num], [skipListeners] )
> Get or set the height of the component (CSS values)

##### PARAMETERS: 
* __num__ `Number|String` _(OPTIONAL)_ New component height
* __skipListeners__ `Boolean` _(OPTIONAL)_ Skip the resize event trigger

##### RETURNS: 
* `vjs.Component` The component if the height was set
* `Number|String` The height if it wasn't set

_inherited from_: [src/js/component.js#L676](https://github.com/videojs/video.js/blob/master/src/js/component.js#L676)

---

### hide()
> Hide the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L618](https://github.com/videojs/video.js/blob/master/src/js/component.js#L618)

---

### id()
> Returns the component's ID

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L214](https://github.com/videojs/video.js/blob/master/src/js/component.js#L214)

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

_inherited from_: [src/js/component.js#L410](https://github.com/videojs/video.js/blob/master/src/js/component.js#L410)

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

_defined in_: [src/js/media/media.js#L41](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L41)

---

### lockShowing()
> Lock an item in its visible state
> To be used with fadeIn/fadeOut.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L629](https://github.com/videojs/video.js/blob/master/src/js/component.js#L629)

---

### name()
> Returns the component's name

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L231](https://github.com/videojs/video.js/blob/master/src/js/component.js#L231)

---

### off( [type], [fn] )
> Remove an event listener from the component's element

##### PARAMETERS: 
* __type__ `String` _(OPTIONAL)_ Event type. Without type it will remove all listeners.
* __fn__ `Function` _(OPTIONAL)_ Event listener. Without fn it will remove all listeners for a type.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L471](https://github.com/videojs/video.js/blob/master/src/js/component.js#L471)

---

### on( type, fn )
> Add an event listener to this component's element
> The context will be the component.

##### PARAMETERS: 
* __type__ `String` Event type e.g. 'click'
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L459](https://github.com/videojs/video.js/blob/master/src/js/component.js#L459)

---

### onClick( event )
> Handle a click on the media element. By default will play/pause the media.

##### PARAMETERS: 
* __event__ 

_defined in_: [src/js/media/media.js#L131](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L131)

---

### one( type, fn )
> Add an event listener to be triggered only once and then removed

##### PARAMETERS: 
* __type__ `String` Event type
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L483](https://github.com/videojs/video.js/blob/master/src/js/component.js#L483)

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

_inherited from_: [src/js/component.js#L148](https://github.com/videojs/video.js/blob/master/src/js/component.js#L148)

---

### player()
> Return the component's player

##### RETURNS: 
* `vjs.Player` 

_inherited from_: [src/js/component.js#L95](https://github.com/videojs/video.js/blob/master/src/js/component.js#L95)

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

_inherited from_: [src/js/component.js#L540](https://github.com/videojs/video.js/blob/master/src/js/component.js#L540)

---

### removeChild( component )
> Remove a child component from this component's list of children, and the
> child component's element from this component's element

##### PARAMETERS: 
* __component__ `vjs.Component` Component to remove

_inherited from_: [src/js/component.js#L372](https://github.com/videojs/video.js/blob/master/src/js/component.js#L372)

---

### removeClass( classToRemove )
> Remove a CSS class name from the component's element

##### PARAMETERS: 
* __classToRemove__ `String` Classname to remove

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L598](https://github.com/videojs/video.js/blob/master/src/js/component.js#L598)

---

### removeControlsListeners()
> Remove the listeners used for click and tap controls. This is needed for
> toggling to controls disabled, where a tap/touch should do nothing.

_defined in_: [src/js/media/media.js#L115](https://github.com/videojs/video.js/blob/master/src/js/media/media.js#L115)

---

### show()
> Show the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L608](https://github.com/videojs/video.js/blob/master/src/js/component.js#L608)

---

### trigger( type, event )
> Trigger an event on an element

##### PARAMETERS: 
* __type__ `String` Event type to trigger
* __event__ `Event|Object` Event object to be passed to the listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L495](https://github.com/videojs/video.js/blob/master/src/js/component.js#L495)

---

### triggerReady()
> Trigger the ready listeners

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L559](https://github.com/videojs/video.js/blob/master/src/js/component.js#L559)

---

### unlockShowing()
> Unlock an item to be hidden
> To be used with fadeIn/fadeOut.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L640](https://github.com/videojs/video.js/blob/master/src/js/component.js#L640)

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

_inherited from_: [src/js/component.js#L664](https://github.com/videojs/video.js/blob/master/src/js/component.js#L664)

---

