<!-- GENERATED FROM SOURCE -->

# vjs.obj

__DEFINED IN__: [src/js/lib.js#L47](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L47)  

Object functions container

---

## INDEX

- [PROPERTIES](#properties)
  - [create](#create)

- [METHODS](#methods)
  - [copy](#copy-obj-)
  - [deepMerge](#deepmerge-obj1-obj2-)
  - [each](#each-obj-fn-)
  - [isPlain](#isplain-obj-)
  - [merge](#merge-obj1-obj2-)

---

## PROPERTIES

### create
> Object.create shim for prototypal inheritance.
> https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create

##### PARAMETERS: 
* __obj__ `Object` Object to use as prototype

_defined in_: [src/js/lib.js#L54](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L54)

---

## METHODS

### copy( obj )
> Make a copy of the supplied object

##### PARAMETERS: 
* __obj__ `Object` Object to copy

##### RETURNS: 
* `Object` Copy of object

_defined in_: [src/js/lib.js#L134](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L134)

---

### deepMerge( obj1, obj2 )
> Merge two objects, and merge any properties that are objects
> instead of just overwriting one. Uses to merge options hashes
> where deeper default settings are important.

##### PARAMETERS: 
* __obj1__ `Object` Object to override
* __obj2__ `Object` Overriding object

##### RETURNS: 
* `Object` New object. Obj1 and Obj2 will be untouched.

_defined in_: [src/js/lib.js#L105](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L105)

---

### each( obj, fn )
> Loop through each property in an object and call a function
> whose arguments are (key,value)

##### PARAMETERS: 
* __obj__ `Object` Object of properties
* __fn__ `Function` Function to be called on each property.

_defined in_: [src/js/lib.js#L73](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L73)

---

### isPlain( obj )
> Check if an object is plain, and not a dom node or any object sub-instance

##### PARAMETERS: 
* __obj__ `Object` Object to check

##### RETURNS: 
* `Boolean` True if plain, false otherwise

_defined in_: [src/js/lib.js#L143](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L143)

---

### merge( obj1, obj2 )
> Merge two objects together and return the original.

##### PARAMETERS: 
* __obj1__ `Object` 
* __obj2__ `Object` 

##### RETURNS: 
* `Object` 

_defined in_: [src/js/lib.js#L87](https://github.com/videojs/video.js/blob/master/src/js/lib.js#L87)

---

