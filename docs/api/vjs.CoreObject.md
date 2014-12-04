<!-- GENERATED FROM SOURCE -->

# vjs.CoreObject

__DEFINED IN__: [src/js/core-object.js#L52](https://github.com/videojs/video.js/blob/master/src/js/core-object.js#L52)  

Core Object/Class for objects that use inheritance + constructors

To create a class that can be subclassed itself, extend the CoreObject class.

    var Animal = CoreObject.extend();
    var Horse = Animal.extend();

The constructor can be defined through the init property of an object argument.

    var Animal = CoreObject.extend({
      init: function(name, sound){
        this.name = name;
      }
    });

Other methods and properties can be added the same way, or directly to the
prototype.

   var Animal = CoreObject.extend({
      init: function(name){
        this.name = name;
      },
      getName: function(){
        return this.name;
      },
      sound: '...'
   });

   Animal.prototype.makeSound = function(){
     alert(this.sound);
   };

To create an instance of a class, use the create method.

   var fluffy = Animal.create('Fluffy');
   fluffy.getName(); // -> Fluffy

Methods and properties can be overridden in subclasses.

    var Horse = Animal.extend({
      sound: 'Neighhhhh!'
    });

    var horsey = Horse.create('Horsey');
    horsey.getName(); // -> Horsey
    horsey.makeSound(); // -> Alert: Neighhhhh!

---

## INDEX

- [METHODS](#methods)
  - [create](#create-static)
  - [extend](#extend-props--static)

---

## METHODS

### create() `STATIC`
> Create a new instance of this Object class
> 
>     var myAnimal = Animal.create();

##### RETURNS: 
* `vjs.CoreObject` An instance of a CoreObject subclass

_defined in_: [src/js/core-object.js#L120](https://github.com/videojs/video.js/blob/master/src/js/core-object.js#L120)

---

### extend( props ) `STATIC`
> Create a new object that inherits from this Object
> 
>     var Animal = CoreObject.extend();
>     var Horse = Animal.extend();

##### PARAMETERS: 
* __props__ `Object` Functions and properties to be applied to the

##### RETURNS: 
* `vjs.CoreObject` An object that inherits from CoreObject

_defined in_: [src/js/core-object.js#L70](https://github.com/videojs/video.js/blob/master/src/js/core-object.js#L70)

---

