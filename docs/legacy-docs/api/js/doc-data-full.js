var docData = 
[
    {
        "comment": "/**\n* @file base-styles.js\n*\n* This code injects the required base styles in the head of the document.\n*/",
        "meta": {
            "range": [
                0,
                105
            ],
            "filename": "base-styles.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "base-styles.js",
        "kind": "file",
        "description": "<p>base-styles.js</p>\n<p>This code injects the required base styles in the head of the document.</p>",
        "preserveName": true,
        "longname": "base-styles.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file big-play-button.js\n*/",
        "meta": {
            "range": [
                0,
                33
            ],
            "filename": "big-play-button.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "big-play-button.js",
        "kind": "file",
        "description": "<p>big-play-button.js</p>",
        "preserveName": true,
        "longname": "big-play-button.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Initial play button. Shows before the video has played. The hiding of the\n* big play button is done via CSS and player states.\n*\n* @param {Object} player  Main Player\n* @param {Object=} options Object of option names and values\n* @extends Button\n* @class BigPlayButton\n*/",
        "meta": {
            "range": [
                146,
                423
            ],
            "filename": "big-play-button.js",
            "lineno": 9,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Initial play button. Shows before the video has played. The hiding of the\nbig play button is done via CSS and player states.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Main Player</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            }
        ],
        "augments": [
            "Button"
        ],
        "kind": "class",
        "name": "BigPlayButton",
        "longname": "BigPlayButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                442,
                568
            ],
            "filename": "big-play-button.js",
            "lineno": 24,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handles click for play \n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                581,
                637
            ],
            "filename": "big-play-button.js",
            "lineno": 34,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handles click for play</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file button.js\n*/",
        "meta": {
            "range": [
                0,
                24
            ],
            "filename": "button.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "button.js",
        "kind": "file",
        "description": "<p>button.js</p>",
        "preserveName": true,
        "longname": "button.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Base class for all buttons\n*\n* @param {Object} player  Main Player\n* @param {Object=} options Object of option names and values\n* @extends Component\n* @class Button\n*/",
        "meta": {
            "range": [
                169,
                342
            ],
            "filename": "button.js",
            "lineno": 13,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Base class for all buttons</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Main Player</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "Button",
        "longname": "Button",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @param {String=} type Element's node type. e.g. 'div'\n* @param {Object=} props An object of element attributes that should be set on the element Tag name \n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                382,
                623
            ],
            "filename": "button.js",
            "lineno": 34,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Element's node type. e.g. 'div'</p>",
                "name": "type"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>An object of element attributes that should be set on the element Tag name</p>",
                "name": "props"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Controls text - both request and localize \n*\n* @param {String} text Text for button\n* @return {String}\n* @method controlText\n*/",
        "meta": {
            "range": [
                690,
                823
            ],
            "filename": "button.js",
            "lineno": 64,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Controls text - both request and localize</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Text for button</p>",
                "name": "text"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "controlText",
        "longname": "controlText",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allows sub components to stack CSS class names\n*\n* @return {String}\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                851,
                951
            ],
            "filename": "button.js",
            "lineno": 80,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Allows sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle Click - Override with specific functionality for button\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                964,
                1059
            ],
            "filename": "button.js",
            "lineno": 90,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle Click - Override with specific functionality for button</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle Focus - Add keyboard functionality to element\n*\n* @method handleFocus\n*/",
        "meta": {
            "range": [
                1066,
                1151
            ],
            "filename": "button.js",
            "lineno": 97,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle Focus - Add keyboard functionality to element</p>",
        "kind": "function",
        "name": "handleFocus",
        "longname": "handleFocus",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle KeyPress (document level) - Trigger click when keys are pressed\n*\n* @method handleKeyPress\n*/",
        "meta": {
            "range": [
                1164,
                1270
            ],
            "filename": "button.js",
            "lineno": 106,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle KeyPress (document level) - Trigger click when keys are pressed</p>",
        "kind": "function",
        "name": "handleKeyPress",
        "longname": "handleKeyPress",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle Blur - Remove keyboard triggers\n*\n* @method handleBlur\n*/",
        "meta": {
            "range": [
                1295,
                1365
            ],
            "filename": "button.js",
            "lineno": 119,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle Blur - Remove keyboard triggers</p>",
        "kind": "function",
        "name": "handleBlur",
        "longname": "handleBlur",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file component.js\n*\n*Player Component - Base class for all UI objects\n*/",
        "meta": {
            "range": [
                0,
                79
            ],
            "filename": "component.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "component.js",
        "kind": "file",
        "description": "<p>component.js</p>\n<p>Player Component - Base class for all UI objects</p>",
        "preserveName": true,
        "longname": "component.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Base UI Component class\n* Components are embeddable UI objects that are represented by both a\n* javascript object and an element in the DOM. They can be children of other\n* components, and can have many children themselves.\n* ```js\n*     // adding a button to the player\n*     var button = player.addChild('button');\n*     button.el(); // -> button element\n* ```\n* ```html\n*     <div class=\"video-js\">\n*       <div class=\"vjs-button\">Button</div>\n*     </div>\n* ```\n* Components are also event emitters.\n* ```js\n*     button.on('click', function(){\n*       console.log('Button Clicked!');\n*     });\n*     button.trigger('customevent');\n* ```\n*\n* @param {Object} player  Main Player\n* @param {Object=} options Object of option names and values\n* @param {Function=} ready    Ready callback function\n* @class Component\n*/",
        "meta": {
            "range": [
                116,
                940
            ],
            "filename": "component.js",
            "lineno": 18,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Base UI Component class\nComponents are embeddable UI objects that are represented by both a\njavascript object and an element in the DOM. They can be children of other\ncomponents, and can have many children themselves.</p>\n<pre class=\"prettyprint source lang-js\"><code>    // adding a button to the player\n    var button = player.addChild('button');\n    button.el(); // -> button element</code></pre><pre class=\"prettyprint source lang-html\"><code>    &lt;div class=&quot;video-js&quot;>\n      &lt;div class=&quot;vjs-button&quot;>Button&lt;/div>\n    &lt;/div></code></pre><p>Components are also event emitters.</p>\n<pre class=\"prettyprint source lang-js\"><code>    button.on('click', function(){\n      console.log('Button Clicked!');\n    });\n    button.trigger('customevent');</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Main Player</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "kind": "class",
        "name": "Component",
        "longname": "Component",
        "scope": "global"
    },
    {
        "comment": "/**\n* Dispose of the component and all child components\n*\n* @method dispose\n*/",
        "meta": {
            "range": [
                1124,
                1202
            ],
            "filename": "component.js",
            "lineno": 107,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Dispose of the component and all child components</p>",
        "kind": "function",
        "name": "dispose",
        "longname": "dispose",
        "scope": "global"
    },
    {
        "comment": "/**\n* Return the component's player\n*\n* @return {Player}\n* @method player\n*/",
        "meta": {
            "range": [
                1290,
                1366
            ],
            "filename": "component.js",
            "lineno": 141,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Return the component's player</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "player",
        "longname": "player",
        "scope": "global"
    },
    {
        "comment": "/**\n* Deep merge of options objects\n* Whenever a property is an object on both options objects\n* the two properties will be merged using mergeOptions.\n* This is used for merging options for child components. We\n* want it to be easy to override individual options on a child\n* component without having to rewrite all the other default options.\n* ```js\n*     Parent.prototype.options_ = {\n*       children: {\n*         'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },\n*         'childTwo': {},\n*         'childThree': {}\n*       }\n*     }\n*     newOptions = {\n*       children: {\n*         'childOne': { 'foo': 'baz', 'abc': '123' }\n*         'childTwo': null,\n*         'childFour': {}\n*       }\n*     }\n*\n*     this.options(newOptions);\n* ```\n* RESULT\n*```js\n*     {\n*       children: {\n*         'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },\n*         'childTwo': null, // Disabled. Won't be initialized.\n*         'childThree': {},\n*         'childFour': {}\n*       }\n*     }\n* ```\n*\n* @param  {Object} obj Object of new option values\n* @return {Object}     A NEW object of this.options_ and obj merged\n* @method options\n*/",
        "meta": {
            "range": [
                1379,
                2515
            ],
            "filename": "component.js",
            "lineno": 151,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Deep merge of options objects\nWhenever a property is an object on both options objects\nthe two properties will be merged using mergeOptions.\nThis is used for merging options for child components. We\nwant it to be easy to override individual options on a child\ncomponent without having to rewrite all the other default options.</p>\n<pre class=\"prettyprint source lang-js\"><code>    Parent.prototype.options_ = {\n      children: {\n        'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },\n        'childTwo': {},\n        'childThree': {}\n      }\n    }\n    newOptions = {\n      children: {\n        'childOne': { 'foo': 'baz', 'abc': '123' }\n        'childTwo': null,\n        'childFour': {}\n      }\n    }\n\n    this.options(newOptions);</code></pre><p>RESULT</p>\n<pre class=\"prettyprint source lang-js\"><code>    {\n      children: {\n        'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },\n        'childTwo': null, // Disabled. Won't be initialized.\n        'childThree': {},\n        'childFour': {}\n      }\n    }</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Object of new option values</p>",
                "name": "obj"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>A NEW object of this.options_ and obj merged</p>"
            }
        ],
        "kind": "function",
        "name": "options",
        "longname": "options",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the component's DOM element\n* ```js\n*     var domEl = myComponent.el();\n* ```\n*\n* @return {Element}\n* @method el\n*/",
        "meta": {
            "range": [
                2549,
                2674
            ],
            "filename": "component.js",
            "lineno": 203,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the component's DOM element</p>\n<pre class=\"prettyprint source lang-js\"><code>    var domEl = myComponent.el();</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "el",
        "longname": "el",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @param  {String=} tagName  Element's node type. e.g. 'div'\n* @param  {Object=} attributes An object of element attributes that should be set on the element\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                2687,
                2929
            ],
            "filename": "component.js",
            "lineno": 216,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Element's node type. e.g. 'div'</p>",
                "name": "tagName"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>An object of element attributes that should be set on the element</p>",
                "name": "attributes"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Return the component's DOM element where children are inserted.\n* Will either be the same as el() or a new element defined in createEl().\n*\n* @return {Element}\n* @method contentEl\n*/",
        "meta": {
            "range": [
                3014,
                3202
            ],
            "filename": "component.js",
            "lineno": 252,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Return the component's DOM element where children are inserted.\nWill either be the same as el() or a new element defined in createEl().</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "contentEl",
        "longname": "contentEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the component's ID\n* ```js\n*     var id = myComponent.id();\n* ```\n*\n* @return {String}\n* @method id\n*/",
        "meta": {
            "range": [
                3215,
                3327
            ],
            "filename": "component.js",
            "lineno": 263,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the component's ID</p>\n<pre class=\"prettyprint source lang-js\"><code>    var id = myComponent.id();</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "id",
        "longname": "id",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the component's name. The name is often used to reference the component.\n* ```js\n*     var name = myComponent.name();\n* ```\n*\n* @return {String}\n* @method name\n*/",
        "meta": {
            "range": [
                3340,
                3512
            ],
            "filename": "component.js",
            "lineno": 276,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the component's name. The name is often used to reference the component.</p>\n<pre class=\"prettyprint source lang-js\"><code>    var name = myComponent.name();</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "name",
        "longname": "name",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get an array of all child components\n* ```js\n*     var kids = myComponent.children();\n* ```\n*\n* @return {Array} The children\n* @method children\n*/",
        "meta": {
            "range": [
                3525,
                3677
            ],
            "filename": "component.js",
            "lineno": 289,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get an array of all child components</p>\n<pre class=\"prettyprint source lang-js\"><code>    var kids = myComponent.children();</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>The children</p>"
            }
        ],
        "kind": "function",
        "name": "children",
        "longname": "children",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns a child component with the provided ID\n*\n* @return {Component}\n* @method getChildById\n*/",
        "meta": {
            "range": [
                3690,
                3792
            ],
            "filename": "component.js",
            "lineno": 302,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Returns a child component with the provided ID</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "getChildById",
        "longname": "getChildById",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns a child component with the provided name\n*\n* @return {Component}\n* @method getChild\n*/",
        "meta": {
            "range": [
                3805,
                3905
            ],
            "filename": "component.js",
            "lineno": 312,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Returns a child component with the provided name</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "getChild",
        "longname": "getChild",
        "scope": "global"
    },
    {
        "comment": "/**\n* Adds a child component inside this component\n* ```js\n*     myComponent.el();\n*     // -> <div class='my-component'></div>\n*     myComponent.children();\n*     // [empty array]\n*\n*     var myButton = myComponent.addChild('MyButton');\n*     // -> <div class='my-component'><div class=\"my-button\">myButton<div></div>\n*     // -> myButton === myComonent.children()[0];\n* ```\n* Pass in options for child constructors and options for children of the child\n* ```js\n*     var myButton = myComponent.addChild('MyButton', {\n*       text: 'Press Me',\n*       children: {\n*         buttonChildExample: {\n*           buttonChildOption: true\n*         }\n*       }\n*     });\n* ```\n*\n* @param {String|Component} child The class name or instance of a child to add\n* @param {Object=} options Options, including options to be passed to children of the child.\n* @return {Component} The child component (created by this process if a string was used)\n* @method addChild\n*/",
        "meta": {
            "range": [
                3918,
                4873
            ],
            "filename": "component.js",
            "lineno": 322,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Adds a child component inside this component</p>\n<pre class=\"prettyprint source lang-js\"><code>    myComponent.el();\n    // -> &lt;div class='my-component'>&lt;/div>\n    myComponent.children();\n    // [empty array]\n\n    var myButton = myComponent.addChild('MyButton');\n    // -> &lt;div class='my-component'>&lt;div class=&quot;my-button&quot;>myButton&lt;div>&lt;/div>\n    // -> myButton === myComonent.children()[0];</code></pre><p>Pass in options for child constructors and options for children of the child</p>\n<pre class=\"prettyprint source lang-js\"><code>    var myButton = myComponent.addChild('MyButton', {\n      text: 'Press Me',\n      children: {\n        buttonChildExample: {\n          buttonChildOption: true\n        }\n      }\n    });</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "String",
                        "Component"
                    ]
                },
                "description": "<p>The class name or instance of a child to add</p>",
                "name": "child"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Options, including options to be passed to children of the child.</p>",
                "name": "options"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>The child component (created by this process if a string was used)</p>"
            }
        ],
        "kind": "function",
        "name": "addChild",
        "longname": "addChild",
        "scope": "global"
    },
    {
        "comment": "/**\n* Remove a child component from this component's list of children, and the\n* child component's element from this component's element\n*\n* @param  {Component} component Component to remove\n* @method removeChild\n*/",
        "meta": {
            "range": [
                5057,
                5272
            ],
            "filename": "component.js",
            "lineno": 412,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Remove a child component from this component's list of children, and the\nchild component's element from this component's element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>Component to remove</p>",
                "name": "component"
            }
        ],
        "kind": "function",
        "name": "removeChild",
        "longname": "removeChild",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add and initialize default child components from options\n* ```js\n*     // when an instance of MyComponent is created, all children in options\n*     // will be added to the instance by their name strings and options\n*     MyComponent.prototype.options_.children = {\n*       myChildComponent: {\n*         myChildOption: true\n*       }\n*     }\n* ```\n*     // Or when creating the component\n* ```js\n*     var myComp = new MyComponent(player, {\n*       children: {\n*         myChildComponent: {\n*           myChildOption: true\n*         }\n*       }\n*     });\n* ```\n* The children option can also be an Array of child names or\n* child options objects (that also include a 'name' key).\n* ```js\n*     var myComp = new MyComponent(player, {\n*       children: [\n*         'button',\n*         {\n*           name: 'button',\n*           someOtherOption: true\n*         }\n*       ]\n*     });\n* ```\n*\n* @method initChildren\n*/",
        "meta": {
            "range": [
                5372,
                6289
            ],
            "filename": "component.js",
            "lineno": 452,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Add and initialize default child components from options</p>\n<pre class=\"prettyprint source lang-js\"><code>    // when an instance of MyComponent is created, all children in options\n    // will be added to the instance by their name strings and options\n    MyComponent.prototype.options_.children = {\n      myChildComponent: {\n        myChildOption: true\n      }\n    }</code></pre><pre class=\"prettyprint source\"><code>// Or when creating the component</code></pre><pre class=\"prettyprint source lang-js\"><code>    var myComp = new MyComponent(player, {\n      children: {\n        myChildComponent: {\n          myChildOption: true\n        }\n      }\n    });</code></pre><p>The children option can also be an Array of child names or\nchild options objects (that also include a 'name' key).</p>\n<pre class=\"prettyprint source lang-js\"><code>    var myComp = new MyComponent(player, {\n      children: [\n        'button',\n        {\n          name: 'button',\n          someOtherOption: true\n        }\n      ]\n    });</code></pre>",
        "kind": "function",
        "name": "initChildren",
        "longname": "initChildren",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allows sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                6467,
                6594
            ],
            "filename": "component.js",
            "lineno": 548,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Allows sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add an event listener to this component's element\n* ```js\n*     var myFunc = function(){\n*       var myComponent = this;\n*       // Do something when the event is fired\n*     };\n*\n*     myComponent.on('eventType', myFunc);\n* ```\n* The context of myFunc will be myComponent unless previously bound.\n* Alternatively, you can add a listener to another element or component.\n* ```js\n*     myComponent.on(otherElement, 'eventName', myFunc);\n*     myComponent.on(otherComponent, 'eventName', myFunc);\n* ```\n* The benefit of using this over `VjsEvents.on(otherElement, 'eventName', myFunc)`\n* and `otherComponent.on('eventName', myFunc)` is that this way the listeners\n* will be automatically cleaned up when either component is disposed.\n* It will also bind myComponent as the context of myFunc.\n* **NOTE**: When using this on elements in the page other than window\n* and document (both permanent), if you remove the element from the DOM\n* you need to call `myComponent.trigger(el, 'dispose')` on it to clean up\n* references to it and allow the browser to garbage collect it.\n*\n* @param  {String|Component} first   The event type or other component\n* @param  {Function|String}      second  The event handler or event type\n* @param  {Function}             third   The event handler\n* @return {Component} \n* @method on\n*/",
        "meta": {
            "range": [
                6613,
                7932
            ],
            "filename": "component.js",
            "lineno": 560,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Add an event listener to this component's element</p>\n<pre class=\"prettyprint source lang-js\"><code>    var myFunc = function(){\n      var myComponent = this;\n      // Do something when the event is fired\n    };\n\n    myComponent.on('eventType', myFunc);</code></pre><p>The context of myFunc will be myComponent unless previously bound.\nAlternatively, you can add a listener to another element or component.</p>\n<pre class=\"prettyprint source lang-js\"><code>    myComponent.on(otherElement, 'eventName', myFunc);\n    myComponent.on(otherComponent, 'eventName', myFunc);</code></pre><p>The benefit of using this over <code>VjsEvents.on(otherElement, 'eventName', myFunc)</code>\nand <code>otherComponent.on('eventName', myFunc)</code> is that this way the listeners\nwill be automatically cleaned up when either component is disposed.\nIt will also bind myComponent as the context of myFunc.\n<strong>NOTE</strong>: When using this on elements in the page other than window\nand document (both permanent), if you remove the element from the DOM\nyou need to call <code>myComponent.trigger(el, 'dispose')</code> on it to clean up\nreferences to it and allow the browser to garbage collect it.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String",
                        "Component"
                    ]
                },
                "description": "<p>The event type or other component</p>",
                "name": "first"
            },
            {
                "type": {
                    "names": [
                        "function",
                        "String"
                    ]
                },
                "description": "<p>The event handler or event type</p>",
                "name": "second"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>The event handler</p>",
                "name": "third"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "on",
        "longname": "on",
        "scope": "global"
    },
    {
        "comment": "/**\n* Remove an event listener from this component's element\n* ```js\n*     myComponent.off('eventType', myFunc);\n* ```\n* If myFunc is excluded, ALL listeners for the event type will be removed.\n* If eventType is excluded, ALL listeners will be removed from the component.\n* Alternatively you can use `off` to remove listeners that were added to other\n* elements or components using `myComponent.on(otherComponent...`.\n* In this case both the event type and listener function are REQUIRED.\n* ```js\n*     myComponent.off(otherElement, 'eventType', myFunc);\n*     myComponent.off(otherComponent, 'eventType', myFunc);\n* ```\n*\n* @param  {String=|Component}  first  The event type or other component\n* @param  {Function=|String}       second The listener function or event type\n* @param  {Function=}              third  The listener for other component\n* @return {Component}\n* @method off\n*/",
        "meta": {
            "range": [
                8065,
                8951
            ],
            "filename": "component.js",
            "lineno": 635,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Remove an event listener from this component's element</p>\n<pre class=\"prettyprint source lang-js\"><code>    myComponent.off('eventType', myFunc);</code></pre><p>If myFunc is excluded, ALL listeners for the event type will be removed.\nIf eventType is excluded, ALL listeners will be removed from the component.\nAlternatively you can use <code>off</code> to remove listeners that were added to other\nelements or components using <code>myComponent.on(otherComponent...</code>.\nIn this case both the event type and listener function are REQUIRED.</p>\n<pre class=\"prettyprint source lang-js\"><code>    myComponent.off(otherElement, 'eventType', myFunc);\n    myComponent.off(otherComponent, 'eventType', myFunc);</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "String",
                        "Component"
                    ]
                },
                "description": "<p>The event type or other component</p>",
                "name": "first"
            },
            {
                "type": {
                    "names": [
                        "function",
                        "String"
                    ]
                },
                "description": "<p>The listener function or event type</p>",
                "name": "second"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>The listener for other component</p>",
                "name": "third"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "off",
        "longname": "off",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add an event listener to be triggered only once and then removed\n* ```js\n*     myComponent.one('eventName', myFunc);\n* ```\n* Alternatively you can add a listener to another element or component\n* that will be triggered only once.\n* ```js\n*     myComponent.one(otherElement, 'eventName', myFunc);\n*     myComponent.one(otherComponent, 'eventName', myFunc);\n* ```\n*\n* @param  {String|Component}  first   The event type or other component\n* @param  {Function|String}       second  The listener function or event type\n* @param  {Function=}             third   The listener function for other component\n* @return {Component}\n* @method one\n*/",
        "meta": {
            "range": [
                9033,
                9675
            ],
            "filename": "component.js",
            "lineno": 683,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Add an event listener to be triggered only once and then removed</p>\n<pre class=\"prettyprint source lang-js\"><code>    myComponent.one('eventName', myFunc);</code></pre><p>Alternatively you can add a listener to another element or component\nthat will be triggered only once.</p>\n<pre class=\"prettyprint source lang-js\"><code>    myComponent.one(otherElement, 'eventName', myFunc);\n    myComponent.one(otherComponent, 'eventName', myFunc);</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "String",
                        "Component"
                    ]
                },
                "description": "<p>The event type or other component</p>",
                "name": "first"
            },
            {
                "type": {
                    "names": [
                        "function",
                        "String"
                    ]
                },
                "description": "<p>The listener function or event type</p>",
                "name": "second"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>The listener function for other component</p>",
                "name": "third"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "one",
        "longname": "one",
        "scope": "global"
    },
    {
        "comment": "/**\n* Trigger an event on an element\n* ```js\n*     myComponent.trigger('eventName');\n*     myComponent.trigger({'type':'eventName'});\n*     myComponent.trigger('eventName', {data: 'some data'});\n*     myComponent.trigger({'type':'eventName'}, {data: 'some data'});\n* ```\n*\n* @param  {Event|Object|String} event  A string (the type) or an event object with a type attribute\n* @param  {Object} [hash] data hash to pass along with the event\n* @return {Component}       self\n* @method trigger\n*/",
        "meta": {
            "range": [
                9742,
                10233
            ],
            "filename": "component.js",
            "lineno": 723,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Trigger an event on an element</p>\n<pre class=\"prettyprint source lang-js\"><code>    myComponent.trigger('eventName');\n    myComponent.trigger({'type':'eventName'});\n    myComponent.trigger('eventName', {data: 'some data'});\n    myComponent.trigger({'type':'eventName'}, {data: 'some data'});</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "Event",
                        "Object",
                        "String"
                    ]
                },
                "description": "<p>A string (the type) or an event object with a type attribute</p>",
                "name": "event"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>data hash to pass along with the event</p>",
                "name": "hash"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>self</p>"
            }
        ],
        "kind": "function",
        "name": "trigger",
        "longname": "trigger",
        "scope": "global"
    },
    {
        "comment": "/**\n* Bind a listener to the component's ready state.\n* Different from event listeners in that if the ready event has already happened\n* it will trigger the function immediately.\n*\n* @param  {Function} fn Ready listener\n* @return {Component}\n* @method ready\n*/",
        "meta": {
            "range": [
                10249,
                10509
            ],
            "filename": "component.js",
            "lineno": 742,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Bind a listener to the component's ready state.\nDifferent from event listeners in that if the ready event has already happened\nit will trigger the function immediately.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>Ready listener</p>",
                "name": "fn"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "ready",
        "longname": "ready",
        "scope": "global"
    },
    {
        "comment": "/**\n* Trigger the ready listeners\n*\n* @return {Component}\n* @method triggerReady\n*/",
        "meta": {
            "range": [
                10549,
                10632
            ],
            "filename": "component.js",
            "lineno": 764,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Trigger the ready listeners</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "triggerReady",
        "longname": "triggerReady",
        "scope": "global"
    },
    {
        "comment": "/**\n* Check if a component's element has a CSS class name\n*\n* @param {String} classToCheck Classname to check\n* @return {Component}\n* @method hasClass\n*/",
        "meta": {
            "range": [
                10696,
                10849
            ],
            "filename": "component.js",
            "lineno": 791,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Check if a component's element has a CSS class name</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Classname to check</p>",
                "name": "classToCheck"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "hasClass",
        "longname": "hasClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add a CSS class name to the component's element\n*\n* @param {String} classToAdd Classname to add\n* @return {Component}\n* @method addClass\n*/",
        "meta": {
            "range": [
                10862,
                11007
            ],
            "filename": "component.js",
            "lineno": 802,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Add a CSS class name to the component's element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Classname to add</p>",
                "name": "classToAdd"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "addClass",
        "longname": "addClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Remove and return a CSS class name from the component's element\n*\n* @param {String} classToRemove Classname to remove\n* @return {Component}\n* @method removeClass\n*/",
        "meta": {
            "range": [
                11023,
                11193
            ],
            "filename": "component.js",
            "lineno": 814,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Remove and return a CSS class name from the component's element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Classname to remove</p>",
                "name": "classToRemove"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "removeClass",
        "longname": "removeClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Show the component element if hidden\n*\n* @return {Component}\n* @method show\n*/",
        "meta": {
            "range": [
                11209,
                11293
            ],
            "filename": "component.js",
            "lineno": 826,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Show the component element if hidden</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "show",
        "longname": "show",
        "scope": "global"
    },
    {
        "comment": "/**\n* Hide the component element if currently showing\n*\n* @return {Component}\n* @method hide\n*/",
        "meta": {
            "range": [
                11309,
                11404
            ],
            "filename": "component.js",
            "lineno": 837,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Hide the component element if currently showing</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "hide",
        "longname": "hide",
        "scope": "global"
    },
    {
        "comment": "/**\n* Lock an item in its visible state\n* To be used with fadeIn/fadeOut.\n*\n* @return {Component}\n* @private\n* @method lockShowing\n*/",
        "meta": {
            "range": [
                11420,
                11553
            ],
            "filename": "component.js",
            "lineno": 848,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Lock an item in its visible state\nTo be used with fadeIn/fadeOut.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "lockShowing",
        "longname": "lockShowing",
        "scope": "global"
    },
    {
        "comment": "/**\n* Unlock an item to be hidden\n* To be used with fadeIn/fadeOut.\n*\n* @return {Component}\n* @private\n* @method unlockShowing\n*/",
        "meta": {
            "range": [
                11569,
                11698
            ],
            "filename": "component.js",
            "lineno": 861,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Unlock an item to be hidden\nTo be used with fadeIn/fadeOut.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "unlockShowing",
        "longname": "unlockShowing",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set or get the width of the component (CSS values)\n* Setting the video tag dimension values only works with values in pixels.\n* Percent values will not work.\n* Some percents can be used, but width()/height() will return the number + %,\n* not the actual computed width/height.\n*\n* @param  {Number|String=} num   Optional width number\n* @param  {Boolean} skipListeners Skip the 'resize' event trigger\n* @return {Component} This component, when setting the width\n* @return {Number|String} The width, when getting\n* @method width\n*/",
        "meta": {
            "range": [
                11714,
                12248
            ],
            "filename": "component.js",
            "lineno": 874,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Set or get the width of the component (CSS values)\nSetting the video tag dimension values only works with values in pixels.\nPercent values will not work.\nSome percents can be used, but width()/height() will return the number + %,\nnot the actual computed width/height.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number",
                        "String"
                    ]
                },
                "description": "<p>Optional width number</p>",
                "name": "num"
            },
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Skip the 'resize' event trigger</p>",
                "name": "skipListeners"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>This component, when setting the width</p>"
            },
            {
                "type": {
                    "names": [
                        "Number",
                        "String"
                    ]
                },
                "description": "<p>The width, when getting</p>"
            }
        ],
        "kind": "function",
        "name": "width",
        "longname": "width",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get or set the height of the component (CSS values)\n* Setting the video tag dimension values only works with values in pixels.\n* Percent values will not work.\n* Some percents can be used, but width()/height() will return the number + %,\n* not the actual computed width/height.\n*\n* @param  {Number|String=} num     New component height\n* @param  {Boolean=} skipListeners Skip the resize event trigger\n* @return {Component} This component, when setting the height\n* @return {Number|String} The height, when getting\n* @method height\n*/",
        "meta": {
            "range": [
                12261,
                12799
            ],
            "filename": "component.js",
            "lineno": 891,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get or set the height of the component (CSS values)\nSetting the video tag dimension values only works with values in pixels.\nPercent values will not work.\nSome percents can be used, but width()/height() will return the number + %,\nnot the actual computed width/height.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number",
                        "String"
                    ]
                },
                "description": "<p>New component height</p>",
                "name": "num"
            },
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "optional": true,
                "description": "<p>Skip the resize event trigger</p>",
                "name": "skipListeners"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>This component, when setting the height</p>"
            },
            {
                "type": {
                    "names": [
                        "Number",
                        "String"
                    ]
                },
                "description": "<p>The height, when getting</p>"
            }
        ],
        "kind": "function",
        "name": "height",
        "longname": "height",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set both width and height at the same time\n*\n* @param  {Number|String} width Width of player\n* @param  {Number|String} height Height of player\n* @return {Component} The component\n* @method dimensions\n*/",
        "meta": {
            "range": [
                12812,
                13020
            ],
            "filename": "component.js",
            "lineno": 908,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Set both width and height at the same time</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number",
                        "String"
                    ]
                },
                "description": "<p>Width of player</p>",
                "name": "width"
            },
            {
                "type": {
                    "names": [
                        "Number",
                        "String"
                    ]
                },
                "description": "<p>Height of player</p>",
                "name": "height"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>The component</p>"
            }
        ],
        "kind": "function",
        "name": "dimensions",
        "longname": "dimensions",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get or set width or height\n* This is the shared code for the width() and height() methods.\n* All for an integer, integer + 'px' or integer + '%';\n* Known issue: Hidden elements officially have a width of 0. We're defaulting\n* to the style.width value and falling back to computedStyle which has the\n* hidden element issue. Info, but probably not an efficient fix:\n* http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/\n*\n* @param  {String} widthOrHeight  'width' or 'height'\n* @param  {Number|String=} num     New dimension\n* @param  {Boolean=} skipListeners Skip resize event trigger\n* @return {Component} The component if a dimension was set\n* @return {Number|String} The dimension if nothing was set\n* @private\n* @method dimension\n*/",
        "meta": {
            "range": [
                13036,
                13820
            ],
            "filename": "component.js",
            "lineno": 921,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get or set width or height\nThis is the shared code for the width() and height() methods.\nAll for an integer, integer + 'px' or integer + '%';\nKnown issue: Hidden elements officially have a width of 0. We're defaulting\nto the style.width value and falling back to computedStyle which has the\nhidden element issue. Info, but probably not an efficient fix:\nhttp://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>'width' or 'height'</p>",
                "name": "widthOrHeight"
            },
            {
                "type": {
                    "names": [
                        "Number",
                        "String"
                    ]
                },
                "description": "<p>New dimension</p>",
                "name": "num"
            },
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "optional": true,
                "description": "<p>Skip resize event trigger</p>",
                "name": "skipListeners"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>The component if a dimension was set</p>"
            },
            {
                "type": {
                    "names": [
                        "Number",
                        "String"
                    ]
                },
                "description": "<p>The dimension if nothing was set</p>"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "dimension",
        "longname": "dimension",
        "scope": "global"
    },
    {
        "comment": "/**\n* Emit 'tap' events when touch events are supported\n* This is used to support toggling the controls through a tap on the video.\n* We're requiring them to be enabled because otherwise every component would\n* have this extra overhead unnecessarily, on mobile devices where extra\n* overhead is especially bad.\n*\n* @private\n* @method emitTapEvents\n*/",
        "meta": {
            "range": [
                13959,
                14309
            ],
            "filename": "component.js",
            "lineno": 984,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Emit 'tap' events when touch events are supported\nThis is used to support toggling the controls through a tap on the video.\nWe're requiring them to be enabled because otherwise every component would\nhave this extra overhead unnecessarily, on mobile devices where extra\noverhead is especially bad.</p>",
        "access": "private",
        "kind": "function",
        "name": "emitTapEvents",
        "longname": "emitTapEvents",
        "scope": "global"
    },
    {
        "comment": "/**\n* Report user touch activity when touch events occur\n* User activity is used to determine when controls should show/hide. It's\n* relatively simple when it comes to mouse events, because any mouse event\n* should show the controls. So we capture mouse events that bubble up to the\n* player and report activity when that happens.\n* With touch events it isn't as easy. We can't rely on touch events at the\n* player level, because a tap (touchstart + touchend) on the video itself on\n* mobile devices is meant to turn controls off (and on). User activity is\n* checked asynchronously, so what could happen is a tap event on the video\n* turns the controls off, then the touchend event bubbles up to the player,\n* which if it reported user activity, would turn the controls right back on.\n* (We also don't want to completely block touch events from bubbling up)\n* Also a touchmove, touch+hold, and anything other than a tap is not supposed\n* to turn the controls back on on a mobile device.\n* Here we're setting the default component behavior to report user activity\n* whenever touch events happen, and this can be turned off by components that\n* want touch events to act differently.\n*\n* @method enableTouchActivity\n*/",
        "meta": {
            "range": [
                14529,
                15744
            ],
            "filename": "component.js",
            "lineno": 1067,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Report user touch activity when touch events occur\nUser activity is used to determine when controls should show/hide. It's\nrelatively simple when it comes to mouse events, because any mouse event\nshould show the controls. So we capture mouse events that bubble up to the\nplayer and report activity when that happens.\nWith touch events it isn't as easy. We can't rely on touch events at the\nplayer level, because a tap (touchstart + touchend) on the video itself on\nmobile devices is meant to turn controls off (and on). User activity is\nchecked asynchronously, so what could happen is a tap event on the video\nturns the controls off, then the touchend event bubbles up to the player,\nwhich if it reported user activity, would turn the controls right back on.\n(We also don't want to completely block touch events from bubbling up)\nAlso a touchmove, touch+hold, and anything other than a tap is not supposed\nto turn the controls back on on a mobile device.\nHere we're setting the default component behavior to report user activity\nwhenever touch events happen, and this can be turned off by components that\nwant touch events to act differently.</p>",
        "kind": "function",
        "name": "enableTouchActivity",
        "longname": "enableTouchActivity",
        "scope": "global"
    },
    {
        "comment": "/**\n* Creates timeout and sets up disposal automatically.\n*\n* @param {Function} fn The function to run after the timeout.\n* @param {Number} timeout Number of ms to delay before executing specified function.\n* @return {Number} Returns the timeout ID\n* @method setTimeout\n*/",
        "meta": {
            "range": [
                15841,
                16113
            ],
            "filename": "component.js",
            "lineno": 1120,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Creates timeout and sets up disposal automatically.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>The function to run after the timeout.</p>",
                "name": "fn"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Number of ms to delay before executing specified function.</p>",
                "name": "timeout"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Returns the timeout ID</p>"
            }
        ],
        "kind": "function",
        "name": "setTimeout",
        "longname": "setTimeout",
        "scope": "global"
    },
    {
        "comment": "/**\n* Clears a timeout and removes the associated dispose listener\n*\n* @param {Number} timeoutId The id of the timeout to clear\n* @return {Number} Returns the timeout ID\n* @method clearTimeout\n*/",
        "meta": {
            "range": [
                16165,
                16360
            ],
            "filename": "component.js",
            "lineno": 1145,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Clears a timeout and removes the associated dispose listener</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>The id of the timeout to clear</p>",
                "name": "timeoutId"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Returns the timeout ID</p>"
            }
        ],
        "kind": "function",
        "name": "clearTimeout",
        "longname": "clearTimeout",
        "scope": "global"
    },
    {
        "comment": "/**\n* Creates an interval and sets up disposal automatically.\n*\n* @param {Function} fn The function to run every N seconds.\n* @param {Number} interval Number of ms to delay before executing specified function.\n* @return {Number} Returns the interval ID\n* @method setInterval\n*/",
        "meta": {
            "range": [
                16397,
                16674
            ],
            "filename": "component.js",
            "lineno": 1164,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Creates an interval and sets up disposal automatically.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>The function to run every N seconds.</p>",
                "name": "fn"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Number of ms to delay before executing specified function.</p>",
                "name": "interval"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Returns the interval ID</p>"
            }
        ],
        "kind": "function",
        "name": "setInterval",
        "longname": "setInterval",
        "scope": "global"
    },
    {
        "comment": "/**\n* Clears an interval and removes the associated dispose listener\n*\n* @param {Number} intervalId The id of the interval to clear\n* @return {Number} Returns the interval ID\n* @method clearInterval\n*/",
        "meta": {
            "range": [
                16723,
                16924
            ],
            "filename": "component.js",
            "lineno": 1188,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Clears an interval and removes the associated dispose listener</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>The id of the interval to clear</p>",
                "name": "intervalId"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Returns the interval ID</p>"
            }
        ],
        "kind": "function",
        "name": "clearInterval",
        "longname": "clearInterval",
        "scope": "global"
    },
    {
        "comment": "/**\n* Registers a component\n*\n* @param {String} name Name of the component to register\n* @param {Object} comp The component to register  \n* @static\n* @method registerComponent\n*/",
        "meta": {
            "range": [
                16961,
                17139
            ],
            "filename": "component.js",
            "lineno": 1207,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Registers a component</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Name of the component to register</p>",
                "name": "name"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The component to register</p>",
                "name": "comp"
            }
        ],
        "scope": "static",
        "kind": "function",
        "name": "registerComponent",
        "longname": "registerComponent"
    },
    {
        "comment": "/**\n* Gets a component by name\n*\n* @param {String} name Name of the component to get\n* @return {Component}\n* @static\n* @method getComponent\n*/",
        "meta": {
            "range": [
                17167,
                17309
            ],
            "filename": "component.js",
            "lineno": 1224,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Gets a component by name</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Name of the component to get</p>",
                "name": "name"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "scope": "static",
        "kind": "function",
        "name": "getComponent",
        "longname": "getComponent"
    },
    {
        "comment": "/**\n* Sets up the constructor using the supplied init method\n* or uses the init of the parent object\n*\n* @param {Object} props An object of properties  \n* @static\n* @method extend\n*/",
        "meta": {
            "range": [
                17343,
                17525
            ],
            "filename": "component.js",
            "lineno": 1243,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Sets up the constructor using the supplied init method\nor uses the init of the parent object</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>An object of properties</p>",
                "name": "props"
            }
        ],
        "scope": "static",
        "kind": "function",
        "name": "extend",
        "longname": "extend"
    },
    {
        "comment": "/**\n* @file control-bar.js\n*/",
        "meta": {
            "range": [
                0,
                29
            ],
            "filename": "control-bar.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "name": "control-bar/control-bar.js",
        "kind": "file",
        "description": "<p>control-bar.js</p>",
        "preserveName": true,
        "longname": "control-bar/control-bar.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Container of main controls\n*\n* @extends Component\n* @class ControlBar\n*/",
        "meta": {
            "range": [
                90,
                168
            ],
            "filename": "control-bar.js",
            "lineno": 24,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Container of main controls</p>",
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "ControlBar",
        "longname": "ControlBar",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                175,
                259
            ],
            "filename": "control-bar.js",
            "lineno": 32,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file fullscreen-toggle.js\n*/",
        "meta": {
            "range": [
                0,
                35
            ],
            "filename": "fullscreen-toggle.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "name": "control-bar/fullscreen-toggle.js",
        "kind": "file",
        "description": "<p>fullscreen-toggle.js</p>",
        "preserveName": true,
        "longname": "control-bar/fullscreen-toggle.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Toggle fullscreen video\n*\n* @extends Button\n* @class FullscreenToggle\n*/",
        "meta": {
            "range": [
                45,
                123
            ],
            "filename": "fullscreen-toggle.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Toggle fullscreen video</p>",
        "augments": [
            "Button"
        ],
        "kind": "class",
        "name": "FullscreenToggle",
        "longname": "FullscreenToggle",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                130,
                256
            ],
            "filename": "fullscreen-toggle.js",
            "lineno": 15,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handles click for full screen\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                269,
                331
            ],
            "filename": "fullscreen-toggle.js",
            "lineno": 25,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Handles click for full screen</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file live-display.js\n*/",
        "meta": {
            "range": [
                0,
                30
            ],
            "filename": "live-display.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "name": "control-bar/live-display.js",
        "kind": "file",
        "description": "<p>live-display.js</p>",
        "preserveName": true,
        "longname": "control-bar/live-display.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Displays the live indicator\n* TODO - Future make it click to snap to live\n* \n* @extends Component\n* @class LiveDisplay\n*/",
        "meta": {
            "range": [
                40,
                167
            ],
            "filename": "live-display.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Displays the live indicator\nTODO - Future make it click to snap to live</p>",
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "LiveDisplay",
        "longname": "LiveDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                174,
                258
            ],
            "filename": "live-display.js",
            "lineno": 16,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file mute-toggle.js\n*/",
        "meta": {
            "range": [
                0,
                29
            ],
            "filename": "mute-toggle.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "name": "control-bar/mute-toggle.js",
        "kind": "file",
        "description": "<p>mute-toggle.js</p>",
        "preserveName": true,
        "longname": "control-bar/mute-toggle.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* A button component for muting the audio\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Button\n* @class MuteToggle\n*/",
        "meta": {
            "range": [
                42,
                189
            ],
            "filename": "mute-toggle.js",
            "lineno": 8,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>A button component for muting the audio</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Button"
        ],
        "kind": "class",
        "name": "MuteToggle",
        "longname": "MuteToggle",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                253,
                379
            ],
            "filename": "mute-toggle.js",
            "lineno": 37,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle click on mute\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                392,
                445
            ],
            "filename": "mute-toggle.js",
            "lineno": 47,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Handle click on mute</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update volume\n*\n* @method update\n*/",
        "meta": {
            "range": [
                458,
                499
            ],
            "filename": "mute-toggle.js",
            "lineno": 56,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Update volume</p>",
        "kind": "function",
        "name": "update",
        "longname": "update",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file play-toggle.js\n*/",
        "meta": {
            "range": [
                0,
                29
            ],
            "filename": "play-toggle.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "name": "control-bar/play-toggle.js",
        "kind": "file",
        "description": "<p>play-toggle.js</p>",
        "preserveName": true,
        "longname": "control-bar/play-toggle.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Button to toggle between play and pause\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Button\n* @class PlayToggle\n*/",
        "meta": {
            "range": [
                39,
                186
            ],
            "filename": "play-toggle.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Button to toggle between play and pause</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Button"
        ],
        "kind": "class",
        "name": "PlayToggle",
        "longname": "PlayToggle",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                214,
                340
            ],
            "filename": "play-toggle.js",
            "lineno": 24,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle click to toggle between play and pause\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                353,
                431
            ],
            "filename": "play-toggle.js",
            "lineno": 34,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Handle click to toggle between play and pause</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add the vjs-playing class to the element so it can change appearance\n*\n* @method handlePlay\n*/",
        "meta": {
            "range": [
                456,
                556
            ],
            "filename": "play-toggle.js",
            "lineno": 47,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Add the vjs-playing class to the element so it can change appearance</p>",
        "kind": "function",
        "name": "handlePlay",
        "longname": "handlePlay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add the vjs-paused class to the element so it can change appearance\n*\n* @method handlePause\n*/",
        "meta": {
            "range": [
                575,
                675
            ],
            "filename": "play-toggle.js",
            "lineno": 58,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Add the vjs-paused class to the element so it can change appearance</p>",
        "kind": "function",
        "name": "handlePause",
        "longname": "handlePause",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file playback-rate-menu-button.js\n*/",
        "meta": {
            "range": [
                0,
                43
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "name": "control-bar/playback-rate-menu/playback-rate-menu-button.js",
        "kind": "file",
        "description": "<p>playback-rate-menu-button.js</p>",
        "preserveName": true,
        "longname": "control-bar/playback-rate-menu/playback-rate-menu-button.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The component for controlling the playback rate\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends MenuButton\n* @class PlaybackRateMenuButton\n*/",
        "meta": {
            "range": [
                62,
                233
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 10,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>The component for controlling the playback rate</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "MenuButton"
        ],
        "kind": "class",
        "name": "PlaybackRateMenuButton",
        "longname": "PlaybackRateMenuButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                270,
                354
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 30,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                394,
                520
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 49,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the playback rate menu\n*\n* @return {Menu} Menu object populated with items\n* @method createMenu\n*/",
        "meta": {
            "range": [
                533,
                644
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 59,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Create the playback rate menu</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Menu"
                    ]
                },
                "description": "<p>Menu object populated with items</p>"
            }
        ],
        "kind": "function",
        "name": "createMenu",
        "longname": "createMenu",
        "scope": "global"
    },
    {
        "comment": "/**\n* Updates ARIA accessibility attributes\n*\n* @method updateARIAAttributes\n*/",
        "meta": {
            "range": [
                690,
                769
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 80,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Updates ARIA accessibility attributes</p>",
        "kind": "function",
        "name": "updateARIAAttributes",
        "longname": "updateARIAAttributes",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle menu item click\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                785,
                840
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 90,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Handle menu item click</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get possible playback rates\n*\n* @return {Array} Possible playback rates\n* @method playbackRates\n*/",
        "meta": {
            "range": [
                889,
                993
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 111,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Get possible playback rates</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>Possible playback rates</p>"
            }
        ],
        "kind": "function",
        "name": "playbackRates",
        "longname": "playbackRates",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get supported playback rates\n*\n* @return {Array} Supported playback rates\n* @method playbackRateSupported\n*/",
        "meta": {
            "range": [
                1006,
                1120
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 121,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Get supported playback rates</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>Supported playback rates</p>"
            }
        ],
        "kind": "function",
        "name": "playbackRateSupported",
        "longname": "playbackRateSupported",
        "scope": "global"
    },
    {
        "comment": "/**\n* Hide playback rate controls when they're no playback rate options to select\n*\n* @method updateVisibility\n*/",
        "meta": {
            "range": [
                1145,
                1258
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 135,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Hide playback rate controls when they're no playback rate options to select</p>",
        "kind": "function",
        "name": "updateVisibility",
        "longname": "updateVisibility",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update button label when rate changed\n*\n* @method updateLabel\n*/",
        "meta": {
            "range": [
                1283,
                1353
            ],
            "filename": "playback-rate-menu-button.js",
            "lineno": 148,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Update button label when rate changed</p>",
        "kind": "function",
        "name": "updateLabel",
        "longname": "updateLabel",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file playback-rate-menu-item.js\n*/",
        "meta": {
            "range": [
                0,
                41
            ],
            "filename": "playback-rate-menu-item.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "name": "control-bar/playback-rate-menu/playback-rate-menu-item.js",
        "kind": "file",
        "description": "<p>playback-rate-menu-item.js</p>",
        "preserveName": true,
        "longname": "control-bar/playback-rate-menu/playback-rate-menu-item.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The specific menu item type for selecting a playback rate\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends MenuItem\n* @class PlaybackRateMenuItem\n*/",
        "meta": {
            "range": [
                51,
                228
            ],
            "filename": "playback-rate-menu-item.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>The specific menu item type for selecting a playback rate</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "MenuItem"
        ],
        "kind": "class",
        "name": "PlaybackRateMenuItem",
        "longname": "PlaybackRateMenuItem",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle click on menu item\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                280,
                338
            ],
            "filename": "playback-rate-menu-item.js",
            "lineno": 32,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Handle click on menu item</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update playback rate with selected rate\n*\n* @method update\n*/",
        "meta": {
            "range": [
                354,
                421
            ],
            "filename": "playback-rate-menu-item.js",
            "lineno": 42,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu",
            "code": {}
        },
        "description": "<p>Update playback rate with selected rate</p>",
        "kind": "function",
        "name": "update",
        "longname": "update",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file load-progress-bar.js\n*/",
        "meta": {
            "range": [
                0,
                35
            ],
            "filename": "load-progress-bar.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "name": "control-bar/progress-control/load-progress-bar.js",
        "kind": "file",
        "description": "<p>load-progress-bar.js</p>",
        "preserveName": true,
        "longname": "control-bar/progress-control/load-progress-bar.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Shows load progress\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class LoadProgressBar\n*/",
        "meta": {
            "range": [
                45,
                180
            ],
            "filename": "load-progress-bar.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Shows load progress</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "LoadProgressBar",
        "longname": "LoadProgressBar",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                202,
                286
            ],
            "filename": "load-progress-bar.js",
            "lineno": 22,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update progress bar\n*\n* @method update\n*/",
        "meta": {
            "range": [
                308,
                355
            ],
            "filename": "load-progress-bar.js",
            "lineno": 35,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Update progress bar</p>",
        "kind": "function",
        "name": "update",
        "longname": "update",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file play-progress-bar.js\n*/",
        "meta": {
            "range": [
                0,
                35
            ],
            "filename": "play-progress-bar.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "name": "control-bar/progress-control/play-progress-bar.js",
        "kind": "file",
        "description": "<p>play-progress-bar.js</p>",
        "preserveName": true,
        "longname": "control-bar/progress-control/play-progress-bar.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Shows play progress\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class PlayProgressBar\n*/",
        "meta": {
            "range": [
                42,
                177
            ],
            "filename": "play-progress-bar.js",
            "lineno": 6,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Shows play progress</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "PlayProgressBar",
        "longname": "PlayProgressBar",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                184,
                268
            ],
            "filename": "play-progress-bar.js",
            "lineno": 16,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file progress-control.js\n*/",
        "meta": {
            "range": [
                0,
                34
            ],
            "filename": "progress-control.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "name": "control-bar/progress-control/progress-control.js",
        "kind": "file",
        "description": "<p>progress-control.js</p>",
        "preserveName": true,
        "longname": "control-bar/progress-control/progress-control.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The Progress Control component contains the seek bar, load progress,\n* and play progress\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class ProgressControl\n*/",
        "meta": {
            "range": [
                44,
                248
            ],
            "filename": "progress-control.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>The Progress Control component contains the seek bar, load progress,\nand play progress</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "ProgressControl",
        "longname": "ProgressControl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                255,
                339
            ],
            "filename": "progress-control.js",
            "lineno": 18,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file seek-bar.js\n*/",
        "meta": {
            "range": [
                0,
                26
            ],
            "filename": "seek-bar.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "name": "control-bar/progress-control/seek-bar.js",
        "kind": "file",
        "description": "<p>seek-bar.js</p>",
        "preserveName": true,
        "longname": "control-bar/progress-control/seek-bar.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Seek Bar and holder for the progress bars\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Slider\n* @class SeekBar\n*/",
        "meta": {
            "range": [
                51,
                197
            ],
            "filename": "seek-bar.js",
            "lineno": 12,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Seek Bar and holder for the progress bars</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Slider"
        ],
        "kind": "class",
        "name": "SeekBar",
        "longname": "SeekBar",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                222,
                306
            ],
            "filename": "seek-bar.js",
            "lineno": 28,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update ARIA accessibility attributes\n*\n* @method updateARIAAttributes\n*/",
        "meta": {
            "range": [
                328,
                406
            ],
            "filename": "seek-bar.js",
            "lineno": 41,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Update ARIA accessibility attributes</p>",
        "kind": "function",
        "name": "updateARIAAttributes",
        "longname": "updateARIAAttributes",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get percentage of video played\n*\n* @return {Number} Percentage played\n* @method getPercent\n*/",
        "meta": {
            "range": [
                428,
                527
            ],
            "filename": "seek-bar.js",
            "lineno": 53,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Get percentage of video played</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Percentage played</p>"
            }
        ],
        "kind": "function",
        "name": "getPercent",
        "longname": "getPercent",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle mouse down on seek bar\n*\n* @method handleMouseDown\n*/",
        "meta": {
            "range": [
                543,
                609
            ],
            "filename": "seek-bar.js",
            "lineno": 64,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Handle mouse down on seek bar</p>",
        "kind": "function",
        "name": "handleMouseDown",
        "longname": "handleMouseDown",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle mouse move on seek bar\n*\n* @method handleMouseMove\n*/",
        "meta": {
            "range": [
                637,
                703
            ],
            "filename": "seek-bar.js",
            "lineno": 78,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Handle mouse move on seek bar</p>",
        "kind": "function",
        "name": "handleMouseMove",
        "longname": "handleMouseMove",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle mouse up on seek bar\n*\n* @method handleMouseUp\n*/",
        "meta": {
            "range": [
                734,
                796
            ],
            "filename": "seek-bar.js",
            "lineno": 93,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Handle mouse up on seek bar</p>",
        "kind": "function",
        "name": "handleMouseUp",
        "longname": "handleMouseUp",
        "scope": "global"
    },
    {
        "comment": "/**\n* Move more quickly fast forward for keyboard-only users\n*\n* @method stepForward\n*/",
        "meta": {
            "range": [
                824,
                911
            ],
            "filename": "seek-bar.js",
            "lineno": 107,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Move more quickly fast forward for keyboard-only users</p>",
        "kind": "function",
        "name": "stepForward",
        "longname": "stepForward",
        "scope": "global"
    },
    {
        "comment": "/**\n* Move more quickly rewind for keyboard-only users\n*\n* @method stepBack\n*/",
        "meta": {
            "range": [
                924,
                1002
            ],
            "filename": "seek-bar.js",
            "lineno": 116,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control",
            "code": {}
        },
        "description": "<p>Move more quickly rewind for keyboard-only users</p>",
        "kind": "function",
        "name": "stepBack",
        "longname": "stepBack",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file custom-control-spacer.js\n*/",
        "meta": {
            "range": [
                0,
                39
            ],
            "filename": "custom-control-spacer.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls",
            "code": {}
        },
        "name": "control-bar/spacer-controls/custom-control-spacer.js",
        "kind": "file",
        "description": "<p>custom-control-spacer.js</p>",
        "preserveName": true,
        "longname": "control-bar/spacer-controls/custom-control-spacer.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Spacer specifically meant to be used as an insertion point for new plugins, etc.\n*\n* @extends Spacer\n* @class CustomControlSpacer\n*/",
        "meta": {
            "range": [
                49,
                187
            ],
            "filename": "custom-control-spacer.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls",
            "code": {}
        },
        "description": "<p>Spacer specifically meant to be used as an insertion point for new plugins, etc.</p>",
        "augments": [
            "Spacer"
        ],
        "kind": "class",
        "name": "CustomControlSpacer",
        "longname": "CustomControlSpacer",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                194,
                320
            ],
            "filename": "custom-control-spacer.js",
            "lineno": 15,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                333,
                417
            ],
            "filename": "custom-control-spacer.js",
            "lineno": 25,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file spacer.js\n*/",
        "meta": {
            "range": [
                0,
                24
            ],
            "filename": "spacer.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls",
            "code": {}
        },
        "name": "control-bar/spacer-controls/spacer.js",
        "kind": "file",
        "description": "<p>spacer.js</p>",
        "preserveName": true,
        "longname": "control-bar/spacer-controls/spacer.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Just an empty spacer element that can be used as an append point for plugins, etc.\n* Also can be used to create space between elements when necessary.\n*\n* @extends Component\n* @class Spacer\n*/",
        "meta": {
            "range": [
                31,
                229
            ],
            "filename": "spacer.js",
            "lineno": 6,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls",
            "code": {}
        },
        "description": "<p>Just an empty spacer element that can be used as an append point for plugins, etc.\nAlso can be used to create space between elements when necessary.</p>",
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "Spacer",
        "longname": "Spacer",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                236,
                362
            ],
            "filename": "spacer.js",
            "lineno": 15,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @param {Object} props An object of properties  \n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                375,
                509
            ],
            "filename": "spacer.js",
            "lineno": 25,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>An object of properties</p>",
                "name": "props"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file caption-settings-menu-item.js\n*/",
        "meta": {
            "range": [
                0,
                44
            ],
            "filename": "caption-settings-menu-item.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "name": "control-bar/text-track-controls/caption-settings-menu-item.js",
        "kind": "file",
        "description": "<p>caption-settings-menu-item.js</p>",
        "preserveName": true,
        "longname": "control-bar/text-track-controls/caption-settings-menu-item.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The menu item for caption track settings menu\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends TextTrackMenuItem\n* @class CaptionSettingsMenuItem\n*/",
        "meta": {
            "range": [
                54,
                231
            ],
            "filename": "caption-settings-menu-item.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>The menu item for caption track settings menu</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "TextTrackMenuItem"
        ],
        "kind": "class",
        "name": "CaptionSettingsMenuItem",
        "longname": "CaptionSettingsMenuItem",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle click on menu item\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                277,
                335
            ],
            "filename": "caption-settings-menu-item.js",
            "lineno": 30,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Handle click on menu item</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file captions-button.js\n*/",
        "meta": {
            "range": [
                0,
                33
            ],
            "filename": "captions-button.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "name": "control-bar/text-track-controls/captions-button.js",
        "kind": "file",
        "description": "<p>captions-button.js</p>",
        "preserveName": true,
        "longname": "control-bar/text-track-controls/captions-button.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The button component for toggling and selecting captions\n*\n* @param {Object} player  Player object\n* @param {Object=} options Object of option names and values\n* @param {Function=} ready    Ready callback function\n* @extends TextTrackButton\n* @class CaptionsButton\n*/",
        "meta": {
            "range": [
                46,
                319
            ],
            "filename": "captions-button.js",
            "lineno": 8,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>The button component for toggling and selecting captions</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Player object</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "augments": [
            "TextTrackButton"
        ],
        "kind": "class",
        "name": "CaptionsButton",
        "longname": "CaptionsButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                341,
                467
            ],
            "filename": "captions-button.js",
            "lineno": 24,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update caption menu items\n*\n* @method update\n*/",
        "meta": {
            "range": [
                480,
                533
            ],
            "filename": "captions-button.js",
            "lineno": 34,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Update caption menu items</p>",
        "kind": "function",
        "name": "update",
        "longname": "update",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create caption menu items\n*\n* @return {Array} Array of menu items\n* @method createItems\n*/",
        "meta": {
            "range": [
                582,
                678
            ],
            "filename": "captions-button.js",
            "lineno": 55,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Create caption menu items</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>Array of menu items</p>"
            }
        ],
        "kind": "function",
        "name": "createItems",
        "longname": "createItems",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file chapters-button.js\n*/",
        "meta": {
            "range": [
                0,
                33
            ],
            "filename": "chapters-button.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "name": "control-bar/text-track-controls/chapters-button.js",
        "kind": "file",
        "description": "<p>chapters-button.js</p>",
        "preserveName": true,
        "longname": "control-bar/text-track-controls/chapters-button.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The button component for toggling and selecting chapters\n* Chapters act much differently than other text tracks\n* Cues are navigation vs. other tracks of alternative languages\n*\n* @param {Object} player  Player object\n* @param {Object=} options Object of option names and values\n* @param {Function=} ready    Ready callback function\n* @extends TextTrackButton\n* @class ChaptersButton\n*/",
        "meta": {
            "range": [
                64,
                456
            ],
            "filename": "chapters-button.js",
            "lineno": 14,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>The button component for toggling and selecting chapters\nChapters act much differently than other text tracks\nCues are navigation vs. other tracks of alternative languages</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Player object</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "augments": [
            "TextTrackButton"
        ],
        "kind": "class",
        "name": "ChaptersButton",
        "longname": "ChaptersButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                478,
                604
            ],
            "filename": "chapters-button.js",
            "lineno": 32,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create a menu item for each text track\n*\n* @return {Array} Array of menu items\n* @method createItems\n*/",
        "meta": {
            "range": [
                617,
                726
            ],
            "filename": "chapters-button.js",
            "lineno": 42,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Create a menu item for each text track</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>Array of menu items</p>"
            }
        ],
        "kind": "function",
        "name": "createItems",
        "longname": "createItems",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create menu from chapter buttons\n*\n* @return {Menu} Menu of chapter buttons\n* @method createMenu\n*/",
        "meta": {
            "range": [
                790,
                895
            ],
            "filename": "chapters-button.js",
            "lineno": 69,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Create menu from chapter buttons</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Menu"
                    ]
                },
                "description": "<p>Menu of chapter buttons</p>"
            }
        ],
        "kind": "function",
        "name": "createMenu",
        "longname": "createMenu",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file chapters-track-menu-item.js\n*/",
        "meta": {
            "range": [
                0,
                42
            ],
            "filename": "chapters-track-menu-item.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "name": "control-bar/text-track-controls/chapters-track-menu-item.js",
        "kind": "file",
        "description": "<p>chapters-track-menu-item.js</p>",
        "preserveName": true,
        "longname": "control-bar/text-track-controls/chapters-track-menu-item.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The chapter track menu item\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends MenuItem\n* @class ChaptersTrackMenuItem\n*/",
        "meta": {
            "range": [
                55,
                203
            ],
            "filename": "chapters-track-menu-item.js",
            "lineno": 8,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>The chapter track menu item</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "MenuItem"
        ],
        "kind": "class",
        "name": "ChaptersTrackMenuItem",
        "longname": "ChaptersTrackMenuItem",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle click on menu item\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                255,
                313
            ],
            "filename": "chapters-track-menu-item.js",
            "lineno": 33,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Handle click on menu item</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update chapter menu item\n*\n* @method update\n*/",
        "meta": {
            "range": [
                332,
                384
            ],
            "filename": "chapters-track-menu-item.js",
            "lineno": 44,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Update chapter menu item</p>",
        "kind": "function",
        "name": "update",
        "longname": "update",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file off-text-track-menu-item.js\n*/",
        "meta": {
            "range": [
                0,
                42
            ],
            "filename": "off-text-track-menu-item.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "name": "control-bar/text-track-controls/off-text-track-menu-item.js",
        "kind": "file",
        "description": "<p>off-text-track-menu-item.js</p>",
        "preserveName": true,
        "longname": "control-bar/text-track-controls/off-text-track-menu-item.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* A special menu item for turning of a specific type of text track\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends TextTrackMenuItem\n* @class OffTextTrackMenuItem\n*/",
        "meta": {
            "range": [
                52,
                245
            ],
            "filename": "off-text-track-menu-item.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>A special menu item for turning of a specific type of text track</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "TextTrackMenuItem"
        ],
        "kind": "class",
        "name": "OffTextTrackMenuItem",
        "longname": "OffTextTrackMenuItem",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle text track change\n*\n* @param {Object} event Event object\n* @method handleTracksChange\n*/",
        "meta": {
            "range": [
                297,
                398
            ],
            "filename": "off-text-track-menu-item.js",
            "lineno": 32,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Handle text track change</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Event object</p>",
                "name": "event"
            }
        ],
        "kind": "function",
        "name": "handleTracksChange",
        "longname": "handleTracksChange",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file subtitles-button.js\n*/",
        "meta": {
            "range": [
                0,
                34
            ],
            "filename": "subtitles-button.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "name": "control-bar/text-track-controls/subtitles-button.js",
        "kind": "file",
        "description": "<p>subtitles-button.js</p>",
        "preserveName": true,
        "longname": "control-bar/text-track-controls/subtitles-button.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The button component for toggling and selecting subtitles\n*\n* @param {Object} player  Player object\n* @param {Object=} options Object of option names and values\n* @param {Function=} ready    Ready callback function\n* @extends TextTrackButton\n* @class SubtitlesButton\n*/",
        "meta": {
            "range": [
                44,
                319
            ],
            "filename": "subtitles-button.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>The button component for toggling and selecting subtitles</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Player object</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "augments": [
            "TextTrackButton"
        ],
        "kind": "class",
        "name": "SubtitlesButton",
        "longname": "SubtitlesButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                341,
                467
            ],
            "filename": "subtitles-button.js",
            "lineno": 23,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file text-track-button.js\n*/",
        "meta": {
            "range": [
                0,
                35
            ],
            "filename": "text-track-button.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "name": "control-bar/text-track-controls/text-track-button.js",
        "kind": "file",
        "description": "<p>text-track-button.js</p>",
        "preserveName": true,
        "longname": "control-bar/text-track-controls/text-track-button.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The base class for buttons that toggle specific text track types (e.g. subtitles)\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends MenuButton\n* @class TextTrackButton\n*/",
        "meta": {
            "range": [
                54,
                252
            ],
            "filename": "text-track-button.js",
            "lineno": 10,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>The base class for buttons that toggle specific text track types (e.g. subtitles)</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "MenuButton"
        ],
        "kind": "class",
        "name": "TextTrackButton",
        "longname": "TextTrackButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file text-track-menu-item.js\n*/",
        "meta": {
            "range": [
                0,
                38
            ],
            "filename": "text-track-menu-item.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "name": "control-bar/text-track-controls/text-track-menu-item.js",
        "kind": "file",
        "description": "<p>text-track-menu-item.js</p>",
        "preserveName": true,
        "longname": "control-bar/text-track-controls/text-track-menu-item.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The specific menu item type for selecting a language within a text track kind\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends MenuItem\n* @class TextTrackMenuItem\n*/",
        "meta": {
            "range": [
                57,
                251
            ],
            "filename": "text-track-menu-item.js",
            "lineno": 10,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>The specific menu item type for selecting a language within a text track kind</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "MenuItem"
        ],
        "kind": "class",
        "name": "TextTrackMenuItem",
        "longname": "TextTrackMenuItem",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle click on text track\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                399,
                458
            ],
            "filename": "text-track-menu-item.js",
            "lineno": 67,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Handle click on text track</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle text track change\n*\n* @method handleTracksChange\n*/",
        "meta": {
            "range": [
                528,
                592
            ],
            "filename": "text-track-menu-item.js",
            "lineno": 95,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls",
            "code": {}
        },
        "description": "<p>Handle text track change</p>",
        "kind": "function",
        "name": "handleTracksChange",
        "longname": "handleTracksChange",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file current-time-display.js\n*/",
        "meta": {
            "range": [
                0,
                38
            ],
            "filename": "current-time-display.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "name": "control-bar/time-controls/current-time-display.js",
        "kind": "file",
        "description": "<p>current-time-display.js</p>",
        "preserveName": true,
        "longname": "control-bar/time-controls/current-time-display.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Displays the current time\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class CurrentTimeDisplay\n*/",
        "meta": {
            "range": [
                51,
                195
            ],
            "filename": "current-time-display.js",
            "lineno": 8,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Displays the current time</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "CurrentTimeDisplay",
        "longname": "CurrentTimeDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                220,
                304
            ],
            "filename": "current-time-display.js",
            "lineno": 24,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update current time display \n*\n* @method updateContent\n*/",
        "meta": {
            "range": [
                350,
                413
            ],
            "filename": "current-time-display.js",
            "lineno": 45,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Update current time display</p>",
        "kind": "function",
        "name": "updateContent",
        "longname": "updateContent",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file duration-display.js\n*/",
        "meta": {
            "range": [
                0,
                34
            ],
            "filename": "duration-display.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "name": "control-bar/time-controls/duration-display.js",
        "kind": "file",
        "description": "<p>duration-display.js</p>",
        "preserveName": true,
        "longname": "control-bar/time-controls/duration-display.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Displays the duration\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class DurationDisplay\n*/",
        "meta": {
            "range": [
                47,
                184
            ],
            "filename": "duration-display.js",
            "lineno": 8,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Displays the duration</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "DurationDisplay",
        "longname": "DurationDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                227,
                311
            ],
            "filename": "duration-display.js",
            "lineno": 30,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update duration time display \n*\n* @method updateContent\n*/",
        "meta": {
            "range": [
                357,
                421
            ],
            "filename": "duration-display.js",
            "lineno": 51,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Update duration time display</p>",
        "kind": "function",
        "name": "updateContent",
        "longname": "updateContent",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file remaining-time-display.js\n*/",
        "meta": {
            "range": [
                0,
                40
            ],
            "filename": "remaining-time-display.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "name": "control-bar/time-controls/remaining-time-display.js",
        "kind": "file",
        "description": "<p>remaining-time-display.js</p>",
        "preserveName": true,
        "longname": "control-bar/time-controls/remaining-time-display.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Displays the time left in the video\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class RemainingTimeDisplay\n*/",
        "meta": {
            "range": [
                53,
                209
            ],
            "filename": "remaining-time-display.js",
            "lineno": 8,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Displays the time left in the video</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "RemainingTimeDisplay",
        "longname": "RemainingTimeDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                234,
                318
            ],
            "filename": "remaining-time-display.js",
            "lineno": 24,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update remaining time display \n*\n* @method updateContent\n*/",
        "meta": {
            "range": [
                364,
                429
            ],
            "filename": "remaining-time-display.js",
            "lineno": 45,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Update remaining time display</p>",
        "kind": "function",
        "name": "updateContent",
        "longname": "updateContent",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file time-divider.js\n*/",
        "meta": {
            "range": [
                0,
                30
            ],
            "filename": "time-divider.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "name": "control-bar/time-controls/time-divider.js",
        "kind": "file",
        "description": "<p>time-divider.js</p>",
        "preserveName": true,
        "longname": "control-bar/time-controls/time-divider.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The separator between the current time and duration.\n* Can be hidden if it's not needed in the design.\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class TimeDivider\n*/",
        "meta": {
            "range": [
                37,
                251
            ],
            "filename": "time-divider.js",
            "lineno": 6,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>The separator between the current time and duration.\nCan be hidden if it's not needed in the design.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "TimeDivider",
        "longname": "TimeDivider",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                258,
                342
            ],
            "filename": "time-divider.js",
            "lineno": 17,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* The bar that contains the volume level and can be clicked on to adjust the level\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Slider\n* @class VolumeBar\n*/",
        "meta": {
            "range": [
                24,
                211
            ],
            "filename": "volume-bar.js",
            "lineno": 9,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>The bar that contains the volume level and can be clicked on to adjust the level</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Slider"
        ],
        "kind": "class",
        "name": "VolumeBar",
        "longname": "VolumeBar",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                236,
                320
            ],
            "filename": "volume-bar.js",
            "lineno": 25,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle mouse move on volume bar\n*\n* @method handleMouseMove\n*/",
        "meta": {
            "range": [
                342,
                410
            ],
            "filename": "volume-bar.js",
            "lineno": 38,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>Handle mouse move on volume bar</p>",
        "kind": "function",
        "name": "handleMouseMove",
        "longname": "handleMouseMove",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get percent of volume level\n*\n* @retun {Number} Volume level percent\n* @method getPercent\n*/",
        "meta": {
            "range": [
                435,
                533
            ],
            "filename": "volume-bar.js",
            "lineno": 51,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>Get percent of volume level</p>",
        "tags": [
            {
                "originalTitle": "retun",
                "title": "retun",
                "text": "{Number} Volume level percent",
                "value": "{Number} Volume level percent"
            }
        ],
        "kind": "function",
        "name": "getPercent",
        "longname": "getPercent",
        "scope": "global"
    },
    {
        "comment": "/**\n* Increase volume level for keyboard users\n*\n* @method stepForward\n*/",
        "meta": {
            "range": [
                558,
                631
            ],
            "filename": "volume-bar.js",
            "lineno": 65,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>Increase volume level for keyboard users</p>",
        "kind": "function",
        "name": "stepForward",
        "longname": "stepForward",
        "scope": "global"
    },
    {
        "comment": "/**\n* Decrease volume level for keyboard users\n*\n* @method stepBack\n*/",
        "meta": {
            "range": [
                644,
                714
            ],
            "filename": "volume-bar.js",
            "lineno": 74,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>Decrease volume level for keyboard users</p>",
        "kind": "function",
        "name": "stepBack",
        "longname": "stepBack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update ARIA accessibility attributes\n*\n* @method updateARIAAttributes\n*/",
        "meta": {
            "range": [
                727,
                805
            ],
            "filename": "volume-bar.js",
            "lineno": 83,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>Update ARIA accessibility attributes</p>",
        "kind": "function",
        "name": "updateARIAAttributes",
        "longname": "updateARIAAttributes",
        "scope": "global"
    },
    {
        "comment": "/**\n* The component for controlling the volume level\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class VolumeControl\n*/",
        "meta": {
            "range": [
                15,
                175
            ],
            "filename": "volume-control.js",
            "lineno": 6,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>The component for controlling the volume level</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "VolumeControl",
        "longname": "VolumeControl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                230,
                314
            ],
            "filename": "volume-control.js",
            "lineno": 32,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Shows volume level\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class VolumeLevel\n*/",
        "meta": {
            "range": [
                6,
                136
            ],
            "filename": "volume-level.js",
            "lineno": 3,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>Shows volume level</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "VolumeLevel",
        "longname": "VolumeLevel",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                143,
                227
            ],
            "filename": "volume-level.js",
            "lineno": 13,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file volume-menu-button.js\n*/",
        "meta": {
            "range": [
                0,
                36
            ],
            "filename": "volume-menu-button.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "name": "control-bar/volume-menu-button.js",
        "kind": "file",
        "description": "<p>volume-menu-button.js</p>",
        "preserveName": true,
        "longname": "control-bar/volume-menu-button.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Button for volume menu\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends MenuButton\n* @class VolumeMenuButton\n*/",
        "meta": {
            "range": [
                58,
                198
            ],
            "filename": "volume-menu-button.js",
            "lineno": 11,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Button for volume menu</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "MenuButton"
        ],
        "kind": "class",
        "name": "VolumeMenuButton",
        "longname": "VolumeMenuButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                265,
                391
            ],
            "filename": "volume-menu-button.js",
            "lineno": 41,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {Menu} The volume menu button\n* @method createMenu\n*/",
        "meta": {
            "range": [
                404,
                521
            ],
            "filename": "volume-menu-button.js",
            "lineno": 51,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Menu"
                    ]
                },
                "description": "<p>The volume menu button</p>"
            }
        ],
        "kind": "function",
        "name": "createMenu",
        "longname": "createMenu",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle click on volume menu and calls super\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                585,
                661
            ],
            "filename": "volume-menu-button.js",
            "lineno": 78,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar",
            "code": {}
        },
        "description": "<p>Handle click on volume menu and calls super</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file error-display.js\n*/",
        "meta": {
            "range": [
                0,
                31
            ],
            "filename": "error-display.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "error-display.js",
        "kind": "file",
        "description": "<p>error-display.js</p>",
        "preserveName": true,
        "longname": "error-display.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Display that an error has occurred making the video unplayable\n*\n* @param {Object} player  Main Player\n* @param {Object=} options Object of option names and values\n* @extends Component\n* @class ErrorDisplay\n*/",
        "meta": {
            "range": [
                41,
                256
            ],
            "filename": "error-display.js",
            "lineno": 7,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Display that an error has occurred making the video unplayable</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Main Player</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "ErrorDisplay",
        "longname": "ErrorDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                284,
                368
            ],
            "filename": "error-display.js",
            "lineno": 24,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update the error message in localized language\n*\n* @method update\n*/",
        "meta": {
            "range": [
                402,
                476
            ],
            "filename": "error-display.js",
            "lineno": 41,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Update the error message in localized language</p>",
        "kind": "function",
        "name": "update",
        "longname": "update",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file event-emitter.js\n*/",
        "meta": {
            "range": [
                0,
                31
            ],
            "filename": "event-emitter.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "event-emitter.js",
        "kind": "file",
        "description": "<p>event-emitter.js</p>",
        "preserveName": true,
        "longname": "event-emitter.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file fullscreen-api.js\n*/",
        "meta": {
            "range": [
                0,
                32
            ],
            "filename": "fullscreen-api.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "fullscreen-api.js",
        "kind": "file",
        "description": "<p>fullscreen-api.js</p>",
        "preserveName": true,
        "longname": "fullscreen-api.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file global-options.js\n*/",
        "meta": {
            "range": [
                0,
                32
            ],
            "filename": "global-options.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "global-options.js",
        "kind": "file",
        "description": "<p>global-options.js</p>",
        "preserveName": true,
        "longname": "global-options.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file loading-spinner.js\n*/",
        "meta": {
            "range": [
                0,
                33
            ],
            "filename": "loading-spinner.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "loading-spinner.js",
        "kind": "file",
        "description": "<p>loading-spinner.js</p>",
        "preserveName": true,
        "longname": "loading-spinner.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Loading spinner for waiting events\n*\n* @extends Component\n* @class LoadingSpinner\n*/",
        "meta": {
            "range": [
                143,
                233
            ],
            "filename": "loading-spinner.js",
            "lineno": 8,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Loading spinner for waiting events</p>",
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "LoadingSpinner",
        "longname": "LoadingSpinner",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @method createEl\n*/",
        "meta": {
            "range": [
                240,
                304
            ],
            "filename": "loading-spinner.js",
            "lineno": 16,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file media-error.js\n*/",
        "meta": {
            "range": [
                0,
                29
            ],
            "filename": "media-error.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "media-error.js",
        "kind": "file",
        "description": "<p>media-error.js</p>",
        "preserveName": true,
        "longname": "media-error.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file menu-button.js\n*/",
        "meta": {
            "range": [
                0,
                29
            ],
            "filename": "menu-button.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "name": "menu/menu-button.js",
        "kind": "file",
        "description": "<p>menu-button.js</p>",
        "preserveName": true,
        "longname": "menu/menu-button.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* A button class with a popup menu\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Button\n* @class MenuButton\n*/",
        "meta": {
            "range": [
                51,
                191
            ],
            "filename": "menu-button.js",
            "lineno": 11,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>A button class with a popup menu</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Button"
        ],
        "kind": "class",
        "name": "MenuButton",
        "longname": "MenuButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update menu\n*\n* @method update\n*/",
        "meta": {
            "range": [
                228,
                267
            ],
            "filename": "menu-button.js",
            "lineno": 31,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Update menu</p>",
        "kind": "function",
        "name": "update",
        "longname": "update",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create menu\n*\n* @return {Menu} The constructed menu\n* @method createMenu\n*/",
        "meta": {
            "range": [
                400,
                481
            ],
            "filename": "menu-button.js",
            "lineno": 61,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Create menu</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Menu"
                    ]
                },
                "description": "<p>The constructed menu</p>"
            }
        ],
        "kind": "function",
        "name": "createMenu",
        "longname": "createMenu",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the list of menu items. Specific to each subclass.\n*\n* @method createItems\n*/",
        "meta": {
            "range": [
                554,
                644
            ],
            "filename": "menu-button.js",
            "lineno": 91,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Create the list of menu items. Specific to each subclass.</p>",
        "kind": "function",
        "name": "createItems",
        "longname": "createItems",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                651,
                735
            ],
            "filename": "menu-button.js",
            "lineno": 98,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Allow sub components to stack CSS class names\n*\n* @return {String} The constructed class name\n* @method buildCSSClass\n*/",
        "meta": {
            "range": [
                754,
                880
            ],
            "filename": "menu-button.js",
            "lineno": 110,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Allow sub components to stack CSS class names</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The constructed class name</p>"
            }
        ],
        "kind": "function",
        "name": "buildCSSClass",
        "longname": "buildCSSClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Focus - Add keyboard functionality to element\n* This function is not needed anymore. Instead, the \n* keyboard functionality is handled by\n* treating the button as triggering a submenu. \n* When the button is pressed, the submenu\n* appears. Pressing the button again makes \n* the submenu disappear.\n*\n* @method handleFocus\n*/",
        "meta": {
            "range": [
                893,
                1222
            ],
            "filename": "menu-button.js",
            "lineno": 120,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Focus - Add keyboard functionality to element\nThis function is not needed anymore. Instead, the \nkeyboard functionality is handled by\ntreating the button as triggering a submenu. \nWhen the button is pressed, the submenu\nappears. Pressing the button again makes \nthe submenu disappear.</p>",
        "kind": "function",
        "name": "handleFocus",
        "longname": "handleFocus",
        "scope": "global"
    },
    {
        "comment": "/**\n* Can't turn off list display that we turned\n* on with focus, because list would go away.\n*\n* @method handleBlur\n*/",
        "meta": {
            "range": [
                1229,
                1348
            ],
            "filename": "menu-button.js",
            "lineno": 133,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Can't turn off list display that we turned\non with focus, because list would go away.</p>",
        "kind": "function",
        "name": "handleBlur",
        "longname": "handleBlur",
        "scope": "global"
    },
    {
        "comment": "/**\n* When you click the button it adds focus, which \n* will show the menu indefinitely.\n* So we'll remove focus when the mouse leaves the button.\n* Focus is needed for tab navigation.\n* Allow sub components to stack CSS class names\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                1355,
                1614
            ],
            "filename": "menu-button.js",
            "lineno": 141,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>When you click the button it adds focus, which \nwill show the menu indefinitely.\nSo we'll remove focus when the mouse leaves the button.\nFocus is needed for tab navigation.\nAllow sub components to stack CSS class names</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle key press on menu\n*\n* @param {Object} Key press event\n* @method handleKeyPress\n*/",
        "meta": {
            "range": [
                1651,
                1745
            ],
            "filename": "menu-button.js",
            "lineno": 162,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Handle key press on menu</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>press event</p>",
                "name": "Key"
            }
        ],
        "kind": "function",
        "name": "handleKeyPress",
        "longname": "handleKeyPress",
        "scope": "global"
    },
    {
        "comment": "/**\n* Makes changes based on button pressed\n*\n* @method pressButton\n*/",
        "meta": {
            "range": [
                1803,
                1873
            ],
            "filename": "menu-button.js",
            "lineno": 187,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Makes changes based on button pressed</p>",
        "kind": "function",
        "name": "pressButton",
        "longname": "pressButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* Makes changes based on button unpressed\n*\n* @method unpressButton\n*/",
        "meta": {
            "range": [
                1901,
                1975
            ],
            "filename": "menu-button.js",
            "lineno": 201,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Makes changes based on button unpressed</p>",
        "kind": "function",
        "name": "unpressButton",
        "longname": "unpressButton",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file menu-item.js\n*/",
        "meta": {
            "range": [
                0,
                27
            ],
            "filename": "menu-item.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "name": "menu/menu-item.js",
        "kind": "file",
        "description": "<p>menu-item.js</p>",
        "preserveName": true,
        "longname": "menu/menu-item.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The component for a menu item. `<li>`\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Button\n* @class MenuItem\n*/",
        "meta": {
            "range": [
                40,
                183
            ],
            "filename": "menu-item.js",
            "lineno": 8,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>The component for a menu item. <code>&lt;li&gt;</code></p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Button"
        ],
        "kind": "class",
        "name": "MenuItem",
        "longname": "MenuItem",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @param {String=} type Desc\n* @param {Object=} props Desc \n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                205,
                349
            ],
            "filename": "menu-item.js",
            "lineno": 23,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Desc</p>",
                "name": "type"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Desc</p>",
                "name": "props"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle a click on the menu item, and set it to selected\n*\n* @method handleClick\n*/",
        "meta": {
            "range": [
                371,
                459
            ],
            "filename": "menu-item.js",
            "lineno": 38,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Handle a click on the menu item, and set it to selected</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set this menu item as selected or not\n*\n* @param  {Boolean} selected\n* @method selected\n*/",
        "meta": {
            "range": [
                472,
                568
            ],
            "filename": "menu-item.js",
            "lineno": 47,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Set this menu item as selected or not</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "name": "selected"
            }
        ],
        "kind": "function",
        "name": "selected",
        "longname": "selected",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file menu.js\n*/",
        "meta": {
            "range": [
                0,
                22
            ],
            "filename": "menu.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "name": "menu/menu.js",
        "kind": "file",
        "description": "<p>menu.js</p>",
        "preserveName": true,
        "longname": "menu/menu.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The Menu component is used to build pop up menus, including subtitle and\n* captions selection menus.\n*\n* @extends Component\n* @class Menu\n*/",
        "meta": {
            "range": [
                38,
                184
            ],
            "filename": "menu.js",
            "lineno": 9,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>The Menu component is used to build pop up menus, including subtitle and\ncaptions selection menus.</p>",
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "Menu",
        "longname": "Menu",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add a menu item to the menu\n*\n* @param {Object|String} component Component or component type to add\n* @method addItem\n*/",
        "meta": {
            "range": [
                191,
                317
            ],
            "filename": "menu.js",
            "lineno": 18,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Add a menu item to the menu</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object",
                        "String"
                    ]
                },
                "description": "<p>Component or component type to add</p>",
                "name": "component"
            }
        ],
        "kind": "function",
        "name": "addItem",
        "longname": "addItem",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                339,
                423
            ],
            "filename": "menu.js",
            "lineno": 31,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file player.js\n*/",
        "meta": {
            "range": [
                0,
                24
            ],
            "filename": "player.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "player.js",
        "kind": "file",
        "description": "<p>player.js</p>",
        "preserveName": true,
        "longname": "player.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* An instance of the `Player` class is created when any of the Video.js setup methods are used to initialize a video.\n* ```js\n* var myPlayer = videojs('example_video_1');\n* ```\n* In the following example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.\n* ```html\n* <video id=\"example_video_1\" data-setup='{}' controls>\n*   <source src=\"my-source.mp4\" type=\"video/mp4\">\n* </video>\n* ```\n* After an instance has been created it can be accessed globally using `Video('example_video_1')`.\n*\n* @param {Element} tag        The original video tag used for configuring options\n* @param {Object=} options    Object of option names and values\n* @param {Function=} ready    Ready callback function\n* @extends Component\n* @class Player\n*/",
        "meta": {
            "range": [
                127,
                918
            ],
            "filename": "player.js",
            "lineno": 38,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>An instance of the <code>Player</code> class is created when any of the Video.js setup methods are used to initialize a video.</p>\n<pre class=\"prettyprint source lang-js\"><code>var myPlayer = videojs('example_video_1');</code></pre><p>In the following example, the <code>data-setup</code> attribute tells the Video.js library to create a player instance when the library is ready.</p>\n<pre class=\"prettyprint source lang-html\"><code>&lt;video id=&quot;example_video_1&quot; data-setup='{}' controls>\n  &lt;source src=&quot;my-source.mp4&quot; type=&quot;video/mp4&quot;>\n&lt;/video></code></pre><p>After an instance has been created it can be accessed globally using <code>Video('example_video_1')</code>.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>The original video tag used for configuring options</p>",
                "name": "tag"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "Player",
        "longname": "Player",
        "scope": "global"
    },
    {
        "comment": "/**\n* player's constructor function\n*\n* @constructs\n* @method init\n* @param {Element} tag        The original video tag used for configuring options\n* @param {Object=} options    Player options\n* @param {Function=} ready    Ready callback function\n*/",
        "meta": {
            "range": [
                925,
                1175
            ],
            "filename": "player.js",
            "lineno": 59,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>player's constructor function</p>",
        "alias": "{@thisClass}",
        "kind": "function",
        "name": "init",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>The original video tag used for configuring options</p>",
                "name": "tag"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Player options</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "longname": "init",
        "scope": "global"
    },
    {
        "comment": "/**\n* Destroys the video player and does any necessary cleanup\n* ```js\n*     myPlayer.dispose();\n* ```\n* This is especially helpful if you are dynamically adding and removing videos\n* to/from the DOM.\n*\n* @method dispose\n*/",
        "meta": {
            "range": [
                1679,
                1902
            ],
            "filename": "player.js",
            "lineno": 205,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Destroys the video player and does any necessary cleanup</p>\n<pre class=\"prettyprint source lang-js\"><code>    myPlayer.dispose();</code></pre><p>This is especially helpful if you are dynamically adding and removing videos\nto/from the DOM.</p>",
        "kind": "function",
        "name": "dispose",
        "longname": "dispose",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                1948,
                2032
            ],
            "filename": "player.js",
            "lineno": 230,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get/set player width\n*\n* @param {Number=} value Value for width\n* @return {Number} Width when getting\n* @method width\n*/",
        "meta": {
            "range": [
                2213,
                2339
            ],
            "filename": "player.js",
            "lineno": 296,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get/set player width</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "optional": true,
                "description": "<p>Value for width</p>",
                "name": "value"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Width when getting</p>"
            }
        ],
        "kind": "function",
        "name": "width",
        "longname": "width",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get/set player height\n*\n* @param {Number=} value Value for height\n* @return {Number} Height when getting\n* @method height\n*/",
        "meta": {
            "range": [
                2352,
                2482
            ],
            "filename": "player.js",
            "lineno": 307,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get/set player height</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "optional": true,
                "description": "<p>Value for height</p>",
                "name": "value"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Height when getting</p>"
            }
        ],
        "kind": "function",
        "name": "height",
        "longname": "height",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get/set dimension for player\n*\n* @param {String} dimension Either width or height\n* @param {Number=} value Value for dimension\n* @return {Component}\n* @method dimension\n*/",
        "meta": {
            "range": [
                2495,
                2672
            ],
            "filename": "player.js",
            "lineno": 318,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get/set dimension for player</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Either width or height</p>",
                "name": "dimension"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "optional": true,
                "description": "<p>Value for dimension</p>",
                "name": "value"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "dimension",
        "longname": "dimension",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add/remove the vjs-fluid class\n*\n* @param {Boolean} bool Value of true adds the class, value of false removes the class \n* @method fluid\n*/",
        "meta": {
            "range": [
                2748,
                2893
            ],
            "filename": "player.js",
            "lineno": 351,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Add/remove the vjs-fluid class</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Value of true adds the class, value of false removes the class</p>",
                "name": "bool"
            }
        ],
        "kind": "function",
        "name": "fluid",
        "longname": "fluid",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get/Set the aspect ratio\n*\n* @param {String=} ratio Aspect ratio for player\n* @return aspectRatio\n* @method aspectRatio\n*/",
        "meta": {
            "range": [
                2936,
                3064
            ],
            "filename": "player.js",
            "lineno": 371,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get/Set the aspect ratio</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Aspect ratio for player</p>",
                "name": "ratio"
            }
        ],
        "returns": [
            {
                "description": "<p>aspectRatio</p>"
            }
        ],
        "kind": "function",
        "name": "aspectRatio",
        "longname": "aspectRatio",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update styles of the player element (height, width and aspect ratio)\n*\n* @method updateStyleEl_\n*/",
        "meta": {
            "range": [
                3119,
                3223
            ],
            "filename": "player.js",
            "lineno": 396,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Update styles of the player element (height, width and aspect ratio)</p>",
        "kind": "function",
        "name": "updateStyleEl_",
        "longname": "updateStyleEl_",
        "scope": "global"
    },
    {
        "comment": "/**\n* Load the Media Playback Technology (tech)\n* Load/Create an instance of playback technology including element and API methods\n* And append playback element in player div.\n*\n* @param {String} techName Name of the playback technology\n* @param {String} source Video source\n* @method loadTech\n*/",
        "meta": {
            "range": [
                3398,
                3694
            ],
            "filename": "player.js",
            "lineno": 459,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Load the Media Playback Technology (tech)\nLoad/Create an instance of playback technology including element and API methods\nAnd append playback element in player div.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Name of the playback technology</p>",
                "name": "techName"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Video source</p>",
                "name": "source"
            }
        ],
        "kind": "function",
        "name": "loadTech",
        "longname": "loadTech",
        "scope": "global"
    },
    {
        "comment": "/**\n* Unload playback technology\n*\n* @method unloadTech\n*/",
        "meta": {
            "range": [
                4001,
                4059
            ],
            "filename": "player.js",
            "lineno": 570,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Unload playback technology</p>",
        "kind": "function",
        "name": "unloadTech",
        "longname": "unloadTech",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add playback technology listeners\n*\n* @method addTechControlsListeners\n*/",
        "meta": {
            "range": [
                4093,
                4172
            ],
            "filename": "player.js",
            "lineno": 586,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Add playback technology listeners</p>",
        "kind": "function",
        "name": "addTechControlsListeners",
        "longname": "addTechControlsListeners",
        "scope": "global"
    },
    {
        "comment": "/**\n* Remove the listeners used for click and tap controls. This is needed for\n* toggling to controls disabled, where a tap/touch should do nothing.\n*\n* @method removeTechControlsListeners\n*/",
        "meta": {
            "range": [
                4230,
                4421
            ],
            "filename": "player.js",
            "lineno": 610,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Remove the listeners used for click and tap controls. This is needed for\ntoggling to controls disabled, where a tap/touch should do nothing.</p>",
        "kind": "function",
        "name": "removeTechControlsListeners",
        "longname": "removeTechControlsListeners",
        "scope": "global"
    },
    {
        "comment": "/**\n* Player waits for the tech to be ready\n*\n* @private\n* @method handleTechReady\n*/",
        "meta": {
            "range": [
                4452,
                4537
            ],
            "filename": "player.js",
            "lineno": 626,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Player waits for the tech to be ready</p>",
        "access": "private",
        "kind": "function",
        "name": "handleTechReady",
        "longname": "handleTechReady",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the native controls are used\n*\n* @private\n* @method handleTechUseNativeControls\n*/",
        "meta": {
            "range": [
                4577,
                4676
            ],
            "filename": "player.js",
            "lineno": 645,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the native controls are used</p>",
        "access": "private",
        "kind": "function",
        "name": "handleTechUseNativeControls",
        "longname": "handleTechUseNativeControls",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the user agent begins looking for media data\n*\n* @event loadstart\n*/",
        "meta": {
            "range": [
                4689,
                4774
            ],
            "filename": "player.js",
            "lineno": 655,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the user agent begins looking for media data</p>",
        "kind": "event",
        "name": "loadstart",
        "longname": "event:loadstart",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add/remove the vjs-has-started class\n*\n* @param {Boolean} hasStarted The value of true adds the class the value of false remove the class\n* @return {Boolean} Boolean value if has started\n* @method hasStarted\n*/",
        "meta": {
            "range": [
                4838,
                5054
            ],
            "filename": "player.js",
            "lineno": 681,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Add/remove the vjs-has-started class</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>The value of true adds the class the value of false remove the class</p>",
                "name": "hasStarted"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Boolean value if has started</p>"
            }
        ],
        "kind": "function",
        "name": "hasStarted",
        "longname": "hasStarted",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired whenever the media begins or resumes playback\n*\n* @event play\n*/",
        "meta": {
            "range": [
                5109,
                5185
            ],
            "filename": "player.js",
            "lineno": 706,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired whenever the media begins or resumes playback</p>",
        "kind": "event",
        "name": "play",
        "longname": "event:play",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired whenever the media begins waiting\n*\n* @event waiting\n*/",
        "meta": {
            "range": [
                5222,
                5289
            ],
            "filename": "player.js",
            "lineno": 723,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired whenever the media begins waiting</p>",
        "kind": "event",
        "name": "waiting",
        "longname": "event:waiting",
        "scope": "global"
    },
    {
        "comment": "/**\n* A handler for events that signal that waiting has ended\n* which is not consistent between browsers. See #1351\n*\n* @event canplay\n*/",
        "meta": {
            "range": [
                5305,
                5442
            ],
            "filename": "player.js",
            "lineno": 733,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>A handler for events that signal that waiting has ended\nwhich is not consistent between browsers. See #1351</p>",
        "kind": "event",
        "name": "canplay",
        "longname": "event:canplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* A handler for events that signal that waiting has ended\n* which is not consistent between browsers. See #1351\n*\n* @event canplaythrough\n*/",
        "meta": {
            "range": [
                5458,
                5602
            ],
            "filename": "player.js",
            "lineno": 744,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>A handler for events that signal that waiting has ended\nwhich is not consistent between browsers. See #1351</p>",
        "kind": "event",
        "name": "canplaythrough",
        "longname": "event:canplaythrough",
        "scope": "global"
    },
    {
        "comment": "/**\n* A handler for events that signal that waiting has ended\n* which is not consistent between browsers. See #1351\n*\n* @event playing\n*/",
        "meta": {
            "range": [
                5618,
                5755
            ],
            "filename": "player.js",
            "lineno": 755,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>A handler for events that signal that waiting has ended\nwhich is not consistent between browsers. See #1351</p>",
        "kind": "event",
        "name": "playing",
        "longname": "event:playing",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired whenever the player is jumping to a new time\n*\n* @event seeking\n*/",
        "meta": {
            "range": [
                5771,
                5849
            ],
            "filename": "player.js",
            "lineno": 766,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired whenever the player is jumping to a new time</p>",
        "kind": "event",
        "name": "seeking",
        "longname": "event:seeking",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the player has finished jumping to a new time\n*\n* @event seeked\n*/",
        "meta": {
            "range": [
                5865,
                5948
            ],
            "filename": "player.js",
            "lineno": 776,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the player has finished jumping to a new time</p>",
        "kind": "event",
        "name": "seeked",
        "longname": "event:seeked",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired the first time a video is played\n* Not part of the HLS spec, and we're not sure if this is the best\n* implementation yet, so use sparingly. If you don't have a reason to\n* prevent playback, use `myPlayer.one('play');` instead.\n*\n* @event firstplay\n*/",
        "meta": {
            "range": [
                5964,
                6226
            ],
            "filename": "player.js",
            "lineno": 786,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired the first time a video is played\nNot part of the HLS spec, and we're not sure if this is the best\nimplementation yet, so use sparingly. If you don't have a reason to\nprevent playback, use <code>myPlayer.one('play');</code> instead.</p>",
        "kind": "event",
        "name": "firstplay",
        "longname": "event:firstplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired whenever the media has been paused\n*\n* @event pause\n*/",
        "meta": {
            "range": [
                6260,
                6326
            ],
            "filename": "player.js",
            "lineno": 805,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired whenever the media has been paused</p>",
        "kind": "event",
        "name": "pause",
        "longname": "event:pause",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired while the user agent is downloading media data\n*\n* @event progress\n*/",
        "meta": {
            "range": [
                6345,
                6426
            ],
            "filename": "player.js",
            "lineno": 816,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired while the user agent is downloading media data</p>",
        "kind": "event",
        "name": "progress",
        "longname": "event:progress",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the end of the media resource is reached (currentTime == duration)\n*\n* @event ended\n*/",
        "meta": {
            "range": [
                6454,
                6557
            ],
            "filename": "player.js",
            "lineno": 830,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the end of the media resource is reached (currentTime == duration)</p>",
        "kind": "event",
        "name": "ended",
        "longname": "event:ended",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the duration of the media resource is first known or changed\n*\n* @event durationchange\n*/",
        "meta": {
            "range": [
                6594,
                6700
            ],
            "filename": "player.js",
            "lineno": 847,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the duration of the media resource is first known or changed</p>",
        "kind": "event",
        "name": "durationchange",
        "longname": "event:durationchange",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle a click on the media element to play/pause\n*\n* @param {Object=} event Event object \n* @method handleTechClick\n*/",
        "meta": {
            "range": [
                6716,
                6841
            ],
            "filename": "player.js",
            "lineno": 857,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle a click on the media element to play/pause</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Event object</p>",
                "name": "event"
            }
        ],
        "kind": "function",
        "name": "handleTechClick",
        "longname": "handleTechClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle a tap on the media element. It will toggle the user\n* activity state, which hides and shows the controls.\n*\n* @method handleTechTap\n*/",
        "meta": {
            "range": [
                6890,
                7037
            ],
            "filename": "player.js",
            "lineno": 879,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle a tap on the media element. It will toggle the user\nactivity state, which hides and shows the controls.</p>",
        "kind": "function",
        "name": "handleTechTap",
        "longname": "handleTechTap",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle touch to start\n*\n* @method handleTechTouchStart\n*/",
        "meta": {
            "range": [
                7050,
                7113
            ],
            "filename": "player.js",
            "lineno": 889,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle touch to start</p>",
        "kind": "function",
        "name": "handleTechTouchStart",
        "longname": "handleTechTouchStart",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle touch to move\n*\n* @method handleTechTouchMove\n*/",
        "meta": {
            "range": [
                7126,
                7187
            ],
            "filename": "player.js",
            "lineno": 898,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle touch to move</p>",
        "kind": "function",
        "name": "handleTechTouchMove",
        "longname": "handleTechTouchMove",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle touch to end\n*\n* @method handleTechTouchEnd\n*/",
        "meta": {
            "range": [
                7206,
                7265
            ],
            "filename": "player.js",
            "lineno": 909,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle touch to end</p>",
        "kind": "function",
        "name": "handleTechTouchEnd",
        "longname": "handleTechTouchEnd",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update the duration of the player using the tech\n*\n* @private\n* @method updateDuration\n*/",
        "meta": {
            "range": [
                7281,
                7376
            ],
            "filename": "player.js",
            "lineno": 919,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Update the duration of the player using the tech</p>",
        "access": "private",
        "kind": "function",
        "name": "updateDuration",
        "longname": "updateDuration",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the player switches in or out of fullscreen mode\n*\n* @event fullscreenchange\n*/",
        "meta": {
            "range": [
                7434,
                7530
            ],
            "filename": "player.js",
            "lineno": 944,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the player switches in or out of fullscreen mode</p>",
        "kind": "event",
        "name": "fullscreenchange",
        "longname": "event:fullscreenchange",
        "scope": "global"
    },
    {
        "comment": "/**\n* native click events on the SWF aren't triggered on IE11, Win8.1RT\n* use stageclick events triggered from inside the SWF instead\n*\n* @private\n* @method handleStageClick\n*/",
        "meta": {
            "range": [
                7555,
                7731
            ],
            "filename": "player.js",
            "lineno": 957,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>native click events on the SWF aren't triggered on IE11, Win8.1RT\nuse stageclick events triggered from inside the SWF instead</p>",
        "access": "private",
        "kind": "function",
        "name": "handleStageClick",
        "longname": "handleStageClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle Tech Fullscreen Change\n*\n* @method handleTechFullscreenChange\n*/",
        "meta": {
            "range": [
                7744,
                7821
            ],
            "filename": "player.js",
            "lineno": 968,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle Tech Fullscreen Change</p>",
        "kind": "function",
        "name": "handleTechFullscreenChange",
        "longname": "handleTechFullscreenChange",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when an error occurred during the loading of an audio/video\n*\n* @event error\n*/",
        "meta": {
            "range": [
                7834,
                7925
            ],
            "filename": "player.js",
            "lineno": 977,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when an error occurred during the loading of an audio/video</p>",
        "kind": "event",
        "name": "error",
        "longname": "event:error",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the browser is intentionally not getting media data\n*\n* @event suspend\n*/",
        "meta": {
            "range": [
                7938,
                8028
            ],
            "filename": "player.js",
            "lineno": 986,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the browser is intentionally not getting media data</p>",
        "kind": "event",
        "name": "suspend",
        "longname": "event:suspend",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the loading of an audio/video is aborted\n*\n* @event abort\n*/",
        "meta": {
            "range": [
                8041,
                8118
            ],
            "filename": "player.js",
            "lineno": 995,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the loading of an audio/video is aborted</p>",
        "kind": "event",
        "name": "abort",
        "longname": "event:abort",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the current playlist is empty\n*\n* @event emptied\n*/",
        "meta": {
            "range": [
                8131,
                8199
            ],
            "filename": "player.js",
            "lineno": 1004,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the current playlist is empty</p>",
        "kind": "event",
        "name": "emptied",
        "longname": "event:emptied",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the browser is trying to get media data, but data is not available\n*\n* @event stalled\n*/",
        "meta": {
            "range": [
                8212,
                8317
            ],
            "filename": "player.js",
            "lineno": 1013,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the browser is trying to get media data, but data is not available</p>",
        "kind": "event",
        "name": "stalled",
        "longname": "event:stalled",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the browser has loaded meta data for the audio/video\n*\n* @event loadedmetadata\n*/",
        "meta": {
            "range": [
                8330,
                8428
            ],
            "filename": "player.js",
            "lineno": 1022,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the browser has loaded meta data for the audio/video</p>",
        "kind": "event",
        "name": "loadedmetadata",
        "longname": "event:loadedmetadata",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the browser has loaded the current frame of the audio/video\n*\n* @event loaddata\n*/",
        "meta": {
            "range": [
                8441,
                8540
            ],
            "filename": "player.js",
            "lineno": 1031,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the browser has loaded the current frame of the audio/video</p>",
        "kind": "event",
        "name": "loaddata",
        "longname": "event:loaddata",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the current playback position has changed\n*\n* @event timeupdate\n*/",
        "meta": {
            "range": [
                8553,
                8636
            ],
            "filename": "player.js",
            "lineno": 1040,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the current playback position has changed</p>",
        "kind": "event",
        "name": "timeupdate",
        "longname": "event:timeupdate",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the playing speed of the audio/video is changed\n*\n* @event ratechange\n*/",
        "meta": {
            "range": [
                8649,
                8738
            ],
            "filename": "player.js",
            "lineno": 1049,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the playing speed of the audio/video is changed</p>",
        "kind": "event",
        "name": "ratechange",
        "longname": "event:ratechange",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the volume has been changed\n*\n* @event volumechange\n*/",
        "meta": {
            "range": [
                8751,
                8822
            ],
            "filename": "player.js",
            "lineno": 1058,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the volume has been changed</p>",
        "kind": "event",
        "name": "volumechange",
        "longname": "event:volumechange",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fires when the text track has been changed\n*\n* @event texttrackchange\n*/",
        "meta": {
            "range": [
                8835,
                8913
            ],
            "filename": "player.js",
            "lineno": 1067,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fires when the text track has been changed</p>",
        "kind": "event",
        "name": "texttrackchange",
        "longname": "event:texttrackchange",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get object for cached values.\n*\n* @return {Object} \n* @method getCache\n*/",
        "meta": {
            "range": [
                8926,
                9005
            ],
            "filename": "player.js",
            "lineno": 1076,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get object for cached values.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "getCache",
        "longname": "getCache",
        "scope": "global"
    },
    {
        "comment": "/**\n* Pass values to the playback tech\n*\n* @param {String=} method Method \n* @param {Object=} arg Argument \n* @method techCall\n*/",
        "meta": {
            "range": [
                9018,
                9147
            ],
            "filename": "player.js",
            "lineno": 1086,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Pass values to the playback tech</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Method</p>",
                "name": "method"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Argument</p>",
                "name": "arg"
            }
        ],
        "kind": "function",
        "name": "techCall",
        "longname": "techCall",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get calls can't wait for the tech, and sometimes don't need to.\n*\n* @param {String} method Tech method\n* @return {Method}\n* @method techGet\n*/",
        "meta": {
            "range": [
                9202,
                9350
            ],
            "filename": "player.js",
            "lineno": 1111,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get calls can't wait for the tech, and sometimes don't need to.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Tech method</p>",
                "name": "method"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Method"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "techGet",
        "longname": "techGet",
        "scope": "global"
    },
    {
        "comment": "/**\n* start media playback\n* ```js\n*     myPlayer.play();\n* ```\n*\n* @return {Player} self\n* @method play\n*/",
        "meta": {
            "range": [
                9435,
                9542
            ],
            "filename": "player.js",
            "lineno": 1146,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>start media playback</p>\n<pre class=\"prettyprint source lang-js\"><code>    myPlayer.play();</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self</p>"
            }
        ],
        "kind": "function",
        "name": "play",
        "longname": "play",
        "scope": "global"
    },
    {
        "comment": "/**\n* Pause the video playback\n* ```js\n*     myPlayer.pause();\n* ```\n*\n* @return {Player} self\n* @method pause\n*/",
        "meta": {
            "range": [
                9558,
                9671
            ],
            "filename": "player.js",
            "lineno": 1160,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Pause the video playback</p>\n<pre class=\"prettyprint source lang-js\"><code>    myPlayer.pause();</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self</p>"
            }
        ],
        "kind": "function",
        "name": "pause",
        "longname": "pause",
        "scope": "global"
    },
    {
        "comment": "/**\n* Check if the player is paused\n* ```js\n*     var isPaused = myPlayer.paused();\n*     var isPlaying = !myPlayer.paused();\n* ```\n*\n* @return {Boolean} false if the media is currently playing, or true otherwise\n* @method paused\n*/",
        "meta": {
            "range": [
                9687,
                9919
            ],
            "filename": "player.js",
            "lineno": 1174,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Check if the player is paused</p>\n<pre class=\"prettyprint source lang-js\"><code>    var isPaused = myPlayer.paused();\n    var isPlaying = !myPlayer.paused();</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>false if the media is currently playing, or true otherwise</p>"
            }
        ],
        "kind": "function",
        "name": "paused",
        "longname": "paused",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns whether or not the user is \"scrubbing\". Scrubbing is when the user\n* has clicked the progress bar handle and is dragging it along the progress bar.\n*\n* @param  {Boolean} isScrubbing   True/false the user is scrubbing\n* @return {Boolean}               The scrubbing status when getting\n* @return {Object}                The player when setting\n* @method scrubbing\n*/",
        "meta": {
            "range": [
                9935,
                10314
            ],
            "filename": "player.js",
            "lineno": 1189,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Returns whether or not the user is &quot;scrubbing&quot;. Scrubbing is when the user\nhas clicked the progress bar handle and is dragging it along the progress bar.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>True/false the user is scrubbing</p>",
                "name": "isScrubbing"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>The scrubbing status when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The player when setting</p>"
            }
        ],
        "kind": "function",
        "name": "scrubbing",
        "longname": "scrubbing",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get or set the current time (in seconds)\n* ```js\n*     // get\n*     var whereYouAt = myPlayer.currentTime();\n*     // set\n*     myPlayer.currentTime(120); // 2 minutes into the video\n* ```\n*\n* @param  {Number|String=} seconds The time to seek to\n* @return {Number}        The time in seconds, when not setting\n* @return {Player}    self, when the current time is set\n* @method currentTime\n*/",
        "meta": {
            "range": [
                10363,
                10760
            ],
            "filename": "player.js",
            "lineno": 1214,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get or set the current time (in seconds)</p>\n<pre class=\"prettyprint source lang-js\"><code>    // get\n    var whereYouAt = myPlayer.currentTime();\n    // set\n    myPlayer.currentTime(120); // 2 minutes into the video</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number",
                        "String"
                    ]
                },
                "description": "<p>The time to seek to</p>",
                "name": "seconds"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>The time in seconds, when not setting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self, when the current time is set</p>"
            }
        ],
        "kind": "function",
        "name": "currentTime",
        "longname": "currentTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the length in time of the video in seconds\n* ```js\n*     var lengthOfVideo = myPlayer.duration();\n* ```\n* **NOTE**: The video must have started loading before the duration can be\n* known, and in the case of Flash, may not be known until the video starts\n* playing.\n*\n* @param {Number} seconds Duration when setting\n* @return {Number} The duration of the video in seconds when getting\n* @method duration\n*/",
        "meta": {
            "range": [
                10812,
                11227
            ],
            "filename": "player.js",
            "lineno": 1245,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the length in time of the video in seconds</p>\n<pre class=\"prettyprint source lang-js\"><code>    var lengthOfVideo = myPlayer.duration();</code></pre><p><strong>NOTE</strong>: The video must have started loading before the duration can be\nknown, and in the case of Flash, may not be known until the video starts\nplaying.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Duration when setting</p>",
                "name": "seconds"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>The duration of the video in seconds when getting</p>"
            }
        ],
        "kind": "function",
        "name": "duration",
        "longname": "duration",
        "scope": "global"
    },
    {
        "comment": "/**\n* Calculates how much time is left.\n* ```js\n*     var timeLeft = myPlayer.remainingTime();\n* ```\n* Not a native video element function, but useful\n*\n* @return {Number} The time remaining in seconds\n* @method remainingTime\n*/",
        "meta": {
            "range": [
                11276,
                11504
            ],
            "filename": "player.js",
            "lineno": 1274,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Calculates how much time is left.</p>\n<pre class=\"prettyprint source lang-js\"><code>    var timeLeft = myPlayer.remainingTime();</code></pre><p>Not a native video element function, but useful</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>The time remaining in seconds</p>"
            }
        ],
        "kind": "function",
        "name": "remainingTime",
        "longname": "remainingTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get a TimeRange object with the times of the video that have been downloaded\n*\n* If you just want the percent of the video that's been downloaded,\n* use bufferedPercent.\n* ```js\n*     // Number of different ranges of time have been buffered. Usually 1.\n*     numberOfRanges = bufferedTimeRange.length,\n*     // Time in seconds when the first range starts. Usually 0.\n*     firstRangeStart = bufferedTimeRange.start(0),\n*     // Time in seconds when the first range ends\n*     firstRangeEnd = bufferedTimeRange.end(0),\n*     // Length in seconds of the first time range\n*     firstRangeLength = firstRangeEnd - firstRangeStart;\n* ```\n*\n* @return {Object} A mock TimeRange object (following HTML spec)\n* @method buffered\n*/",
        "meta": {
            "range": [
                11529,
                12256
            ],
            "filename": "player.js",
            "lineno": 1292,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get a TimeRange object with the times of the video that have been downloaded</p>\n<p>If you just want the percent of the video that's been downloaded,\nuse bufferedPercent.</p>\n<pre class=\"prettyprint source lang-js\"><code>    // Number of different ranges of time have been buffered. Usually 1.\n    numberOfRanges = bufferedTimeRange.length,\n    // Time in seconds when the first range starts. Usually 0.\n    firstRangeStart = bufferedTimeRange.start(0),\n    // Time in seconds when the first range ends\n    firstRangeEnd = bufferedTimeRange.end(0),\n    // Length in seconds of the first time range\n    firstRangeLength = firstRangeEnd - firstRangeStart;</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>A mock TimeRange object (following HTML spec)</p>"
            }
        ],
        "kind": "function",
        "name": "buffered",
        "longname": "buffered",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the percent (as a decimal) of the video that's been downloaded\n* ```js\n*     var howMuchIsDownloaded = myPlayer.bufferedPercent();\n* ```\n* 0 means none, 1 means all.\n* (This method isn't in the HTML5 spec, but it's very convenient)\n*\n* @return {Number} A decimal between 0 and 1 representing the percent\n* @method bufferedPercent\n*/",
        "meta": {
            "range": [
                12287,
                12629
            ],
            "filename": "player.js",
            "lineno": 1321,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the percent (as a decimal) of the video that's been downloaded</p>\n<pre class=\"prettyprint source lang-js\"><code>    var howMuchIsDownloaded = myPlayer.bufferedPercent();</code></pre><p>0 means none, 1 means all.\n(This method isn't in the HTML5 spec, but it's very convenient)</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>A decimal between 0 and 1 representing the percent</p>"
            }
        ],
        "kind": "function",
        "name": "bufferedPercent",
        "longname": "bufferedPercent",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the ending time of the last buffered time range\n* This is used in the progress bar to encapsulate all time ranges.\n*\n* @return {Number} The end of the last buffered time range\n* @method bufferedEnd\n*/",
        "meta": {
            "range": [
                12642,
                12852
            ],
            "filename": "player.js",
            "lineno": 1336,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the ending time of the last buffered time range\nThis is used in the progress bar to encapsulate all time ranges.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>The end of the last buffered time range</p>"
            }
        ],
        "kind": "function",
        "name": "bufferedEnd",
        "longname": "bufferedEnd",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get or set the current volume of the media\n* ```js\n*     // get\n*     var howLoudIsIt = myPlayer.volume();\n*     // set\n*     myPlayer.volume(0.5); // Set volume to half\n* ```\n* 0 is off (muted), 1.0 is all the way up, 0.5 is half way.\n*\n* @param  {Number} percentAsDecimal The new volume as a decimal percent\n* @return {Number}              The current volume when getting\n* @return {Player}              self when setting\n* @method volume\n*/",
        "meta": {
            "range": [
                12889,
                13338
            ],
            "filename": "player.js",
            "lineno": 1355,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get or set the current volume of the media</p>\n<pre class=\"prettyprint source lang-js\"><code>    // get\n    var howLoudIsIt = myPlayer.volume();\n    // set\n    myPlayer.volume(0.5); // Set volume to half</code></pre><p>0 is off (muted), 1.0 is all the way up, 0.5 is half way.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>The new volume as a decimal percent</p>",
                "name": "percentAsDecimal"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>The current volume when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self when setting</p>"
            }
        ],
        "kind": "function",
        "name": "volume",
        "longname": "volume",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the current muted state, or turn mute on or off\n* ```js\n*     // get\n*     var isVolumeMuted = myPlayer.muted();\n*     // set\n*     myPlayer.muted(true); // mute the volume\n* ```\n*\n* @param  {Boolean=} muted True to mute, false to unmute\n* @return {Boolean} True if mute is on, false if not when getting\n* @return {Player} self when setting mute\n* @method muted\n*/",
        "meta": {
            "range": [
                13390,
                13764
            ],
            "filename": "player.js",
            "lineno": 1387,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the current muted state, or turn mute on or off</p>\n<pre class=\"prettyprint source lang-js\"><code>    // get\n    var isVolumeMuted = myPlayer.muted();\n    // set\n    myPlayer.muted(true); // mute the volume</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "optional": true,
                "description": "<p>True to mute, false to unmute</p>",
                "name": "muted"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>True if mute is on, false if not when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self when setting mute</p>"
            }
        ],
        "kind": "function",
        "name": "muted",
        "longname": "muted",
        "scope": "global"
    },
    {
        "comment": "/**\n* Check to see if fullscreen is supported\n*\n* @return {Boolean} \n* @method supportsFullScreen\n*/",
        "meta": {
            "range": [
                13795,
                13895
            ],
            "filename": "player.js",
            "lineno": 1411,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Check to see if fullscreen is supported</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "supportsFullScreen",
        "longname": "supportsFullScreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Check if the player is in fullscreen mode\n* ```js\n*     // get\n*     var fullscreenOrNot = myPlayer.isFullscreen();\n*     // set\n*     myPlayer.isFullscreen(true); // tell the player it's in fullscreen\n* ```\n* NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official\n* property and instead document.fullscreenElement is used. But isFullscreen is\n* still a valuable property for internal player workings.\n*\n* @param  {Boolean=} isFS Update the player's fullscreen state\n* @return {Boolean} true if fullscreen false if not when getting\n* @return {Player} self when setting\n* @method isFullscreen\n*/",
        "meta": {
            "range": [
                13908,
                14526
            ],
            "filename": "player.js",
            "lineno": 1421,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Check if the player is in fullscreen mode</p>\n<pre class=\"prettyprint source lang-js\"><code>    // get\n    var fullscreenOrNot = myPlayer.isFullscreen();\n    // set\n    myPlayer.isFullscreen(true); // tell the player it's in fullscreen</code></pre><p>NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official\nproperty and instead document.fullscreenElement is used. But isFullscreen is\nstill a valuable property for internal player workings.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "optional": true,
                "description": "<p>Update the player's fullscreen state</p>",
                "name": "isFS"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>true if fullscreen false if not when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self when setting</p>"
            }
        ],
        "kind": "function",
        "name": "isFullscreen",
        "longname": "isFullscreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Old naming for isFullscreen()\n*\n* @param  {Boolean=} isFS Update the player's fullscreen state\n* @return {Boolean} true if fullscreen false if not when getting\n* @return {Player} self when setting\n* @deprecated\n* @method isFullScreen\n*/",
        "meta": {
            "range": [
                14551,
                14793
            ],
            "filename": "player.js",
            "lineno": 1446,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Old naming for isFullscreen()</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "optional": true,
                "description": "<p>Update the player's fullscreen state</p>",
                "name": "isFS"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>true if fullscreen false if not when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self when setting</p>"
            }
        ],
        "deprecated": true,
        "kind": "function",
        "name": "isFullScreen",
        "longname": "isFullScreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Increase the size of the video to full screen\n* ```js\n*     myPlayer.requestFullscreen();\n* ```\n* In some browsers, full screen is not supported natively, so it enters\n* \"full window mode\", where the video fills the browser window.\n* In browsers and devices that support native full screen, sometimes the\n* browser's default controls will be shown, and not the Video.js custom skin.\n* This includes most mobile devices (iOS, Android) and older versions of\n* Safari.\n*\n* @return {Player} self\n* @method requestFullscreen\n*/",
        "meta": {
            "range": [
                14809,
                15337
            ],
            "filename": "player.js",
            "lineno": 1460,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Increase the size of the video to full screen</p>\n<pre class=\"prettyprint source lang-js\"><code>    myPlayer.requestFullscreen();</code></pre><p>In some browsers, full screen is not supported natively, so it enters\n&quot;full window mode&quot;, where the video fills the browser window.\nIn browsers and devices that support native full screen, sometimes the\nbrowser's default controls will be shown, and not the Video.js custom skin.\nThis includes most mobile devices (iOS, Android) and older versions of\nSafari.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self</p>"
            }
        ],
        "kind": "function",
        "name": "requestFullscreen",
        "longname": "requestFullscreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Old naming for requestFullscreen\n*\n* @return {Boolean} true if fullscreen false if not when getting\n* @deprecated\n* @method requestFullScreen\n*/",
        "meta": {
            "range": [
                15461,
                15611
            ],
            "filename": "player.js",
            "lineno": 1516,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Old naming for requestFullscreen</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>true if fullscreen false if not when getting</p>"
            }
        ],
        "deprecated": true,
        "kind": "function",
        "name": "requestFullScreen",
        "longname": "requestFullScreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Return the video to its normal size after having been in full screen mode\n* ```js\n*     myPlayer.exitFullscreen();\n* ```\n*\n* @return {Player} self\n* @method exitFullscreen\n*/",
        "meta": {
            "range": [
                15627,
                15807
            ],
            "filename": "player.js",
            "lineno": 1528,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Return the video to its normal size after having been in full screen mode</p>\n<pre class=\"prettyprint source lang-js\"><code>    myPlayer.exitFullscreen();</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self</p>"
            }
        ],
        "kind": "function",
        "name": "exitFullscreen",
        "longname": "exitFullscreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Old naming for exitFullscreen\n*\n* @return {Player} self\n* @deprecated\n* @method cancelFullScreen\n*/",
        "meta": {
            "range": [
                15859,
                15964
            ],
            "filename": "player.js",
            "lineno": 1554,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Old naming for exitFullscreen</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self</p>"
            }
        ],
        "deprecated": true,
        "kind": "function",
        "name": "cancelFullScreen",
        "longname": "cancelFullScreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.\n*\n* @method enterFullWindow\n*/",
        "meta": {
            "range": [
                15980,
                16122
            ],
            "filename": "player.js",
            "lineno": 1566,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.</p>",
        "kind": "function",
        "name": "enterFullWindow",
        "longname": "enterFullWindow",
        "scope": "global"
    },
    {
        "comment": "/**\n* Check for call to either exit full window or full screen on ESC key\n*\n* @param {String} event Event to check for key press\n* @method fullWindowOnEscKey\n*/",
        "meta": {
            "range": [
                16177,
                16337
            ],
            "filename": "player.js",
            "lineno": 1589,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Check for call to either exit full window or full screen on ESC key</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Event to check for key press</p>",
                "name": "event"
            }
        ],
        "kind": "function",
        "name": "fullWindowOnEscKey",
        "longname": "fullWindowOnEscKey",
        "scope": "global"
    },
    {
        "comment": "/**\n* Exit full window \n*\n* @method exitFullWindow\n*/",
        "meta": {
            "range": [
                16368,
                16421
            ],
            "filename": "player.js",
            "lineno": 1605,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Exit full window</p>",
        "kind": "function",
        "name": "exitFullWindow",
        "longname": "exitFullWindow",
        "scope": "global"
    },
    {
        "comment": "/**\n* Select source based on tech order\n*\n* @param {Array} sources The sources for a media asset\n* @return {Object|Boolean} Object of source and tech order, otherwise false\n* @method selectSource\n*/",
        "meta": {
            "range": [
                16467,
                16665
            ],
            "filename": "player.js",
            "lineno": 1625,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Select source based on tech order</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>The sources for a media asset</p>",
                "name": "sources"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object",
                        "Boolean"
                    ]
                },
                "description": "<p>Object of source and tech order, otherwise false</p>"
            }
        ],
        "kind": "function",
        "name": "selectSource",
        "longname": "selectSource",
        "scope": "global"
    },
    {
        "comment": "/**\n* The source function updates the video source\n* There are three types of variables you can pass as the argument.\n* **URL String**: A URL to the the video file. Use this method if you are sure\n* the current playback technology (HTML5/Flash) can support the source you\n* provide. Currently only MP4 files can be used in both HTML5 and Flash.\n* ```js\n*     myPlayer.src(\"http://www.example.com/path/to/video.mp4\");\n* ```\n* **Source Object (or element):** A javascript object containing information\n* about the source file. Use this method if you want the player to determine if\n* it can support the file using the type information.\n* ```js\n*     myPlayer.src({ type: \"video/mp4\", src: \"http://www.example.com/path/to/video.mp4\" });\n* ```\n* **Array of Source Objects:** To provide multiple versions of the source so\n* that it can be played using HTML5 across browsers you can use an array of\n* source objects. Video.js will detect which version is supported and load that\n* file.\n* ```js\n*     myPlayer.src([\n*       { type: \"video/mp4\", src: \"http://www.example.com/path/to/video.mp4\" },\n*       { type: \"video/webm\", src: \"http://www.example.com/path/to/video.webm\" },\n*       { type: \"video/ogg\", src: \"http://www.example.com/path/to/video.ogv\" }\n*     ]);\n* ```\n*\n* @param  {String|Object|Array=} source The source URL, object, or array of sources\n* @return {String} The current video source when getting\n* @return {String} The player when setting\n* @method src\n*/",
        "meta": {
            "range": [
                16753,
                18222
            ],
            "filename": "player.js",
            "lineno": 1661,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>The source function updates the video source\nThere are three types of variables you can pass as the argument.\n<strong>URL String</strong>: A URL to the the video file. Use this method if you are sure\nthe current playback technology (HTML5/Flash) can support the source you\nprovide. Currently only MP4 files can be used in both HTML5 and Flash.</p>\n<pre class=\"prettyprint source lang-js\"><code>    myPlayer.src(&quot;http://www.example.com/path/to/video.mp4&quot;);</code></pre><p><strong>Source Object (or element):</strong> A javascript object containing information\nabout the source file. Use this method if you want the player to determine if\nit can support the file using the type information.</p>\n<pre class=\"prettyprint source lang-js\"><code>    myPlayer.src({ type: &quot;video/mp4&quot;, src: &quot;http://www.example.com/path/to/video.mp4&quot; });</code></pre><p><strong>Array of Source Objects:</strong> To provide multiple versions of the source so\nthat it can be played using HTML5 across browsers you can use an array of\nsource objects. Video.js will detect which version is supported and load that\nfile.</p>\n<pre class=\"prettyprint source lang-js\"><code>    myPlayer.src([\n      { type: &quot;video/mp4&quot;, src: &quot;http://www.example.com/path/to/video.mp4&quot; },\n      { type: &quot;video/webm&quot;, src: &quot;http://www.example.com/path/to/video.webm&quot; },\n      { type: &quot;video/ogg&quot;, src: &quot;http://www.example.com/path/to/video.ogv&quot; }\n    ]);</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "String",
                        "Object",
                        "Array"
                    ]
                },
                "description": "<p>The source URL, object, or array of sources</p>",
                "name": "source"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The current video source when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The player when setting</p>"
            }
        ],
        "kind": "function",
        "name": "src",
        "longname": "src",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle an array of source objects\n*\n* @param  {Array} sources Array of source objects\n* @private\n* @method sourceList_\n*/",
        "meta": {
            "range": [
                18388,
                18515
            ],
            "filename": "player.js",
            "lineno": 1748,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Handle an array of source objects</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>Array of source objects</p>",
                "name": "sources"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "sourceList_",
        "longname": "sourceList_",
        "scope": "global"
    },
    {
        "comment": "/**\n* Begin loading the src data.\n*\n* @return {Player} Returns the player\n* @method load\n*/",
        "meta": {
            "range": [
                18585,
                18676
            ],
            "filename": "player.js",
            "lineno": 1778,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Begin loading the src data.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>Returns the player</p>"
            }
        ],
        "kind": "function",
        "name": "load",
        "longname": "load",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4\n* Can be used in conjuction with `currentType` to assist in rebuilding the current source object.\n*\n* @return {String} The current source\n* @method currentSrc\n*/",
        "meta": {
            "range": [
                18692,
                18952
            ],
            "filename": "player.js",
            "lineno": 1789,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4\nCan be used in conjuction with <code>currentType</code> to assist in rebuilding the current source object.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The current source</p>"
            }
        ],
        "kind": "function",
        "name": "currentSrc",
        "longname": "currentSrc",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the current source type e.g. video/mp4\n* This can allow you rebuild the current source object so that you could load the same\n* source and tech later\n*\n* @return {String} The source MIME type\n* @method currentType\n*/",
        "meta": {
            "range": [
                18965,
                19191
            ],
            "filename": "player.js",
            "lineno": 1800,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the current source type e.g. video/mp4\nThis can allow you rebuild the current source object so that you could load the same\nsource and tech later</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The source MIME type</p>"
            }
        ],
        "kind": "function",
        "name": "currentType",
        "longname": "currentType",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get or set the preload attribute\n*\n* @param {Boolean} value Boolean to determine if preload should be used\n* @return {String} The preload attribute value when getting\n* @return {Player} Returns the player when setting\n* @method preload\n*/",
        "meta": {
            "range": [
                19204,
                19448
            ],
            "filename": "player.js",
            "lineno": 1812,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get or set the preload attribute</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Boolean to determine if preload should be used</p>",
                "name": "value"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The preload attribute value when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>Returns the player when setting</p>"
            }
        ],
        "kind": "function",
        "name": "preload",
        "longname": "preload",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get or set the autoplay attribute.\n*\n* @param {Boolean} value Boolean to determine if preload should be used\n* @return {String} The autoplay attribute value when getting\n* @return {Player} Returns the player when setting\n* @method autoplay\n*/",
        "meta": {
            "range": [
                19476,
                19724
            ],
            "filename": "player.js",
            "lineno": 1829,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get or set the autoplay attribute.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Boolean to determine if preload should be used</p>",
                "name": "value"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The autoplay attribute value when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>Returns the player when setting</p>"
            }
        ],
        "kind": "function",
        "name": "autoplay",
        "longname": "autoplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get or set the loop attribute on the video element.\n*\n* @param {Boolean} value Boolean to determine if preload should be used\n* @return {String} The loop attribute value when getting\n* @return {Player} Returns the player when setting\n* @method loop\n*/",
        "meta": {
            "range": [
                19752,
                20009
            ],
            "filename": "player.js",
            "lineno": 1846,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get or set the loop attribute on the video element.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Boolean to determine if preload should be used</p>",
                "name": "value"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The loop attribute value when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>Returns the player when setting</p>"
            }
        ],
        "kind": "function",
        "name": "loop",
        "longname": "loop",
        "scope": "global"
    },
    {
        "comment": "/**\n* get or set the poster image source url\n* ##### EXAMPLE:\n* ```js\n*     // get\n*     var currentPoster = myPlayer.poster();\n*     // set\n*     myPlayer.poster('http://example.com/myImage.jpg');\n* ```\n*\n* @param  {String=} src Poster image source URL\n* @return {String} poster URL when getting\n* @return {Player} self when setting\n* @method poster\n*/",
        "meta": {
            "range": [
                20037,
                20390
            ],
            "filename": "player.js",
            "lineno": 1863,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>get or set the poster image source url</p>\n<h5>EXAMPLE:</h5><pre class=\"prettyprint source lang-js\"><code>    // get\n    var currentPoster = myPlayer.poster();\n    // set\n    myPlayer.poster('http://example.com/myImage.jpg');</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Poster image source URL</p>",
                "name": "src"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>poster URL when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self when setting</p>"
            }
        ],
        "kind": "function",
        "name": "poster",
        "longname": "poster",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get or set whether or not the controls are showing.\n*\n* @param  {Boolean} bool Set controls to showing or not\n* @return {Boolean}    Controls are showing\n* @method controls\n*/",
        "meta": {
            "range": [
                20460,
                20641
            ],
            "filename": "player.js",
            "lineno": 1901,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get or set whether or not the controls are showing.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Set controls to showing or not</p>",
                "name": "bool"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Controls are showing</p>"
            }
        ],
        "kind": "function",
        "name": "controls",
        "longname": "controls",
        "scope": "global"
    },
    {
        "comment": "/**\n* Toggle native controls on/off. Native controls are the controls built into\n* devices (e.g. default iPhone controls), Flash, or other techs\n* (e.g. Vimeo Controls)\n* **This should only be set by the current tech, because only the tech knows\n* if it can support native controls**\n*\n* @param  {Boolean} bool    True signals that native controls are on\n* @return {Player}      Returns the player\n* @private\n* @method usingNativeControls\n*/",
        "meta": {
            "range": [
                20744,
                21185
            ],
            "filename": "player.js",
            "lineno": 1942,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Toggle native controls on/off. Native controls are the controls built into\ndevices (e.g. default iPhone controls), Flash, or other techs\n(e.g. Vimeo Controls)\n<strong>This should only be set by the current tech, because only the tech knows\nif it can support native controls</strong></p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>True signals that native controls are on</p>",
                "name": "bool"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>Returns the player</p>"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "usingNativeControls",
        "longname": "usingNativeControls",
        "scope": "global"
    },
    {
        "comment": "/**\n* player is using the native device controls\n*\n* @event usingnativecontrols\n* @memberof Player\n* @instance\n* @private\n*/",
        "meta": {
            "range": [
                21213,
                21337
            ],
            "filename": "player.js",
            "lineno": 1963,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>player is using the native device controls</p>",
        "kind": "event",
        "name": "usingnativecontrols",
        "memberof": "Player",
        "scope": "instance",
        "access": "private",
        "longname": "Player#event:usingnativecontrols"
    },
    {
        "comment": "/**\n* player is using the custom HTML controls\n*\n* @event usingcustomcontrols\n* @memberof Player\n* @instance\n* @private\n*/",
        "meta": {
            "range": [
                21350,
                21472
            ],
            "filename": "player.js",
            "lineno": 1975,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>player is using the custom HTML controls</p>",
        "kind": "event",
        "name": "usingcustomcontrols",
        "memberof": "Player",
        "scope": "instance",
        "access": "private",
        "longname": "Player#event:usingcustomcontrols"
    },
    {
        "comment": "/**\n* Set or get the current MediaError\n*\n* @param  {*} err A MediaError or a String/Number to be turned into a MediaError\n* @return {MediaError|null}     when getting\n* @return {Player}              when setting\n* @method error\n*/",
        "meta": {
            "range": [
                21497,
                21728
            ],
            "filename": "player.js",
            "lineno": 1991,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Set or get the current MediaError</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "*"
                    ]
                },
                "description": "<p>A MediaError or a String/Number to be turned into a MediaError</p>",
                "name": "err"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "MediaError",
                        "null"
                    ]
                },
                "description": "<p>when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>when setting</p>"
            }
        ],
        "kind": "function",
        "name": "error",
        "longname": "error",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns whether or not the player is in the \"ended\" state.\n*\n* @return {Boolean} True if the player is in the ended state, false if not.\n* @method ended\n*/",
        "meta": {
            "range": [
                21825,
                21986
            ],
            "filename": "player.js",
            "lineno": 2031,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Returns whether or not the player is in the &quot;ended&quot; state.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>True if the player is in the ended state, false if not.</p>"
            }
        ],
        "kind": "function",
        "name": "ended",
        "longname": "ended",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns whether or not the player is in the \"seeking\" state.\n*\n* @return {Boolean} True if the player is in the seeking state, false if not.\n* @method seeking\n*/",
        "meta": {
            "range": [
                21993,
                22160
            ],
            "filename": "player.js",
            "lineno": 2039,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Returns whether or not the player is in the &quot;seeking&quot; state.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>True if the player is in the seeking state, false if not.</p>"
            }
        ],
        "kind": "function",
        "name": "seeking",
        "longname": "seeking",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns the TimeRanges of the media that are currently available\n* for seeking to.\n*\n* @return {TimeRanges} the seekable intervals of the media timeline\n* @method seekable\n*/",
        "meta": {
            "range": [
                22167,
                22347
            ],
            "filename": "player.js",
            "lineno": 2047,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Returns the TimeRanges of the media that are currently available\nfor seeking to.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "TimeRanges"
                    ]
                },
                "description": "<p>the seekable intervals of the media timeline</p>"
            }
        ],
        "kind": "function",
        "name": "seekable",
        "longname": "seekable",
        "scope": "global"
    },
    {
        "comment": "/**\n* Report user activity \n*\n* @param {Object} event Event object\n* @method reportUserActivity\n*/",
        "meta": {
            "range": [
                22354,
                22452
            ],
            "filename": "player.js",
            "lineno": 2056,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Report user activity</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Event object</p>",
                "name": "event"
            }
        ],
        "kind": "function",
        "name": "reportUserActivity",
        "longname": "reportUserActivity",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get/set if user is active\n*\n* @param {Boolean} bool Value when setting\n* @return {Boolean} Value if user is active user when getting\n* @method userActive\n*/",
        "meta": {
            "range": [
                22465,
                22627
            ],
            "filename": "player.js",
            "lineno": 2066,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get/set if user is active</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Value when setting</p>",
                "name": "bool"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Value if user is active user when getting</p>"
            }
        ],
        "kind": "function",
        "name": "userActive",
        "longname": "userActive",
        "scope": "global"
    },
    {
        "comment": "/**\n* Listen for user activity based on timeout value\n*\n* @method listenForUserActivity\n*/",
        "meta": {
            "range": [
                22754,
                22844
            ],
            "filename": "player.js",
            "lineno": 2115,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Listen for user activity based on timeout value</p>",
        "kind": "function",
        "name": "listenForUserActivity",
        "longname": "listenForUserActivity",
        "scope": "global"
    },
    {
        "comment": "/**\n* Gets or sets the current playback rate.  A playback rate of\n* 1.0 represents normal speed and 0.5 would indicate half-speed\n* playback, for instance.\n* @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate\n*\n* @param  {Number} rate    New playback rate to set.\n* @return {Number}         Returns the new playback rate when setting\n* @return {Number}         Returns the current playback rate when getting\n* @method playbackRate\n*/",
        "meta": {
            "range": [
                23082,
                23553
            ],
            "filename": "player.js",
            "lineno": 2199,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Gets or sets the current playback rate.  A playback rate of\n1.0 represents normal speed and 0.5 would indicate half-speed\nplayback, for instance.</p>",
        "see": [
            "https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-playbackrate"
        ],
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>New playback rate to set.</p>",
                "name": "rate"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Returns the new playback rate when setting</p>"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Returns the current playback rate when getting</p>"
            }
        ],
        "kind": "function",
        "name": "playbackRate",
        "longname": "playbackRate",
        "scope": "global"
    },
    {
        "comment": "/**\n* Gets or sets the audio flag\n*\n* @param  {Boolean} bool    True signals that this is an audio player.\n* @return {Boolean}         Returns true if player is audio, false if not when getting\n* @return {Player}      Returns the player if setting\n* @private\n* @method isAudio\n*/",
        "meta": {
            "range": [
                23593,
                23872
            ],
            "filename": "player.js",
            "lineno": 2223,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Gets or sets the audio flag</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>True signals that this is an audio player.</p>",
                "name": "bool"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>Returns true if player is audio, false if not when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>Returns the player if setting</p>"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "isAudio",
        "longname": "isAudio",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns the current state of network activity for the element, from\n* the codes in the list below.\n* - NETWORK_EMPTY (numeric value 0)\n*   The element has not yet been initialised. All attributes are in\n*   their initial states.\n* - NETWORK_IDLE (numeric value 1)\n*   The element's resource selection algorithm is active and has\n*   selected a resource, but it is not actually using the network at\n*   this time.\n* - NETWORK_LOADING (numeric value 2)\n*   The user agent is actively trying to download data.\n* - NETWORK_NO_SOURCE (numeric value 3)\n*   The element's resource selection algorithm is active, but it has\n*   not yet found a resource to use.\n*\n* @see https://html.spec.whatwg.org/multipage/embedded-content.html#network-states\n* @return {Number} the current network activity state\n* @method networkState\n*/",
        "meta": {
            "range": [
                23900,
                24723
            ],
            "filename": "player.js",
            "lineno": 2241,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Returns the current state of network activity for the element, from\nthe codes in the list below.</p>\n<ul>\n<li>NETWORK_EMPTY (numeric value 0)\nThe element has not yet been initialised. All attributes are in\ntheir initial states.</li>\n<li>NETWORK_IDLE (numeric value 1)\nThe element's resource selection algorithm is active and has\nselected a resource, but it is not actually using the network at\nthis time.</li>\n<li>NETWORK_LOADING (numeric value 2)\nThe user agent is actively trying to download data.</li>\n<li>NETWORK_NO_SOURCE (numeric value 3)\nThe element's resource selection algorithm is active, but it has\nnot yet found a resource to use.</li>\n</ul>",
        "see": [
            "https://html.spec.whatwg.org/multipage/embedded-content.html#network-states"
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>the current network activity state</p>"
            }
        ],
        "kind": "function",
        "name": "networkState",
        "longname": "networkState",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns a value that expresses the current state of the element\n* with respect to rendering the current playback position, from the\n* codes in the list below.\n* - HAVE_NOTHING (numeric value 0)\n*   No information regarding the media resource is available.\n* - HAVE_METADATA (numeric value 1)\n*   Enough of the resource has been obtained that the duration of the\n*   resource is available.\n* - HAVE_CURRENT_DATA (numeric value 2)\n*   Data for the immediate current playback position is available.\n* - HAVE_FUTURE_DATA (numeric value 3)\n*   Data for the immediate current playback position is available, as\n*   well as enough data for the user agent to advance the current\n*   playback position in the direction of playback.\n* - HAVE_ENOUGH_DATA (numeric value 4)\n*   The user agent estimates that enough data is available for\n*   playback to proceed uninterrupted.\n*\n* @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-readystate\n* @return {Number} the current playback rendering state\n* @method readyState\n*/",
        "meta": {
            "range": [
                24736,
                25776
            ],
            "filename": "player.js",
            "lineno": 2265,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Returns a value that expresses the current state of the element\nwith respect to rendering the current playback position, from the\ncodes in the list below.</p>\n<ul>\n<li>HAVE_NOTHING (numeric value 0)\nNo information regarding the media resource is available.</li>\n<li>HAVE_METADATA (numeric value 1)\nEnough of the resource has been obtained that the duration of the\nresource is available.</li>\n<li>HAVE_CURRENT_DATA (numeric value 2)\nData for the immediate current playback position is available.</li>\n<li>HAVE_FUTURE_DATA (numeric value 3)\nData for the immediate current playback position is available, as\nwell as enough data for the user agent to advance the current\nplayback position in the direction of playback.</li>\n<li>HAVE_ENOUGH_DATA (numeric value 4)\nThe user agent estimates that enough data is available for\nplayback to proceed uninterrupted.</li>\n</ul>",
        "see": [
            "https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-readystate"
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>the current playback rendering state</p>"
            }
        ],
        "kind": "function",
        "name": "readyState",
        "longname": "readyState",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get an array of associated text tracks. captions, subtitles, chapters, descriptions\n* http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks\n*\n* @return {Array}           Array of track objects\n* @method textTracks\n*/",
        "meta": {
            "range": [
                26233,
                26491
            ],
            "filename": "player.js",
            "lineno": 2300,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get an array of associated text tracks. captions, subtitles, chapters, descriptions\nhttp://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>Array of track objects</p>"
            }
        ],
        "kind": "function",
        "name": "textTracks",
        "longname": "textTracks",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get an array of remote text tracks\n*\n* @return {Array}\n* @method remoteTextTracks\n*/",
        "meta": {
            "range": [
                26510,
                26600
            ],
            "filename": "player.js",
            "lineno": 2313,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get an array of remote text tracks</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "remoteTextTracks",
        "longname": "remoteTextTracks",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add a text track\n* In addition to the W3C settings we allow adding additional info through options.\n* http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack\n*\n* @param {String}  kind        Captions, subtitles, chapters, descriptions, or metadata\n* @param {String=} label       Optional label\n* @param {String=} language    Optional language\n* @method addTextTrack\n*/",
        "meta": {
            "range": [
                26613,
                27023
            ],
            "filename": "player.js",
            "lineno": 2323,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Add a text track\nIn addition to the W3C settings we allow adding additional info through options.\nhttp://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Captions, subtitles, chapters, descriptions, or metadata</p>",
                "name": "kind"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Optional label</p>",
                "name": "label"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Optional language</p>",
                "name": "language"
            }
        ],
        "kind": "function",
        "name": "addTextTrack",
        "longname": "addTextTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add a remote text track\n*\n* @param {Object} options    Options for remote text track\n* @method addRemoteTextTrack\n*/",
        "meta": {
            "range": [
                27036,
                27158
            ],
            "filename": "player.js",
            "lineno": 2337,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Add a remote text track</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Options for remote text track</p>",
                "name": "options"
            }
        ],
        "kind": "function",
        "name": "addRemoteTextTrack",
        "longname": "addRemoteTextTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Remove a remote text track\n*\n* @param {Object} track    Remote text track to remove\n* @method removeRemoteTextTrack\n*/",
        "meta": {
            "range": [
                27171,
                27295
            ],
            "filename": "player.js",
            "lineno": 2347,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Remove a remote text track</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Remote text track to remove</p>",
                "name": "track"
            }
        ],
        "kind": "function",
        "name": "removeRemoteTextTrack",
        "longname": "removeRemoteTextTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get video width\n*\n* @return {Number} Video width\n* @method videoWidth\n*/",
        "meta": {
            "range": [
                27308,
                27386
            ],
            "filename": "player.js",
            "lineno": 2357,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get video width</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Video width</p>"
            }
        ],
        "kind": "function",
        "name": "videoWidth",
        "longname": "videoWidth",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get video height\n*\n* @return {Number} Video height\n* @method videoHeight\n*/",
        "meta": {
            "range": [
                27399,
                27480
            ],
            "filename": "player.js",
            "lineno": 2367,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get video height</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Video height</p>"
            }
        ],
        "kind": "function",
        "name": "videoHeight",
        "longname": "videoHeight",
        "scope": "global"
    },
    {
        "comment": "/**\n* The player's language code\n* NOTE: The language should be set in the player options if you want the\n* the controls to be built with a specific language. Changing the lanugage\n* later will not update controls text.\n*\n* @param {String} code  The locale string\n* @return {String}      The locale string when getting\n* @return {Player}      self when setting\n* @method language\n*/",
        "meta": {
            "range": [
                27541,
                27923
            ],
            "filename": "player.js",
            "lineno": 2393,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>The player's language code\nNOTE: The language should be set in the player options if you want the\nthe controls to be built with a specific language. Changing the lanugage\nlater will not update controls text.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The locale string</p>",
                "name": "code"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The locale string when getting</p>"
            },
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>self when setting</p>"
            }
        ],
        "kind": "function",
        "name": "language",
        "longname": "language",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the player's language dictionary\n* Merge every time, because a newly added plugin might call videojs.addLanguage() at any time\n* Languages specified directly in the player options have precedence\n*\n* @return {Array} Array of languages\n* @method languages\n*/",
        "meta": {
            "range": [
                27951,
                28218
            ],
            "filename": "player.js",
            "lineno": 2413,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the player's language dictionary\nMerge every time, because a newly added plugin might call videojs.addLanguage() at any time\nLanguages specified directly in the player options have precedence</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>Array of languages</p>"
            }
        ],
        "kind": "function",
        "name": "languages",
        "longname": "languages",
        "scope": "global"
    },
    {
        "comment": "/**\n* Converts track info to JSON\n*\n* @return {Object} JSON object of options\n* @method toJSON\n*/",
        "meta": {
            "range": [
                28231,
                28328
            ],
            "filename": "player.js",
            "lineno": 2425,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Converts track info to JSON</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>JSON object of options</p>"
            }
        ],
        "kind": "function",
        "name": "toJSON",
        "longname": "toJSON",
        "scope": "global"
    },
    {
        "comment": "/**\n* Gets tag settings\n*\n* @param {Element} tag The player tag\n* @return {Array} An array of sources and track objects\n* @static\n* @method getTagSettings\n*/",
        "meta": {
            "range": [
                28383,
                28540
            ],
            "filename": "player.js",
            "lineno": 2449,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Gets tag settings</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>The player tag</p>",
                "name": "tag"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Array"
                    ]
                },
                "description": "<p>An array of sources and track objects</p>"
            }
        ],
        "scope": "static",
        "kind": "function",
        "name": "getTagSettings",
        "longname": "getTagSettings"
    },
    {
        "comment": "/**\n* Fired when the player has initial duration and dimension information\n*\n* @event loadedmetadata\n*/",
        "meta": {
            "range": [
                28971,
                29074
            ],
            "filename": "player.js",
            "lineno": 2519,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the player has initial duration and dimension information</p>",
        "kind": "event",
        "name": "loadedmetadata",
        "longname": "event:loadedmetadata",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the player has downloaded data at the current playback position\n*\n* @event loadeddata\n*/",
        "meta": {
            "range": [
                29081,
                29186
            ],
            "filename": "player.js",
            "lineno": 2526,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the player has downloaded data at the current playback position</p>",
        "kind": "event",
        "name": "loadeddata",
        "longname": "event:loadeddata",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the player has finished downloading the source data\n*\n* @event loadedalldata\n*/",
        "meta": {
            "range": [
                29193,
                29289
            ],
            "filename": "player.js",
            "lineno": 2533,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the player has finished downloading the source data</p>",
        "kind": "event",
        "name": "loadedalldata",
        "longname": "event:loadedalldata",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the user is active, e.g. moves the mouse over the player\n*\n* @event useractive\n*/",
        "meta": {
            "range": [
                29296,
                29394
            ],
            "filename": "player.js",
            "lineno": 2540,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the user is active, e.g. moves the mouse over the player</p>",
        "kind": "event",
        "name": "useractive",
        "longname": "event:useractive",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the user is inactive, e.g. a short delay after the last mouse move or control interaction\n*\n* @event userinactive\n*/",
        "meta": {
            "range": [
                29401,
                29534
            ],
            "filename": "player.js",
            "lineno": 2547,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the user is inactive, e.g. a short delay after the last mouse move or control interaction</p>",
        "kind": "event",
        "name": "userinactive",
        "longname": "event:userinactive",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the current playback position has changed *\n* During playback this is fired every 15-250 milliseconds, depending on the\n* playback technology in use.\n*\n* @event timeupdate\n*/",
        "meta": {
            "range": [
                29541,
                29732
            ],
            "filename": "player.js",
            "lineno": 2554,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the current playback position has changed *\nDuring playback this is fired every 15-250 milliseconds, depending on the\nplayback technology in use.</p>",
        "kind": "event",
        "name": "timeupdate",
        "longname": "event:timeupdate",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when the volume changes\n*\n* @event volumechange\n*/",
        "meta": {
            "range": [
                29739,
                29801
            ],
            "filename": "player.js",
            "lineno": 2563,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when the volume changes</p>",
        "kind": "event",
        "name": "volumechange",
        "longname": "event:volumechange",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fired when an error occurs\n*\n* @event error\n*/",
        "meta": {
            "range": [
                29808,
                29860
            ],
            "filename": "player.js",
            "lineno": 2570,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Fired when an error occurs</p>",
        "kind": "event",
        "name": "error",
        "longname": "event:error",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file plugins.js\n*/",
        "meta": {
            "range": [
                0,
                25
            ],
            "filename": "plugins.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "plugins.js",
        "kind": "file",
        "description": "<p>plugins.js</p>",
        "preserveName": true,
        "longname": "plugins.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The method for registering a video.js plugin\n*\n* @param  {String} name The name of the plugin\n* @param  {Function} init The function that is run when the player inits\n* @method plugin\n*/",
        "meta": {
            "range": [
                32,
                224
            ],
            "filename": "plugins.js",
            "lineno": 6,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>The method for registering a video.js plugin</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The name of the plugin</p>",
                "name": "name"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>The function that is run when the player inits</p>",
                "name": "init"
            }
        ],
        "kind": "function",
        "name": "plugin",
        "longname": "plugin",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file poster-image.js\n*/",
        "meta": {
            "range": [
                0,
                30
            ],
            "filename": "poster-image.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "poster-image.js",
        "kind": "file",
        "description": "<p>poster-image.js</p>",
        "preserveName": true,
        "longname": "poster-image.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The component that handles showing the poster image.\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Button\n* @class PosterImage\n*/",
        "meta": {
            "range": [
                149,
                310
            ],
            "filename": "poster-image.js",
            "lineno": 12,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>The component that handles showing the poster image.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Button"
        ],
        "kind": "class",
        "name": "PosterImage",
        "longname": "PosterImage",
        "scope": "global"
    },
    {
        "comment": "/**\n* Clean up the poster image\n*\n* @method dispose\n*/",
        "meta": {
            "range": [
                338,
                392
            ],
            "filename": "poster-image.js",
            "lineno": 29,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Clean up the poster image</p>",
        "kind": "function",
        "name": "dispose",
        "longname": "dispose",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the poster's image element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                408,
                491
            ],
            "filename": "poster-image.js",
            "lineno": 39,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Create the poster's image element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Event handler for updates to the player's poster source\n*\n* @method update\n*/",
        "meta": {
            "range": [
                552,
                635
            ],
            "filename": "poster-image.js",
            "lineno": 65,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Event handler for updates to the player's poster source</p>",
        "kind": "function",
        "name": "update",
        "longname": "update",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set the poster source depending on the display method\n*\n* @param {String} url The URL to the poster source\n* @method setSrc\n*/",
        "meta": {
            "range": [
                678,
                810
            ],
            "filename": "poster-image.js",
            "lineno": 84,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Set the poster source depending on the display method</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The URL to the poster source</p>",
                "name": "url"
            }
        ],
        "kind": "function",
        "name": "setSrc",
        "longname": "setSrc",
        "scope": "global"
    },
    {
        "comment": "/**\n* Event handler for clicks on the poster image\n* \n* @method handleClick\n*/",
        "meta": {
            "range": [
                856,
                934
            ],
            "filename": "poster-image.js",
            "lineno": 105,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Event handler for clicks on the poster image</p>",
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file setup.js\n*\n* Functions for automatically setting up a player\n* based on the data-setup attribute of the video tag\n*/",
        "meta": {
            "range": [
                0,
                128
            ],
            "filename": "setup.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "setup.js",
        "kind": "file",
        "description": "<p>setup.js</p>\n<p>Functions for automatically setting up a player\nbased on the data-setup attribute of the video tag</p>",
        "preserveName": true,
        "longname": "setup.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file slider.js\n*/",
        "meta": {
            "range": [
                0,
                24
            ],
            "filename": "slider.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "name": "slider/slider.js",
        "kind": "file",
        "description": "<p>slider.js</p>",
        "preserveName": true,
        "longname": "slider/slider.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The base functionality for sliders like the volume bar and seek bar\n*\n* @param {Player|Object} player\n* @param {Object=} options\n* @extends Component\n* @class Slider\n*/",
        "meta": {
            "range": [
                43,
                217
            ],
            "filename": "slider.js",
            "lineno": 10,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>The base functionality for sliders like the volume bar and seek bar</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Player",
                        "Object"
                    ]
                },
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "Slider",
        "longname": "Slider",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @param {String} type Type of element to create\n* @param {Object=} props List of properties in Object form \n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                284,
                477
            ],
            "filename": "slider.js",
            "lineno": 40,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Type of element to create</p>",
                "name": "type"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>List of properties in Object form</p>",
                "name": "props"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle mouse down on slider\n*\n* @param {Object} event Mouse down event object\n* @method handleMouseDown\n*/",
        "meta": {
            "range": [
                520,
                632
            ],
            "filename": "slider.js",
            "lineno": 62,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Handle mouse down on slider</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Mouse down event object</p>",
                "name": "event"
            }
        ],
        "kind": "function",
        "name": "handleMouseDown",
        "longname": "handleMouseDown",
        "scope": "global"
    },
    {
        "comment": "/**\n* To be overridden by a subclass\n*\n* @method handleMouseMove\n*/",
        "meta": {
            "range": [
                672,
                739
            ],
            "filename": "slider.js",
            "lineno": 81,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>To be overridden by a subclass</p>",
        "kind": "function",
        "name": "handleMouseMove",
        "longname": "handleMouseMove",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle mouse up on Slider \n*\n* @method handleMouseUp\n*/",
        "meta": {
            "range": [
                746,
                807
            ],
            "filename": "slider.js",
            "lineno": 88,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Handle mouse up on Slider</p>",
        "kind": "function",
        "name": "handleMouseUp",
        "longname": "handleMouseUp",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update slider\n*\n* @method update\n*/",
        "meta": {
            "range": [
                844,
                885
            ],
            "filename": "slider.js",
            "lineno": 105,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Update slider</p>",
        "kind": "function",
        "name": "update",
        "longname": "update",
        "scope": "global"
    },
    {
        "comment": "/**\n* Calculate distance for slider\n*\n* @param {Object} event Event object\n* @method calculateDistance\n*/",
        "meta": {
            "range": [
                985,
                1090
            ],
            "filename": "slider.js",
            "lineno": 143,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Calculate distance for slider</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Event object</p>",
                "name": "event"
            }
        ],
        "kind": "function",
        "name": "calculateDistance",
        "longname": "calculateDistance",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle on focus for slider\n*\n* @method handleFocus\n*/",
        "meta": {
            "range": [
                1241,
                1300
            ],
            "filename": "slider.js",
            "lineno": 199,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Handle on focus for slider</p>",
        "kind": "function",
        "name": "handleFocus",
        "longname": "handleFocus",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle key press for slider\n*\n* @param {Object} event Event object\n* @method handleKeyPress\n*/",
        "meta": {
            "range": [
                1313,
                1413
            ],
            "filename": "slider.js",
            "lineno": 208,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Handle key press for slider</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Event object</p>",
                "name": "event"
            }
        ],
        "kind": "function",
        "name": "handleKeyPress",
        "longname": "handleKeyPress",
        "scope": "global"
    },
    {
        "comment": "/**\n* Handle on blur for slider\n*\n* @method handleBlur\n*/",
        "meta": {
            "range": [
                1444,
                1501
            ],
            "filename": "slider.js",
            "lineno": 224,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Handle on blur for slider</p>",
        "kind": "function",
        "name": "handleBlur",
        "longname": "handleBlur",
        "scope": "global"
    },
    {
        "comment": "/**\n* Listener for click events on slider, used to prevent clicks\n*   from bubbling up to parent elements like button menus.\n*\n* @param {Object} event Event object\n* @method handleClick\n*/",
        "meta": {
            "range": [
                1514,
                1702
            ],
            "filename": "slider.js",
            "lineno": 233,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Listener for click events on slider, used to prevent clicks\n  from bubbling up to parent elements like button menus.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Event object</p>",
                "name": "event"
            }
        ],
        "kind": "function",
        "name": "handleClick",
        "longname": "handleClick",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get/set if slider is horizontal for vertical\n*\n* @param {Boolean} bool True if slider is vertical, false is horizontal\n* @return {Boolean} True if slider is vertical, false is horizontal\n* @method vertical\n*/",
        "meta": {
            "range": [
                1718,
                1932
            ],
            "filename": "slider.js",
            "lineno": 245,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider",
            "code": {}
        },
        "description": "<p>Get/set if slider is horizontal for vertical</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>True if slider is vertical, false is horizontal</p>",
                "name": "bool"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>True if slider is vertical, false is horizontal</p>"
            }
        ],
        "kind": "function",
        "name": "vertical",
        "longname": "vertical",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file flash-rtmp.js\n*/",
        "meta": {
            "range": [
                0,
                28
            ],
            "filename": "flash-rtmp.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "name": "tech/flash-rtmp.js",
        "kind": "file",
        "description": "<p>flash-rtmp.js</p>",
        "preserveName": true,
        "longname": "tech/flash-rtmp.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file flash.js \n* VideoJS-SWF - Custom Flash Player with HTML5-ish API\n* https://github.com/zencoder/video-js-swf\n* Not using setupTriggers. Using global onEvent func to distribute events\n*/",
        "meta": {
            "range": [
                0,
                196
            ],
            "filename": "flash.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "name": "tech/flash.js",
        "kind": "file",
        "description": "<p>flash.js \nVideoJS-SWF - Custom Flash Player with HTML5-ish API\nhttps://github.com/zencoder/video-js-swf\nNot using setupTriggers. Using global onEvent func to distribute events</p>",
        "preserveName": true,
        "longname": "tech/flash.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Flash Media Controller - Wrapper for fallback SWF API\n*\n* @param {Object=} options Object of option names and values\n* @param {Function=} ready Ready callback function\n* @extends Tech\n* @class Flash\n*/",
        "meta": {
            "range": [
                230,
                437
            ],
            "filename": "flash.js",
            "lineno": 18,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Flash Media Controller - Wrapper for fallback SWF API</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "augments": [
            "Tech"
        ],
        "kind": "class",
        "name": "Flash",
        "longname": "Flash",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                537,
                621
            ],
            "filename": "flash.js",
            "lineno": 59,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Play for flash tech\n*\n* @method play\n*/",
        "meta": {
            "range": [
                745,
                790
            ],
            "filename": "flash.js",
            "lineno": 106,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Play for flash tech</p>",
        "kind": "function",
        "name": "play",
        "longname": "play",
        "scope": "global"
    },
    {
        "comment": "/**\n* Pause for flash tech\n*\n* @method pause\n*/",
        "meta": {
            "range": [
                803,
                850
            ],
            "filename": "flash.js",
            "lineno": 115,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Pause for flash tech</p>",
        "kind": "function",
        "name": "pause",
        "longname": "pause",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get/set video\n*\n* @param {Object=} src Source object \n* @return {Object} \n* @method src\n*/",
        "meta": {
            "range": [
                863,
                959
            ],
            "filename": "flash.js",
            "lineno": 124,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get/set video</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Source object</p>",
                "name": "src"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "src",
        "longname": "src",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set video\n*\n* @param {Object=} src Source object \n* @deprecated\n* @method setSrc\n*/",
        "meta": {
            "range": [
                987,
                1076
            ],
            "filename": "flash.js",
            "lineno": 140,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set video</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Source object</p>",
                "name": "src"
            }
        ],
        "deprecated": true,
        "kind": "function",
        "name": "setSrc",
        "longname": "setSrc",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set current time\n*\n* @param {Number} time Current time of video \n* @method setCurrentTime\n*/",
        "meta": {
            "range": [
                1116,
                1214
            ],
            "filename": "flash.js",
            "lineno": 160,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set current time</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Current time of video</p>",
                "name": "time"
            }
        ],
        "kind": "function",
        "name": "setCurrentTime",
        "longname": "setCurrentTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get current time\n*\n* @param {Number=} time Current time of video \n* @return {Number} Current time\n* @method currentTime\n*/",
        "meta": {
            "range": [
                1233,
                1361
            ],
            "filename": "flash.js",
            "lineno": 172,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get current time</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "optional": true,
                "description": "<p>Current time of video</p>",
                "name": "time"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Current time</p>"
            }
        ],
        "kind": "function",
        "name": "currentTime",
        "longname": "currentTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get current source\n*\n* @method currentSrc\n*/",
        "meta": {
            "range": [
                1389,
                1439
            ],
            "filename": "flash.js",
            "lineno": 188,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get current source</p>",
        "kind": "function",
        "name": "currentSrc",
        "longname": "currentSrc",
        "scope": "global"
    },
    {
        "comment": "/**\n* Load media into player\n*\n* @method load\n*/",
        "meta": {
            "range": [
                1464,
                1512
            ],
            "filename": "flash.js",
            "lineno": 201,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Load media into player</p>",
        "kind": "function",
        "name": "load",
        "longname": "load",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get poster\n*\n* @method poster\n*/",
        "meta": {
            "range": [
                1525,
                1563
            ],
            "filename": "flash.js",
            "lineno": 210,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get poster</p>",
        "kind": "function",
        "name": "poster",
        "longname": "poster",
        "scope": "global"
    },
    {
        "comment": "/**\n* Poster images are not handled by the Flash tech so make this a no-op\n*\n* @method setPoster\n*/",
        "meta": {
            "range": [
                1576,
                1675
            ],
            "filename": "flash.js",
            "lineno": 219,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Poster images are not handled by the Flash tech so make this a no-op</p>",
        "kind": "function",
        "name": "setPoster",
        "longname": "setPoster",
        "scope": "global"
    },
    {
        "comment": "/**\n* Determine if can seek in media\n*\n* @return {TimeRangeObject}\n* @method seekable\n*/",
        "meta": {
            "range": [
                1682,
                1770
            ],
            "filename": "flash.js",
            "lineno": 226,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Determine if can seek in media</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "TimeRangeObject"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "seekable",
        "longname": "seekable",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get buffered time range\n*\n* @return {TimeRangeObject} \n* @method buffered\n*/",
        "meta": {
            "range": [
                1795,
                1877
            ],
            "filename": "flash.js",
            "lineno": 240,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get buffered time range</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "TimeRangeObject"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "buffered",
        "longname": "buffered",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get fullscreen support - \n* Flash does not allow fullscreen through javascript\n* so always returns false\n*\n* @return {Boolean} false \n* @method supportsFullScreen\n*/",
        "meta": {
            "range": [
                1890,
                2061
            ],
            "filename": "flash.js",
            "lineno": 250,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get fullscreen support - \nFlash does not allow fullscreen through javascript\nso always returns false</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>false</p>"
            }
        ],
        "kind": "function",
        "name": "supportsFullScreen",
        "longname": "supportsFullScreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Request to enter fullscreen\n* Flash does not allow fullscreen through javascript\n* so always returns false\n*\n* @return {Boolean} false \n* @method enterFullScreen\n*/",
        "meta": {
            "range": [
                2074,
                2244
            ],
            "filename": "flash.js",
            "lineno": 262,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Request to enter fullscreen\nFlash does not allow fullscreen through javascript\nso always returns false</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>false</p>"
            }
        ],
        "kind": "function",
        "name": "enterFullScreen",
        "longname": "enterFullScreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file html5.js \n* HTML5 Media Controller - Wrapper for HTML5 Media API\n*/",
        "meta": {
            "range": [
                0,
                79
            ],
            "filename": "html5.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "name": "tech/html5.js",
        "kind": "file",
        "description": "<p>html5.js \nHTML5 Media Controller - Wrapper for HTML5 Media API</p>",
        "preserveName": true,
        "longname": "tech/html5.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* HTML5 Media Controller - Wrapper for HTML5 Media API\n*\n* @param {Object=} options Object of option names and values\n* @param {Function=} ready Ready callback function\n* @extends Tech\n* @class Html5\n*/",
        "meta": {
            "range": [
                119,
                325
            ],
            "filename": "html5.js",
            "lineno": 18,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>HTML5 Media Controller - Wrapper for HTML5 Media API</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "augments": [
            "Tech"
        ],
        "kind": "class",
        "name": "Html5",
        "longname": "Html5",
        "scope": "global"
    },
    {
        "comment": "/**\n* Dispose of html5 media element\n*\n* @method dispose\n*/",
        "meta": {
            "range": [
                497,
                556
            ],
            "filename": "html5.js",
            "lineno": 83,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Dispose of html5 media element</p>",
        "kind": "function",
        "name": "dispose",
        "longname": "dispose",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                572,
                656
            ],
            "filename": "html5.js",
            "lineno": 93,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Hide captions from text track\n*\n* @method hideCaptions\n*/",
        "meta": {
            "range": [
                846,
                909
            ],
            "filename": "html5.js",
            "lineno": 162,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Hide captions from text track</p>",
        "kind": "function",
        "name": "hideCaptions",
        "longname": "hideCaptions",
        "scope": "global"
    },
    {
        "comment": "/**\n* Play for html5 tech\n*\n* @method play\n*/",
        "meta": {
            "range": [
                961,
                1006
            ],
            "filename": "html5.js",
            "lineno": 184,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Play for html5 tech</p>",
        "kind": "function",
        "name": "play",
        "longname": "play",
        "scope": "global"
    },
    {
        "comment": "/**\n* Pause for html5 tech\n*\n* @method pause\n*/",
        "meta": {
            "range": [
                1013,
                1060
            ],
            "filename": "html5.js",
            "lineno": 191,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Pause for html5 tech</p>",
        "kind": "function",
        "name": "pause",
        "longname": "pause",
        "scope": "global"
    },
    {
        "comment": "/**\n* Paused for html5 tech\n*\n* @return {Boolean} \n* @method paused\n*/",
        "meta": {
            "range": [
                1067,
                1137
            ],
            "filename": "html5.js",
            "lineno": 198,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Paused for html5 tech</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "paused",
        "longname": "paused",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get current time\n*\n* @return {Number} \n* @method currentTime\n*/",
        "meta": {
            "range": [
                1144,
                1213
            ],
            "filename": "html5.js",
            "lineno": 206,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get current time</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "currentTime",
        "longname": "currentTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set current time\n*\n* @param {Number} seconds Current time of video \n* @method setCurrentTime\n*/",
        "meta": {
            "range": [
                1220,
                1321
            ],
            "filename": "html5.js",
            "lineno": 214,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set current time</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Current time of video</p>",
                "name": "seconds"
            }
        ],
        "kind": "function",
        "name": "setCurrentTime",
        "longname": "setCurrentTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get duration\n*\n* @return {Number}\n* @method duration\n*/",
        "meta": {
            "range": [
                1349,
                1410
            ],
            "filename": "html5.js",
            "lineno": 229,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get duration</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "duration",
        "longname": "duration",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get a TimeRange object that represents the intersection\n* of the time ranges for which the user agent has all\n* relevant media\n*\n* @return {TimeRangeObject}\n* @method buffered\n*/",
        "meta": {
            "range": [
                1417,
                1601
            ],
            "filename": "html5.js",
            "lineno": 237,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get a TimeRange object that represents the intersection\nof the time ranges for which the user agent has all\nrelevant media</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "TimeRangeObject"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "buffered",
        "longname": "buffered",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get volume level \n*\n* @return {Number}\n* @method volume\n*/",
        "meta": {
            "range": [
                1608,
                1672
            ],
            "filename": "html5.js",
            "lineno": 247,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get volume level</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "volume",
        "longname": "volume",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set volume level \n*\n* @param {Number} percentAsDecimal Volume percent as a decimal\n* @method setVolume\n*/",
        "meta": {
            "range": [
                1679,
                1790
            ],
            "filename": "html5.js",
            "lineno": 255,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set volume level</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Volume percent as a decimal</p>",
                "name": "percentAsDecimal"
            }
        ],
        "kind": "function",
        "name": "setVolume",
        "longname": "setVolume",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get if muted \n*\n* @return {Boolean}\n* @method muted\n*/",
        "meta": {
            "range": [
                1797,
                1857
            ],
            "filename": "html5.js",
            "lineno": 263,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get if muted</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "muted",
        "longname": "muted",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set muted \n*\n* @param {Boolean} If player is to be muted or note\n* @method setMuted\n*/",
        "meta": {
            "range": [
                1864,
                1956
            ],
            "filename": "html5.js",
            "lineno": 271,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set muted</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "description": "<p>player is to be muted or note</p>",
                "name": "If"
            }
        ],
        "kind": "function",
        "name": "setMuted",
        "longname": "setMuted",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get player width \n*\n* @return {Number}\n* @method width\n*/",
        "meta": {
            "range": [
                1963,
                2026
            ],
            "filename": "html5.js",
            "lineno": 279,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get player width</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "width",
        "longname": "width",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get player height \n*\n* @return {Number}\n* @method height\n*/",
        "meta": {
            "range": [
                2033,
                2098
            ],
            "filename": "html5.js",
            "lineno": 287,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get player height</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "height",
        "longname": "height",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get if there is fullscreen support \n*\n* @return {Boolean} \n* @method supportsFullScreen\n*/",
        "meta": {
            "range": [
                2105,
                2201
            ],
            "filename": "html5.js",
            "lineno": 295,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get if there is fullscreen support</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "supportsFullScreen",
        "longname": "supportsFullScreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Request to enter fullscreen\n*\n* @method enterFullScreen\n*/",
        "meta": {
            "range": [
                2235,
                2299
            ],
            "filename": "html5.js",
            "lineno": 312,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Request to enter fullscreen</p>",
        "kind": "function",
        "name": "enterFullScreen",
        "longname": "enterFullScreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Request to exit fullscreen\n*\n* @method exitFullScreen\n*/",
        "meta": {
            "range": [
                2387,
                2449
            ],
            "filename": "html5.js",
            "lineno": 346,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Request to exit fullscreen</p>",
        "kind": "function",
        "name": "exitFullScreen",
        "longname": "exitFullScreen",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get/set video\n*\n* @param {Object=} src Source object \n* @return {Object} \n* @method src\n*/",
        "meta": {
            "range": [
                2462,
                2558
            ],
            "filename": "html5.js",
            "lineno": 355,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get/set video</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Source object</p>",
                "name": "src"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "src",
        "longname": "src",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set video\n*\n* @param {Object} src Source object \n* @deprecated\n* @method setSrc\n*/",
        "meta": {
            "range": [
                2586,
                2674
            ],
            "filename": "html5.js",
            "lineno": 371,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set video</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Source object</p>",
                "name": "src"
            }
        ],
        "deprecated": true,
        "kind": "function",
        "name": "setSrc",
        "longname": "setSrc",
        "scope": "global"
    },
    {
        "comment": "/**\n* Load media into player\n*\n* @method load\n*/",
        "meta": {
            "range": [
                2681,
                2729
            ],
            "filename": "html5.js",
            "lineno": 380,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Load media into player</p>",
        "kind": "function",
        "name": "load",
        "longname": "load",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get current source \n*\n* @return {Object} \n* @method currentSrc\n*/",
        "meta": {
            "range": [
                2736,
                2807
            ],
            "filename": "html5.js",
            "lineno": 387,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get current source</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "currentSrc",
        "longname": "currentSrc",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get poster \n*\n* @return {String} \n* @method poster\n*/",
        "meta": {
            "range": [
                2814,
                2873
            ],
            "filename": "html5.js",
            "lineno": 395,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get poster</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "poster",
        "longname": "poster",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get preload attribute \n*\n* @return {String} \n* @method preload\n*/",
        "meta": {
            "range": [
                2962,
                3033
            ],
            "filename": "html5.js",
            "lineno": 411,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get preload attribute</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "preload",
        "longname": "preload",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set preload attribute \n*\n* @param {String} val Value for preload attribute \n* @method setPreload\n*/",
        "meta": {
            "range": [
                3040,
                3145
            ],
            "filename": "html5.js",
            "lineno": 419,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set preload attribute</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Value for preload attribute</p>",
                "name": "val"
            }
        ],
        "kind": "function",
        "name": "setPreload",
        "longname": "setPreload",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get autoplay attribute \n*\n* @return {String} \n* @method autoplay\n*/",
        "meta": {
            "range": [
                3152,
                3225
            ],
            "filename": "html5.js",
            "lineno": 427,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get autoplay attribute</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "autoplay",
        "longname": "autoplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set autoplay attribute \n*\n* @param {String} val Value for preload attribute \n* @method setAutoplay\n*/",
        "meta": {
            "range": [
                3232,
                3339
            ],
            "filename": "html5.js",
            "lineno": 435,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set autoplay attribute</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Value for preload attribute</p>",
                "name": "val"
            }
        ],
        "kind": "function",
        "name": "setAutoplay",
        "longname": "setAutoplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get controls attribute \n*\n* @return {String} \n* @method controls\n*/",
        "meta": {
            "range": [
                3346,
                3419
            ],
            "filename": "html5.js",
            "lineno": 443,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get controls attribute</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "controls",
        "longname": "controls",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set controls attribute \n*\n* @param {String} val Value for controls attribute \n* @method setControls\n*/",
        "meta": {
            "range": [
                3426,
                3534
            ],
            "filename": "html5.js",
            "lineno": 451,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set controls attribute</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Value for controls attribute</p>",
                "name": "val"
            }
        ],
        "kind": "function",
        "name": "setControls",
        "longname": "setControls",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get loop attribute \n*\n* @return {String} \n* @method loop\n*/",
        "meta": {
            "range": [
                3541,
                3606
            ],
            "filename": "html5.js",
            "lineno": 459,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get loop attribute</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "loop",
        "longname": "loop",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set loop attribute \n*\n* @param {String} val Value for loop attribute \n* @method setLoop\n*/",
        "meta": {
            "range": [
                3613,
                3709
            ],
            "filename": "html5.js",
            "lineno": 467,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set loop attribute</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Value for loop attribute</p>",
                "name": "val"
            }
        ],
        "kind": "function",
        "name": "setLoop",
        "longname": "setLoop",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get error value \n*\n* @return {String} \n* @method error\n*/",
        "meta": {
            "range": [
                3716,
                3779
            ],
            "filename": "html5.js",
            "lineno": 475,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get error value</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "error",
        "longname": "error",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get whether or not the player is in the \"seeking\" state\n*\n* @return {Boolean} \n* @method seeking\n*/",
        "meta": {
            "range": [
                3786,
                3891
            ],
            "filename": "html5.js",
            "lineno": 483,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get whether or not the player is in the &quot;seeking&quot; state</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "seeking",
        "longname": "seeking",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get a TimeRanges object that represents the \n* ranges of the media resource to which it is possible \n* for the user agent to seek. \n*\n* @return {TimeRangeObject} \n* @method seekable\n*/",
        "meta": {
            "range": [
                3898,
                4088
            ],
            "filename": "html5.js",
            "lineno": 491,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get a TimeRanges object that represents the \nranges of the media resource to which it is possible \nfor the user agent to seek.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "TimeRangeObject"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "seekable",
        "longname": "seekable",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get if video ended \n*\n* @return {Boolean} \n* @method ended\n*/",
        "meta": {
            "range": [
                4095,
                4162
            ],
            "filename": "html5.js",
            "lineno": 501,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get if video ended</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "ended",
        "longname": "ended",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the value of the muted content attribute\n* This attribute has no dynamic effect, it only \n* controls the default state of the element\n*\n* @return {Boolean} \n* @method defaultMuted\n*/",
        "meta": {
            "range": [
                4169,
                4361
            ],
            "filename": "html5.js",
            "lineno": 509,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get the value of the muted content attribute\nThis attribute has no dynamic effect, it only \ncontrols the default state of the element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "defaultMuted",
        "longname": "defaultMuted",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get desired speed at which the media resource is to play \n*\n* @return {Number}\n* @method playbackRate\n*/",
        "meta": {
            "range": [
                4368,
                4478
            ],
            "filename": "html5.js",
            "lineno": 519,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get desired speed at which the media resource is to play</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "playbackRate",
        "longname": "playbackRate",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set desired speed at which the media resource is to play \n*\n* @param {Number} val Speed at which the media resource is to play\n* @method setPlaybackRate\n*/",
        "meta": {
            "range": [
                4485,
                4646
            ],
            "filename": "html5.js",
            "lineno": 527,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set desired speed at which the media resource is to play</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Speed at which the media resource is to play</p>",
                "name": "val"
            }
        ],
        "kind": "function",
        "name": "setPlaybackRate",
        "longname": "setPlaybackRate",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the current state of network activity for the element, from\n* the list below\n* NETWORK_EMPTY (numeric value 0)\n* NETWORK_IDLE (numeric value 1)\n* NETWORK_LOADING (numeric value 2)\n* NETWORK_NO_SOURCE (numeric value 3)\n*\n* @return {Number}\n* @method networkState\n*/",
        "meta": {
            "range": [
                4653,
                4927
            ],
            "filename": "html5.js",
            "lineno": 535,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get the current state of network activity for the element, from\nthe list below\nNETWORK_EMPTY (numeric value 0)\nNETWORK_IDLE (numeric value 1)\nNETWORK_LOADING (numeric value 2)\nNETWORK_NO_SOURCE (numeric value 3)</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "networkState",
        "longname": "networkState",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get a value that expresses the current state of the element \n* with respect to rendering the current playback position, from \n* the codes in the list below\n* HAVE_NOTHING (numeric value 0)\n* HAVE_METADATA (numeric value 1)\n* HAVE_CURRENT_DATA (numeric value 2)\n* HAVE_FUTURE_DATA (numeric value 3)\n* HAVE_ENOUGH_DATA (numeric value 4)\n* \n* @return {Number}\n* @method readyState\n*/",
        "meta": {
            "range": [
                4934,
                5320
            ],
            "filename": "html5.js",
            "lineno": 548,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get a value that expresses the current state of the element \nwith respect to rendering the current playback position, from \nthe codes in the list below\nHAVE_NOTHING (numeric value 0)\nHAVE_METADATA (numeric value 1)\nHAVE_CURRENT_DATA (numeric value 2)\nHAVE_FUTURE_DATA (numeric value 3)\nHAVE_ENOUGH_DATA (numeric value 4)</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "readyState",
        "longname": "readyState",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get width of video \n*\n* @return {Number}\n* @method videoWidth\n*/",
        "meta": {
            "range": [
                5327,
                5397
            ],
            "filename": "html5.js",
            "lineno": 563,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get width of video</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "videoWidth",
        "longname": "videoWidth",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get height of video \n*\n* @return {Number}\n* @method videoHeight\n*/",
        "meta": {
            "range": [
                5404,
                5476
            ],
            "filename": "html5.js",
            "lineno": 571,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get height of video</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "videoHeight",
        "longname": "videoHeight",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get text tracks \n*\n* @return {TextTrackList} \n* @method textTracks\n*/",
        "meta": {
            "range": [
                5483,
                5558
            ],
            "filename": "html5.js",
            "lineno": 579,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get text tracks</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "TextTrackList"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "textTracks",
        "longname": "textTracks",
        "scope": "global"
    },
    {
        "comment": "/**\n* Creates and returns a text track object \n*\n* @param {String} kind Text track kind (subtitles, captions, descriptions\n*                                       chapters and metadata)\n* @param {String=} label Label to identify the text track\n* @param {String=} language Two letter language abbreviation\n* @return {TextTrackObject}\n* @method addTextTrack\n*/",
        "meta": {
            "range": [
                5583,
                5941
            ],
            "filename": "html5.js",
            "lineno": 593,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Creates and returns a text track object</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Text track kind (subtitles, captions, descriptions\n                                      chapters and metadata)</p>",
                "name": "kind"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Label to identify the text track</p>",
                "name": "label"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Two letter language abbreviation</p>",
                "name": "language"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "TextTrackObject"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "addTextTrack",
        "longname": "addTextTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Creates and returns a remote text track object \n*\n* @param {Object} options The object should contain values for\n* kind, language, label and src (location of the WebVTT file)\n* @return {TextTrackObject}\n* @method addRemoteTextTrack\n*/",
        "meta": {
            "range": [
                5966,
                6206
            ],
            "filename": "html5.js",
            "lineno": 611,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Creates and returns a remote text track object</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The object should contain values for\nkind, language, label and src (location of the WebVTT file)</p>",
                "name": "options"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "TextTrackObject"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "addRemoteTextTrack",
        "longname": "addRemoteTextTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Remove remote text track from TextTrackList object \n*\n* @param {TextTrackObject} track Texttrack object to remove\n* @method removeRemoteTextTrack\n*/",
        "meta": {
            "range": [
                6360,
                6514
            ],
            "filename": "html5.js",
            "lineno": 670,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Remove remote text track from TextTrackList object</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "TextTrackObject"
                    ]
                },
                "description": "<p>Texttrack object to remove</p>",
                "name": "track"
            }
        ],
        "kind": "function",
        "name": "removeRemoteTextTrack",
        "longname": "removeRemoteTextTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file loader.js\n*/",
        "meta": {
            "range": [
                0,
                24
            ],
            "filename": "loader.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "name": "tech/loader.js",
        "kind": "file",
        "description": "<p>loader.js</p>",
        "preserveName": true,
        "longname": "tech/loader.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The Media Loader is the component that decides which playback technology to load\n* when the player is initialized.\n*\n* @param {Object} player  Main Player\n* @param {Object=} options Object of option names and values\n* @param {Function=} ready    Ready callback function\n* @extends Component\n* @class MediaLoader\n*/",
        "meta": {
            "range": [
                37,
                357
            ],
            "filename": "loader.js",
            "lineno": 8,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>The Media Loader is the component that decides which playback technology to load\nwhen the player is initialized.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Main Player</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "MediaLoader",
        "longname": "MediaLoader",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file tech.js\n* Media Technology Controller - Base class for media playback\n* technology controllers like Flash and HTML5\n*/",
        "meta": {
            "range": [
                0,
                130
            ],
            "filename": "tech.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "name": "tech/tech.js",
        "kind": "file",
        "description": "<p>tech.js\nMedia Technology Controller - Base class for media playback\ntechnology controllers like Flash and HTML5</p>",
        "preserveName": true,
        "longname": "tech/tech.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Base class for media (HTML5 Video, Flash) controllers\n*\n* @param {Object=} options Options object\n* @param {Function=} ready Ready callback function\n* @extends Component\n* @class Tech\n*/",
        "meta": {
            "range": [
                164,
                356
            ],
            "filename": "tech.js",
            "lineno": 17,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Base class for media (HTML5 Video, Flash) controllers</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Options object</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "Tech",
        "longname": "Tech",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set up click and touch listeners for the playback element\n* On desktops, a click on the video itself will toggle playback,\n* on a mobile device a click on the video toggles controls.\n* (toggling controls is done by toggling the user state between active and\n* inactive)\n* A tap can signal that a user has become active, or has become inactive\n* e.g. a quick tap on an iPhone movie should reveal the controls. Another\n* quick tap should hide them again (signaling the user is in an inactive\n* viewing state)\n* In addition to this, we still want the user to be considered inactive after\n* a few seconds of inactivity.\n* Note: the only part of iOS interaction we can't mimic with this setup\n* is a touch and hold on the video element counting as activity in order to\n* keep the controls showing, but that shouldn't be an issue. A touch and hold on\n* any controls will still keep the user active\n*\n* @method initControlsListeners\n*/",
        "meta": {
            "range": [
                465,
                1399
            ],
            "filename": "tech.js",
            "lineno": 61,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set up click and touch listeners for the playback element\nOn desktops, a click on the video itself will toggle playback,\non a mobile device a click on the video toggles controls.\n(toggling controls is done by toggling the user state between active and\ninactive)\nA tap can signal that a user has become active, or has become inactive\ne.g. a quick tap on an iPhone movie should reveal the controls. Another\nquick tap should hide them again (signaling the user is in an inactive\nviewing state)\nIn addition to this, we still want the user to be considered inactive after\na few seconds of inactivity.\nNote: the only part of iOS interaction we can't mimic with this setup\nis a touch and hold on the video element counting as activity in order to\nkeep the controls showing, but that shouldn't be an issue. A touch and hold on\nany controls will still keep the user active</p>",
        "kind": "function",
        "name": "initControlsListeners",
        "longname": "initControlsListeners",
        "scope": "global"
    },
    {
        "comment": "/**\n* Turn on progress events \n*\n* @method manualProgressOn\n*/",
        "meta": {
            "range": [
                1570,
                1632
            ],
            "filename": "tech.js",
            "lineno": 97,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Turn on progress events</p>",
        "kind": "function",
        "name": "manualProgressOn",
        "longname": "manualProgressOn",
        "scope": "global"
    },
    {
        "comment": "/**\n* Turn off progress events \n*\n* @method manualProgressOff\n*/",
        "meta": {
            "range": [
                1660,
                1724
            ],
            "filename": "tech.js",
            "lineno": 111,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Turn off progress events</p>",
        "kind": "function",
        "name": "manualProgressOff",
        "longname": "manualProgressOff",
        "scope": "global"
    },
    {
        "comment": "/**\n* Track progress \n*\n* @method trackProgress\n*/",
        "meta": {
            "range": [
                1746,
                1796
            ],
            "filename": "tech.js",
            "lineno": 123,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Track progress</p>",
        "kind": "function",
        "name": "trackProgress",
        "longname": "trackProgress",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update duration \n*\n* @method onDurationChange\n*/",
        "meta": {
            "range": [
                1851,
                1905
            ],
            "filename": "tech.js",
            "lineno": 146,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Update duration</p>",
        "kind": "function",
        "name": "onDurationChange",
        "longname": "onDurationChange",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create and get TimeRange object for buffering \n*\n* @return {TimeRangeObject}\n* @method buffered\n*/",
        "meta": {
            "range": [
                1918,
                2022
            ],
            "filename": "tech.js",
            "lineno": 155,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Create and get TimeRange object for buffering</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "TimeRangeObject"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "buffered",
        "longname": "buffered",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get buffered percent\n*\n* @return {Number}\n* @method bufferedPercent\n*/",
        "meta": {
            "range": [
                2035,
                2111
            ],
            "filename": "tech.js",
            "lineno": 165,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get buffered percent</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "bufferedPercent",
        "longname": "bufferedPercent",
        "scope": "global"
    },
    {
        "comment": "/**\n* Stops tracking progress by clearing progress interval \n*\n* @method stopTrackingProgress\n*/",
        "meta": {
            "range": [
                2124,
                2220
            ],
            "filename": "tech.js",
            "lineno": 175,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Stops tracking progress by clearing progress interval</p>",
        "kind": "function",
        "name": "stopTrackingProgress",
        "longname": "stopTrackingProgress",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set event listeners for on play and pause and tracking current time\n*\n* @method manualTimeUpdatesOn\n*/",
        "meta": {
            "range": [
                2317,
                2425
            ],
            "filename": "tech.js",
            "lineno": 185,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set event listeners for on play and pause and tracking current time</p>",
        "kind": "function",
        "name": "manualTimeUpdatesOn",
        "longname": "manualTimeUpdatesOn",
        "scope": "global"
    },
    {
        "comment": "/**\n* Remove event listeners for on play and pause and tracking current time\n*\n* @method manualTimeUpdatesOff\n*/",
        "meta": {
            "range": [
                2447,
                2559
            ],
            "filename": "tech.js",
            "lineno": 197,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Remove event listeners for on play and pause and tracking current time</p>",
        "kind": "function",
        "name": "manualTimeUpdatesOff",
        "longname": "manualTimeUpdatesOff",
        "scope": "global"
    },
    {
        "comment": "/**\n* Tracks current time\n*\n* @method trackCurrentTime\n*/",
        "meta": {
            "range": [
                2581,
                2638
            ],
            "filename": "tech.js",
            "lineno": 209,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Tracks current time</p>",
        "kind": "function",
        "name": "trackCurrentTime",
        "longname": "trackCurrentTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* Turn off play progress tracking (when paused or dragging)\n*\n* @method stopTrackingCurrentTime\n*/",
        "meta": {
            "range": [
                2660,
                2762
            ],
            "filename": "tech.js",
            "lineno": 221,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Turn off play progress tracking (when paused or dragging)</p>",
        "kind": "function",
        "name": "stopTrackingCurrentTime",
        "longname": "stopTrackingCurrentTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* Turn off any manual progress or timeupdate tracking\n*\n* @method dispose\n*/",
        "meta": {
            "range": [
                2787,
                2867
            ],
            "filename": "tech.js",
            "lineno": 234,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Turn off any manual progress or timeupdate tracking</p>",
        "kind": "function",
        "name": "dispose",
        "longname": "dispose",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set current time \n*\n* @method setCurrentTime\n*/",
        "meta": {
            "range": [
                2895,
                2948
            ],
            "filename": "tech.js",
            "lineno": 248,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Set current time</p>",
        "kind": "function",
        "name": "setCurrentTime",
        "longname": "setCurrentTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* Initialize texttrack listeners \n*\n* @method initTextTrackListeners\n*/",
        "meta": {
            "range": [
                2964,
                3039
            ],
            "filename": "tech.js",
            "lineno": 258,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Initialize texttrack listeners</p>",
        "kind": "function",
        "name": "initTextTrackListeners",
        "longname": "initTextTrackListeners",
        "scope": "global"
    },
    {
        "comment": "/**\n* Emulate texttracks \n*\n* @method emulateTextTracks\n*/",
        "meta": {
            "range": [
                3094,
                3152
            ],
            "filename": "tech.js",
            "lineno": 281,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Emulate texttracks</p>",
        "kind": "function",
        "name": "emulateTextTracks",
        "longname": "emulateTextTracks",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get texttracks \n*\n* @returns {TextTrackList}\n* @method textTracks\n*/",
        "meta": {
            "range": [
                3345,
                3419
            ],
            "filename": "tech.js",
            "lineno": 328,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get texttracks</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "TextTrackList"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "textTracks",
        "longname": "textTracks",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get remote texttracks \n*\n* @returns {TextTrackList}\n* @method remoteTextTracks\n*/",
        "meta": {
            "range": [
                3435,
                3522
            ],
            "filename": "tech.js",
            "lineno": 339,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Get remote texttracks</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "TextTrackList"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "remoteTextTracks",
        "longname": "remoteTextTracks",
        "scope": "global"
    },
    {
        "comment": "/**\n* Creates and returns a remote text track object \n*\n* @param {String} kind Text track kind (subtitles, captions, descriptions\n*                                       chapters and metadata)\n* @param {String=} label Label to identify the text track\n* @param {String=} language Two letter language abbreviation\n* @return {TextTrackObject}\n* @method addTextTrack\n*/",
        "meta": {
            "range": [
                3538,
                3903
            ],
            "filename": "tech.js",
            "lineno": 350,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Creates and returns a remote text track object</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Text track kind (subtitles, captions, descriptions\n                                      chapters and metadata)</p>",
                "name": "kind"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Label to identify the text track</p>",
                "name": "label"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Two letter language abbreviation</p>",
                "name": "language"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "TextTrackObject"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "addTextTrack",
        "longname": "addTextTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Creates and returns a remote text track object \n*\n* @param {Object} options The object should contain values for\n* kind, language, label and src (location of the WebVTT file)\n* @return {TextTrackObject}\n* @method addRemoteTextTrack\n*/",
        "meta": {
            "range": [
                3928,
                4168
            ],
            "filename": "tech.js",
            "lineno": 368,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Creates and returns a remote text track object</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The object should contain values for\nkind, language, label and src (location of the WebVTT file)</p>",
                "name": "options"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "TextTrackObject"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "addRemoteTextTrack",
        "longname": "addRemoteTextTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Remove remote texttrack \n*\n* @param {TextTrackObject} track Texttrack to remove\n* @method removeRemoteTextTrack\n*/",
        "meta": {
            "range": [
                4193,
                4313
            ],
            "filename": "tech.js",
            "lineno": 384,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Remove remote texttrack</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "TextTrackObject"
                    ]
                },
                "description": "<p>Texttrack to remove</p>",
                "name": "track"
            }
        ],
        "kind": "function",
        "name": "removeRemoteTextTrack",
        "longname": "removeRemoteTextTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Provide a default setPoster method for techs\n* Poster support for techs should be optional, so we don't want techs to\n* break if they don't have a way to set a poster.\n*\n* @method setPoster\n*/",
        "meta": {
            "range": [
                4329,
                4527
            ],
            "filename": "tech.js",
            "lineno": 395,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech",
            "code": {}
        },
        "description": "<p>Provide a default setPoster method for techs\nPoster support for techs should be optional, so we don't want techs to\nbreak if they don't have a way to set a poster.</p>",
        "kind": "function",
        "name": "setPoster",
        "longname": "setPoster",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file text-track-cue-list.js\n*/",
        "meta": {
            "range": [
                0,
                37
            ],
            "filename": "text-track-cue-list.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "name": "tracks/text-track-cue-list.js",
        "kind": "file",
        "description": "<p>text-track-cue-list.js</p>",
        "preserveName": true,
        "longname": "tracks/text-track-cue-list.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file text-track-display.js\n*/",
        "meta": {
            "range": [
                0,
                36
            ],
            "filename": "text-track-display.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "name": "tracks/text-track-display.js",
        "kind": "file",
        "description": "<p>text-track-display.js</p>",
        "preserveName": true,
        "longname": "tracks/text-track-display.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* The component for displaying text track cues\n*\n* @param {Object} player  Main Player\n* @param {Object=} options Object of option names and values\n* @param {Function=} ready    Ready callback function\n* @extends Component\n* @class TextTrackDisplay\n*/",
        "meta": {
            "range": [
                106,
                361
            ],
            "filename": "text-track-display.js",
            "lineno": 27,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>The component for displaying text track cues</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Main Player</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Ready callback function</p>",
                "name": "ready"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "TextTrackDisplay",
        "longname": "TextTrackDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Toggle display texttracks \n*\n* @method toggleDisplay\n*/",
        "meta": {
            "range": [
                446,
                507
            ],
            "filename": "text-track-display.js",
            "lineno": 64,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Toggle display texttracks</p>",
        "kind": "function",
        "name": "toggleDisplay",
        "longname": "toggleDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                532,
                616
            ],
            "filename": "text-track-display.js",
            "lineno": 77,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Clear display texttracks \n*\n* @method clearDisplay\n*/",
        "meta": {
            "range": [
                635,
                694
            ],
            "filename": "text-track-display.js",
            "lineno": 89,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Clear display texttracks</p>",
        "kind": "function",
        "name": "clearDisplay",
        "longname": "clearDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update display texttracks \n*\n* @method updateDisplay\n*/",
        "meta": {
            "range": [
                713,
                774
            ],
            "filename": "text-track-display.js",
            "lineno": 100,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Update display texttracks</p>",
        "kind": "function",
        "name": "updateDisplay",
        "longname": "updateDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add texttrack to texttrack list \n*\n* @param {TextTrackObject} track Texttrack object to be added to list\n* @method updateForTrack\n*/",
        "meta": {
            "range": [
                826,
                964
            ],
            "filename": "text-track-display.js",
            "lineno": 122,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Add texttrack to texttrack list</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "TextTrackObject"
                    ]
                },
                "description": "<p>Texttrack object to be added to list</p>",
                "name": "track"
            }
        ],
        "kind": "function",
        "name": "updateForTrack",
        "longname": "updateForTrack",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add cue HTML to display\n*\n* @param {Number} color Hex number for color, like #f0e\n* @param {Number} opacity Value for opacity,0.0 - 1.0\n* @return {RGBAColor} In the form 'rgba(255, 0, 0, 0.3)'\n* @method constructColor\n*/",
        "meta": {
            "range": [
                1187,
                1413
            ],
            "filename": "text-track-display.js",
            "lineno": 202,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Add cue HTML to display</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Hex number for color, like #f0e</p>",
                "name": "color"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Value for opacity,0.0 - 1.0</p>",
                "name": "opacity"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "RGBAColor"
                    ]
                },
                "description": "<p>In the form 'rgba(255, 0, 0, 0.3)'</p>"
            }
        ],
        "kind": "function",
        "name": "constructColor",
        "longname": "constructColor",
        "scope": "global"
    },
    {
        "comment": "/**\n* Try to update style\n* Some style changes will throw an error, particularly in IE8. Those should be noops.\n*\n* @param {Element} el The element to be styles\n* @param {CSSProperty} style The CSS property to be styled\n* @param {CSSStyle} rule The actual style to be applied to the property\n* @method tryUpdateStyle\n*/",
        "meta": {
            "range": [
                1441,
                1760
            ],
            "filename": "text-track-display.js",
            "lineno": 219,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Try to update style\nSome style changes will throw an error, particularly in IE8. Those should be noops.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>The element to be styles</p>",
                "name": "el"
            },
            {
                "type": {
                    "names": [
                        "CSSProperty"
                    ]
                },
                "description": "<p>The CSS property to be styled</p>",
                "name": "style"
            },
            {
                "type": {
                    "names": [
                        "CSSStyle"
                    ]
                },
                "description": "<p>The actual style to be applied to the property</p>",
                "name": "rule"
            }
        ],
        "kind": "function",
        "name": "tryUpdateStyle",
        "longname": "tryUpdateStyle",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file text-track-enums.js\n*\n* https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode\n*\n* enum TextTrackMode { \"disabled\",  \"hidden\",  \"showing\" };\n*/",
        "meta": {
            "range": [
                0,
                175
            ],
            "filename": "text-track-enums.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "name": "tracks/text-track-enums.js",
        "kind": "file",
        "description": "<p>text-track-enums.js</p>\n<p>https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode</p>\n<p>enum TextTrackMode { &quot;disabled&quot;,  &quot;hidden&quot;,  &quot;showing&quot; };</p>",
        "preserveName": true,
        "longname": "tracks/text-track-enums.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file text-track-list.js\n*/",
        "meta": {
            "range": [
                0,
                33
            ],
            "filename": "text-track-list.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "name": "tracks/text-track-list.js",
        "kind": "file",
        "description": "<p>text-track-list.js</p>",
        "preserveName": true,
        "longname": "tracks/text-track-list.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file text-track-settings.js\n*/",
        "meta": {
            "range": [
                0,
                37
            ],
            "filename": "text-track-settings.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "name": "tracks/text-track-settings.js",
        "kind": "file",
        "description": "<p>text-track-settings.js</p>",
        "preserveName": true,
        "longname": "tracks/text-track-settings.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Manipulate settings of texttracks\n*\n* @param {Object} player  Main Player\n* @param {Object=} options Object of option names and values\n* @extends Component\n* @class TextTrackSettings\n*/",
        "meta": {
            "range": [
                59,
                250
            ],
            "filename": "text-track-settings.js",
            "lineno": 11,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Manipulate settings of texttracks</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Main Player</p>",
                "name": "player"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Object of option names and values</p>",
                "name": "options"
            }
        ],
        "augments": [
            "Component"
        ],
        "kind": "class",
        "name": "TextTrackSettings",
        "longname": "TextTrackSettings",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create the component's DOM element\n*\n* @return {Element}\n* @method createEl\n*/",
        "meta": {
            "range": [
                383,
                467
            ],
            "filename": "text-track-settings.js",
            "lineno": 63,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Create the component's DOM element</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get texttrack settings \n* Settings are\n* .vjs-edge-style\n* .vjs-font-family\n* .vjs-fg-color\n* .vjs-text-opacity\n* .vjs-bg-color\n* .vjs-bg-opacity\n* .window-color\n* .vjs-window-opacity \n*\n* @return {Object} \n* @method getValues\n*/",
        "meta": {
            "range": [
                489,
                724
            ],
            "filename": "text-track-settings.js",
            "lineno": 76,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Get texttrack settings \nSettings are\n.vjs-edge-style\n.vjs-font-family\n.vjs-fg-color\n.vjs-text-opacity\n.vjs-bg-color\n.vjs-bg-opacity\n.window-color\n.vjs-window-opacity</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "getValues",
        "longname": "getValues",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set texttrack settings \n* Settings are\n* .vjs-edge-style\n* .vjs-font-family\n* .vjs-fg-color\n* .vjs-text-opacity\n* .vjs-bg-color\n* .vjs-bg-opacity\n* .window-color\n* .vjs-window-opacity \n*\n* @param {Object} values Object with texttrack setting values\n* @method setValues\n*/",
        "meta": {
            "range": [
                821,
                1098
            ],
            "filename": "text-track-settings.js",
            "lineno": 123,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Set texttrack settings \nSettings are\n.vjs-edge-style\n.vjs-font-family\n.vjs-fg-color\n.vjs-text-opacity\n.vjs-bg-color\n.vjs-bg-opacity\n.window-color\n.vjs-window-opacity</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Object with texttrack setting values</p>",
                "name": "values"
            }
        ],
        "kind": "function",
        "name": "setValues",
        "longname": "setValues",
        "scope": "global"
    },
    {
        "comment": "/**\n* Restore texttrack settings \n*\n* @method restoreSettings\n*/",
        "meta": {
            "range": [
                1162,
                1226
            ],
            "filename": "text-track-settings.js",
            "lineno": 159,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Restore texttrack settings</p>",
        "kind": "function",
        "name": "restoreSettings",
        "longname": "restoreSettings",
        "scope": "global"
    },
    {
        "comment": "/**\n* Save texttrack settings to local storage \n*\n* @method saveSettings\n*/",
        "meta": {
            "range": [
                1263,
                1338
            ],
            "filename": "text-track-settings.js",
            "lineno": 176,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Save texttrack settings to local storage</p>",
        "kind": "function",
        "name": "saveSettings",
        "longname": "saveSettings",
        "scope": "global"
    },
    {
        "comment": "/**\n* Update display of texttrack settings  \n*\n* @method updateDisplay\n*/",
        "meta": {
            "range": [
                1384,
                1457
            ],
            "filename": "text-track-settings.js",
            "lineno": 196,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "description": "<p>Update display of texttrack settings</p>",
        "kind": "function",
        "name": "updateDisplay",
        "longname": "updateDisplay",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file text-track.js\n*/",
        "meta": {
            "range": [
                0,
                28
            ],
            "filename": "text-track.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks",
            "code": {}
        },
        "name": "tracks/text-track.js",
        "kind": "file",
        "description": "<p>text-track.js</p>",
        "preserveName": true,
        "longname": "tracks/text-track.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file browser.js\n*/",
        "meta": {
            "range": [
                0,
                25
            ],
            "filename": "browser.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "utils/browser.js",
        "kind": "file",
        "description": "<p>browser.js</p>",
        "preserveName": true,
        "longname": "utils/browser.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file buffer.js\n*/",
        "meta": {
            "range": [
                0,
                24
            ],
            "filename": "buffer.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "utils/buffer.js",
        "kind": "file",
        "description": "<p>buffer.js</p>",
        "preserveName": true,
        "longname": "utils/buffer.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Compute how much your video has been buffered\n*\n* @param  {Object} Buffered object\n* @param  {Number} Total duration\n* @return {Number} Percent buffered of the total duration\n* @private\n* @function bufferedPercent\n*/",
        "meta": {
            "range": [
                31,
                253
            ],
            "filename": "buffer.js",
            "lineno": 6,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Compute how much your video has been buffered</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>object</p>",
                "name": "Buffered"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>duration</p>",
                "name": "Total"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Percent buffered of the total duration</p>"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "bufferedPercent",
        "longname": "bufferedPercent",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file dom.js\n*/",
        "meta": {
            "range": [
                0,
                21
            ],
            "filename": "dom.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "utils/dom.js",
        "kind": "file",
        "description": "<p>dom.js</p>",
        "preserveName": true,
        "longname": "utils/dom.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Shorthand for document.getElementById()\n* Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.\n*\n* @param  {String} id  Element ID\n* @return {Element}    Element with supplied ID\n* @function getEl\n*/",
        "meta": {
            "range": [
                37,
                257
            ],
            "filename": "dom.js",
            "lineno": 9,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Shorthand for document.getElementById()\nAlso allows for CSS (jQuery) ID syntax. But nothing other than IDs.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Element ID</p>",
                "name": "id"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Element with supplied ID</p>"
            }
        ],
        "kind": "function",
        "name": "getEl",
        "longname": "getEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Creates an element and applies properties.\n*\n* @param  {String=} tagName    Name of tag to be created.\n* @param  {Object=} properties Element properties to be applied.\n* @return {Element}\n* @function createEl\n*/",
        "meta": {
            "range": [
                282,
                499
            ],
            "filename": "dom.js",
            "lineno": 25,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Creates an element and applies properties.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "optional": true,
                "description": "<p>Name of tag to be created.</p>",
                "name": "tagName"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Element properties to be applied.</p>",
                "name": "properties"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "createEl",
        "longname": "createEl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Insert an element as the first child node of another\n* \n* @param  {Element} child   Element to insert\n* @param  {Element} parent Element to insert child into\n* @private\n* @function insertElFirst\n*/",
        "meta": {
            "range": [
                572,
                775
            ],
            "filename": "dom.js",
            "lineno": 57,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Insert an element as the first child node of another</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Element to insert</p>",
                "name": "child"
            },
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Element to insert child into</p>",
                "name": "parent"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "insertElFirst",
        "longname": "insertElFirst",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns the cache object where data for an element is stored\n*\n* @param  {Element} el Element to store data for.\n* @return {Object}\n* @function getElData\n*/",
        "meta": {
            "range": [
                1172,
                1334
            ],
            "filename": "dom.js",
            "lineno": 92,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Returns the cache object where data for an element is stored</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Element to store data for.</p>",
                "name": "el"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "getElData",
        "longname": "getElData",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns whether or not an element has cached data\n*\n* @param  {Element} el A dom element\n* @return {Boolean}\n* @private\n* @function hasElData\n*/",
        "meta": {
            "range": [
                1377,
                1527
            ],
            "filename": "dom.js",
            "lineno": 113,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Returns whether or not an element has cached data</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>A dom element</p>",
                "name": "el"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "hasElData",
        "longname": "hasElData",
        "scope": "global"
    },
    {
        "comment": "/**\n* Delete data for the element from the cache and the guid attr from getElementById\n*\n* @param  {Element} el Remove data for an element\n* @private\n* @function removeElData\n*/",
        "meta": {
            "range": [
                1558,
                1735
            ],
            "filename": "dom.js",
            "lineno": 131,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Delete data for the element from the cache and the guid attr from getElementById</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Remove data for an element</p>",
                "name": "el"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "removeElData",
        "longname": "removeElData",
        "scope": "global"
    },
    {
        "comment": "/**\n* Check if an element has a CSS class\n*\n* @param {Element} element Element to check\n* @param {String} classToCheck Classname to check\n* @function hasElClass\n*/",
        "meta": {
            "range": [
                1805,
                1968
            ],
            "filename": "dom.js",
            "lineno": 161,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Check if an element has a CSS class</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Element to check</p>",
                "name": "element"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Classname to check</p>",
                "name": "classToCheck"
            }
        ],
        "kind": "function",
        "name": "hasElClass",
        "longname": "hasElClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add a CSS class name to an element\n*\n* @param {Element} element    Element to add class name to\n* @param {String} classToAdd Classname to add\n* @function addElClass\n*/",
        "meta": {
            "range": [
                1981,
                2154
            ],
            "filename": "dom.js",
            "lineno": 172,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Add a CSS class name to an element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Element to add class name to</p>",
                "name": "element"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Classname to add</p>",
                "name": "classToAdd"
            }
        ],
        "kind": "function",
        "name": "addElClass",
        "longname": "addElClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Remove a CSS class name from an element\n*\n* @param {Element} element    Element to remove from class name\n* @param {String} classToRemove Classname to remove\n* @function removeElClass\n*/",
        "meta": {
            "range": [
                2173,
                2365
            ],
            "filename": "dom.js",
            "lineno": 185,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Remove a CSS class name from an element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Element to remove from class name</p>",
                "name": "element"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Classname to remove</p>",
                "name": "classToRemove"
            }
        ],
        "kind": "function",
        "name": "removeElClass",
        "longname": "removeElClass",
        "scope": "global"
    },
    {
        "comment": "/**\n* Apply attributes to an HTML element.\n*\n* @param  {Element} el         Target element.\n* @param  {Object=} attributes Element attributes to be applied.\n* @private\n* @function setElAttributes\n*/",
        "meta": {
            "range": [
                2411,
                2609
            ],
            "filename": "dom.js",
            "lineno": 207,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Apply attributes to an HTML element.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Target element.</p>",
                "name": "el"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Element attributes to be applied.</p>",
                "name": "attributes"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "setElAttributes",
        "longname": "setElAttributes",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get an element's attribute values, as defined on the HTML tag\n* Attributes are not the same as properties. They're defined on the tag\n* or with setAttribute (which shouldn't be used with HTML)\n* This will return true or false for boolean attributes.\n*\n* @param  {Element} tag Element from which to get tag attributes\n* @return {Object}\n* @private\n* @function getElAttributes\n*/",
        "meta": {
            "range": [
                2646,
                3029
            ],
            "filename": "dom.js",
            "lineno": 227,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Get an element's attribute values, as defined on the HTML tag\nAttributes are not the same as properties. They're defined on the tag\nor with setAttribute (which shouldn't be used with HTML)\nThis will return true or false for boolean attributes.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Element from which to get tag attributes</p>",
                "name": "tag"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                }
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "getElAttributes",
        "longname": "getElAttributes",
        "scope": "global"
    },
    {
        "comment": "/**\n* Attempt to block the ability to select text while dragging controls\n*\n* @return {Boolean} \n* @method blockTextSelection\n*/",
        "meta": {
            "range": [
                3129,
                3257
            ],
            "filename": "dom.js",
            "lineno": 271,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Attempt to block the ability to select text while dragging controls</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "blockTextSelection",
        "longname": "blockTextSelection",
        "scope": "global"
    },
    {
        "comment": "/**\n* Turn off text selection blocking\n*\n* @return {Boolean} \n* @method unblockTextSelection\n*/",
        "meta": {
            "range": [
                3279,
                3374
            ],
            "filename": "dom.js",
            "lineno": 284,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Turn off text selection blocking</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "unblockTextSelection",
        "longname": "unblockTextSelection",
        "scope": "global"
    },
    {
        "comment": "/**\n* Offset Left\n* getBoundingClientRect technique from \n* John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/\n*\n* @param {Element} el Element from which to get offset\n* @return {Object=} \n* @method findElPosition\n*/",
        "meta": {
            "range": [
                3393,
                3625
            ],
            "filename": "dom.js",
            "lineno": 296,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Offset Left\ngetBoundingClientRect technique from \nJohn Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element"
                    ]
                },
                "description": "<p>Element from which to get offset</p>",
                "name": "el"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true
            }
        ],
        "kind": "function",
        "name": "findElPosition",
        "longname": "findElPosition",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file events.js\n*\n* Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)\n* (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)\n* This should work very similarly to jQuery's events, however it's based off the book version which isn't as\n* robust as jquery's, so there's probably some differences.\n*/",
        "meta": {
            "range": [
                0,
                377
            ],
            "filename": "events.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "utils/events.js",
        "kind": "file",
        "description": "<p>events.js</p>\n<p>Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)\n(Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)\nThis should work very similarly to jQuery's events, however it's based off the book version which isn't as\nrobust as jquery's, so there's probably some differences.</p>",
        "preserveName": true,
        "longname": "utils/events.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Add an event listener to element\n* It stores the handler function in a separate cache object\n* and adds a generic handler to the element's event,\n* along with a unique id (guid) to the element.\n* \n* @param  {Element|Object}   elem Element or object to bind listeners to\n* @param  {String|Array}   type Type of event to bind to.\n* @param  {Function} fn   Event listener.\n* @method on\n*/",
        "meta": {
            "range": [
                396,
                787
            ],
            "filename": "events.js",
            "lineno": 15,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Add an event listener to element\nIt stores the handler function in a separate cache object\nand adds a generic handler to the element's event,\nalong with a unique id (guid) to the element.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element",
                        "Object"
                    ]
                },
                "description": "<p>Element or object to bind listeners to</p>",
                "name": "elem"
            },
            {
                "type": {
                    "names": [
                        "String",
                        "Array"
                    ]
                },
                "description": "<p>Type of event to bind to.</p>",
                "name": "type"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>Event listener.</p>",
                "name": "fn"
            }
        ],
        "kind": "function",
        "name": "on",
        "longname": "on",
        "scope": "global"
    },
    {
        "comment": "/**\n* Removes event listeners from an element\n*\n* @param  {Element|Object}   elem Object to remove listeners from\n* @param  {String|Array=}   type Type of listener to remove. Don't include to remove all events from element.\n* @param  {Function} fn   Specific listener to remove. Don't include to remove listeners for an event type.\n* @method off\n*/",
        "meta": {
            "range": [
                938,
                1286
            ],
            "filename": "events.js",
            "lineno": 76,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Removes event listeners from an element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element",
                        "Object"
                    ]
                },
                "description": "<p>Object to remove listeners from</p>",
                "name": "elem"
            },
            {
                "type": {
                    "names": [
                        "String",
                        "Array"
                    ]
                },
                "description": "<p>Type of listener to remove. Don't include to remove all events from element.</p>",
                "name": "type"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>Specific listener to remove. Don't include to remove listeners for an event type.</p>",
                "name": "fn"
            }
        ],
        "kind": "function",
        "name": "off",
        "longname": "off",
        "scope": "global"
    },
    {
        "comment": "/**\n* Trigger an event for an element\n*\n* @param  {Element|Object}      elem  Element to trigger an event on\n* @param  {Event|Object|String} event A string (the type) or an event object with a type attribute\n* @param  {Object} [hash] data hash to pass along with the event\n* @return {Boolean=} Returned only if default was prevented\n* @method trigger\n*/",
        "meta": {
            "range": [
                1431,
                1784
            ],
            "filename": "events.js",
            "lineno": 132,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Trigger an event for an element</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element",
                        "Object"
                    ]
                },
                "description": "<p>Element to trigger an event on</p>",
                "name": "elem"
            },
            {
                "type": {
                    "names": [
                        "Event",
                        "Object",
                        "String"
                    ]
                },
                "description": "<p>A string (the type) or an event object with a type attribute</p>",
                "name": "event"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>data hash to pass along with the event</p>",
                "name": "hash"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Boolean"
                    ]
                },
                "optional": true,
                "description": "<p>Returned only if default was prevented</p>"
            }
        ],
        "kind": "function",
        "name": "trigger",
        "longname": "trigger",
        "scope": "global"
    },
    {
        "comment": "/**\n* Trigger a listener only once for an event\n*\n* @param  {Element|Object}   elem Element or object to\n* @param  {String|Array}   type Name/type of event\n* @param  {Function} fn Event handler function\n* @method one\n*/",
        "meta": {
            "range": [
                1926,
                2145
            ],
            "filename": "events.js",
            "lineno": 188,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Trigger a listener only once for an event</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element",
                        "Object"
                    ]
                },
                "description": "<p>Element or object to</p>",
                "name": "elem"
            },
            {
                "type": {
                    "names": [
                        "String",
                        "Array"
                    ]
                },
                "description": "<p>Name/type of event</p>",
                "name": "type"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>Event handler function</p>",
                "name": "fn"
            }
        ],
        "kind": "function",
        "name": "one",
        "longname": "one",
        "scope": "global"
    },
    {
        "comment": "/**\n* Fix a native event to have standard property values\n* \n* @param  {Object} event Event object to fix\n* @return {Object}\n* @private\n* @method fixEvent\n*/",
        "meta": {
            "range": [
                2185,
                2342
            ],
            "filename": "events.js",
            "lineno": 209,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Fix a native event to have standard property values</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Event object to fix</p>",
                "name": "event"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                }
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "fixEvent",
        "longname": "fixEvent",
        "scope": "global"
    },
    {
        "comment": "/**\n* Clean up the listener cache and dispatchers\n*\n* @param  {Element|Object} elem Element to clean up\n* @param  {String} type Type of event to clean up\n* @private\n* @method _cleanUpEvents\n*/",
        "meta": {
            "range": [
                2649,
                2841
            ],
            "filename": "events.js",
            "lineno": 319,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Clean up the listener cache and dispatchers</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Element",
                        "Object"
                    ]
                },
                "description": "<p>Element to clean up</p>",
                "name": "elem"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Type of event to clean up</p>",
                "name": "type"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "_cleanUpEvents",
        "longname": "_cleanUpEvents",
        "scope": "global"
    },
    {
        "comment": "/**\n* Loops through an array of event types and calls the requested method for each type.\n*\n* @param  {Function} fn   The event method we want to use.\n* @param  {Element|Object} elem Element or object to bind listeners to\n* @param  {String}   type Type of event to bind to.\n* @param  {Function} callback   Event listener.\n* @private\n* @function _handleMultipleEvents\n*/",
        "meta": {
            "range": [
                2932,
                3301
            ],
            "filename": "events.js",
            "lineno": 357,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Loops through an array of event types and calls the requested method for each type.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>The event method we want to use.</p>",
                "name": "fn"
            },
            {
                "type": {
                    "names": [
                        "Element",
                        "Object"
                    ]
                },
                "description": "<p>Element or object to bind listeners to</p>",
                "name": "elem"
            },
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Type of event to bind to.</p>",
                "name": "type"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>Event listener.</p>",
                "name": "callback"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "_handleMultipleEvents",
        "longname": "_handleMultipleEvents",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file fn.js\n*/",
        "meta": {
            "range": [
                0,
                20
            ],
            "filename": "fn.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "utils/fn.js",
        "kind": "file",
        "description": "<p>fn.js</p>",
        "preserveName": true,
        "longname": "utils/fn.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Bind (a.k.a proxy or Context). A simple method for changing the context of a function\n* It also stores a unique id on the function so it can be easily removed from events\n*\n* @param  {*}   context The object to bind as scope\n* @param  {Function} fn      The function to be bound to a scope\n* @param  {Number=}   uid     An optional unique ID for the function to be set\n* @return {Function}\n* @private\n* @method bind\n*/",
        "meta": {
            "range": [
                27,
                451
            ],
            "filename": "fn.js",
            "lineno": 6,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Bind (a.k.a proxy or Context). A simple method for changing the context of a function\nIt also stores a unique id on the function so it can be easily removed from events</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "*"
                    ]
                },
                "description": "<p>The object to bind as scope</p>",
                "name": "context"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>The function to be bound to a scope</p>",
                "name": "fn"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "optional": true,
                "description": "<p>An optional unique ID for the function to be set</p>",
                "name": "uid"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "function"
                    ]
                }
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "bind",
        "longname": "bind",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file format-time.js\n*\n* Format seconds as a time string, H:MM:SS or M:SS\n* Supplying a guide (in seconds) will force a number of leading zeros\n* to cover the length of the guide\n*\n* @param  {Number} seconds Number of seconds to be turned into a string\n* @param  {Number} guide   Number (in seconds) to model the string after\n* @return {String}         Time formatted as H:MM:SS or M:SS\n* @private\n* @function formatTime\n*/",
        "meta": {
            "range": [
                0,
                429
            ],
            "filename": "format-time.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "formatTime",
        "kind": "function",
        "description": "<p>format-time.js</p>\n<p>Format seconds as a time string, H:MM:SS or M:SS\nSupplying a guide (in seconds) will force a number of leading zeros\nto cover the length of the guide</p>",
        "preserveName": true,
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Number of seconds to be turned into a string</p>",
                "name": "seconds"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Number (in seconds) to model the string after</p>",
                "name": "guide"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Time formatted as H:MM:SS or M:SS</p>"
            }
        ],
        "access": "private",
        "longname": "formatTime",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file guid.js\n*\n* Unique ID for an element or function\n* @type {Number}\n* @private\n*/",
        "meta": {
            "range": [
                0,
                91
            ],
            "filename": "guid.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "utils/guid.js",
        "kind": "file",
        "description": "<p>guid.js</p>\n<p>Unique ID for an element or function</p>",
        "preserveName": true,
        "type": {
            "names": [
                "Number"
            ]
        },
        "access": "private",
        "longname": "utils/guid.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the next unique ID\n*\n* @return {String} \n* @function newGUID\n*/",
        "meta": {
            "range": [
                98,
                171
            ],
            "filename": "guid.js",
            "lineno": 10,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Get the next unique ID</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "kind": "function",
        "name": "newGUID",
        "longname": "newGUID",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file log.js\n*/",
        "meta": {
            "range": [
                0,
                21
            ],
            "filename": "log.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "utils/log.js",
        "kind": "file",
        "description": "<p>log.js</p>",
        "preserveName": true,
        "longname": "utils/log.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Log messages to the console and history based on the type of message\n*\n* @param  {String} type The type of message, or `null` for `log`\n* @param  {Object} args The args to be passed to the log\n* @private\n* @method _logType\n*/",
        "meta": {
            "range": [
                218,
                449
            ],
            "filename": "log.js",
            "lineno": 33,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Log messages to the console and history based on the type of message</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The type of message, or <code>null</code> for <code>log</code></p>",
                "name": "type"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The args to be passed to the log</p>",
                "name": "args"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "_logType",
        "longname": "_logType",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file merge-options.js\n*/",
        "meta": {
            "range": [
                0,
                31
            ],
            "filename": "merge-options.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "utils/merge-options.js",
        "kind": "file",
        "description": "<p>merge-options.js</p>",
        "preserveName": true,
        "longname": "utils/merge-options.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Merge two options objects, recursively merging **only** plain object\n* properties.  Previously `deepMerge`.\n*\n* @param  {Object} object    The destination object\n* @param  {...Object} source One or more objects to merge into the first\n* @returns {Object}          The updated first object\n* @function mergeOptions\n*/",
        "meta": {
            "range": [
                59,
                381
            ],
            "filename": "merge-options.js",
            "lineno": 13,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Merge two options objects, recursively merging <strong>only</strong> plain object\nproperties.  Previously <code>deepMerge</code>.</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The destination object</p>",
                "name": "object"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "variable": true,
                "description": "<p>One or more objects to merge into the first</p>",
                "name": "source"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The updated first object</p>"
            }
        ],
        "kind": "function",
        "name": "mergeOptions",
        "longname": "mergeOptions",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file round-float.js\n*\n* Should round off a number to a decimal place\n*\n* @param  {Number} num Number to round\n* @param  {Number} dec Number of decimal places to round to\n* @return {Number}     Rounded number\n* @private\n* @method roundFloat\n*/",
        "meta": {
            "range": [
                0,
                249
            ],
            "filename": "round-float.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "roundFloat",
        "kind": "function",
        "description": "<p>round-float.js</p>\n<p>Should round off a number to a decimal place</p>",
        "preserveName": true,
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Number to round</p>",
                "name": "num"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Number of decimal places to round to</p>",
                "name": "dec"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Rounded number</p>"
            }
        ],
        "access": "private",
        "longname": "roundFloat",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file time-ranges.js\n*\n* Should create a fake TimeRange object\n* Mimics an HTML5 time range instance, which has functions that\n* return the start and end times for a range\n* TimeRanges are returned by the buffered() method\n*\n* @param  {Number} start Start time in seconds\n* @param  {Number} end   End time in seconds\n* @return {Object}       Fake TimeRange object\n* @private\n* @method createTimeRange\n*/",
        "meta": {
            "range": [
                0,
                409
            ],
            "filename": "time-ranges.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "createTimeRange",
        "kind": "function",
        "description": "<p>time-ranges.js</p>\n<p>Should create a fake TimeRange object\nMimics an HTML5 time range instance, which has functions that\nreturn the start and end times for a range\nTimeRanges are returned by the buffered() method</p>",
        "preserveName": true,
        "params": [
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>Start time in seconds</p>",
                "name": "start"
            },
            {
                "type": {
                    "names": [
                        "Number"
                    ]
                },
                "description": "<p>End time in seconds</p>",
                "name": "end"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>Fake TimeRange object</p>"
            }
        ],
        "access": "private",
        "longname": "createTimeRange",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file to-title-case.js\n*\n* Uppercase the first letter of a string\n*\n* @param  {String} string String to be uppercased\n* @return {String}\n* @private\n* @method toTitleCase\n*/",
        "meta": {
            "range": [
                0,
                178
            ],
            "filename": "to-title-case.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "toTitleCase",
        "kind": "function",
        "description": "<p>to-title-case.js</p>\n<p>Uppercase the first letter of a string</p>",
        "preserveName": true,
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>String to be uppercased</p>",
                "name": "string"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                }
            }
        ],
        "access": "private",
        "longname": "toTitleCase",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file url.js\n*/",
        "meta": {
            "range": [
                0,
                21
            ],
            "filename": "url.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "name": "utils/url.js",
        "kind": "file",
        "description": "<p>url.js</p>",
        "preserveName": true,
        "longname": "utils/url.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Resolve and parse the elements of a URL\n*\n* @param  {String} url The url to parse\n* @return {Object}     An object of url details\n* @method parseUrl\n*/",
        "meta": {
            "range": [
                28,
                185
            ],
            "filename": "url.js",
            "lineno": 6,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Resolve and parse the elements of a URL</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The url to parse</p>",
                "name": "url"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>An object of url details</p>"
            }
        ],
        "kind": "function",
        "name": "parseUrl",
        "longname": "parseUrl",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get absolute version of relative URL. Used to tell flash correct URL.\n* http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue\n*\n* @param  {String} url URL to make absolute\n* @return {String}     Absolute URL\n* @private\n* @method getAbsoluteURL\n*/",
        "meta": {
            "range": [
                321,
                615
            ],
            "filename": "url.js",
            "lineno": 58,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Get absolute version of relative URL. Used to tell flash correct URL.\nhttp://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>URL to make absolute</p>",
                "name": "url"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>Absolute URL</p>"
            }
        ],
        "access": "private",
        "kind": "function",
        "name": "getAbsoluteURL",
        "longname": "getAbsoluteURL",
        "scope": "global"
    },
    {
        "comment": "/**\n* Returns the extension of the passed file name. It will return an empty string if you pass an invalid path\n*\n* @param {String}    path    The fileName path like '/path/to/file.mp4'\n* @returns {String}          The extension in lower case or an empty string if no extension could be found.\n* @method getFileExtension\n*/",
        "meta": {
            "range": [
                652,
                975
            ],
            "filename": "url.js",
            "lineno": 79,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils",
            "code": {}
        },
        "description": "<p>Returns the extension of the passed file name. It will return an empty string if you pass an invalid path</p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The fileName path like '/path/to/file.mp4'</p>",
                "name": "path"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The extension in lower case or an empty string if no extension could be found.</p>"
            }
        ],
        "kind": "function",
        "name": "getFileExtension",
        "longname": "getFileExtension",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file video.js\n*/",
        "meta": {
            "range": [
                0,
                23
            ],
            "filename": "video.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "video.js",
        "kind": "file",
        "description": "<p>video.js</p>",
        "preserveName": true,
        "longname": "video.js",
        "scope": "global"
    },
    {
        "comment": "/**\n* Doubles as the main function for users to create a player instance and also\n* the main library object.\n* The `videojs` function can be used to initialize or retrieve a player.\n* ```js\n*     var myPlayer = videojs('my_video_id');\n* ```\n*\n* @param  {String|Element} id      Video element or video element ID\n* @param  {Object=} options        Optional options object for config/settings\n* @param  {Function=} ready        Optional ready callback\n* @return {Player}                 A player instance\n* @mixes videojs\n* @method videojs\n*/",
        "meta": {
            "range": [
                102,
                642
            ],
            "filename": "video.js",
            "lineno": 30,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Doubles as the main function for users to create a player instance and also\nthe main library object.\nThe <code>videojs</code> function can be used to initialize or retrieve a player.</p>\n<pre class=\"prettyprint source lang-js\"><code>    var myPlayer = videojs('my_video_id');</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "String",
                        "Element"
                    ]
                },
                "description": "<p>Video element or video element ID</p>",
                "name": "id"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "optional": true,
                "description": "<p>Optional options object for config/settings</p>",
                "name": "options"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "optional": true,
                "description": "<p>Optional ready callback</p>",
                "name": "ready"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Player"
                    ]
                },
                "description": "<p>A player instance</p>"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "videojs",
        "longname": "videojs",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get the global options object\n*\n* @return {Object} The global options object\n* @mixes videojs\n* @method getGlobalOptions\n*/",
        "meta": {
            "range": [
                860,
                989
            ],
            "filename": "video.js",
            "lineno": 102,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get the global options object</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The global options object</p>"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "getGlobalOptions",
        "longname": "getGlobalOptions",
        "scope": "global"
    },
    {
        "comment": "/**\n* Set options that will apply to every player\n* ```js\n*     videojs.setGlobalOptions({\n*       autoplay: true\n*     });\n*     // -> all players will autoplay by default\n* ```\n* NOTE: This will do a deep merge with the new options,\n* not overwrite the entire global options object.\n*\n* @return {Object} The updated global options object\n* @mixes videojs\n* @method setGlobalOptions\n*/",
        "meta": {
            "range": [
                996,
                1382
            ],
            "filename": "video.js",
            "lineno": 111,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Set options that will apply to every player</p>\n<pre class=\"prettyprint source lang-js\"><code>    videojs.setGlobalOptions({\n      autoplay: true\n    });\n    // -> all players will autoplay by default</code></pre><p>NOTE: This will do a deep merge with the new options,\nnot overwrite the entire global options object.</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The updated global options object</p>"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "setGlobalOptions",
        "longname": "setGlobalOptions",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get an object with the currently created players, keyed by player ID\n*\n* @return {Object} The created players\n* @mixes videojs\n* @method getPlayers\n*/",
        "meta": {
            "range": [
                1395,
                1551
            ],
            "filename": "video.js",
            "lineno": 130,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get an object with the currently created players, keyed by player ID</p>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The created players</p>"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "getPlayers",
        "longname": "getPlayers",
        "scope": "global"
    },
    {
        "comment": "/**\n* Get a component class object by name\n* ```js\n*     var VjsButton = videojs.getComponent('Button');\n*     // Create a new instance of the component\n*     var myButton = new VjsButton(myPlayer);\n* ```\n*\n* @return {Component} Component identified by name\n* @mixes videojs\n* @method getComponent\n*/",
        "meta": {
            "range": [
                1564,
                1864
            ],
            "filename": "video.js",
            "lineno": 141,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Get a component class object by name</p>\n<pre class=\"prettyprint source lang-js\"><code>    var VjsButton = videojs.getComponent('Button');\n    // Create a new instance of the component\n    var myButton = new VjsButton(myPlayer);</code></pre>",
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>Component identified by name</p>"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "getComponent",
        "longname": "getComponent",
        "scope": "global"
    },
    {
        "comment": "/**\n* Register a component so it can referred to by name\n* Used when adding to other\n* components, either through addChild\n* `component.addChild('myComponent')`\n* or through default children options\n* `{ children: ['myComponent'] }`.\n* ```js\n*     // Get a component to subclass\n*     var VjsButton = videojs.getComponent('Button');\n*     // Subclass the component (see 'extends' doc for more info)\n*     var MySpecialButton = videojs.extends(VjsButton, {});\n*     // Register the new component\n*     VjsButton.registerComponent('MySepcialButton', MySepcialButton);\n*     // (optionally) add the new component as a default player child\n*     myPlayer.addChild('MySepcialButton');\n* ```\n* NOTE: You could also just initialize the component before adding.\n* `component.addChild(new MyComponent());`\n*\n* @param {String} The class name of the component\n* @param {Component} The component class\n* @return {Component} The newly registered component\n* @mixes videojs\n* @method registerComponent\n*/",
        "meta": {
            "range": [
                1871,
                2861
            ],
            "filename": "video.js",
            "lineno": 155,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Register a component so it can referred to by name\nUsed when adding to other\ncomponents, either through addChild\n<code>component.addChild('myComponent')</code>\nor through default children options\n<code>{ children: ['myComponent'] }</code>.</p>\n<pre class=\"prettyprint source lang-js\"><code>    // Get a component to subclass\n    var VjsButton = videojs.getComponent('Button');\n    // Subclass the component (see 'extends' doc for more info)\n    var MySpecialButton = videojs.extends(VjsButton, {});\n    // Register the new component\n    VjsButton.registerComponent('MySepcialButton', MySepcialButton);\n    // (optionally) add the new component as a default player child\n    myPlayer.addChild('MySepcialButton');</code></pre><p>NOTE: You could also just initialize the component before adding.\n<code>component.addChild(new MyComponent());</code></p>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>class name of the component</p>",
                "name": "The"
            },
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>component class</p>",
                "name": "The"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Component"
                    ]
                },
                "description": "<p>The newly registered component</p>"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "registerComponent",
        "longname": "registerComponent",
        "scope": "global"
    },
    {
        "comment": "/**\n* Subclass an existing class\n* Mimics ES6 subclassing with the `extends` keyword\n* ```js\n*     // Create a basic javascript 'class'\n*     function MyClass(name){\n*       // Set a property at initialization\n*       this.myName = name;\n*     }\n*     // Create an instance method\n*     MyClass.prototype.sayMyName = function(){\n*       alert(this.myName);\n*     };\n*     // Subclass the exisitng class and change the name\n*     // when initializing\n*     var MySubClass = videojs.extends(MyClass, {\n*       constructor: function(name) {\n*         // Call the super class constructor for the subclass\n*         MyClass.call(this, name)\n*       }\n*     });\n*     // Create an instance of the new sub class\n*     var myInstance = new MySubClass('John');\n*     myInstance.sayMyName(); // -> should alert \"John\"\n* ```\n*\n* @param {Function} The Class to subclass\n* @param {Object} An object including instace methods for the new class\n*                   Optionally including a `constructor` function\n* @return {Function} The newly created subclass\n* @mixes videojs\n* @method extends\n*/",
        "meta": {
            "range": [
                2937,
                4018
            ],
            "filename": "video.js",
            "lineno": 190,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Subclass an existing class\nMimics ES6 subclassing with the <code>extends</code> keyword</p>\n<pre class=\"prettyprint source lang-js\"><code>    // Create a basic javascript 'class'\n    function MyClass(name){\n      // Set a property at initialization\n      this.myName = name;\n    }\n    // Create an instance method\n    MyClass.prototype.sayMyName = function(){\n      alert(this.myName);\n    };\n    // Subclass the exisitng class and change the name\n    // when initializing\n    var MySubClass = videojs.extends(MyClass, {\n      constructor: function(name) {\n        // Call the super class constructor for the subclass\n        MyClass.call(this, name)\n      }\n    });\n    // Create an instance of the new sub class\n    var myInstance = new MySubClass('John');\n    myInstance.sayMyName(); // -> should alert &quot;John&quot;</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>Class to subclass</p>",
                "name": "The"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>object including instace methods for the new class\n                  Optionally including a <code>constructor</code> function</p>",
                "name": "An"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>The newly created subclass</p>"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "extends",
        "longname": "extends",
        "scope": "global"
    },
    {
        "comment": "/**\n* Merge two options objects recursively\n* Performs a deep merge like lodash.merge but **only merges plain objects**\n* (not arrays, elements, anything else)\n* Other values will be copied directly from the second object.\n* ```js\n*     var defaultOptions = {\n*       foo: true,\n*       bar: {\n*         a: true,\n*         b: [1,2,3]\n*       }\n*     };\n*     var newOptions = {\n*       foo: false,\n*       bar: {\n*         b: [4,5,6]\n*       }\n*     };\n*     var result = videojs.mergeOptions(defaultOptions, newOptions);\n*     // result.foo = false;\n*     // result.bar.a = true;\n*     // result.bar.b = [4,5,6];\n* ```\n*\n* @param {Object} The options object whose values will be overriden\n* @param {Object} The options object with values to override the first\n* @param {Object} Any number of additional options objects\n*\n* @return {Object} a new object with the merged values\n* @mixes videojs\n* @method mergeOptions\n*/",
        "meta": {
            "range": [
                4025,
                4944
            ],
            "filename": "video.js",
            "lineno": 225,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Merge two options objects recursively\nPerforms a deep merge like lodash.merge but <strong>only merges plain objects</strong>\n(not arrays, elements, anything else)\nOther values will be copied directly from the second object.</p>\n<pre class=\"prettyprint source lang-js\"><code>    var defaultOptions = {\n      foo: true,\n      bar: {\n        a: true,\n        b: [1,2,3]\n      }\n    };\n    var newOptions = {\n      foo: false,\n      bar: {\n        b: [4,5,6]\n      }\n    };\n    var result = videojs.mergeOptions(defaultOptions, newOptions);\n    // result.foo = false;\n    // result.bar.a = true;\n    // result.bar.b = [4,5,6];</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>options object whose values will be overriden</p>",
                "name": "The"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>options object with values to override the first</p>",
                "name": "The"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>number of additional options objects</p>",
                "name": "Any"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>a new object with the merged values</p>"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "mergeOptions",
        "longname": "mergeOptions",
        "scope": "global"
    },
    {
        "comment": "/**\n* Create a Video.js player plugin\n* Plugins are only initialized when options for the plugin are included\n* in the player options, or the plugin function on the player instance is\n* called.\n* **See the plugin guide in the docs for a more detailed example**\n* ```js\n*     // Make a plugin that alerts when the player plays\n*     videojs.plugin('myPlugin', function(myPluginOptions) {\n*       myPluginOptions = myPluginOptions || {};\n*\n*       var player = this;\n*       var alertText = myPluginOptions.text || 'Player is playing!'\n*\n*       player.on('play', function(){\n*         alert(alertText);\n*       });\n*     });\n*     // USAGE EXAMPLES\n*     // EXAMPLE 1: New player with plugin options, call plugin immediately\n*     var player1 = videojs('idOne', {\n*       myPlugin: {\n*         text: 'Custom text!'\n*       }\n*     });\n*     // Click play\n*     // --> Should alert 'Custom text!'\n*     // EXAMPLE 3: New player, initialize plugin later\n*     var player3 = videojs('idThree');\n*     // Click play\n*     // --> NO ALERT\n*     // Click pause\n*     // Initialize plugin using the plugin function on the player instance\n*     player3.myPlugin({\n*       text: 'Plugin added later!'\n*     });\n*     // Click play\n*     // --> Should alert 'Plugin added later!'\n* ```\n*\n* @param {String} The plugin name\n* @param {Function} The plugin function that will be called with options\n* @mixes videojs\n* @method plugin\n*/",
        "meta": {
            "range": [
                4951,
                6371
            ],
            "filename": "video.js",
            "lineno": 260,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Create a Video.js player plugin\nPlugins are only initialized when options for the plugin are included\nin the player options, or the plugin function on the player instance is\ncalled.\n<strong>See the plugin guide in the docs for a more detailed example</strong></p>\n<pre class=\"prettyprint source lang-js\"><code>    // Make a plugin that alerts when the player plays\n    videojs.plugin('myPlugin', function(myPluginOptions) {\n      myPluginOptions = myPluginOptions || {};\n\n      var player = this;\n      var alertText = myPluginOptions.text || 'Player is playing!'\n\n      player.on('play', function(){\n        alert(alertText);\n      });\n    });\n    // USAGE EXAMPLES\n    // EXAMPLE 1: New player with plugin options, call plugin immediately\n    var player1 = videojs('idOne', {\n      myPlugin: {\n        text: 'Custom text!'\n      }\n    });\n    // Click play\n    // --> Should alert 'Custom text!'\n    // EXAMPLE 3: New player, initialize plugin later\n    var player3 = videojs('idThree');\n    // Click play\n    // --> NO ALERT\n    // Click pause\n    // Initialize plugin using the plugin function on the player instance\n    player3.myPlugin({\n      text: 'Plugin added later!'\n    });\n    // Click play\n    // --> Should alert 'Plugin added later!'</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>plugin name</p>",
                "name": "The"
            },
            {
                "type": {
                    "names": [
                        "function"
                    ]
                },
                "description": "<p>plugin function that will be called with options</p>",
                "name": "The"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "plugin",
        "longname": "plugin",
        "scope": "global"
    },
    {
        "comment": "/**\n* Adding languages so that they're available to all players.\n* ```js\n*     videojs.addLanguage('es', { 'Hello': 'Hola' });\n* ```\n*\n* @param  {String} code The language code or dictionary property\n* @param  {Object} data The data values to be translated\n* @return {Object} The resulting language dictionary object\n* @mixes videojs\n* @method addLanguage\n*/",
        "meta": {
            "range": [
                6378,
                6736
            ],
            "filename": "video.js",
            "lineno": 307,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "description": "<p>Adding languages so that they're available to all players.</p>\n<pre class=\"prettyprint source lang-js\"><code>    videojs.addLanguage('es', { 'Hello': 'Hola' });</code></pre>",
        "params": [
            {
                "type": {
                    "names": [
                        "String"
                    ]
                },
                "description": "<p>The language code or dictionary property</p>",
                "name": "code"
            },
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The data values to be translated</p>",
                "name": "data"
            }
        ],
        "returns": [
            {
                "type": {
                    "names": [
                        "Object"
                    ]
                },
                "description": "<p>The resulting language dictionary object</p>"
            }
        ],
        "mixes": [
            "videojs"
        ],
        "kind": "function",
        "name": "addLanguage",
        "longname": "addLanguage",
        "scope": "global"
    },
    {
        "comment": "/**\n* @file xhr.js\n*/",
        "meta": {
            "range": [
                0,
                21
            ],
            "filename": "xhr.js",
            "lineno": 1,
            "path": "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src",
            "code": {}
        },
        "name": "xhr.js",
        "kind": "file",
        "description": "<p>xhr.js</p>",
        "preserveName": true,
        "longname": "xhr.js",
        "scope": "global"
    },
    {
        "kind": "package",
        "longname": "package:undefined",
        "files": [
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/base-styles.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/big-play-button.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/button.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/component.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/control-bar.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/fullscreen-toggle.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/live-display.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/mute-toggle.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/play-toggle.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu/playback-rate-menu-button.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/playback-rate-menu/playback-rate-menu-item.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control/load-progress-bar.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control/play-progress-bar.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control/progress-control.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/progress-control/seek-bar.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls/custom-control-spacer.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/spacer-controls/spacer.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls/caption-settings-menu-item.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls/captions-button.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls/chapters-button.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls/chapters-track-menu-item.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls/off-text-track-menu-item.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls/subtitles-button.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls/text-track-button.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/text-track-controls/text-track-menu-item.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls/current-time-display.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls/duration-display.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls/remaining-time-display.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/time-controls/time-divider.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control/volume-bar.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control/volume-control.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-control/volume-level.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/control-bar/volume-menu-button.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/error-display.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/event-emitter.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/extends.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/fullscreen-api.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/global-options.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/loading-spinner.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/media-error.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu/menu-button.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu/menu-item.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/menu/menu.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/player.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/plugins.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/poster-image.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/setup.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/slider/slider.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech/flash-rtmp.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech/flash.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech/html5.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech/loader.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tech/tech.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks/text-track-cue-list.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks/text-track-display.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks/text-track-enums.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks/text-track-list.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks/text-track-settings.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/tracks/text-track.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/browser.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/buffer.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/dom.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/events.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/fn.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/format-time.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/guid.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/log.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/merge-options.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/round-float.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/time-ranges.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/to-title-case.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/utils/url.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/video.js",
            "/Users/mboles/git/BCL-LearningSamples/grunt-shell/videojs-src/xhr.js"
        ]
    }
]

;