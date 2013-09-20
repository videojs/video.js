<!-- GENERATED FROM SOURCE -->

# vjs.Component

__EXTENDS__: [vjs.CoreObject](vjs.CoreObject.md)  
__DEFINED IN__: [src/js/component.js#L35](https://github.com/videojs/video.js/blob/master/src/js/component.js#L35)  

Base UI Component class

Components are embeddable UI objects that are represented by both a
javascript object and an element in the DOM. They can be children of other
components, and can have many children themselves.

    // adding a button to the player
    var button = player.addChild('button');
    button.el(); // -> button element

    <div class="video-js">
      <div class="vjs-button">Button</div>
    </div>

Components are also event emitters.

    button.on('click', function(){
      console.log('Button Clicked!');
    });

    button.trigger('customevent');

---

## INDEX

- [METHODS](#methods)
  - [addChild](#addchild-child-options-)
  - [addClass](#addclass-classtoadd-)
  - [buildCSSClass](#buildcssclass)
  - [children](#children)
  - [contentEl](#contentel)
  - [createEl](#createel-tagname-attributes-)
  - [dimension](#dimension-widthorheight-num-skiplisteners-)
  - [dimensions](#dimensions-width-height-)
  - [disable](#disable)
  - [dispose](#dispose)
  - [el](#el)
  - [emitTapEvents](#emittapevents)
  - [getChild](#getchild-name-)
  - [getChildById](#getchildbyid-id-)
  - [height](#height-num-skiplisteners-)
  - [hide](#hide)
  - [id](#id)
  - [init](#init-player-options-ready-)
  - [initChildren](#initchildren)
  - [lockShowing](#lockshowing)
  - [name](#name)
  - [off](#off-type-fn-)
  - [on](#on-type-fn-)
  - [one](#one-type-fn-)
  - [options](#options-obj-)
  - [player](#player)
  - [ready](#ready-fn-)
  - [removeChild](#removechild-component-)
  - [removeClass](#removeclass-classtoremove-)
  - [show](#show)
  - [trigger](#trigger-type-event-)
  - [triggerReady](#triggerready)
  - [unlockShowing](#unlockshowing)
  - [width](#width-num-skiplisteners-)

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

_defined in_: [src/js/component.js#L335](https://github.com/videojs/video.js/blob/master/src/js/component.js#L335)

---

### addClass( classToAdd )
> Add a CSS class name to the component's element

##### PARAMETERS: 
* __classToAdd__ `String` Classname to add

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L608](https://github.com/videojs/video.js/blob/master/src/js/component.js#L608)

---

### buildCSSClass()
> Allows sub components to stack CSS class names

##### RETURNS: 
* `String` The constructed class name

_defined in_: [src/js/component.js#L463](https://github.com/videojs/video.js/blob/master/src/js/component.js#L463)

---

### children()
> Returns an array of all child components

##### RETURNS: 
* `Array` 

_defined in_: [src/js/component.js#L269](https://github.com/videojs/video.js/blob/master/src/js/component.js#L269)

---

### contentEl()
> Return the component's DOM element for embedding content.
> Will either be el_ or a new element defined in createEl.

##### RETURNS: 
* `Element` 

_defined in_: [src/js/component.js#L218](https://github.com/videojs/video.js/blob/master/src/js/component.js#L218)

---

### createEl( [tagName], [attributes] )
> Create the component's DOM element

##### PARAMETERS: 
* __tagName__ `String` _(OPTIONAL)_ Element's node type. e.g. 'div'
* __attributes__ `Object` _(OPTIONAL)_ An object of element attributes that should be set on the element

##### RETURNS: 
* `Element` 

_defined in_: [src/js/component.js#L190](https://github.com/videojs/video.js/blob/master/src/js/component.js#L190)

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

_defined in_: [src/js/component.js#L730](https://github.com/videojs/video.js/blob/master/src/js/component.js#L730)

---

### dimensions( width, height )
> Set both width and height at the same time

##### PARAMETERS: 
* __width__ `Number|String` 
* __height__ `Number|String` 

##### RETURNS: 
* `vjs.Component` The component

_defined in_: [src/js/component.js#L708](https://github.com/videojs/video.js/blob/master/src/js/component.js#L708)

---

### disable()
> Disable component by making it unshowable

_defined in_: [src/js/component.js#L669](https://github.com/videojs/video.js/blob/master/src/js/component.js#L669)

---

### dispose()
> Dispose of the component and all child components

_defined in_: [src/js/component.js#L74](https://github.com/videojs/video.js/blob/master/src/js/component.js#L74)

---

### el()
> return the component's DOM element

##### RETURNS: 
* `Element` 

_defined in_: [src/js/component.js#L199](https://github.com/videojs/video.js/blob/master/src/js/component.js#L199)

---

### emitTapEvents()
> Emit 'tap' events when touch events are supported
> 
> This is used to support toggling the controls through a tap on the video.
> 
> We're requireing them to be enabled because otherwise every component would
> have this extra overhead unnecessarily, on mobile devices where extra
> overhead is especially bad.

_defined in_: [src/js/component.js#L791](https://github.com/videojs/video.js/blob/master/src/js/component.js#L791)

---

### getChild( name )
> Returns a child component with the provided ID

##### PARAMETERS: 
* __name__ 

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L303](https://github.com/videojs/video.js/blob/master/src/js/component.js#L303)

---

### getChildById( id )
> Returns a child component with the provided ID

##### PARAMETERS: 
* __id__ 

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L286](https://github.com/videojs/video.js/blob/master/src/js/component.js#L286)

---

### height( [num], [skipListeners] )
> Get or set the height of the component (CSS values)

##### PARAMETERS: 
* __num__ `Number|String` _(OPTIONAL)_ New component height
* __skipListeners__ `Boolean` _(OPTIONAL)_ Skip the resize event trigger

##### RETURNS: 
* `vjs.Component` The component if the height was set
* `Number|String` The height if it wasn't set

_defined in_: [src/js/component.js#L697](https://github.com/videojs/video.js/blob/master/src/js/component.js#L697)

---

### hide()
> Hide the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L639](https://github.com/videojs/video.js/blob/master/src/js/component.js#L639)

---

### id()
> Returns the component's ID

##### RETURNS: 
* `String` 

_defined in_: [src/js/component.js#L235](https://github.com/videojs/video.js/blob/master/src/js/component.js#L235)

---

### init( player, options, ready )
> the constructor funciton for the class

##### PARAMETERS: 
* __player__ 
* __options__ 
* __ready__ 

_defined in_: [src/js/component.js#L41](https://github.com/videojs/video.js/blob/master/src/js/component.js#L41)

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

_defined in_: [src/js/component.js#L431](https://github.com/videojs/video.js/blob/master/src/js/component.js#L431)

---

### lockShowing()
> Lock an item in its visible state
> To be used with fadeIn/fadeOut.

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L650](https://github.com/videojs/video.js/blob/master/src/js/component.js#L650)

---

### name()
> Returns the component's name

##### RETURNS: 
* `String` 

_defined in_: [src/js/component.js#L252](https://github.com/videojs/video.js/blob/master/src/js/component.js#L252)

---

### off( [type], [fn] )
> Remove an event listener from the component's element

##### PARAMETERS: 
* __type__ `String` _(OPTIONAL)_ Event type. Without type it will remove all listeners.
* __fn__ `Function` _(OPTIONAL)_ Event listener. Without fn it will remove all listeners for a type.

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L492](https://github.com/videojs/video.js/blob/master/src/js/component.js#L492)

---

### on( type, fn )
> Add an event listener to this component's element
> The context will be the component.

##### PARAMETERS: 
* __type__ `String` Event type e.g. 'click'
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L480](https://github.com/videojs/video.js/blob/master/src/js/component.js#L480)

---

### one( type, fn )
> Add an event listener to be triggered only once and then removed

##### PARAMETERS: 
* __type__ `String` Event type
* __fn__ `Function` Event listener

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L504](https://github.com/videojs/video.js/blob/master/src/js/component.js#L504)

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

_defined in_: [src/js/component.js#L169](https://github.com/videojs/video.js/blob/master/src/js/component.js#L169)

---

### player()
> Return the component's player

##### RETURNS: 
* `vjs.Player` 

_defined in_: [src/js/component.js#L116](https://github.com/videojs/video.js/blob/master/src/js/component.js#L116)

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

_defined in_: [src/js/component.js#L561](https://github.com/videojs/video.js/blob/master/src/js/component.js#L561)

---

### removeChild( component )
> Remove a child component from this component's list of children, and the
> child component's element from this component's element

##### PARAMETERS: 
* __component__ `vjs.Component` Component to remove

_defined in_: [src/js/component.js#L393](https://github.com/videojs/video.js/blob/master/src/js/component.js#L393)

---

### removeClass( classToRemove )
> Remove a CSS class name from the component's element

##### PARAMETERS: 
* __classToRemove__ `String` Classname to remove

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L619](https://github.com/videojs/video.js/blob/master/src/js/component.js#L619)

---

### show()
> Show the component element if hidden

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L629](https://github.com/videojs/video.js/blob/master/src/js/component.js#L629)

---

### trigger( type, event )
> Trigger an event on an element

##### PARAMETERS: 
* __type__ `String` Event type to trigger
* __event__ `Event|Object` Event object to be passed to the listener

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L516](https://github.com/videojs/video.js/blob/master/src/js/component.js#L516)

---

### triggerReady()
> Trigger the ready listeners

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L580](https://github.com/videojs/video.js/blob/master/src/js/component.js#L580)

---

### unlockShowing()
> Unlock an item to be hidden
> To be used with fadeIn/fadeOut.

##### RETURNS: 
* `vjs.Component` 

_defined in_: [src/js/component.js#L661](https://github.com/videojs/video.js/blob/master/src/js/component.js#L661)

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

_defined in_: [src/js/component.js#L685](https://github.com/videojs/video.js/blob/master/src/js/component.js#L685)

---

