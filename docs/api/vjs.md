<!-- GENERATED FROM SOURCE -->

# vjs

__DEFINED IN__: [src/js/core.js#L20](https://github.com/videojs/video.js/blob/master/src/js/core.js#L20)  

Doubles as the main function for users to create a player instance and also
the main library object.

---

## INDEX

- [PROPERTIES](#properties)
  - [cache](#cache)
  - [guid](#guid)
  - [options](#options)
  - [players](#players)
  - [support](#support)

- [METHODS](#methods)
  - [addClass](#addclass-element-classtoadd-)
  - [bind](#bind-context-fn-uid-)
  - [capitalize](#capitalize-string-)
  - [cleanUpEvents](#cleanupevents-elem-type-)
  - [createEl](#createel-tagname-properties-)
  - [createTimeRange](#createtimerange-start-end-)
  - [el](#el-id-)
  - [fixEvent](#fixevent-event-)
  - [formatTime](#formattime-seconds-guide-)
  - [get](#get-url-onsuccess-onerror-)
  - [getAbsoluteURL](#getabsoluteurl-url-)
  - [getAttributeValues](#getattributevalues-tag-)
  - [getComputedDimension](#getcomputeddimension-el-strcssrule-)
  - [getData](#getdata-el-)
  - [hasData](#hasdata-el-)
  - [insertFirst](#insertfirst-child-parent-)
  - [off](#off-elem-type-fn-)
  - [on](#on-elem-type-fn-)
  - [one](#one-elem-type-fn-)
  - [plugin](#plugin-name-init-)
  - [removeClass](#removeclass-element-classtoadd-)
  - [removeData](#removedata-el-)
  - [round](#round-num-dec-)
  - [trigger](#trigger-elem-event-)
  - [trim](#trim-string-)

- [CONSTANT](#constant)
  - [IS_IPHONE](#is_iphone)
  - [TEST_VID](#test_vid)
  - [USER_AGENT](#user_agent)
  - [expando](#expando)

- [UNDEFINED](#undefined)
  - [JSON](#json)

---

## PROPERTIES

### cache
> Element Data Store. Allows for binding data to an element without putting it directly on the element.
> Ex. Event listneres are stored here.
> (also from jsninja.com, slightly modified and updated for closure compiler)

_defined in_: [src/js/lib.js#L184](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L184)

---

### guid
> Unique ID for an element or function

_defined in_: [src/js/lib.js#L190](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L190)

---

### options
> Global Player instance options, surfaced from vjs.Player.prototype.options_
> vjs.options = vjs.Player.prototype.options_
> All options should use string keys so they avoid
> renaming by closure compiler

_defined in_: [src/js/core.js#L71](https://github.com/videojs/video.js/blob/master/src/js/core.js#L71)

---

### players
> Global player list

_defined in_: [src/js/core.js#L106](https://github.com/videojs/video.js/blob/master/src/js/core.js#L106)

---

### support
> Object to hold browser support information

_defined in_: [src/js/lib.js#L425](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L425)

---

## METHODS

### addClass( element, classToAdd )
> Add a CSS class name to an element

##### PARAMETERS: 
* __element__ `Element` Element to add class name to
* __classToAdd__ `String` Classname to add

_defined in_: [src/js/lib.js#L264](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L264)

---

### bind( context, fn, [uid] )
> Bind (a.k.a proxy or Context). A simple method for changing the context of a function
>    It also stores a unique id on the function so it can be easily removed from events

##### PARAMETERS: 
* __context__ `*` The object to bind as scope
* __fn__ `Function` The function to be bound to a scope
* __uid__ `Number` _(OPTIONAL)_ An optional unique ID for the function to be set

##### RETURNS: 
* `Function` 

_defined in_: [src/js/lib.js#L158](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L158)

---

### capitalize( string )
> Uppercase the first letter of a string

##### PARAMETERS: 
* __string__ `String` String to be uppercased

##### RETURNS: 
* `String` 

_defined in_: [src/js/lib.js#L39](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L39)

---

### cleanUpEvents( elem, type )
> Clean up the listener cache and dispatchers

##### PARAMETERS: 
* __elem__ `Element|Object` Element to clean up
* __type__ `String` Type of event to clean up

_defined in_: [src/js/events.js#L118](https://github.com/videojs/video.js/blob/master/src/js/events.js#L118)

---

### createEl( [tagName], [properties] )
> Creates an element and applies properties.

##### PARAMETERS: 
* __tagName__ `String` _(OPTIONAL)_ Name of tag to be created.
* __properties__ `Object` _(OPTIONAL)_ Element properties to be applied.

##### RETURNS: 
* `Element` 

_defined in_: [src/js/lib.js#L9](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L9)

---

### createTimeRange( start, end )
> Should create a fake TimeRange object
> Mimics an HTML5 time range instance, which has functions that
> return the start and end times for a range
> TimeRanges are returned by the buffered() method

##### PARAMETERS: 
* __start__ `Number` Start time in seconds
* __end__ `Number` End time in seconds

##### RETURNS: 
* `Object` Fake TimeRange object

_defined in_: [src/js/lib.js#L507](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L507)

---

### el( id )
> Shorthand for document.getElementById()
> Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.

##### PARAMETERS: 
* __id__ `String` Element ID

##### RETURNS: 
* `Element` Element with supplied ID

_defined in_: [src/js/lib.js#L433](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L433)

---

### fixEvent( event )
> Fix a native event to have standard property values

##### PARAMETERS: 
* __event__ `Object` Event object to fix

##### RETURNS: 
* `Object` 

_defined in_: [src/js/events.js#L157](https://github.com/videojs/video.js/blob/master/src/js/events.js#L157)

---

### formatTime( seconds, guide )
> Format seconds as a time string, H:MM:SS or M:SS
> Supplying a guide (in seconds) will force a number of leading zeros
> to cover the length of the guide

##### PARAMETERS: 
* __seconds__ `Number` Number of seconds to be turned into a string
* __guide__ `Number` Number (in seconds) to model the string after

##### RETURNS: 
* `String` Time formatted as H:MM:SS or M:SS

_defined in_: [src/js/lib.js#L449](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L449)

---

### get( url, [onSuccess], [onError] )
> Simple http request for retrieving external files (e.g. text tracks)

##### PARAMETERS: 
* __url__ `String` URL of resource
* __onSuccess__ `Function` _(OPTIONAL)_ Success callback
* __onError__ `Function` _(OPTIONAL)_ Error callback

_defined in_: [src/js/lib.js#L521](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L521)

---

### getAbsoluteURL( url )
> Get abosolute version of relative URL. Used to tell flash correct URL.
> http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue

##### PARAMETERS: 
* __url__ `String` URL to make absolute

##### RETURNS: 
* `String` Absolute URL

_defined in_: [src/js/lib.js#L589](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L589)

---

### getAttributeValues( tag )
> Get an element's attribute values, as defined on the HTML tag
> Attributs are not the same as properties. They're defined on the tag
> or with setAttribute (which shouldn't be used with HTML)
> This will return true or false for boolean attributes.

##### PARAMETERS: 
* __tag__ `Element` Element from which to get tag attributes

##### RETURNS: 
* `Object` 

_defined in_: [src/js/lib.js#L356](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L356)

---

### getComputedDimension( el, strCssRule )
> Get the computed style value for an element
> From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/

##### PARAMETERS: 
* __el__ `Element` Element to get style value for
* __strCssRule__ `String` Style name

##### RETURNS: 
* `String` Style value

_defined in_: [src/js/lib.js#L396](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L396)

---

### getData( el )
> Returns the cache object where data for an element is stored

##### PARAMETERS: 
* __el__ `Element` Element to store data for.

##### RETURNS: 
* `Object` 

_defined in_: [src/js/lib.js#L204](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L204)

---

### hasData( el )
> Returns the cache object where data for an element is stored

##### PARAMETERS: 
* __el__ `Element` Element to store data for.

##### RETURNS: 
* `Object` 

_defined in_: [src/js/lib.js#L218](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L218)

---

### insertFirst( child, parent )
> Insert an element as the first child node of another

##### PARAMETERS: 
* __child__ `Element` Element to insert
* __parent__ `[type]` Element to insert child into

_defined in_: [src/js/lib.js#L413](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L413)

---

### off( elem, [type], fn )
> Removes event listeners from an element

##### PARAMETERS: 
* __elem__ `Element|Object` Object to remove listeners from
* __type__ `String` _(OPTIONAL)_ Type of listener to remove. Don't include to remove all events from element.
* __fn__ `Function` Specific listener to remove. Don't incldue to remove listeners for an event type.

_defined in_: [src/js/events.js#L69](https://github.com/videojs/video.js/blob/master/src/js/events.js#L69)

---

### on( elem, type, fn )
> Add an event listener to element
> It stores the handler function in a separate cache object
> and adds a generic handler to the element's event,
> along with a unique id (guid) to the element.

##### PARAMETERS: 
* __elem__ `Element|Object` Element or object to bind listeners to
* __type__ `String` Type of event to bind to.
* __fn__ `Function` Event listener.

_defined in_: [src/js/events.js#L17](https://github.com/videojs/video.js/blob/master/src/js/events.js#L17)

---

### one( elem, type, fn )
> Trigger a listener only once for an event

##### PARAMETERS: 
* __elem__ `Element|Object` Element or object to
* __type__ `[type]` [description]
* __fn__ `Function` [description]

##### RETURNS: 
* `[type]` 

_defined in_: [src/js/events.js#L332](https://github.com/videojs/video.js/blob/master/src/js/events.js#L332)

---

### plugin( name, init )
> the method for registering a video.js plugin

##### PARAMETERS: 
* __name__ `String` The name of the plugin
* __init__ `Function` The function that is run when the player inits

_defined in_: [src/js/plugins.js#L7](https://github.com/videojs/video.js/blob/master/src/js/plugins.js#L7)

---

### removeClass( element, classToAdd )
> Remove a CSS class name from an element

##### PARAMETERS: 
* __element__ `Element` Element to remove from class name
* __classToAdd__ `String` Classname to remove

_defined in_: [src/js/lib.js#L275](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L275)

---

### removeData( el )
> Delete data for the element from the cache and the guid attr from getElementById

##### PARAMETERS: 
* __el__ `Element` Remove data for an element

_defined in_: [src/js/lib.js#L227](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L227)

---

### round( num, dec )
> Should round off a number to a decimal place

##### PARAMETERS: 
* __num__ `Number` Number to round
* __dec__ `Number` Number of decimal places to round to

##### RETURNS: 
* `Number` Rounded number

_defined in_: [src/js/lib.js#L493](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L493)

---

### trigger( elem, event )
> Trigger an event for an element

##### PARAMETERS: 
* __elem__ `Element|Object` Element to trigger an event on
* __event__ `String` Type of event to trigger

_defined in_: [src/js/events.js#L259](https://github.com/videojs/video.js/blob/master/src/js/events.js#L259)

---

### trim( string )
> Trim whitespace from the ends of a string.

##### PARAMETERS: 
* __string__ `String` String to trim

##### RETURNS: 
* `String` Trimmed string

_defined in_: [src/js/lib.js#L483](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L483)

---

## CONSTANT

### IS_IPHONE
> Device is an iPhone

_defined in_: [src/js/lib.js#L307](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L307)

---

### TEST_VID
> Element for testing browser HTML5 video capabilities

_defined in_: [src/js/lib.js#L293](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L293)

---

### USER_AGENT
> Useragent for browser testing.

_defined in_: [src/js/lib.js#L300](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L300)

---

### expando
> Unique attribute name to store an element's guid in

_defined in_: [src/js/lib.js#L197](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L197)

---

## UNDEFINED

### JSON
> Javascript JSON implementation
> (Parse Method Only)
> https://github.com/douglascrockford/JSON-js/blob/master/json2.js
> Only using for parse method when parsing data-setup attribute JSON.

_defined in_: [src/js/json.js#L15](https://github.com/videojs/video.js/blob/master/src/js/json.js#L15)

---

