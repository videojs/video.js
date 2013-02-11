Plugins
=======
If you've built something cool with Video.js, you can easily share it with the rest of the world by creating a plugin.

Step 1: Write Some Javascript
-----------------------------
You may have already done this step. Code up something interesting and then wrap it in a function. At the most basic level, that's all a video.js plugin is. By convention, plugins take a hash of options as their first argument:

    function examplePlugin(options) {
      this.on('play', function(e) {
        console.log('playback has started!');
      });
    };

When it's activated, `this` will be the Video.js player your plugin is attached to. You can use anything you'd like in the [Video.js API](api.md) when you're writing a plugin: change the `src`, mess up the DOM, or listen for and emit your own events.

Step 2: Registering A Plugin
-------------------------------
It's time to give the rest of the world the opportunity to be awed by your genius. When your plugin is loaded, it needs to let Video.js know this amazing new functionality is now available:

    vjs.plugin('examplePlugin', examplePlugin);

From this point on, your plugin will be added to the Video.js prototype and will show up as a property on every instance created. Make sure you choose a unique name that doesn't clash with any of the properties already in Video.js. Which leads us to...

Step 3: Using A Plugin
----------------------
There are two ways to initialize a plugin. If you're creating your video tag dynamically, you can specify the plugins you'd like to initialize with it and any options you want to pass to them:

    vjs('vidId', {
      plugins: {
        examplePlugin: {
          exampleOption: true
        }
      }
    });

If you've already initialized your video tag, you can activate a plugin at any time by calling its setup function directly:

    video.examplePlugin({ exampleOption: true });

That's it. Head on over to the Video.js wiki and add your plugin to the list so everyone else can check it out.