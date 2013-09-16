<!-- GENERATED FROM SOURCE -->

# vjs.MenuItem

__EXTENDS__: [vjs.Button](vjs.Button.md)  
__DEFINED IN__: [src/js/menu.js#L52](https://github.com/videojs/video.js/blob/master/src/js/menu.js#L52)  

Menu item

---

## INDEX

- [METHODS](#methods)
  - [createEl](#createel-tagname-attributes-)
  - [init](#init-player-options-)
  - [onClick](#onclick)
  - [selected](#selected-selected-)
  - [addChild](#addchild-child-options-) _`inherited`_
  - [addClass](#addclass-classtoadd-) _`inherited`_
  - [children](#children) _`inherited`_
  - [contentEl](#contentel) _`inherited`_
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
  - [removeClass](#removeclass-classtoremove-) _`inherited`_
  - [show](#show) _`inherited`_
  - [trigger](#trigger-type-event-) _`inherited`_
  - [triggerReady](#triggerready) _`inherited`_
  - [unlockShowing](#unlockshowing) _`inherited`_
  - [width](#width-num-skiplisteners-) _`inherited`_

---

## METHODS

### addChild( child, [options] )
> Adds a child component inside this component.

##### PARAMETERS: 
* __child__ `String|vjs.Component` The class name or instance of a child to add.
* __options__ `Object` _(OPTIONAL)_ Options, including options to be passed to children of the child.

##### RETURNS: 
* `vjs.Component` The child component, because it might be created in this process.

_inherited from_: [src/js/component.js#L275](https://github.com/videojs/video.js/blob/master/src/js/component.js#L275)

---

### addClass( classToAdd )
> Add a CSS class name to the component's element

##### PARAMETERS: 
* __classToAdd__ `String` Classname to add

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L515](https://github.com/videojs/video.js/blob/master/src/js/component.js#L515)

---

### children()
> Returns array of all child components.

##### RETURNS: 
* `Array` 

_inherited from_: [src/js/component.js#L234](https://github.com/videojs/video.js/blob/master/src/js/component.js#L234)

---

### contentEl()
> Return the component's DOM element for embedding content.
>   will either be el_ or a new element defined in createEl

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L189](https://github.com/videojs/video.js/blob/master/src/js/component.js#L189)

---

### createEl( [tagName], [attributes] )
> Create the component's DOM element.

##### PARAMETERS: 
* __tagName__ `String` _(OPTIONAL)_ Element's node type. e.g. 'div'
* __attributes__ `Object` _(OPTIONAL)_ An object of element attributes that should be set on the element.

_defined in_: [src/js/menu.js#L61](https://github.com/videojs/video.js/blob/master/src/js/menu.js#L61)

---

### dimension( [widthOrHeight], [num], [skipListeners] )
> Get or set width or height.
> All for an integer, integer + 'px' or integer + '%';
> Known issue: hidden elements. Hidden elements officially have a width of 0.
> So we're defaulting to the style.width value and falling back to computedStyle
> which has the hidden element issue.
> Info, but probably not an efficient fix:
> http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/

##### PARAMETERS: 
* __widthOrHeight__ `String` _(OPTIONAL)_ 'width' or 'height'
* __num__ `Number|String` _(OPTIONAL)_ New dimension
* __skipListeners__ `Boolean` _(OPTIONAL)_ Skip resize event trigger

##### RETURNS: 
* `vjs.Component|Number|String` Return the player if setting a dimension.

_inherited from_: [src/js/component.js#L624](https://github.com/videojs/video.js/blob/master/src/js/component.js#L624)

---

### dimensions( width, height )
> Set both width and height at the same time.

##### PARAMETERS: 
* __width__ `Number|String` 
* __height__ `Number|String` 

##### RETURNS: 
* `vjs.Component` The player.

_inherited from_: [src/js/component.js#L605](https://github.com/videojs/video.js/blob/master/src/js/component.js#L605)

---

### disable()
> Disable component by making it unshowable

_inherited from_: [src/js/component.js#L569](https://github.com/videojs/video.js/blob/master/src/js/component.js#L569)

---

### dispose()
> Dispose of the component and all child components.

_inherited from_: [src/js/component.js#L53](https://github.com/videojs/video.js/blob/master/src/js/component.js#L53)

---

### el()
> Return the component's DOM element.

##### RETURNS: 
* `Element` 

_inherited from_: [src/js/component.js#L172](https://github.com/videojs/video.js/blob/master/src/js/component.js#L172)

---

### emitTapEvents()
> Emit 'tap' events when touch events are supported. We're requireing them to
> be enabled because otherwise every component would have this extra overhead
> unnecessarily, on mobile devices where extra overhead is especially bad.
> 
> This is being implemented so we can support taps on the video element
> toggling the controls.

_inherited from_: [src/js/component.js#L684](https://github.com/videojs/video.js/blob/master/src/js/component.js#L684)

---

### getChild( name )
> Returns a child component with the provided ID.

##### PARAMETERS: 
* __name__ 

##### RETURNS: 
* `Array` 

_inherited from_: [src/js/component.js#L264](https://github.com/videojs/video.js/blob/master/src/js/component.js#L264)

---

### getChildById( id )
> Returns a child component with the provided ID.

##### PARAMETERS: 
* __id__ 

##### RETURNS: 
* `Array` 

_inherited from_: [src/js/component.js#L249](https://github.com/videojs/video.js/blob/master/src/js/component.js#L249)

---

### height( [num], [skipListeners] )
> Get or set the height of the player

##### PARAMETERS: 
* __num__ `Number|String` _(OPTIONAL)_ Optional new player height
* __skipListeners__ `Boolean` _(OPTIONAL)_ Optional skip resize event trigger

##### RETURNS: 
* `vjs.Component|Number|String` The player, or the dimension

_inherited from_: [src/js/component.js#L595](https://github.com/videojs/video.js/blob/master/src/js/component.js#L595)

---

### hide()
> Hide the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L543](https://github.com/videojs/video.js/blob/master/src/js/component.js#L543)

---

### id()
> Return the component's ID.

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L204](https://github.com/videojs/video.js/blob/master/src/js/component.js#L204)

---

### init( player, options )

##### PARAMETERS: 
* __player__ 
* __options__ 

_defined in_: [src/js/menu.js#L54](https://github.com/videojs/video.js/blob/master/src/js/menu.js#L54)

---

### initChildren()
> Initialize default child components from options

_inherited from_: [src/js/component.js#L357](https://github.com/videojs/video.js/blob/master/src/js/component.js#L357)

---

### lockShowing()
> Lock an item in its visible state. To be used with fadeIn/fadeOut.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L552](https://github.com/videojs/video.js/blob/master/src/js/component.js#L552)

---

### name()
> Return the component's ID.

##### RETURNS: 
* `String` 

_inherited from_: [src/js/component.js#L219](https://github.com/videojs/video.js/blob/master/src/js/component.js#L219)

---

### off( [type], [fn] )
> Remove an event listener from the component's element

##### PARAMETERS: 
* __type__ `String` _(OPTIONAL)_ Optional event type. Without type it will remove all listeners.
* __fn__ `Function` _(OPTIONAL)_ Optional event listener. Without fn it will remove all listeners for a type.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L410](https://github.com/videojs/video.js/blob/master/src/js/component.js#L410)

---

### on( type, fn )
> Add an event listener to this component's element. Context will be the component.

##### PARAMETERS: 
* __type__ `String` Event type e.g. 'click'
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L399](https://github.com/videojs/video.js/blob/master/src/js/component.js#L399)

---

### onClick()

_defined in_: [src/js/menu.js#L69](https://github.com/videojs/video.js/blob/master/src/js/menu.js#L69)

---

### one( type, fn )
> Add an event listener to be triggered only once and then removed

##### PARAMETERS: 
* __type__ `String` Event type
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L421](https://github.com/videojs/video.js/blob/master/src/js/component.js#L421)

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

_inherited from_: [src/js/component.js#L145](https://github.com/videojs/video.js/blob/master/src/js/component.js#L145)

---

### player()
> Return the component's player.

##### RETURNS: 
* `vjs.Player` 

_inherited from_: [src/js/component.js#L93](https://github.com/videojs/video.js/blob/master/src/js/component.js#L93)

---

### ready( fn )
> Bind a listener to the component's ready state.
>   Different from event listeners in that if the ready event has already happend
>   it will trigger the function immediately.

##### PARAMETERS: 
* __fn__ `Function` Ready listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L470](https://github.com/videojs/video.js/blob/master/src/js/component.js#L470)

---

### removeClass( classToRemove )
> Remove a CSS class name from the component's element

##### PARAMETERS: 
* __classToRemove__ `String` Classname to remove

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L525](https://github.com/videojs/video.js/blob/master/src/js/component.js#L525)

---

### selected( selected )
> Set this menu item as selected or not

##### PARAMETERS: 
* __selected__ `Boolean` 

_defined in_: [src/js/menu.js#L77](https://github.com/videojs/video.js/blob/master/src/js/menu.js#L77)

---

### show()
> Show the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L534](https://github.com/videojs/video.js/blob/master/src/js/component.js#L534)

---

### trigger( type, event )
> Trigger an event on an element

##### PARAMETERS: 
* __type__ `String` Event type to trigger
* __event__ `Event|Object` Event object to be passed to the listener

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L432](https://github.com/videojs/video.js/blob/master/src/js/component.js#L432)

---

### triggerReady()
> Trigger the ready listeners

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L488](https://github.com/videojs/video.js/blob/master/src/js/component.js#L488)

---

### unlockShowing()
> Unlock an item to be hidden. To be used with fadeIn/fadeOut.

##### RETURNS: 
* `vjs.Component` 

_inherited from_: [src/js/component.js#L561](https://github.com/videojs/video.js/blob/master/src/js/component.js#L561)

---

### width( [num], skipListeners )
> If a value is provided it will change the width of the player to that value
> otherwise the width is returned
> http://dev.w3.org/html5/spec/dimension-attributes.html#attr-dim-height
> Video tag width/height only work in pixels. No percents.
> But allowing limited percents use. e.g. width() will return number+%, not computed width

##### PARAMETERS: 
* __num__ `Number|String` _(OPTIONAL)_ Optional width number
* __skipListeners__ `[type]` Skip the 'resize' event trigger

##### RETURNS: 
* `vjs.Component|Number|String` Returns 'this' if dimension was set.

_inherited from_: [src/js/component.js#L585](https://github.com/videojs/video.js/blob/master/src/js/component.js#L585)

---

