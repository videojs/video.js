# Usage examples for the functions on videojs

## Table of Contents

* [videojs()](#videojs)
* [options](#options)
* [getComponent()](#getcomponent)
* [registerComponent](#registercomponent)
* [getTech()](#gettech)
* [registerTech](#registertech)
* [extend()](#extend)
* [mergeOptions()](#mergeoptions)
* [bind()](#bind)
* [plugin()](#plugin)
* [xhr](#xhr)

## `videojs()`

```js
var myPlayer = videojs('my_video_id');
```

## `options`

```js
videojs.options.autoplay = true
// -> all players will autoplay by default
```

## `getComponent()`

```js
var VjsButton = videojs.getComponent('Button');
// Create a new instance of the component
var myButton = new VjsButton(myPlayer);
```

## `registerComponent()`

```js
// Get a component to subclass
var VjsButton = videojs.getComponent('Button');
// Subclass the component (see 'extend' doc for more info)
var MySpecialButton = videojs.extend(VjsButton, {});
// Register the new component
VjsButton.registerComponent('MySepcialButton', MySepcialButton);
// (optionally) add the new component as a default player child
myPlayer.addChild('MySepcialButton');
```

## `getTech()`

```js
var Html5 = videojs.getTech('Html5');
// Create a new instance of the component
var html5 = new Html5(options);
```

## `registerTech()`

```js
// get the Html5 Tech
var Html5 = videojs.getTech('Html5');
var MyTech = videojs.extend(Html5, {});
// Register the new Tech
VjsButton.registerTech('Tech', MyTech);
var player = videojs('myplayer', {
  techOrder: ['myTech', 'html5']
});
```

## `extend()`

```js
// Create a basic javascript 'class'
function MyClass(name) {
  // Set a property at initialization
  this.myName = name;
}
// Create an instance method
MyClass.prototype.sayMyName = function() {
  alert(this.myName);
};
// Subclass the exisitng class and change the name
// when initializing
var MySubClass = videojs.extend(MyClass, {
  constructor: function(name) {
    // Call the super class constructor for the subclass
    MyClass.call(this, name)
  }
});
// Create an instance of the new sub class
var myInstance = new MySubClass('John');
myInstance.sayMyName(); // -> should alert "John"
```

## `mergeOptions()`

```js
var defaultOptions = {
  foo: true,
  bar: {
    a: true,
    b: [1,2,3]
  }
};
var newOptions = {
  foo: false,
  bar: {
    b: [4,5,6]
  }
};
var result = videojs.mergeOptions(defaultOptions, newOptions);
// result.foo = false;
// result.bar.a = true;
// result.bar.b = [4,5,6];
```

## `bind()`

```js
var someClass = function() {};
var someObj = new someClass();
videojs.bind(someObj, function() {
  // this will be the context of someObj here
});
```

## `plugin()`

**See the [plugin guide](plugins.md) in the docs for a more detailed example**

```js
// Make a plugin that alerts when the player plays
videojs.plugin('myPlugin', function(myPluginOptions) {
  myPluginOptions = myPluginOptions || {};

  var player = this;
  var alertText = myPluginOptions.text || 'Player is playing!'

  player.on('play', function() {
    alert(alertText);
  });
});
// USAGE EXAMPLES
// EXAMPLE 1: New player with plugin options, call plugin immediately
var player1 = videojs('idOne', {
  myPlugin: {
    text: 'Custom text!'
  }
});
// Click play
// --> Should alert 'Custom text!'
// EXAMPLE 3: New player, initialize plugin later
var player3 = videojs('idThree');
// Click play
// --> NO ALERT
// Click pause
// Initialize plugin using the plugin function on the player instance
player3.myPlugin({
  text: 'Plugin added later!'
});
// Click play
// --> Should alert 'Plugin added later!'
```

## `xhr()`

```js
videojs.xhr({
  body: someJSONString,
  uri: "/foo",
  headers: {
    "Content-Type": "application/json"
  }
}, function (err, resp, body) {
  // check resp.statusCode
});
```
