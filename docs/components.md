Components
===
The Video.js player is built on top of a simple custom UI components architecture. The player class and all control classes extend the Component class, or a subclass of Component.

```js
_V_.Control = _V_.Component.extend({});
_V_.Button = _V_.Control.extend({});
_V_.PlayToggle = _V_.Button.extend({});
```

(The Class interface itself is provided using John Resig's [simple class inheritance](http://ejohn.org/blog/simple-javascript-inheritance/) also found in [JSNinja](http://jsninja.com).