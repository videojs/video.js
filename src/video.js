var videojs, _V_;
(function(videojs) {
// VIDEO.JS NOTE
// Video.js uses Google's Closure Compiler in Avanced Optimization mode
// to achieve an exceptionally small file size. Video.js does not currently
// use the full Closure Library as a base, however Closure Compiler
// automatically replaces certain Closure Library methods with more
// optimized versions of the code when it compiles.
// http://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/javascript/jscomp/ProcessClosurePrimitives.java
//
// For instance we use `goog.base(this, 'methodName')` within class methods,
// which Compiler auto replaces with `this.superClass_.methodName.call(this);`.
// Compiler then minifies that code even more. So while we use the following
// code in development, it gets stripped out at compile time.
//
// (heff's note: Nothing against Closure Library, we just don't need it yet.)

/*
 * Class inhertance notes from compiler testing
 * In a constructor, goog.base(this) is equivalent to _V_.SuperClass.call(this)
 *   in function and compression
 * In an instance method,
 *    goog.base(this, 'funcName'); becomes
 *      f.a.c.call(this);
 *
 *    this.superClass_.funcName.call(this); becomes
 *      this.a.c.call(this);
 *
 *    _V_.SuperClass.prototype.funcName.call(this); becomes
 *      h.prototype.c.call(this);
 *
 *  All three do the same thing but goog.base results in less characters.
 */


// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 *
 * @provideGoog
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {}; // Identifies this file as the Closure base.


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Creates object stubs for a namespace.  The presence of one or more
 * goog.provide() calls indicate that the file defines the given
 * objects/namespaces.  Build tools also scan for provide/require statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 * @see goog.require
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {

  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param {string} name name of the object to look for.
   * @return {boolean} Whether the name has been provided.
   * @private
   */
  goog.isProvided_ = function(name) {
    return !goog.implicitNamespaces_[name] && !!goog.getObjectByName(name);
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {?} The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(nnaze): The debug DOM loader was included in base.js as an orignal
// way to do "debug-mode" development.  The dependency system can sometimes
// be confusing, as can the debug DOM loader's asyncronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the
// script will not load until some point after the current script.  If a
// namespace is needed at runtime, it needs to be defined in a previous
// script, or loaded via require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// http://code.google.com/closure/library/docs/depswriter.html
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.ENABLE_DEBUG_LOADER = true;


/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @see goog.provide
 * @param {string} name Namespace to include (as was given in goog.provide())
 *     in the form "goog.package.part".
 */
goog.require = function(name) {

  // if the object already exists we do not need do do anything
  // TODO(arv): If we start to support require based on file name this has
  //            to change
  // TODO(arv): If we allow goog.foo.* this has to change
  // TODO(arv): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      return;
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    if (goog.global.console) {
      goog.global.console['error'](errorMessage);
    }


      throw Error(errorMessage);

  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS = true;
// goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {*=} opt_returnValue The single value that will be returned.
 * @param {...*} var_args Optional trailing arguments. These are ignored.
 * @return {?} The first argument. We can't know the type -- just pass it along
 *      without type.
 * @deprecated Use goog.functions.identity instead.
 */
// Currently not used in Video.js and throwing jshint errors
// goog.identityFunction = function(opt_returnValue, var_args) {
//   return opt_returnValue;
// };


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
// Currently not used in Video.js and throwing jshint errors
// goog.addSingletonGetter = function(ctor) {
//   ctor.getInstance = function() {
//     if (ctor.instance_) {
//       return ctor.instance_;
//     }
//     if (goog.DEBUG) {
//       // NOTE: JSCompiler can't optimize away Array#push.
//       goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
//     }
//     return ctor.instance_ = new ctor;
//   };
// };


/**
 * All singleton classes that have been instantiated, for testing. Don't read
 * it directly, use the {@code goog.testing.singleton} module. The compiler
 * removes this variable if unused.
 * @type {!Array.<!Function>}
 * @private
 */
goog.instantiatedSingletons_ = [];


if (!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    // used when resolving dependencies to prevent us from
    // visiting the file twice
    visited: {},
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script source.
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;

      // If the user tries to require a new symbol after document load,
      // something has gone terribly wrong. Doing a document.write would
      // wipe out the page.
      if (doc.readyState == 'complete') {
        // Certain test frameworks load base.js multiple times, which tries
        // to write deps.js each time. If that happens, just fail silently.
        // These frameworks wipe the page between each load of base.js, so this
        // is OK.
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }

      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // return Object(val) === val also works, but is slower, especially if val is
  // not an object.
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions. It is unsafe to generate unique ID for
 * function prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind
 *     is deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
// Currently not used in Video.js and throwing errors
// goog.bindNative_ = function(fn, selfObj, var_args) {
//   return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
// };


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
// goog.bindJs_ = function(fn, selfObj, var_args) {
//   if (!fn) {
//     throw new Error();
//   }

//   if (arguments.length > 2) {
//     var boundArgs = Array.prototype.slice.call(arguments, 2);
//     return function() {
//       // Prepend the bound arguments to the current arguments.
//       var newArgs = Array.prototype.slice.call(arguments);
//       Array.prototype.unshift.apply(newArgs, boundArgs);
//       return fn.apply(selfObj, newArgs);
//     };

//   } else {
//     return function() {
//       return fn.apply(selfObj, arguments);
//     };
//   }
// };


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} See above.
 */
// goog.bind = function(fn, selfObj, var_args) {
//   // TODO(nicksantos): narrow the type signature.
//   if (Function.prototype.bind &&
//       // NOTE(nicksantos): Somebody pulled base.js into the default
//       // Chrome extension environment. This means that for Chrome extensions,
//       // they get the implementation of Function.prototype.bind that
//       // calls goog.bind instead of the native one. Even worse, we don't want
//       // to introduce a circular dependency between goog.bind and
//       // Function.prototype.bind, so we have to hack this to make sure it
//       // works correctly.
//       Function.prototype.bind.toString().indexOf('native code') != -1) {
//     goog.bind = goog.bindNative_;
//   } else {
//     goog.bind = goog.bindJs_;
//   }
//   return goog.bind.apply(null, arguments);
// };


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
// goog.partial = function(fn, var_args) {
//   var args = Array.prototype.slice.call(arguments, 1);
//   return function() {
//     // Prepend the bound arguments to the current arguments.
//     var newArgs = Array.prototype.slice.call(arguments);
//     newArgs.unshift.apply(newArgs, args);
//     return fn.apply(this, newArgs);
//   };
// };


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
// Currently not used in Video.js and throwing jshint errors
// goog.globalEval = function(script) {
//   if (goog.global.execScript) {
//     goog.global.execScript(script, 'JavaScript');
//   } else if (goog.global.eval) {
//     // Test to see if eval works
//     if (goog.evalWorksForGlobals_ == null) {
//       goog.global.eval('var _et_ = 1;');
//       if (typeof goog.global['_et_'] != 'undefined') {
//         delete goog.global['_et_'];
//         goog.evalWorksForGlobals_ = true;
//       } else {
//         goog.evalWorksForGlobals_ = false;
//       }
//     }

//     if (goog.evalWorksForGlobals_) {
//       goog.global.eval(script);
//     } else {
//       var doc = goog.global.document;
//       var scriptElt = doc.createElement('script');
//       scriptElt.type = 'text/javascript';
//       scriptElt.defer = false;
//       // Note(user): can't use .innerHTML since "t('<test>')" will fail and
//       // .text doesn't work in Safari 2.  Therefore we append a text node.
//       scriptElt.appendChild(doc.createTextNode(script));
//       doc.body.appendChild(scriptElt);
//       doc.body.removeChild(scriptElt);
//     }
//   } else {
//     throw Error('goog.globalEval not available');
//   }
// };


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a
 * hyphen and passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which
 * these mappings are used. In the BY_PART style, each part (i.e. in
 * between hyphens) of the passed in css name is rewritten according
 * to the map. In the BY_WHOLE style, the full css name is looked up in
 * the map directly. If a rewrite is not specified by the map, the
 * compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls
 * to goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed
 * only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {Object|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Gets a localized message.
 *
 * This function is a compiler primitive. If you give the compiler a localized
 * message bundle, it will replace the string at compile-time with a localized
 * version, and expand goog.getMsg call to a concatenated string.
 *
 * Messages must be initialized in the form:
 * <code>
 * var MSG_NAME = goog.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
 * </code>
 *
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Gets a localized message. If the message does not have a translation, gives a
 * fallback message.
 *
 * This is useful when introducing a new message that has not yet been
 * translated into all languages.
 *
 * This function is a compiler primtive. Must be used in the form:
 * <code>var x = goog.getMsgWithFallback(MSG_A, MSG_B);</code>
 * where MSG_A and MSG_B were initialized with goog.getMsg.
 *
 * @param {string} a The preferred message.
 * @param {string} b The fallback message.
 * @return {string} The best translated message.
 */
// goog.getMsgWithFallback = function(a, b) {
//   return a;
// };


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('public.path.Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   goog.base(this, a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {}
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var_args = var_args; // Hiding JSHint unused var warning without killing check
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


/**
 * @fileoverview Main function src.
 */

goog.provide('vjs');
goog.provide('videojs');

// HTML5 Shiv. Must be in <head> to support older browsers.
document.createElement('video');document.createElement('audio');

/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.
 *
 * @param  {String|Element} id      Video element or video element ID
 * @param  {Object=} options        Optional options object for config/settings
 * @param  {Function=} ready        Optional ready callback
 * @return {vjs.Player}             A player instance
 */
vjs = function(id, options, ready){
  var tag; // Element of ID

  // Allow for element or ID to be passed in
  // String ID
  if (typeof id === 'string') {

    // Adjust for jQuery ID syntax
    if (id.indexOf('#') === 0) {
      id = id.slice(1);
    }

    // If a player instance has already been created for this ID return it.
    if (vjs.players[id]) {
      return vjs.players[id];

    // Otherwise get element for ID
    } else {
      tag = vjs.el(id);
    }

  // ID is a media element
  } else {
    tag = id;
  }

  // Check for a useable element
  if (!tag || !tag.nodeName) { // re: nodeName, could be a box div also
    throw new TypeError('The element or ID supplied is not valid. (videojs)'); // Returns
  }

  // Element may have a player attr referring to an already created player instance.
  // If not, set up a new player and return the instance.
  return tag['player'] || new vjs.Player(tag, options, ready);
};

// Extended name, also available externally, window.videojs
var videojs = vjs;

// CDN Version. Used to target right flash swf.
vjs.CDN_VERSION = 'GENERATED_CDN_VSN';
vjs.ACCESS_PROTOCOL = ('https:' == document.location.protocol ? 'https://' : 'http://');

/**
 * Global Player instance options, surfaced from vjs.Player.prototype.options_
 * vjs.options = vjs.Player.prototype.options_
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 */
vjs.options = {
  // Default order of fallback technology
  'techOrder': ['html5','flash'],
  // techOrder: ['flash','html5'],

  'html5': {},
  'flash': { swf: vjs.ACCESS_PROTOCOL + 'vjs.zencdn.net/c/video-js.swf' },

  // Default of web browser is 300x150. Should rely on source width/height.
  'width': 300,
  'height': 150,

  // defaultVolume: 0.85,
  'defaultVolume': 0.00, // The freakin seaguls are driving me crazy!

  // Included control sets
  'children': {
    'mediaLoader': {},
    'posterImage': {},
    'textTrackDisplay': {},
    'loadingSpinner': {},
    'bigPlayButton': {},
    'controlBar': {}
  }
};

/**
 * Global player list
 * @type {Object}
 */
vjs.players = {};


// Set CDN Version of swf
if (vjs.CDN_VERSION != 'GENERATED_CDN_VSN') {
  videojs.options['flash']['swf'] = vjs.ACCESS_PROTOCOL + 'vjs.zencdn.net/'+vjs.CDN_VERSION+'/video-js.swf';
}
/**
 * @fileoverview Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
 * (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
 * This should work very similarly to jQuery's events, however it's based off the book version which isn't as
 * robust as jquery's, so there's probably some differences.
 */

goog.provide('vjs.events');

goog.require('vjs');

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 * @param  {Element|Object}   elem Element or object to bind listeners to
 * @param  {String}   type Type of event to bind to.
 * @param  {Function} fn   Event listener.
 */
vjs.on = function(elem, type, fn){
  var data = vjs.getData(elem);

  // We need a place to store all our handler data
  if (!data.handlers) data.handlers = {};

  if (!data.handlers[type]) data.handlers[type] = [];

  if (!fn.guid) fn.guid = vjs.guid++;

  data.handlers[type].push(fn);

  if (!data.dispatcher) {
    data.disabled = false;

    data.dispatcher = function (event){

      if (data.disabled) return;
      event = vjs.fixEvent(event);

      var handlers = data.handlers[event.type];

      if (handlers) {
        // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
        var handlersCopy = handlers.slice(0);

        for (var m = 0, n = handlersCopy.length; m < n; m++) {
          if (event.isImmediatePropagationStopped()) {
            break;
          } else {
            handlersCopy[m].call(elem, event);
          }
        }
      }
    };
  }

  if (data.handlers[type].length == 1) {
    if (document.addEventListener) {
      elem.addEventListener(type, data.dispatcher, false);
    } else if (document.attachEvent) {
      elem.attachEvent('on' + type, data.dispatcher);
    }
  }
};

/**
 * Removes event listeners from an element
 * @param  {Element|Object}   elem Object to remove listeners from
 * @param  {String=}   type Type of listener to remove. Don't include to remove all events from element.
 * @param  {Function} fn   Specific listener to remove. Don't incldue to remove listeners for an event type.
 */
vjs.off = function(elem, type, fn) {
  // Don't want to add a cache object through getData if not needed
  if (!vjs.hasData(elem)) return;

  var data = vjs.getData(elem);

  // If no events exist, nothing to unbind
  if (!data.handlers) { return; }

  // Utility function
  var removeType = function(t){
     data.handlers[t] = [];
     vjs.cleanUpEvents(elem,t);
  };

  // Are we removing all bound events?
  if (!type) {
    for (var t in data.handlers) removeType(t);
    return;
  }

  var handlers = data.handlers[type];

  // If no handlers exist, nothing to unbind
  if (!handlers) return;

  // If no listener was provided, remove all listeners for type
  if (!fn) {
    removeType(type);
    return;
  }

  // We're only removing a single handler
  if (fn.guid) {
    for (var n = 0; n < handlers.length; n++) {
      if (handlers[n].guid === fn.guid) {
        handlers.splice(n--, 1);
      }
    }
  }

  vjs.cleanUpEvents(elem, type);
};

/**
 * Clean up the listener cache and dispatchers
 * @param  {Element|Object} elem Element to clean up
 * @param  {String} type Type of event to clean up
 */
vjs.cleanUpEvents = function(elem, type) {
  var data = vjs.getData(elem);

  // Remove the events of a particular type if there are none left
  if (data.handlers[type].length === 0) {
    delete data.handlers[type];
    // data.handlers[type] = null;
    // Setting to null was causing an error with data.handlers

    // Remove the meta-handler from the element
    if (document.removeEventListener) {
      elem.removeEventListener(type, data.dispatcher, false);
    } else if (document.detachEvent) {
      elem.detachEvent('on' + type, data.dispatcher);
    }
  }

  // Remove the events object if there are no types left
  if (vjs.isEmpty(data.handlers)) {
    delete data.handlers;
    delete data.dispatcher;
    delete data.disabled;

    // data.handlers = null;
    // data.dispatcher = null;
    // data.disabled = null;
  }

  // Finally remove the expando if there is no data left
  if (vjs.isEmpty(data)) {
    vjs.removeData(elem);
  }
};

/**
 * Fix a native event to have standard property values
 * @param  {Object} event Event object to fix
 * @return {Object}
 */
vjs.fixEvent = function(event) {

  function returnTrue() { return true; }
  function returnFalse() { return false; }

  // Test if fixing up is needed
  // Used to check if !event.stopPropagation instead of isPropagationStopped
  // But native events return true for stopPropagation, but don't have
  // other expected methods like isPropagationStopped. Seems to be a problem
  // with the Javascript Ninja code. So we're just overriding all events now.
  if (!event || !event.isPropagationStopped) {
    var old = event || window.event;

    // Clone the old object so that we can modify the values event = {};
    for (var prop in old) {
      event[prop] = old[prop];
    }

    // The event occurred on this element
    if (!event.target) {
      event.target = event.srcElement || document;
    }

    // Handle which other element the event is related to
    event.relatedTarget = event.fromElement === event.target ?
      event.toElement :
      event.fromElement;

    // Stop the default browser action
    event.preventDefault = function () {
      event.returnValue = false;
      event.isDefaultPrevented = returnTrue;
    };

    event.isDefaultPrevented = returnFalse;

    // Stop the event from bubbling
    event.stopPropagation = function () {
      event.cancelBubble = true;
      event.isPropagationStopped = returnTrue;
    };

    event.isPropagationStopped = returnFalse;

    // Stop the event from bubbling and executing other handlers
    event.stopImmediatePropagation = function () {
      event.isImmediatePropagationStopped = returnTrue;
      event.stopPropagation();
    };

    event.isImmediatePropagationStopped = returnFalse;

    // Handle mouse position
    if (event.clientX != null) {
      var doc = document.documentElement, body = document.body;

      event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY +
        (doc && doc.scrollTop || body && body.scrollTop || 0) -
        (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Handle key presses
    event.which = event.charCode || event.keyCode;

    // Fix button for mouse clicks:
    // 0 == left; 1 == middle; 2 == right
    if (event.button != null) {
      event.button = (event.button & 1 ? 0 :
        (event.button & 4 ? 1 :
          (event.button & 2 ? 2 : 0)));
    }
  }

  // Returns fixed-up instance
  return event;
};

/**
 * Trigger an event for an element
 * @param  {Element|Object} elem  Element to trigger an event on
 * @param  {String} event Type of event to trigger
 */
vjs.trigger = function(elem, event) {
  // Fetches element data and a reference to the parent (for bubbling).
  // Don't want to add a data object to cache for every parent,
  // so checking hasData first.
  var elemData = (vjs.hasData(elem)) ? vjs.getData(elem) : {};
  var parent = elem.parentNode || elem.ownerDocument;
      // type = event.type || event,
      // handler;

  // If an event name was passed as a string, creates an event out of it
  if (typeof event === 'string') {
    event = { type:event, target:elem };
  }
  // Normalizes the event properties.
  event = vjs.fixEvent(event);

  // If the passed element has a dispatcher, executes the established handlers.
  if (elemData.dispatcher) {
    elemData.dispatcher.call(elem, event);
  }

  // Unless explicitly stopped, recursively calls this function to bubble the event up the DOM.
  if (parent && !event.isPropagationStopped()) {
    vjs.trigger(parent, event);

  // If at the top of the DOM, triggers the default action unless disabled.
  } else if (!parent && !event.isDefaultPrevented()) {
    var targetData = vjs.getData(event.target);

    // Checks if the target has a default action for this event.
    if (event.target[event.type]) {
      // Temporarily disables event dispatching on the target as we have already executed the handler.
      targetData.disabled = true;
      // Executes the default action.
      if (typeof event.target[event.type] === 'function') {
        event.target[event.type]();
      }
      // Re-enables event dispatching.
      targetData.disabled = false;
    }
  }

  // Inform the triggerer if the default was prevented by returning false
  return !event.isDefaultPrevented();
  /* Original version of js ninja events wasn't complete.
   * We've since updated to the latest version, but keeping this around
   * for now just in case.
   */
  // // Added in attion to book. Book code was broke.
  // event = typeof event === 'object' ?
  //   event[vjs.expando] ?
  //     event :
  //     new vjs.Event(type, event) :
  //   new vjs.Event(type);

  // event.type = type;
  // if (handler) {
  //   handler.call(elem, event);
  // }

  // // Clean up the event in case it is being reused
  // event.result = undefined;
  // event.target = elem;
};

/**
 * Trigger a listener only once for an event
 * @param  {Element|Object}   elem Element or object to
 * @param  {[type]}   type [description]
 * @param  {Function} fn   [description]
 * @return {[type]}
 */
vjs.one = function(elem, type, fn) {
  vjs.on(elem, type, function(){
    vjs.off(elem, type, arguments.callee);
    fn.apply(this, arguments);
  });
};
goog.provide('vjs.dom');

goog.require('vjs');

/**
 * Creates an element and applies properties.
 * @param  {String=} tagName    Name of tag to be created.
 * @param  {Object=} properties Element properties to be applied.
 * @return {Element}
 */
vjs.createEl = function(tagName, properties){
  var el = document.createElement(tagName || 'div');

  for (var propName in properties){
    if (properties.hasOwnProperty(propName)) {
      el[propName] = properties[propName];
      // Not remembering why we were checking for dash
      // but using setAttribute means you have to use getAttribute
      // if (propName.indexOf('-') !== -1) {
      //   el.setAttribute(propName, properties[propName]);
      // } else {
      //   el[propName] = properties[propName];
      // }
    }
  }
  return el;
};

/**
 * Uppercase the first letter of a string
 * @param  {String} string String to be uppercased
 * @return {String}
 */
vjs.capitalize = function(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Loop through each property in an object and call a function
 * whose arguments are (key,value)
 * @param  {Object}   obj Object of properties
 * @param  {Function} fn  Function to be called on each property.
 * @this {*}
 */
vjs.eachProp = function(obj, fn){
  if (!obj) { return; }

  for (var name in obj) {
    if (obj.hasOwnProperty(name)) {
      fn.call(this, name, obj[name]);
    }
  }
};

/**
 * Merge two objects together and return the original.
 * @param  {[type]} obj1 [description]
 * @param  {[type]} obj2 [description]
 * @param  {[type]} safe [description]
 * @return {[type]}
 */
vjs.merge = function(obj1, obj2){
  // Make sure second object exists
  if (!obj2) { return obj1; }

  for (var propName in obj2){
    if (obj2.hasOwnProperty(propName)) { obj1[propName] = obj2[propName]; }
  }
  return obj1;
};

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
   It also stores a unique id on the function so it can be easily removed from events
 * @param  {*}   context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}   uid     An optional unique ID for the function to be set
 * @return {Function}
 */
vjs.bind = function(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) { fn.guid = vjs.guid++; }

  // Create the new function that changes the context
  var ret = function() {
    return fn.apply(context, arguments);
  };

  // Allow for the ability to individualize this function
  // Needed in the case where multiple objects might share the same prototype
  // IF both items add an event listener with the same function, then you try to remove just one
  // it will remove both because they both have the same guid.
  // when using this, you need to use the bind method when you remove the listener as well.
  // currently used in text tracks
  ret.guid = (uid) ? uid + '_' + fn.guid : fn.guid;

  return ret;
};

/**
 * Element Data Store. Allows for binding data to an element without putting it directly on the element.
 * Ex. Event listneres are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 * @type {Object}
 */
vjs.cache = {};

/**
 * Unique ID for an element or function
 * @type {Number}
 */
vjs.guid = 1;

/**
 * Unique attribute name to store an element's guid in
 * @type {String}
 * @constant
 */
vjs.expando = 'vdata' + (new Date()).getTime();

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 */
vjs.getData = function(el){
  var id = el[vjs.expando];
  if (!id) {
    id = el[vjs.expando] = vjs.guid++;
    vjs.cache[id] = {};
  }
  return vjs.cache[id];
};

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 */
vjs.hasData = function(el){
  var id = el[vjs.expando];
  return !(!id || vjs.isEmpty(vjs.cache[id]));
};

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 * @param  {Element} el Remove data for an element
 */
vjs.removeData = function(el){
  var id = el[vjs.expando];
  if (!id) { return; }
  // Remove all stored data
  // Changed to = null
  // http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
  // vjs.cache[id] = null;
  delete vjs.cache[id];

  // Remove the expando property from the DOM node
  try {
    delete el[vjs.expando];
  } catch(e) {
    if (el.removeAttribute) {
      el.removeAttribute(vjs.expando);
    } else {
      // IE doesn't appear to support removeAttribute on the document element
      el[vjs.expando] = null;
    }
  }
};

vjs.isEmpty = function(obj) {
  for (var prop in obj) {
    // Inlude null properties as empty.
    if (obj[prop] !== null) {
      return false;
    }
  }
  return true;
};

/**
 * Add a CSS class name to an element
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
 */
vjs.addClass = function(element, classToAdd){
  if ((' '+element.className+' ').indexOf(' '+classToAdd+' ') == -1) {
    element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
  }
};

/**
 * Remove a CSS class name from an element
 * @param {Element} element    Element to remove from class name
 * @param {String} classToAdd Classname to remove
 */
vjs.removeClass = function(element, classToRemove){
  if (element.className.indexOf(classToRemove) == -1) { return; }
  var classNames = element.className.split(' ');
  classNames.splice(classNames.indexOf(classToRemove),1);
  element.className = classNames.join(' ');
};

/**
 * Element for testing browser HTML5 video capabilities
 * @type {Element}
 * @constant
 */
vjs.TEST_VID = vjs.createEl('video');

/**
 * Useragent for browser testing.
 * @type {String}
 * @constant
 */
vjs.USER_AGENT = navigator.userAgent;

/**
 * Device is an iPhone
 * @type {Boolean}
 * @constant
 */
vjs.IS_IPHONE = !!vjs.USER_AGENT.match(/iPad/i);
vjs.IS_IPAD = !!vjs.USER_AGENT.match(/iPhone/i);
vjs.IS_IPOD = !!vjs.USER_AGENT.match(/iPod/i);
vjs.IS_IOS = vjs.IS_IPHONE || vjs.IS_IPAD || vjs.IS_IPOD;

vjs.IOS_VERSION = (function(){
  var match = vjs.USER_AGENT.match(/OS (\d+)_/i);
  if (match && match[1]) { return match[1]; }
})();

vjs.IS_ANDROID = !!vjs.USER_AGENT.match(/Android.*AppleWebKit/i);
vjs.ANDROID_VERSION = (function() {
  var match = vjs.USER_AGENT.match(/Android (\d+)\./i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
})();

vjs.IS_FIREFOX = function(){ return !!vjs.USER_AGENT.match('Firefox'); };


/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributs are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 */
vjs.getAttributeValues = function(tag){
  var obj = {};

  // Known boolean attributes
  // We can check for matching boolean properties, but older browsers
  // won't know about HTML5 boolean attributes that we still read from.
  // Bookending with commas to allow for an easy string search.
  var knownBooleans = ','+'autoplay,controls,loop,muted,default'+',';

  if (tag && tag.attributes && tag.attributes.length > 0) {
    var attrs = tag.attributes;
    var attrName, attrVal;

    for (var i = attrs.length - 1; i >= 0; i--) {
      attrName = attrs[i].name;
      attrVal = attrs[i].value;

      // Check for known booleans
      // The matching element property will return a value for typeof
      if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(','+attrName+',') !== -1) {
        // The value of an included boolean attribute is typically an empty string ('')
        // which would equal false if we just check for a false value.
        // We also don't want support bad code like autoplay='false'
        attrVal = (attrVal !== null) ? true : false;
      }

      obj[attrName] = attrVal;
    }
  }

  return obj;
};

/**
 * Get the computed style value for an element
 * From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/
 * @param  {Element} el        Element to get style value for
 * @param  {String} strCssRule Style name
 * @return {String}            Style value
 */
vjs.getComputedStyleValue = function(el, strCssRule){
  var strValue = '';
  if(document.defaultView && document.defaultView.getComputedStyle){
    strValue = document.defaultView.getComputedStyle(el, '').getPropertyValue(strCssRule);

  } else if(el.currentStyle){
    strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1){
      return p1.toUpperCase();
    });
    strValue = el.currentStyle[strCssRule];
  }
  return strValue;
};

/**
 * Insert an element as the first child node of another
 * @param  {Element} child   Element to insert
 * @param  {[type]} parent Element to insert child into
 */
vjs.insertFirst = function(child, parent){
  if (parent.firstChild) {
    parent.insertBefore(child, parent.firstChild);
  } else {
    parent.appendChild(child);
  }
};

/**
 * Object to hold browser support information
 * @type {Object}
 */
vjs.support = {};

/**
 * Shorthand for document.getElementById()
 * Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
 * @param  {String} id  Element ID
 * @return {Element}    Element with supplied ID
 */
vjs.el = function(id){
  if (id.indexOf('#') === 0) {
    id = id.slice(1);
  }

  return document.getElementById(id);
};

/**
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 * @param  {Number} seconds Number of seconds to be turned into a string
 * @param  {Number} guide   Number (in seconds) to model the string after
 * @return {String}         Time formatted as H:MM:SS or M:SS
 */
vjs.formatTime = function(seconds, guide) {
  guide = guide || seconds; // Default to using seconds as guide
  var s = Math.floor(seconds % 60),
      m = Math.floor(seconds / 60 % 60),
      h = Math.floor(seconds / 3600),
      gm = Math.floor(guide / 60 % 60),
      gh = Math.floor(guide / 3600);

  // Check if we need to show hours
  h = (h > 0 || gh > 0) ? h + ':' : '';

  // If hours are showing, we may need to add a leading zero.
  // Always show at least one digit of minutes.
  m = (((h || gm >= 10) && m < 10) ? '0' + m : m) + ':';

  // Check if leading zero is need for seconds
  s = (s < 10) ? '0' + s : s;

  return h + m + s;
};

// Attempt to block the ability to select text while dragging controls
vjs.blockTextSelection = function(){
  document.body.focus();
  document.onselectstart = function () { return false; };
};
// Turn off text selection blocking
vjs.unblockTextSelection = function(){ document.onselectstart = function () { return true; }; };

/**
 * Trim whitespace from the ends of a string.
 * @param  {String} string String to trim
 * @return {String}        Trimmed string
 */
vjs.trim = function(string){
  return string.toString().replace(/^\s+/, '').replace(/\s+$/, '');
};

/**
 * Should round off a number to a decimal place
 * @param  {Number} num Number to round
 * @param  {Number} dec Number of decimal places to round to
 * @return {Number}     Rounded number
 */
vjs.round = function(num, dec) {
  if (!dec) { dec = 0; }
  return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
};

/**
 * Should create a fake TimeRange object
 * Mimics an HTML5 time range instance, which has functions that
 * return the start and end times for a range
 * TimeRanges are returned by the buffered() method
 * @param  {Number} start Start time in seconds
 * @param  {Number} end   End time in seconds
 * @return {Object}       Fake TimeRange object
 */
vjs.createTimeRange = function(start, end){
  return {
    length: 1,
    start: function() { return start; },
    end: function() { return end; }
  };
};

/**
 * Simple http request for retrieving external files (e.g. text tracks)
 * @param  {String} url           URL of resource
 * @param  {Function=} onSuccess  Success callback
 * @param  {Function=} onError    Error callback
 */
vjs.get = function(url, onSuccess, onError){
  var local = (url.indexOf('file:') === 0 || (window.location.href.indexOf('file:') === 0 && url.indexOf('http') === -1));

  if (typeof XMLHttpRequest === 'undefined') {
    window.XMLHttpRequest = function () {
      try { return new window.ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch (e) {}
      try { return new window.ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch (f) {}
      try { return new window.ActiveXObject('Msxml2.XMLHTTP'); } catch (g) {}
      throw new Error('This browser does not support XMLHttpRequest.');
    };
  }

  var request = new XMLHttpRequest();

  try {
    request.open('GET', url);
  } catch(e) {
    onError(e);
  }

  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      if (request.status === 200 || local && request.status === 0) {
        onSuccess(request.responseText);
      } else {
        if (onError) {
          onError();
        }
      }
    }
  };

  try {
    request.send();
  } catch(e) {
    if (onError) {
      onError(e);
    }
  }
};

/* Local Storage
================================================================================ */
vjs.setLocalStorage = function(key, value){
  // IE was throwing errors referencing the var anywhere without this
  var localStorage = window.localStorage || false;
  if (!localStorage) { return; }
  try {
    localStorage[key] = value;
  } catch(e) {
    if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
      vjs.log('LocalStorage Full (VideoJS)', e);
    } else {
      vjs.log('LocalStorage Error (VideoJS)', e);
    }
  }
};

/**
 * Get abosolute version of relative URL. Used to tell flash correct URL.
 * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 * @param  {String} url URL to make absolute
 * @return {String}     Absolute URL
 */
vjs.getAbsoluteURL = function(url){

  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    url = vjs.createEl('div', {
      innerHTML: '<a href="'+url+'">x</a>'
    }).firstChild.href;
  }

  return url;
};

// usage: log('inside coolFunc',this,arguments);
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
vjs.log = function(){
  vjs.log.history = vjs.log.history || [];   // store logs to an array for reference
  vjs.log.history.push(arguments);
  if(window.console){
    window.console.log(Array.prototype.slice.call(arguments));
  }
};

// Offset Left
// getBoundingClientRect technique from John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
if ('getBoundingClientRect' in document.documentElement) {
  vjs.findPosX = function(el) {
    var box;

    try {
      box = el.getBoundingClientRect();
    } catch(e) {}

    if (!box) { return 0; }

    var docEl = document.documentElement,
        body = document.body,
        clientLeft = docEl.clientLeft || body.clientLeft || 0,
        scrollLeft = window.pageXOffset || body.scrollLeft,
        left = box.left + scrollLeft - clientLeft;

    return left;
  };
} else {
  vjs.findPosX = function(el) {
    var curleft = el.offsetLeft;
    // vjs.log(obj.className, obj.offsetLeft)
    while(el = el.offsetParent) {
      if (el.className.indexOf('video-js') == -1) {
        // vjs.log(el.offsetParent, 'OFFSETLEFT', el.offsetLeft)
        // vjs.log('-webkit-full-screen', el.webkitMatchesSelector('-webkit-full-screen'));
        // vjs.log('-webkit-full-screen', el.querySelectorAll('.video-js:-webkit-full-screen'));
      } else {
      }
      curleft += el.offsetLeft;
    }
    return curleft;
  };
}
/**
 * @fileoverview Player Component - Base class for all UI objects
 *
 */

goog.provide('vjs.Component');

goog.require('vjs.events');
goog.require('vjs.dom');

/**
 * Base UI Component class
 * @param {Object} player  Main Player
 * @param {Object=} options
 * @constructor
 */
vjs.Component = function(player, options, ready){
  this.player_ = player;

  // // Allow for overridding default component options
  options = this.options_ = this.mergeOptions(this.options_, options);

  // Get ID from options, element, or create using player ID and unique ID
  this.id_ = options['id'] || ((options['el'] && options['el']['id']) ? options['el']['id'] : player.id() + '_component_' + vjs.guid++ );

  this.name_ = options['name'] || null;

  // Create element if one wasn't provided in potions
  this.el_ = options['el'] || this.createEl();

  this.children_ = [];
  this.childIndex_ = {};
  this.childNameIndex_ = {};

  // Add any child components in options
  this.initChildren();

  this.ready(ready);
  // Don't want to trigger ready here or it will before init is actually
  // finished for all children that run this constructor
};

/**
 * Dispose of the component and all child components.
 */
vjs.Component.prototype.dispose = function(){
  // Dispose all children.
  if (this.children_) {
    for (var i = this.children_.length - 1; i >= 0; i--) {
      if (this.children_[i].dispose) {
        this.children_[i].dispose();
      }
    }
  }

  // Delete child references
  this.children_ = null;
  this.childIndex_ = null;
  this.childNameIndex_ = null;

  // Remove all event listeners.
  this.off();

  // Remove element from DOM
  if (this.el_.parentNode) {
    this.el_.parentNode.removeChild(this.el_);
  }

  vjs.removeData(this.el_);
  this.el_ = null;
};

/**
 * Reference to main player instance.
 * @type {vjs.Player}
 * @private
 */
vjs.Component.prototype.player_;

/**
 * Return the component's player.
 * @return {vjs.Player}
 */
vjs.Component.prototype.player = function(){
  return this.player_;
};

/**
 * Component options object.
 * @type {Object}
 * @private
 */
vjs.Component.prototype.options_;

/**
 * Deep merge of options objects
 * Whenever a property is an object on both options objects
 * the two properties will be merged using mergeOptions
 *
 * This is used for merging options for child components. We
 * want it to be easy to override individual options on a child
 * component without having to rewrite all the other default options.
 *
 * parentDefaultOptions = {
 *   children: {
 *     'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
 *     'childTwo': {},
 *     'childThree': {}
 *   }
 * }
 * parentOptionsFromInit = {
 *   children: {
 *     'childOne': { 'foo': 'baz', 'abc': '123' }
 *     'childTwo': null,
 *     'childFour': {}
 *   }
 * }
 *
 * this.mergeOptions(parentDefaultOptions, parentOptionsFromInit);
 *
 * RESULT
 *
 * {
 *   children: {
 *     'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
 *     'childTwo': null, // Disabled. Won't be initialized.
 *     'childThree': {},
 *     'childFour': {}
 *   }
 * }
 *
 *
 * @param  {Object} obj1 Object whose values will be overwritten
 * @param  {Object} obj2 Object whose values will overwrite
 * @return {Object}      NEW merged object. Does not return obj1.
 */
vjs.Component.prototype.mergeOptions = function(obj1, obj2){
  var retObj, toString, hasOwnProp, propName, objDef, val1, val2;

  hasOwnProp = Object.prototype.hasOwnProperty;
  toString = Object.prototype.toString;
  objDef = '[object Object]';
  obj1 = obj1 || {};
  retObj = {};

  // Make a copy of obj1 so we don't affect the original options
  vjs.eachProp(obj1, function(name, val){
    retObj[name] = val;
  });

  if (!obj2) { return retObj; }

  for (propName in obj2){
    if (hasOwnProp.call(obj2, propName)) {
      val1 = retObj[propName];
      val2 = obj2[propName];

      if (toString.call(val1) === objDef && toString.call(val2) === objDef) {
        retObj[propName] = this.mergeOptions(val1, val2);
      } else {
        retObj[propName] = obj2[propName];
      }
    }
  }

  return retObj;
};

/**
 * The DOM element for the component.
 * @type {Element}
 * @private
 */
vjs.Component.prototype.el_;

/**
 * Create the component's DOM element.
 * @param  {String=} tagName  Element's node type. e.g. 'div'
 * @param  {Object=} attributes An object of element attributes that should be set on the element.
 * @return {Element}
 */
vjs.Component.prototype.createEl = function(tagName, attributes){
  return vjs.createEl(tagName, attributes);
};

/**
 * Return the component's DOM element.
 * @return {Element}
 */
vjs.Component.prototype.el = function(){
  return this.el_;
};

/**
 * The ID for the component.
 * @type {String}
 * @private
 */
vjs.Component.prototype.id_;

/**
 * Return the component's ID.
 * @return {String}
 */
vjs.Component.prototype.id = function(){
  return this.id_;
};

/**
 * The name for the component. Often used to reference the component.
 * @type {String}
 * @private
 */
vjs.Component.prototype.name_;

/**
 * Return the component's ID.
 * @return {String}
 */
vjs.Component.prototype.name = function(){
  return this.name_;
};

/**
 * Array of child components
 * @type {Array}
 * @private
 */
vjs.Component.prototype.children_;

/**
 * Returns array of all child components.
 * @return {Array}
 */
vjs.Component.prototype.children = function(){
  return this.children_;
};

/**
 * Object of child components by ID
 * @type {Object}
 * @private
 */
vjs.Component.prototype.childIndex_;

/**
 * Returns a child component with the provided ID.
 * @return {Array}
 */
vjs.Component.prototype.getChildById = function(id){
  return this.childIndex_[id];
};

/**
 * Object of child components by Name
 * @type {Object}
 * @private
 */
vjs.Component.prototype.childNameIndex_;

/**
 * Returns a child component with the provided ID.
 * @return {Array}
 */
vjs.Component.prototype.getChild = function(name){
  return this.childNameIndex_[name];
};

/**
 * Adds a child component inside this component.
 * @param {String|vjs.Component} child The class name or instance of a child to add.
 * @param {Object=} options Optional options, including options to be passed to
 *  children of the child.
 * @return {vjs.Component} The child component, because it might be created in this process.
 * @suppress {accessControls|checkRegExp|checkTypes|checkVars|const|constantProperty|deprecated|duplicate|es5Strict|fileoverviewTags|globalThis|invalidCasts|missingProperties|nonStandardJsDocs|strictModuleDepCheck|undefinedNames|undefinedVars|unknownDefines|uselessCode|visibility}
 */
vjs.Component.prototype.addChild = function(child, options){
  var component, componentClass, componentName, componentId;

  // If string, create new component with options
  if (typeof child === 'string') {

    componentName = child;

    // Make sure options is at least an empty object to protect against errors
    options = options || {};

    // Assume name of set is a lowercased name of the UI Class (PlayButton, etc.)
    componentClass = options['componentClass'] || vjs.capitalize(componentName);

    // Set name through options
    options['name'] = componentName;

    // Create a new object & element for this controls set
    // If there's no .player_, this is a player
    // Closure Compiler throws an 'incomplete alias' warning if we use the vjs variable directly.
    // Every class should be exported, so this should never be a problem here.
    component = new window['videojs'][componentClass](this.player_ || this, options);

  // child is a component instance
  } else {
    component = child;
  }

  this.children_.push(component);

  if (typeof component.id === 'function') {
    this.childIndex_[component.id()] = component;
  }

  // If a name wasn't used to create the component, check if we can use the
  // name function of the component
  componentName = componentName || (component.name && component.name());

  if (componentName) {
    this.childNameIndex_[componentName] = component;
  }

  // Add the UI object's element to the container div (box)
  // Having an element is not required
  if (typeof component.el === 'function' && component.el()) {
    this.el_.appendChild(component.el());
  }

  // Return so it can stored on parent object if desired.
  return component;
};

vjs.Component.prototype.removeChild = function(component){
  if (typeof component === 'string') {
    component = this.getChild(component);
  }

  if (!component || !this.children_) return;

  var childFound = false;
  for (var i = this.children_.length - 1; i >= 0; i--) {
    if (this.children_[i] === component) {
      childFound = true;
      this.children_.splice(i,1);
      break;
    }
  }

  if (!childFound) return;

  this.childIndex_[component.id] = null;
  this.childNameIndex_[component.name] = null;

  var compEl = component.el();
  if (compEl && compEl.parentNode === this.el_) {
    this.el_.removeChild(component.el());
  }
};

/**
 * Initialize default child components from options
 */
vjs.Component.prototype.initChildren = function(){
  var options = this.options_;

  if (options && options['children']) {
    var self = this;

    // Loop through components and add them to the player
    vjs.eachProp(options['children'], function(name, opts){

      // Allow for disabling default components
      // e.g. vjs.options['children']['posterImage'] = false
      if (opts === false) return;

      // Allow waiting to add components until a specific event is called
      var tempAdd = function(){
        // Set property name on player. Could cause conflicts with other prop names, but it's worth making refs easy.
        self[name] = self.addChild(name, opts);
      };

      if (opts['loadEvent']) {
        // this.one(opts.loadEvent, tempAdd)
      } else {
        tempAdd();
      }
    });
  }
};

vjs.Component.prototype.buildCSSClass = function(){
    // Child classes can include a function that does:
    // return 'CLASS NAME' + this._super();
    return '';
};

/* Events
============================================================================= */

/**
 * Add an event listener to this component's element. Context will be the component.
 * @param  {String}   type Event type e.g. 'click'
 * @param  {Function} fn   Event listener
 * @return {vjs.Component}
 */
vjs.Component.prototype.on = function(type, fn){
  vjs.on(this.el_, type, vjs.bind(this, fn));
  return this;
};

/**
 * Remove an event listener from the component's element
 * @param  {String=}   type Optional event type. Without type it will remove all listeners.
 * @param  {Function=} fn   Optional event listener. Without fn it will remove all listeners for a type.
 * @return {vjs.Component}
 */
vjs.Component.prototype.off = function(type, fn){
  vjs.off(this.el_, type, fn);
  return this;
};

/**
 * Add an event listener to be triggered only once and then removed
 * @param  {String}   type Event type
 * @param  {Function} fn   Event listener
 * @return {vjs.Component}
 */
vjs.Component.prototype.one = function(type, fn) {
  vjs.one(this.el_, type, vjs.bind(this, fn));
  return this;
};

/**
 * Trigger an event on an element
 * @param  {String} type  Event type to trigger
 * @param  {Event|Object} event Event object to be passed to the listener
 * @return {vjs.Component}
 */
vjs.Component.prototype.trigger = function(type, event){
  vjs.trigger(this.el_, type, event);
  return this;
};

/* Ready
================================================================================ */
/**
 * Is the component loaded.
 * @type {Boolean}
 * @private
 */
vjs.Component.prototype.isReady_;

/**
 * Trigger ready as soon as initialization is finished.
 *   Allows for delaying ready. Override on a sub class prototype.
 *   If you set this.isReadyOnInitFinish_ it will affect all components.
 *   Specially used when waiting for the Flash player to asynchrnously load.
 *   @type {Boolean}
 *   @private
 */
vjs.Component.prototype.isReadyOnInitFinish_ = true;

/**
 * List of ready listeners
 * @type {Array}
 * @private
 */
vjs.Component.prototype.readyQueue_;

/**
 * Bind a listener to the component's ready state.
 *   Different from event listeners in that if the ready event has already happend
 *   it will trigger the function immediately.
 * @param  {Function} fn Ready listener
 * @return {vjs.Component}
 */
vjs.Component.prototype.ready = function(fn){
  if (fn) {
    if (this.isReady_) {
      fn.call(this);
    } else {
      if (this.readyQueue_ === undefined) {
        this.readyQueue_ = [];
      }
      this.readyQueue_.push(fn);
    }
  }
  return this;
};

/**
 * Trigger the ready listeners
 * @return {vjs.Component}
 */
vjs.Component.prototype.triggerReady = function(){
  this.isReady_ = true;

  var readyQueue = this.readyQueue_;

  if (readyQueue && readyQueue.length > 0) {

    for (var i = 0, j = readyQueue.length; i < j; i++) {
      readyQueue[i].call(this);
    }

    // Reset Ready Queue
    this.readyQueue_ = [];

    // Allow for using event listeners also, in case you want to do something everytime a source is ready.
    this.trigger('ready');
  }
};

/* Display
============================================================================= */

/**
 * Add a CSS class name to the component's element
 * @param {String} classToAdd Classname to add
 * @return {vjs.Component}
 */
vjs.Component.prototype.addClass = function(classToAdd){
  vjs.addClass(this.el_, classToAdd);
  return this;
};

/**
 * Remove a CSS class name from the component's element
 * @param {String} classToRemove Classname to remove
 * @return {vjs.Component}
 */
vjs.Component.prototype.removeClass = function(classToRemove){
  vjs.removeClass(this.el_, classToRemove);
  return this;
};

/**
 * Show the component element if hidden
 * @return {vjs.Component}
 */
vjs.Component.prototype.show = function(){
  this.el_.style.display = 'block';
  return this;
};

/**
 * Hide the component element if hidden
 * @return {vjs.Component}
 */
vjs.Component.prototype.hide = function(){
  this.el_.style.display = 'none';
  return this;
};

/**
 * Fade a component in using CSS
 * @return {vjs.Component}
 */
vjs.Component.prototype.fadeIn = function(){
  this.removeClass('vjs-fade-out');
  this.addClass('vjs-fade-in');
  return this;
};

/**
 * Fade a component out using CSS
 * @return {vjs.Component}
 */
vjs.Component.prototype.fadeOut = function(){
  this.removeClass('vjs-fade-in');
  this.addClass('vjs-fade-out');
  return this;
};

/**
 * Lock an item in its visible state. To be used with fadeIn/fadeOut.
 * @return {vjs.Component}
 */
vjs.Component.prototype.lockShowing = function(){
  var style = this.el_.style;
  style.display = 'block';
  style.opacity = 1;
  style.visiblity = 'visible';
  return this;
};

/**
 * Unlock an item to be hidden. To be used with fadeIn/fadeOut.
 * @return {vjs.Component}
 */
vjs.Component.prototype.unlockShowing = function(){
  var style = this.el_.style;
  style.display = '';
  style.opacity = '';
  style.visiblity = '';
  return this;
};

/**
 * If a value is provided it will change the width of the player to that value
 * otherwise the width is returned
 * http://dev.w3.org/html5/spec/dimension-attributes.html#attr-dim-height
 * Video tag width/height only work in pixels. No percents.
 * But allowing limited percents use. e.g. width() will return number+%, not computed width
 * @param  {Number|String=} num   Optional width number
 * @param  {[type]} skipListeners Skip the 'resize' event trigger
 * @return {vjs.Component|Number|String} Returns 'this' if dimension was set.
 *   Otherwise it returns the dimension.
 */
vjs.Component.prototype.width = function(num, skipListeners){
  return this.dimension('width', num, skipListeners);
};

/**
 * Get or set the height of the player
 * @param  {Number|String=} num     Optional new player height
 * @param  {Boolean=} skipListeners Optional skip resize event trigger
 * @return {vjs.Component|Number|String} The player, or the dimension
 */
vjs.Component.prototype.height = function(num, skipListeners){
  return this.dimension('height', num, skipListeners);
};

/**
 * Set both width and height at the same time.
 * @param  {Number|String} width
 * @param  {Number|String} height
 * @return {vjs.Component}   The player.
 */
vjs.Component.prototype.dimensions = function(width, height){
  // Skip resize listeners on width for optimization
  return this.width(width, true).height(height);
};

/**
 * Get or set width or height.
 * All for an integer, integer + 'px' or integer + '%';
 * Known issue: hidden elements. Hidden elements officially have a width of 0.
 * So we're defaulting to the style.width value and falling back to computedStyle
 * which has the hidden element issue.
 * Info, but probably not an efficient fix:
 * http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/
 * @param  {String=} widthOrHeight 'width' or 'height'
 * @param  {Number|String=} num           New dimension
 * @param  {Boolean=} skipListeners Skip resize event trigger
 * @return {vjs.Component|Number|String} Return the player if setting a dimension.
 *                                         Otherwise it returns the dimension.
 */
vjs.Component.prototype.dimension = function(widthOrHeight, num, skipListeners){
  if (num !== undefined) {

    // Check if using css width/height (% or px) and adjust
    if ((''+num).indexOf('%') !== -1 || (''+num).indexOf('px') !== -1) {
      this.el_.style[widthOrHeight] = num;
    } else {
      this.el_.style[widthOrHeight] = num+'px';
    }

    // skipListeners allows us to avoid triggering the resize event when setting both width and height
    if (!skipListeners) { this.trigger('resize'); }

    // Return component
    return this;
  }

  // Not setting a value, so getting it
  // Make sure element exists
  if (!this.el_) return 0;

  // Get dimension value from style
  var val = this.el_.style[widthOrHeight];
  var pxIndex = val.indexOf('px');
  if (pxIndex !== -1) {
    // Return the pixel value with no 'px'
    return parseInt(val.slice(0,pxIndex), 10);

  // No px so using % or no style was set, so falling back to offsetWidth/height
  // If component has display:none, offset will return 0
  // TODO: handle display:none and no dimension style using px
  } else {

    return parseInt(this.el_['offset'+vjs.capitalize(widthOrHeight)], 10);

    // ComputedStyle version.
    // Only difference is if the element is hidden it will return
    // the percent value (e.g. '100%'')
    // instead of zero like offsetWidth returns.
    // var val = vjs.getComputedStyleValue(this.el_, widthOrHeight);
    // var pxIndex = val.indexOf('px');

    // if (pxIndex !== -1) {
    //   return val.slice(0, pxIndex);
    // } else {
    //   return val;
    // }
  }
};
goog.provide('vjs.Player');

goog.require('vjs.Component');

/**
 * Main player class. A player instance is returned by _V_(id);
 * @param {Element} tag        The original video tag used for configuring options
 * @param {Object=} options    Player options
 * @param {Function=} ready    Ready callback function
 * @constructor
 */
vjs.Player = function(tag, options, ready){
  this.tag = tag; // Store the original tag used to set options

  // Set Options
  // The options argument overrides options set in the video tag
  // which overrides globally set options.
  // This latter part coincides with the load order
  // (tag must exist before Player)
  options = this.mergeOptions(this.getTagSettings(tag), options);

  // Cache for video property values.
  this.cache_ = {};

  // Run base component initializing with new options.
  // Builds the element through createEl()
  // Inits and embeds any child components in opts
  vjs.Component.call(this, this, options, ready);

  // Set poster
  this.poster_ = this.options_['poster'];
  // Set controls
  this.controls_ = this.options_['controls'];

  // Firstplay event implimentation. Not sold on the event yet.
  // Could probably just check currentTime==0?
  this.one('play', function(e){
    var fpEvent = { type: 'firstplay', target: this.el_ };
    // Using vjs.trigger so we can check if default was prevented
    var keepGoing = vjs.trigger(this.el_, fpEvent);

    if (!keepGoing) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  });

  this.on('ended', this.onEnded);
  this.on('play', this.onPlay);
  this.on('pause', this.onPause);
  this.on('progress', this.onProgress);
  this.on('durationchange', this.onDurationChange);
  this.on('error', this.onError);

  // Make player easily findable by ID
  vjs.players[this.id_] = this;
};
goog.inherits(vjs.Player, vjs.Component);

/**
 * Player instance options, surfaced using vjs.options
 * vjs.options = vjs.Player.prototype.options_
 * Make changes in vjs.options, not here.
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 * @private
 */
vjs.Player.prototype.options_ = vjs.options;

vjs.Player.prototype.dispose = function(){
  // this.isReady_ = false;

  // Kill reference to this player
  vjs.players[this.id_] = null;
  if (this.tag && this.tag['player']) { this.tag['player'] = null; }
  if (this.el_ && this.el_['player']) { this.el_['player'] = null; }

  // Ensure that tracking progress and time progress will stop and plater deleted
  this.stopTrackingProgress();
  this.stopTrackingCurrentTime();

  if (this.tech) { this.tech.dispose(); }

  // Component dispose
  goog.base(this, 'dispose');
};

vjs.Player.prototype.getTagSettings = function(tag){
  var options = {
    'sources': [],
    'tracks': []
  };

  vjs.merge(options, vjs.getAttributeValues(tag));

  // Get tag children settings
  if (tag.hasChildNodes()) {
    var child, childName,
        children = tag.childNodes,
        i = 0,
        j = children.length;

    for (; i < j; i++) {
      child = children[i];
      // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
      childName = child.nodeName.toLowerCase();

      if (childName === 'source') {
        options['sources'].push(vjs.getAttributeValues(child));

      } else if (childName === 'track') {
        options['tracks'].push(vjs.getAttributeValues(child));

      }
    }
  }

  return options;
};

vjs.Player.prototype.createEl = function(){
  var el = this.el_ = goog.base(this, 'createEl', 'div');
  var tag = this.tag;

  // Original tag settings stored in options
  // now remove immediately so native controls don't flash.
  tag.removeAttribute('controls');
  // Poster will be handled by a manual <img>
  tag.removeAttribute('poster');
  // Remove width/height attrs from tag so CSS can make it 100% width/height
  tag.removeAttribute('width');
  tag.removeAttribute('height');
  // Empty video tag sources and tracks so the built-in player doesn't use them also.
  // This may not be fast enough to stop HTML5 browsers from reading the tags
  // so we'll need to turn off any default tracks if we're manually doing
  // captions and subtitles. videoElement.textTracks
  if (tag.hasChildNodes()) {
    var nrOfChildNodes = tag.childNodes.length;
    for (var i=0,j=tag.childNodes;i<nrOfChildNodes;i++) {
      if (j[0].nodeName.toLowerCase() == 'source' || j[0].nodeName.toLowerCase() == 'track') {
        tag.removeChild(j[0]);
      }
    }
  }

  // Make sure tag ID exists
  tag.id = tag.id || 'vjs_video_' + vjs.guid++;

  // Give video tag ID and class to player div
  // ID will now reference player box, not the video tag
  el.id = tag.id;
  el.className = tag.className;

  // Update tag id/class for use as HTML5 playback tech
  // Might think we should do this after embedding in container so .vjs-tech class
  // doesn't flash 100% width/height, but class only applies with .video-js parent
  tag.id += '_html5_api';
  tag.className = 'vjs-tech';

  // Make player findable on elements
  tag['player'] = el['player'] = this;

  // Default state of video is paused
  this.addClass('vjs-paused');

  // Make box use width/height of tag, or default 300x150
  // Enforce with CSS since width/height attrs don't work on divs
  this.width(this.options_['width'], true); // (true) Skip resize listener on load
  this.height(this.options_['height'], true);

  // Wrap video tag in div (el/box) container
  if (tag.parentNode) {
    tag.parentNode.insertBefore(el, tag);
  }
  vjs.insertFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.

  return el;
};

// /* Media Technology (tech)
// ================================================================================ */
// Load/Create an instance of playback technlogy including element and API methods
// And append playback element in player div.
vjs.Player.prototype.loadTech = function(techName, source){

  // Pause and remove current playback technology
  if (this.tech) {
    this.unloadTech();

  // If the first time loading, HTML5 tag will exist but won't be initialized
  // So we need to remove it if we're not loading HTML5
  } else if (techName !== 'Html5' && this.tag) {
    this.el_.removeChild(this.tag);
    this.tag = null;
  }

  this.techName = techName;

  // Turn off API access because we're loading a new tech that might load asynchronously
  this.isReady_ = false;

  var techReady = function(){
    this.player_.triggerReady();

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this.features.progressEvents) {
      this.player_.manualProgressOn();
    }

    // Manually track timeudpates in cases where the browser/flash player doesn't report it.
    if (!this.features.timeupdateEvents) {
      this.player_.manualTimeUpdatesOn();
    }
  };

  // Grab tech-specific options from player options and add source and parent element to use.
  var techOptions = vjs.merge({ source: source, parentEl: this.el_ }, this.options_[techName.toLowerCase()]);

  if (source) {
    if (source.src == this.cache_.src && this.cache_.currentTime > 0) {
      techOptions['startTime'] = this.cache_.currentTime;
    }

    this.cache_.src = source.src;
  }

  // Initialize tech instance
  this.tech = new window['videojs'][techName](this, techOptions);

  this.tech.ready(techReady);
};

vjs.Player.prototype.unloadTech = function(){
  this.tech.dispose();

  // Turn off any manual progress or timeupdate tracking
  if (this.manualProgress) { this.manualProgressOff(); }

  if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

  this.tech = false;
};

// There's many issues around changing the size of a Flash (or other plugin) object.
// First is a plugin reload issue in Firefox that has been around for 11 years: https://bugzilla.mozilla.org/show_bug.cgi?id=90268
// Then with the new fullscreen API, Mozilla and webkit browsers will reload the flash object after going to fullscreen.
// To get around this, we're unloading the tech, caching source and currentTime values, and reloading the tech once the plugin is resized.
// reloadTech: function(betweenFn){
//   vjs.log('unloadingTech')
//   this.unloadTech();
//   vjs.log('unloadedTech')
//   if (betweenFn) { betweenFn.call(); }
//   vjs.log('LoadingTech')
//   this.loadTech(this.techName, { src: this.cache_.src })
//   vjs.log('loadedTech')
// },

/* Fallbacks for unsupported event types
================================================================================ */
// Manually trigger progress events based on changes to the buffered amount
// Many flash players and older HTML5 browsers don't send progress or progress-like events
vjs.Player.prototype.manualProgressOn = function(){
  this.manualProgress = true;

  // Trigger progress watching when a source begins loading
  this.trackProgress();

  // Watch for a native progress event call on the tech element
  // In HTML5, some older versions don't support the progress event
  // So we're assuming they don't, and turning off manual progress if they do.
  // As opposed to doing user agent detection
  this.tech.one('progress', function(){

    // Update known progress support for this playback technology
    this.features.progressEvents = true;

    // Turn off manual progress tracking
    this.player_.manualProgressOff();
  });
};

vjs.Player.prototype.manualProgressOff = function(){
  this.manualProgress = false;
  this.stopTrackingProgress();
};

vjs.Player.prototype.trackProgress = function(){

  this.progressInterval = setInterval(vjs.bind(this, function(){
    // Don't trigger unless buffered amount is greater than last time
    // log(this.cache_.bufferEnd, this.buffered().end(0), this.duration())
    /* TODO: update for multiple buffered regions */
    if (this.cache_.bufferEnd < this.buffered().end(0)) {
      this.trigger('progress');
    } else if (this.bufferedPercent() == 1) {
      this.stopTrackingProgress();
      this.trigger('progress'); // Last update
    }
  }), 500);
};
vjs.Player.prototype.stopTrackingProgress = function(){ clearInterval(this.progressInterval); };

/* Time Tracking -------------------------------------------------------------- */
vjs.Player.prototype.manualTimeUpdatesOn = function(){
  this.manualTimeUpdates = true;

  this.on('play', this.trackCurrentTime);
  this.on('pause', this.stopTrackingCurrentTime);
  // timeupdate is also called by .currentTime whenever current time is set

  // Watch for native timeupdate event
  this.tech.one('timeupdate', function(){
    // Update known progress support for this playback technology
    this.features.timeupdateEvents = true;
    // Turn off manual progress tracking
    this.player_.manualTimeUpdatesOff();
  });
};

vjs.Player.prototype.manualTimeUpdatesOff = function(){
  this.manualTimeUpdates = false;
  this.stopTrackingCurrentTime();
  this.off('play', this.trackCurrentTime);
  this.off('pause', this.stopTrackingCurrentTime);
};

vjs.Player.prototype.trackCurrentTime = function(){
  if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
  this.currentTimeInterval = setInterval(vjs.bind(this, function(){
    this.trigger('timeupdate');
  }), 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
};

// Turn off play progress tracking (when paused or dragging)
vjs.Player.prototype.stopTrackingCurrentTime = function(){ clearInterval(this.currentTimeInterval); };

// /* Player event handlers (how the player reacts to certain events)
// ================================================================================ */
vjs.Player.prototype.onEnded = function(){
  if (this.options_['loop']) {
    this.currentTime(0);
    this.play();
  }
};

vjs.Player.prototype.onPlay = function(){
  vjs.removeClass(this.el_, 'vjs-paused');
  vjs.addClass(this.el_, 'vjs-playing');
};

vjs.Player.prototype.onPause = function(){
  vjs.removeClass(this.el_, 'vjs-playing');
  vjs.addClass(this.el_, 'vjs-paused');
};

vjs.Player.prototype.onProgress = function(){
  // Add custom event for when source is finished downloading.
  if (this.bufferedPercent() == 1) {
    this.trigger('loadedalldata');
  }
};

// Update duration with durationchange event
// Allows for cacheing value instead of asking player each time.
vjs.Player.prototype.onDurationChange = function(){
  this.duration(this.techGet('duration'));
};

vjs.Player.prototype.onError = function(e) {
  vjs.log('Video Error', e);
};

// /* Player API
// ================================================================================ */

/**
 * Object for cached values.
 * @private
 */
vjs.Player.prototype.cache_;

vjs.Player.prototype.getCache = function(){
  return this.cache_;
};

// Pass values to the playback tech
vjs.Player.prototype.techCall = function(method, arg){
  // If it's not ready yet, call method when it is
  if (this.tech && this.tech.isReady_) {
    this.tech.ready(function(){
      this[method](arg);
    });

  // Otherwise call method now
  } else {
    try {
      this.tech[method](arg);
    } catch(e) {
      vjs.log(e);
    }
  }
};

// Get calls can't wait for the tech, and sometimes don't need to.
vjs.Player.prototype.techGet = function(method){

  // Make sure there is a tech
  // if (!this.tech) {
  //   return;
  // }

  if (this.tech.isReady_) {

    // Flash likes to die and reload when you hide or reposition it.
    // In these cases the object methods go away and we get errors.
    // When that happens we'll catch the errors and inform tech that it's not ready any more.
    try {
      return this.tech[method]();
    } catch(e) {

      // When building additional tech libs, an expected method may not be defined yet
      if (this.tech[method] === undefined) {
        vjs.log('Video.js: ' + method + ' method not defined for '+this.techName+' playback technology.', e);

      } else {

        // When a method isn't available on the object it throws a TypeError
        if (e.name == 'TypeError') {
          vjs.log('Video.js: ' + method + ' unavailable on '+this.techName+' playback technology element.', e);
          this.tech.isReady_ = false;
          throw e;
        } else {
          vjs.log(e);
        }
      }
    }
  }

  return;
};

/**
 * Start media playback
 * http://dev.w3.org/html5/spec/video.html#dom-media-play
 * We're triggering the 'play' event here instead of relying on the
 * media element to allow using event.preventDefault() to stop
 * play from happening if desired. Usecase: preroll ads.
 */
vjs.Player.prototype.play = function(){
  // Create an event object so we can check for preventDefault after
  var e = { type: 'play', target: this.el_ };

  this.trigger(e);

  if (!e.isDefaultPrevented()) {
    this.techCall('play');
  }

  return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-pause
vjs.Player.prototype.pause = function(){
  this.techCall('pause');
  return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-paused
// The initial state of paused should be true (in Safari it's actually false)
vjs.Player.prototype.paused = function(){
  return (this.techGet('paused') === false) ? false : true;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-currenttime
vjs.Player.prototype.currentTime = function(seconds){
  if (seconds !== undefined) {

    // Cache the last set value for smoother scrubbing.
    this.cache_.lastSetCurrentTime = seconds;

    this.techCall('setCurrentTime', seconds);

    // Improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) { this.trigger('timeupdate'); }

    return this;
  }

  // Cache last currentTime and return
  // Default to 0 seconds
  return this.cache_.currentTime = (this.techGet('currentTime') || 0);
};

// http://dev.w3.org/html5/spec/video.html#dom-media-duration
// Duration should return NaN if not available. ParseFloat will turn false-ish values to NaN.
vjs.Player.prototype.duration = function(seconds){
  if (seconds !== undefined) {

    // Cache the last set value for optimiized scrubbing (esp. Flash)
    this.cache_.duration = parseFloat(seconds);

    return this;
  }

  return this.cache_.duration;
};

// Calculates how much time is left. Not in spec, but useful.
vjs.Player.prototype.remainingTime = function(){
  return this.duration() - this.currentTime();
};

// http://dev.w3.org/html5/spec/video.html#dom-media-buffered
// Buffered returns a timerange object.
// Kind of like an array of portions of the video that have been downloaded.
// So far no browsers return more than one range (portion)
vjs.Player.prototype.buffered = function(){
  var buffered = this.techGet('buffered'),
      start = 0,
      // Default end to 0 and store in values
      end = this.cache_.bufferEnd = this.cache_.bufferEnd || 0;

  if (buffered && buffered.length > 0 && buffered.end(0) !== end) {
    end = buffered.end(0);
    // Storing values allows them be overridden by setBufferedFromProgress
    this.cache_.bufferEnd = end;
  }

  return vjs.createTimeRange(start, end);
};

// Calculates amount of buffer is full. Not in spec but useful.
vjs.Player.prototype.bufferedPercent = function(){
  return (this.duration()) ? this.buffered().end(0) / this.duration() : 0;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-volume
vjs.Player.prototype.volume = function(percentAsDecimal){
  var vol;

  if (percentAsDecimal !== undefined) {
    vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
    this.cache_.volume = vol;
    this.techCall('setVolume', vol);
    vjs.setLocalStorage('volume', vol);
    return this;
  }

  // Default to 1 when returning current volume.
  vol = parseFloat(this.techGet('volume'));
  return (isNaN(vol)) ? 1 : vol;
};

// http://dev.w3.org/html5/spec/video.html#attr-media-muted
vjs.Player.prototype.muted = function(muted){
  if (muted !== undefined) {
    this.techCall('setMuted', muted);
    return this;
  }
  return this.techGet('muted') || false; // Default to false
};

// Check if current tech can support native fullscreen (e.g. with built in controls lik iOS, so not our flash swf)
vjs.Player.prototype.supportsFullScreen = function(){ return this.techGet('supportsFullScreen') || false; };

// Turn on fullscreen (or window) mode
vjs.Player.prototype.requestFullScreen = function(){
  var requestFullScreen = vjs.support.requestFullScreen;

  this.isFullScreen = true;

  // Check for browser element fullscreen support
  if (requestFullScreen) {

    // Trigger fullscreenchange event after change
    vjs.on(document, requestFullScreen.eventName, vjs.bind(this, function(){
      this.isFullScreen = document[requestFullScreen.isFullScreen];

      // If cancelling fullscreen, remove event listener.
      if (this.isFullScreen === false) {
        vjs.off(document, requestFullScreen.eventName, arguments.callee);
      }

      this.trigger('fullscreenchange');
    }));

    // Flash and other plugins get reloaded when you take their parent to fullscreen.
    // To fix that we'll remove the tech, and reload it after the resize has finished.
    if (this.tech.features.fullscreenResize === false && this.options_['flash']['iFrameMode'] !== true) {

      this.pause();
      this.unloadTech();

      vjs.on(document, requestFullScreen.eventName, vjs.bind(this, function(){
        vjs.off(document, requestFullScreen.eventName, arguments.callee);
        this.loadTech(this.techName, { src: this.cache_.src });
      }));

      this.el_[requestFullScreen.requestFn]();

    } else {
      this.el_[requestFullScreen.requestFn]();
    }

  } else if (this.tech.supportsFullScreen()) {
    this.trigger('fullscreenchange');
    this.techCall('enterFullScreen');

  } else {
    this.trigger('fullscreenchange');
    this.enterFullWindow();
  }

   return this;
};

vjs.Player.prototype.cancelFullScreen = function(){
  var requestFullScreen = vjs.support.requestFullScreen;

  this.isFullScreen = false;

  // Check for browser element fullscreen support
  if (requestFullScreen) {

   // Flash and other plugins get reloaded when you take their parent to fullscreen.
   // To fix that we'll remove the tech, and reload it after the resize has finished.
   if (this.tech.features.fullscreenResize === false && this.options_['flash']['iFrameMode'] !== true) {

     this.pause();
     this.unloadTech();

     vjs.on(document, requestFullScreen.eventName, vjs.bind(this, function(){
       vjs.off(document, requestFullScreen.eventName, arguments.callee);
       this.loadTech(this.techName, { src: this.cache_.src });
     }));

     document[requestFullScreen.cancelFn]();

   } else {
     document[requestFullScreen.cancelFn]();
   }

  } else if (this.tech.supportsFullScreen()) {
   this.techCall('exitFullScreen');
   this.trigger('fullscreenchange');

  } else {
   this.exitFullWindow();
   this.trigger('fullscreenchange');
  }

  return this;
};

// When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.
vjs.Player.prototype.enterFullWindow = function(){
  this.isFullWindow = true;

  // Storing original doc overflow value to return to when fullscreen is off
  this.docOrigOverflow = document.documentElement.style.overflow;

  // Add listener for esc key to exit fullscreen
  vjs.on(document, 'keydown', vjs.bind(this, this.fullWindowOnEscKey));

  // Hide any scroll bars
  document.documentElement.style.overflow = 'hidden';

  // Apply fullscreen styles
  vjs.addClass(document.body, 'vjs-full-window');
  vjs.addClass(this.el_, 'vjs-fullscreen');

  this.trigger('enterFullWindow');
};
vjs.Player.prototype.fullWindowOnEscKey = function(event){
  if (event.keyCode === 27) {
    if (this.isFullScreen === true) {
      this.cancelFullScreen();
    } else {
      this.exitFullWindow();
    }
  }
};

vjs.Player.prototype.exitFullWindow = function(){
  this.isFullWindow = false;
  vjs.off(document, 'keydown', this.fullWindowOnEscKey);

  // Unhide scroll bars.
  document.documentElement.style.overflow = this.docOrigOverflow;

  // Remove fullscreen styles
  vjs.removeClass(document.body, 'vjs-full-window');
  vjs.removeClass(this.el_, 'vjs-fullscreen');

  // Resize the box, controller, and poster to original sizes
  // this.positionAll();
  this.trigger('exitFullWindow');
};

vjs.Player.prototype.selectSource = function(sources){

  // Loop through each playback technology in the options order
  for (var i=0,j=this.options_['techOrder'];i<j.length;i++) {
    var techName = vjs.capitalize(j[i]),
        tech = window['videojs'][techName];

    // Check if the browser supports this technology
    if (tech.isSupported()) {
      // Loop through each source object
      for (var a=0,b=sources;a<b.length;a++) {
        var source = b[a];

        // Check if source can be played with this technology
        if (tech['canPlaySource'](source)) {
          return { source: source, tech: techName };
        }
      }
    }
  }

  return false;
};

// src is a pretty powerful function
// If you pass it an array of source objects, it will find the best source to play and use that object.src
//   If the new source requires a new playback technology, it will switch to that.
// If you pass it an object, it will set the source to object.src
// If you pass it anything else (url string) it will set the video source to that
vjs.Player.prototype.src = function(source){
  // Case: Array of source objects to choose from and pick the best to play
  if (source instanceof Array) {

    var sourceTech = this.selectSource(source),
        techName;

    if (sourceTech) {
        source = sourceTech.source;
        techName = sourceTech.tech;

      // If this technology is already loaded, set source
      if (techName == this.techName) {
        this.src(source); // Passing the source object
      // Otherwise load this technology with chosen source
      } else {
        this.loadTech(techName, source);
      }
    } else {
      this.el_.appendChild(vjs.createEl('p', {
        innerHTML: 'Sorry, no compatible source and playback technology were found for this video. Try using another browser like <a href="http://www.google.com/chrome">Google Chrome</a> or download the latest <a href="http://get.adobe.com/flashplayer/">Adobe Flash Player</a>.'
      }));
    }

  // Case: Source object { src: '', type: '' ... }
  } else if (source instanceof Object) {

    if (window['videojs'][this.techName]['canPlaySource'](source)) {
      this.src(source.src);
    } else {
      // Send through tech loop to check for a compatible technology.
      this.src([source]);
    }

  // Case: URL String (http://myvideo...)
  } else {
    // Cache for getting last set source
    this.cache_.src = source;

    if (!this.isReady_) {
      this.ready(function(){
        this.src(source);
      });
    } else {
      this.techCall('src', source);
      if (this.options_['preload'] == 'auto') {
        this.load();
      }
      if (this.options_['autoplay']) {
        this.play();
      }
    }
  }
  return this;
};

// Begin loading the src data
// http://dev.w3.org/html5/spec/video.html#dom-media-load
vjs.Player.prototype.load = function(){
  this.techCall('load');
  return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-currentsrc
vjs.Player.prototype.currentSrc = function(){
  return this.techGet('currentSrc') || this.cache_.src || '';
};

// Attributes/Options
vjs.Player.prototype.preload = function(value){
  if (value !== undefined) {
    this.techCall('setPreload', value);
    this.options_['preload'] = value;
    return this;
  }
  return this.techGet('preload');
};
vjs.Player.prototype.autoplay = function(value){
  if (value !== undefined) {
    this.techCall('setAutoplay', value);
    this.options_['autoplay'] = value;
    return this;
  }
  return this.techGet('autoplay', value);
};
vjs.Player.prototype.loop = function(value){
  if (value !== undefined) {
    this.techCall('setLoop', value);
    this.options_['loop'] = value;
    return this;
  }
  return this.techGet('loop');
};

/**
 * The url of the poster image source.
 * @type {String}
 * @private
 */
vjs.Player.prototype.poster_;

/**
 * Get or set the poster image source url.
 * @param  {String} src Poster image source URL
 * @return {String=}    Poster image source URL or null
 */
vjs.Player.prototype.poster = function(src){
  if (src !== undefined) {
    this.poster_ = src;
  }
  return this.poster_;
};

/**
 * Whether or not the controls are showing
 * @type {Boolean}
 * @private
 */
vjs.Player.prototype.controls_;

/**
 * Get or set whether or not the controls are showing.
 * @param  {Boolean} controls Set controls to showing or not
 * @return {Boolean}    Controls are showing
 */
vjs.Player.prototype.controls = function(controls){
  if (controls !== undefined) {
    this.controls_ = controls;
  }
  return this.controls_;
};

vjs.Player.prototype.error = function(){ return this.techGet('error'); };
vjs.Player.prototype.ended = function(){ return this.techGet('ended'); };

// Methods to add support for
// networkState: function(){ return this.techCall('networkState'); },
// readyState: function(){ return this.techCall('readyState'); },
// seeking: function(){ return this.techCall('seeking'); },
// initialTime: function(){ return this.techCall('initialTime'); },
// startOffsetTime: function(){ return this.techCall('startOffsetTime'); },
// played: function(){ return this.techCall('played'); },
// seekable: function(){ return this.techCall('seekable'); },
// videoTracks: function(){ return this.techCall('videoTracks'); },
// audioTracks: function(){ return this.techCall('audioTracks'); },
// videoWidth: function(){ return this.techCall('videoWidth'); },
// videoHeight: function(){ return this.techCall('videoHeight'); },
// defaultPlaybackRate: function(){ return this.techCall('defaultPlaybackRate'); },
// playbackRate: function(){ return this.techCall('playbackRate'); },
// mediaGroup: function(){ return this.techCall('mediaGroup'); },
// controller: function(){ return this.techCall('controller'); },
// defaultMuted: function(){ return this.techCall('defaultMuted'); }

// TODO
// currentSrcList: the array of sources including other formats and bitrates
// playList: array of source lists in order of playback

// RequestFullscreen API
(function(){
  var requestFn, cancelFn, eventName, isFullScreen;

  // Current W3C Spec
  // http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html#api
  // Mozilla Draft: https://wiki.mozilla.org/Gecko:FullScreenAPI#fullscreenchange_event
  if (document.cancelFullscreen !== undefined) {
    requestFn = 'requestFullscreen';
    cancelFn = 'exitFullscreen';
    eventName = 'fullscreenchange';
    isFullScreen = 'fullScreen';

  // Webkit (Chrome/Safari) and Mozilla (Firefox) have working implementaitons
  // that use prefixes and vary slightly from the new W3C spec. Specifically, using 'exit' instead of 'cancel',
  // and lowercasing the 'S' in Fullscreen.
  // Other browsers don't have any hints of which version they might follow yet, so not going to try to predict by loopeing through all prefixes.
  } else {

    var prefixes = ['moz', 'webkit'];

    for (var i = prefixes.length - 1; i >= 0; i--) {
      var prefix = prefixes[i];

      // https://github.com/zencoder/video-js/pull/128
      if ((prefix != 'moz' || document.mozFullScreenEnabled) && document[prefix + 'CancelFullScreen'] !== undefined) {
        requestFn = prefix + 'RequestFullScreen';
        cancelFn = prefix + 'CancelFullScreen';
        eventName = prefix + 'fullscreenchange';

        if (prefix == 'webkit') {
          isFullScreen = prefix + 'IsFullScreen';
        } else {
          isFullScreen = prefix + 'FullScreen';
        }
      }
    }
  }

  if (requestFn) {
    vjs.support.requestFullScreen = {
      requestFn: requestFn,
      cancelFn: cancelFn,
      eventName: eventName,
      isFullScreen: isFullScreen
    };
  }

})();

/**
 * @constructor
 */
vjs.MediaLoader = function(player, options, ready){
  vjs.Component.call(this, player, options, ready);

  // If there are no sources when the player is initialized,
  // load the first supported playback technology.
  if (!player.options_['sources'] || player.options_['sources'].length === 0) {
    for (var i=0,j=player.options_['techOrder']; i<j.length; i++) {
      var techName = vjs.capitalize(j[i]),
          tech = window['videojs'][techName];

      // Check if the browser supports this technology
      if (tech && tech.isSupported()) {
        player.loadTech(techName);
        break;
      }
    }
  } else {
    // // Loop through playback technologies (HTML5, Flash) and check for support.
    // // Then load the best source.
    // // A few assumptions here:
    // //   All playback technologies respect preload false.
    player.src(player.options_['sources']);
  }
};
goog.inherits(vjs.MediaLoader, vjs.Component);


/**
 * @fileoverview Controls classes for Video.js buttons, sliders, etc.
 */

goog.provide('vjs.Control');
goog.provide('vjs.Menu');
goog.provide('vjs.MenuItem');

goog.require('vjs.Player');

/**
 * Base class for all control elements
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Control = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.Control, vjs.Component);

vjs.Control.prototype.buildCSSClass = function(){
  return 'vjs-control ' + goog.base(this, 'buildCSSClass');
};

/* Control Bar
================================================================================ */
/**
 * Container of main controls
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.ControlBar = function(player, options){
  goog.base(this, player, options);

  player.one('play', vjs.bind(this, function(){
    this.fadeIn();
    this.player_.on('mouseover', vjs.bind(this, this.fadeIn));
    this.player_.on('mouseout', vjs.bind(this, this.fadeOut));
  }));
};
goog.inherits(vjs.ControlBar, vjs.Component);

vjs.ControlBar.prototype.options_ = {
  loadEvent: 'play',
  children: {
    'playToggle': {},
    'fullscreenToggle': {},
    'currentTimeDisplay': {},
    'timeDivider': {},
    'durationDisplay': {},
    'remainingTimeDisplay': {},
    'progressControl': {},
    'volumeControl': {},
    'muteToggle': {}
  }
};

vjs.ControlBar.prototype.createEl = function(){
  return vjs.createEl('div', {
    className: 'vjs-control-bar'
  });
};

vjs.ControlBar.prototype.fadeIn = function(){
  goog.base(this, 'fadeIn');
  this.player_.trigger('controlsvisible');
};

vjs.ControlBar.prototype.fadeOut = function(){
  goog.base(this, 'fadeOut');
  this.player_.trigger('controlshidden');
};

vjs.ControlBar.prototype.lockShowing = function(){
  this.el_.style.opacity = '1';
};

/* Button - Base class for all buttons
================================================================================ */
/**
 * Base class for all buttons
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Button = function(player, options){
  goog.base(this, player, options);

  this.on('click', this.onClick);
  this.on('focus', this.onFocus);
  this.on('blur', this.onBlur);
};
goog.inherits(vjs.Button, vjs.Control);

vjs.Button.prototype.createEl = function(type, props){
  // Add standard Aria and Tabindex info
  props = vjs.merge({
    className: this.buildCSSClass(),
    innerHTML: '<div><span class="vjs-control-text">' + (this.buttonText || 'Need Text') + '</span></div>',
    role: 'button',
    tabIndex: 0
  }, props);

  return goog.base(this, 'createEl', type, props);
};

  // Click - Override with specific functionality for button
vjs.Button.prototype.onClick = function(){};

  // Focus - Add keyboard functionality to element
vjs.Button.prototype.onFocus = function(){
  vjs.on(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

  // KeyPress (document level) - Trigger click when keys are pressed
vjs.Button.prototype.onKeyPress = function(event){
  // Check for space bar (32) or enter (13) keys
  if (event.which == 32 || event.which == 13) {
    event.preventDefault();
    this.onClick();
  }
};

  // Blur - Remove keyboard triggers
vjs.Button.prototype.onBlur = function(){
  vjs.off(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

/* Play Button
================================================================================ */
/**
 * Basic play button
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PlayButton = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.PlayButton, vjs.Button);

vjs.PlayButton.prototype.buttonText = 'Play';

vjs.PlayButton.prototype.buildCSSClass = function(){
  return 'vjs-play-button ' + goog.base(this, 'buildCSSClass');
};

vjs.PlayButton.prototype.onClick = function(){
  this.player_.play();
};

/* Pause Button
================================================================================ */
/**
 * Basic pause button
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PauseButton = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.PauseButton, vjs.Button);

vjs.PauseButton.prototype.buttonText = 'Play';

vjs.PauseButton.prototype.buildCSSClass = function(){
  return 'vjs-pause-button ' + goog.base(this, 'buildCSSClass');
};

vjs.PauseButton.prototype.onClick = function(){
  this.player_.pause();
};

/* Play Toggle - Play or Pause Media
================================================================================ */
/**
 * Button to toggle between play and pause
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PlayToggle = function(player, options){
  goog.base(this, player, options);

  player.on('play', vjs.bind(this, this.onPlay));
  player.on('pause', vjs.bind(this, this.onPause));
};
goog.inherits(vjs.PlayToggle, vjs.Button);

vjs.PlayToggle.prototype.buttonText = 'Play';

vjs.PlayToggle.prototype.buildCSSClass = function(){
  return 'vjs-play-control ' + goog.base(this, 'buildCSSClass');
};

  // OnClick - Toggle between play and pause
vjs.PlayToggle.prototype.onClick = function(){
  if (this.player_.paused()) {
    this.player_.play();
  } else {
    this.player_.pause();
  }
};

  // OnPlay - Add the vjs-playing class to the element so it can change appearance
vjs.PlayToggle.prototype.onPlay = function(){
  vjs.removeClass(this.el_, 'vjs-paused');
  vjs.addClass(this.el_, 'vjs-playing');
};

  // OnPause - Add the vjs-paused class to the element so it can change appearance
vjs.PlayToggle.prototype.onPause = function(){
  vjs.removeClass(this.el_, 'vjs-playing');
  vjs.addClass(this.el_, 'vjs-paused');
};


/* Fullscreen Toggle Behaviors
================================================================================ */
/**
 * Toggle fullscreen video
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.FullscreenToggle = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.FullscreenToggle, vjs.Button);

vjs.FullscreenToggle.prototype.buttonText = 'Fullscreen';

vjs.FullscreenToggle.prototype.buildCSSClass = function(){
  return 'vjs-fullscreen-control ' + goog.base(this, 'buildCSSClass');
};

vjs.FullscreenToggle.prototype.onClick = function(){
  if (!this.player_.isFullScreen) {
    this.player_.requestFullScreen();
  } else {
    this.player_.cancelFullScreen();
  }
};


/* Big Play Button
================================================================================ */
/**
 * Initial play button. Shows before the video has played.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.BigPlayButton = function(player, options){
  goog.base(this, player, options);

  player.on('play', vjs.bind(this, this.hide));
  // player.on('ended', vjs.bind(this, this.show));
};
goog.inherits(vjs.BigPlayButton, vjs.Button);

vjs.BigPlayButton.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-big-play-button',
    innerHTML: '<span></span>'
  });
};

vjs.BigPlayButton.prototype.onClick = function(){
  // Go back to the beginning if big play button is showing at the end.
  // Have to check for current time otherwise it might throw a 'not ready' error.
  if(this.player_.currentTime()) {
    this.player_.currentTime(0);
  }
  this.player_.play();
};

/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.LoadingSpinner = function(player, options){
  goog.base(this, player, options);

  player.on('canplay', vjs.bind(this, this.hide));
  player.on('canplaythrough', vjs.bind(this, this.hide));
  player.on('playing', vjs.bind(this, this.hide));
  player.on('seeked', vjs.bind(this, this.hide));

  player.on('seeking', vjs.bind(this, this.show));

  // in some browsers seeking does not trigger the 'playing' event,
  // so we also need to trap 'seeked' if we are going to set a
  // 'seeking' event
  player.on('seeked', vjs.bind(this, this.hide));

  player.on('error', vjs.bind(this, this.show));

  // Not showing spinner on stalled any more. Browsers may stall and then not trigger any events that would remove the spinner.
  // Checked in Chrome 16 and Safari 5.1.2. http://help.videojs.com/discussions/problems/883-why-is-the-download-progress-showing
  // player.on('stalled', vjs.bind(this, this.show));

  player.on('waiting', vjs.bind(this, this.show));
};
goog.inherits(vjs.LoadingSpinner, vjs.Component);

vjs.LoadingSpinner.prototype.createEl = function(){
  var classNameSpinner, innerHtmlSpinner;

  if ( typeof this.player_.el().style.WebkitBorderRadius == 'string'
       || typeof this.player_.el().style.MozBorderRadius == 'string'
       || typeof this.player_.el().style.KhtmlBorderRadius == 'string'
       || typeof this.player_.el().style.borderRadius == 'string')
    {
      classNameSpinner = 'vjs-loading-spinner';
      innerHtmlSpinner = '<div class="ball1"></div><div class="ball2"></div><div class="ball3"></div><div class="ball4"></div><div class="ball5"></div><div class="ball6"></div><div class="ball7"></div><div class="ball8"></div>';
    } else {
      classNameSpinner = 'vjs-loading-spinner-fallback';
      innerHtmlSpinner = '';
    }

  return goog.base(this, 'createEl', 'div', {
    className: classNameSpinner,
    innerHTML: innerHtmlSpinner
  });
};

/* Time
================================================================================ */

/**
 * Displays the current time
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.CurrentTimeDisplay = function(player, options){
  goog.base(this, player, options);

  player.on('timeupdate', vjs.bind(this, this.updateContent));
};
goog.inherits(vjs.CurrentTimeDisplay, vjs.Component);

vjs.CurrentTimeDisplay.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', 'div', {
    className: 'vjs-current-time vjs-time-controls vjs-control'
  });

  this.content = vjs.createEl('div', {
    className: 'vjs-current-time-display',
    innerHTML: '0:00'
  });

  el.appendChild(vjs.createEl('div').appendChild(this.content));
  return el;
};

vjs.CurrentTimeDisplay.prototype.updateContent = function(){
  // Allows for smooth scrubbing, when player can't keep up.
  var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  this.content.innerHTML = vjs.formatTime(time, this.player_.duration());
};

/**
 * Displays the duration
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.DurationDisplay = function(player, options){
  goog.base(this, player, options);

  player.on('timeupdate', vjs.bind(this, this.updateContent));
};
goog.inherits(vjs.DurationDisplay, vjs.Component);

vjs.DurationDisplay.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', 'div', {
    className: 'vjs-duration vjs-time-controls vjs-control'
  });

  this.content = vjs.createEl('div', {
    className: 'vjs-duration-display',
    innerHTML: '0:00'
  });

  el.appendChild(vjs.createEl('div').appendChild(this.content));
  return el;
};

vjs.DurationDisplay.prototype.updateContent = function(){
  if (this.player_.duration()) { this.content.innerHTML = vjs.formatTime(this.player_.duration()); }
};

/**
 * Time Separator (Not used in main skin, but still available, and could be used as a 'spare element')
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.TimeDivider = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.TimeDivider, vjs.Component);

vjs.TimeDivider.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-time-divider',
    innerHTML: '<div><span>/</span></div>'
  });
};

/**
 * Displays the time left in the video
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.RemainingTimeDisplay = function(player, options){
  goog.base(this, player, options);

  player.on('timeupdate', vjs.bind(this, this.updateContent));
};
goog.inherits(vjs.RemainingTimeDisplay, vjs.Component);


vjs.RemainingTimeDisplay.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', 'div', {
    className: 'vjs-remaining-time vjs-time-controls vjs-control'
  });

  this.content = vjs.createEl('div', {
    className: 'vjs-remaining-time-display',
    innerHTML: '-0:00'
  });

  el.appendChild(vjs.createEl('div').appendChild(this.content));
  return el;
};

vjs.RemainingTimeDisplay.prototype.updateContent = function(){
  if (this.player_.duration()) { this.content.innerHTML = '-'+vjs.formatTime(this.player_.remainingTime()); }

  // Allows for smooth scrubbing, when player can't keep up.
  // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  // this.content.innerHTML = vjs.formatTime(time, this.player_.duration());
};

/* Slider
================================================================================ */
/**
 * Parent for seek bar and volume slider
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Slider = function(player, options){
    goog.base(this, player, options);

    // Set property names to bar and handle to match with the child Slider class is looking for
    this.bar = this.getChild(this.options_['barName']);
    this.handle = this.getChild(this.options_['handleName']);

    // console.log('asdf', this.bar, this.childNameIndex_, this.options_)

    player.on(this.playerEvent, vjs.bind(this, this.update));

    this.on('mousedown', this.onMouseDown);
    this.on('focus', this.onFocus);
    this.on('blur', this.onBlur);

    this.player_.on('controlsvisible', vjs.bind(this, this.update));

    // This is actually to fix the volume handle position. http://twitter.com/#!/gerritvanaaken/status/159046254519787520
    // this.player_.one('timeupdate', vjs.bind(this, this.update));

    player.ready(vjs.bind(this, this.update));
};
goog.inherits(vjs.Slider, vjs.Component);

vjs.Slider.prototype.createEl = function(type, props) {
  props = vjs.merge({
    role: 'slider',
    'aria-valuenow': 0,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    tabIndex: 0
  }, props);

  return goog.base(this, 'createEl', type, props);
};

vjs.Slider.prototype.onMouseDown = function(event){
  event.preventDefault();
  vjs.blockTextSelection();

  vjs.on(document, 'mousemove', vjs.bind(this, this.onMouseMove));
  vjs.on(document, 'mouseup', vjs.bind(this, this.onMouseUp));

  this.onMouseMove(event);
};

vjs.Slider.prototype.onMouseUp = function() {
  vjs.unblockTextSelection();
  vjs.off(document, 'mousemove', this.onMouseMove, false);
  vjs.off(document, 'mouseup', this.onMouseUp, false);

  this.update();
};

vjs.Slider.prototype.update = function(){
  // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
  // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
  // var progress =  (this.player_.scrubbing) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();

  var barProgress,
      progress = this.getPercent(),
      handle = this.handle,
      bar = this.bar;

  // Protect against no duration and other division issues
  if (isNaN(progress)) { progress = 0; }

  barProgress = progress;

  // If there is a handle, we need to account for the handle in our calculation for progress bar
  // so that it doesn't fall short of or extend past the handle.
  if (handle) {

    var box = this.el_,
        boxWidth = box.offsetWidth,

        handleWidth = handle.el().offsetWidth,

        // The width of the handle in percent of the containing box
        // In IE, widths may not be ready yet causing NaN
        handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

        // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
        // There is a margin of half the handle's width on both sides.
        boxAdjustedPercent = 1 - handlePercent,

        // Adjust the progress that we'll use to set widths to the new adjusted box width
        adjustedProgress = progress * boxAdjustedPercent;

    // The bar does reach the left side, so we need to account for this in the bar's width
    barProgress = adjustedProgress + (handlePercent / 2);

    // Move the handle from the left based on the adjected progress
    handle.el().style.left = vjs.round(adjustedProgress * 100, 2) + '%';
  }

  // Set the new bar width
  bar.el().style.width = vjs.round(barProgress * 100, 2) + '%';
};

vjs.Slider.prototype.calculateDistance = function(event){
  var box = this.el_,
      boxX = vjs.findPosX(box),
      boxW = box.offsetWidth,
      handle = this.handle;

  if (handle) {
    var handleW = handle.el().offsetWidth;

    // Adjusted X and Width, so handle doesn't go outside the bar
    boxX = boxX + (handleW / 2);
    boxW = boxW - handleW;
  }

  // Percent that the click is through the adjusted area
  return Math.max(0, Math.min(1, (event.pageX - boxX) / boxW));
};

vjs.Slider.prototype.onFocus = function(){
  vjs.on(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

vjs.Slider.prototype.onKeyPress = function(event){
  if (event.which == 37) { // Left Arrow
    event.preventDefault();
    this.stepBack();
  } else if (event.which == 39) { // Right Arrow
    event.preventDefault();
    this.stepForward();
  }
};

vjs.Slider.prototype.onBlur = function(){
  vjs.off(document, 'keyup', vjs.bind(this, this.onKeyPress));
};


/* Progress
================================================================================ */

/**
 * Seek, Load Progress, and Play Progress
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.ProgressControl = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.ProgressControl, vjs.Component);

vjs.ProgressControl.prototype.options_ = {
  children: {
    'seekBar': {}
  }
};

vjs.ProgressControl.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-progress-control vjs-control'
  });
};

/**
 * Seek Bar and holder for the progress bars
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.SeekBar = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.SeekBar, vjs.Slider);

vjs.SeekBar.prototype.options_ = {
  children: {
    'loadProgressBar': {},
    'playProgressBar': {},
    'seekHandle': {}
  },
  'barName': 'playProgressBar',
  'handleName': 'seekHandle'
};

vjs.SeekBar.prototype.playerEvent = 'timeupdate';

vjs.SeekBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-progress-holder'
  });
};

vjs.SeekBar.prototype.getPercent = function(){
  return this.player_.currentTime() / this.player_.duration();
};

vjs.SeekBar.prototype.onMouseDown = function(event){
  goog.base(this, 'onMouseDown', event);

  this.player_.scrubbing = true;

  this.videoWasPlaying = !this.player_.paused();
  this.player_.pause();
};

vjs.SeekBar.prototype.onMouseMove = function(event){
  var newTime = this.calculateDistance(event) * this.player_.duration();

  // Don't let video end while scrubbing.
  if (newTime == this.player_.duration()) { newTime = newTime - 0.1; }

  // Set new time (tell player to seek to new time)
  this.player_.currentTime(newTime);
};

vjs.SeekBar.prototype.onMouseUp = function(event){
  goog.base(this, 'onMouseUp', event);

  this.player_.scrubbing = false;
  if (this.videoWasPlaying) {
    this.player_.play();
  }
};

vjs.SeekBar.prototype.stepForward = function(){
  this.player_.currentTime(this.player_.currentTime() + 1);
};

vjs.SeekBar.prototype.stepBack = function(){
  this.player_.currentTime(this.player_.currentTime() - 1);
};


/**
 * Shows load progres
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.LoadProgressBar = function(player, options){
  goog.base(this, player, options);
  player.on('progress', vjs.bind(this, this.update));
};
goog.inherits(vjs.LoadProgressBar, vjs.Component);

vjs.LoadProgressBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-load-progress',
    innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
  });
};

vjs.LoadProgressBar.prototype.update = function(){
  if (this.el_.style) { this.el_.style.width = vjs.round(this.player_.bufferedPercent() * 100, 2) + '%'; }
};


/**
 * Shows play progress
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PlayProgressBar = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.PlayProgressBar, vjs.Component);

vjs.PlayProgressBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-play-progress',
    innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
  });
};

/**
 * SeekBar Behavior includes play progress bar, and seek handle
 * Needed so it can determine seek position based on handle position/size
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.SeekHandle = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.SeekHandle, vjs.Component);

vjs.SeekHandle.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-seek-handle',
    innerHTML: '<span class="vjs-control-text">00:00</span>'
  });
};

/**
 * Control the volume
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeControl = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.VolumeControl, vjs.Component);

vjs.VolumeControl.prototype.options_ = {
  children: {
    'volumeBar': {}
  }
};

vjs.VolumeControl.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-volume-control vjs-control'
  });
};

/**
 * Contains volume level
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeBar = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.VolumeBar, vjs.Slider);

vjs.VolumeBar.prototype.options_ = {
  children: {
    'volumeLevel': {},
    'volumeHandle': {}
  },
  'barName': 'volumeLevel',
  'handleName': 'volumeHandle'
};

vjs.VolumeBar.prototype.playerEvent = 'volumechange';

vjs.VolumeBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-volume-bar'
  });
};

vjs.VolumeBar.prototype.onMouseMove = function(event) {
  this.player_.volume(this.calculateDistance(event));
};

vjs.VolumeBar.prototype.getPercent = function(){
   return this.player_.volume();
};

vjs.VolumeBar.prototype.stepForward = function(){
  this.player_.volume(this.player_.volume() + 0.1);
};

vjs.VolumeBar.prototype.stepBack = function(){
  this.player_.volume(this.player_.volume() - 0.1);
};

/**
 * Shows volume level
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeLevel = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.VolumeLevel, vjs.Component);

vjs.VolumeLevel.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-volume-level',
    innerHTML: '<span class="vjs-control-text"></span>'
  });
};

/**
 * Change volume level
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeHandle = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.VolumeHandle, vjs.Component);

vjs.VolumeHandle.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-volume-handle',
    innerHTML: '<span class="vjs-control-text"></span>'
    // tabindex: 0,
    // role: 'slider', 'aria-valuenow': 0, 'aria-valuemin': 0, 'aria-valuemax': 100
  });
};

/**
 * Mute the audio
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.MuteToggle = function(player, options){
  goog.base(this, player, options);

  player.on('volumechange', vjs.bind(this, this.update));
};
goog.inherits(vjs.MuteToggle, vjs.Button);

vjs.MuteToggle.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-mute-control vjs-control',
    innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
  });
};

vjs.MuteToggle.prototype.onClick = function(){
  this.player_.muted( this.player_.muted() ? false : true );
};

vjs.MuteToggle.prototype.update = function(){
  var vol = this.player_.volume(),
      level = 3;

  if (vol === 0 || this.player_.muted()) {
    level = 0;
  } else if (vol < 0.33) {
    level = 1;
  } else if (vol < 0.67) {
    level = 2;
  }

  /* TODO improve muted icon classes */
  for (var i = 0; i < 4; i++) {
    vjs.removeClass(this.el_, 'vjs-vol-'+i);
  }
  vjs.addClass(this.el_, 'vjs-vol-'+level);
};

/* Poster Image
================================================================================ */
/**
 * Poster image. Shows before the video plays.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PosterImage = function(player, options){
  goog.base(this, player, options);

  if (!player.poster()) {
    this.hide();
  }

  player.on('play', vjs.bind(this, this.hide));
};
goog.inherits(vjs.PosterImage, vjs.Button);

vjs.PosterImage.prototype.createEl = function(){
  var el = vjs.createEl('img', {
    className: 'vjs-poster',

    // Don't want poster to be tabbable.
    tabIndex: -1
  });

  // src throws errors if no poster was defined.
  if (this.player_.poster()) {
    el.src = this.player_.poster();
  }
  return el;
};

vjs.PosterImage.prototype.onClick = function(){
  this.player_.play();
};

/* Menu
================================================================================ */
/**
 * The base for text track and settings menu buttons.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Menu = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.Menu, vjs.Component);

vjs.Menu.prototype.addItem = function(component){
  this.addChild(component);
  component.on('click', vjs.bind(this, function(){
    this.unlockShowing();
  }));
};

vjs.Menu.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'ul', {
    className: 'vjs-menu'
  });
};

/**
 * Menu item
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.MenuItem = function(player, options){
  goog.base(this, player, options);

  if (options['selected']) {
    this.addClass('vjs-selected');
  }
};
goog.inherits(vjs.MenuItem, vjs.Button);

vjs.MenuItem.prototype.createEl = function(type, props){
  return goog.base(this, 'createEl', 'li', vjs.merge({
    className: 'vjs-menu-item',
    innerHTML: this.options_['label']
  }, props));
};

vjs.MenuItem.prototype.onClick = function(){
  this.selected(true);
};

vjs.MenuItem.prototype.selected = function(selected){
  if (selected) {
    this.addClass('vjs-selected');
  } else {
    this.removeClass('vjs-selected');
  }
};
/**
 * @fileoverview Media Technology Controller - Base class for media playback technologies
 */

goog.provide('vjs.MediaTechController');

goog.require('vjs.Component');

/**
 * Base class for media (HTML5 Video, Flash) controllers
 * @param {vjs.Player|Object} player  Central player instance
 * @param {Object=} options Options object
 * @constructor
 */
vjs.MediaTechController = function(player, options, ready){
  goog.base(this, player, options, ready);

  // Make playback element clickable
  // this.addEvent('click', this.proxy(this.onClick));

  // player.triggerEvent('techready');
};
goog.inherits(vjs.MediaTechController, vjs.Component);

// destroy: function(){},
// createElement: function(){},

/**
 * Handle a click on the media element. By default will play the media.
 */
vjs.MediaTechController.prototype.onClick = function(){
  if (this.player_.controls()) {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }
};

vjs.media = {};

/**
 * List of default API methods for any MediaTechController
 * @type {String}
 */
vjs.media.ApiMethods = 'play,pause,paused,currentTime,setCurrentTime,duration,buffered,volume,setVolume,muted,setMuted,width,height,supportsFullScreen,enterFullScreen,src,load,currentSrc,preload,setPreload,autoplay,setAutoplay,loop,setLoop,error,networkState,readyState,seeking,initialTime,startOffsetTime,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks,defaultPlaybackRate,playbackRate,mediaGroup,controller,controls,defaultMuted'.split(',');
// Create placeholder methods for each that warn when a method isn't supported by the current playback technology

function createMethod(methodName){
  return function(){
    throw new Error('The "'+methodName+'" method is not available on the playback technology\'s API');
  };
}

for (var i = vjs.media.ApiMethods.length - 1; i >= 0; i--) {
  var methodName = vjs.media.ApiMethods[i];
  vjs.MediaTechController.prototype[vjs.media.ApiMethods[i]] = createMethod(methodName);
}
/**
 * @fileoverview HTML5 Media Controller - Wrapper for HTML5 Media API
 */

goog.provide('vjs.Html5');

goog.require('vjs.MediaTechController');

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
vjs.Html5 = function(player, options, ready){
  goog.base(this, player, options, ready);

  var source = options['source'];

  // If the element source is already set, we may have missed the loadstart event, and want to trigger it.
  // We don't want to set the source again and interrupt playback.
  if (source && this.el_.currentSrc == source.src) {
    player.trigger('loadstart');

  // Otherwise set the source if one was provided.
  } else if (source) {
    this.el_.src = source.src;
  }

  // Chrome and Safari both have issues with autoplay.
  // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
  // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
  // This fixes both issues. Need to wait for API, so it updates displays correctly
  player.ready(function(){
    if (this.options_['autoplay'] && this.paused()) {
      this.tag.poster = null; // Chrome Fix. Fixed in Chrome v16.
      this.play();
    }
  });

  this.on('click', this.onClick);

  this.setupTriggers();

  this.triggerReady();
};
goog.inherits(vjs.Html5, vjs.MediaTechController);

vjs.Html5.prototype.dispose = function(){
  goog.base(this, 'dispose');
};

vjs.Html5.prototype.createEl = function(){
  var player = this.player_,
      // If possible, reuse original tag for HTML5 playback technology element
      el = player.tag,
      newEl;

  // Check if this browser supports moving the element into the box.
  // On the iPhone video will break if you move the element,
  // So we have to create a brand new element.
  if (!el || this.features.movingMediaElementInDOM === false) {

    // If the original tag is still there, remove it.
    if (el) {
      player.el().removeChild(el);
    }

    newEl = vjs.createElement('video', {
      id: el.id || player.id() + '_html5_api',
      className: el.className || 'vjs-tech'
    });

    el = newEl;
    vjs.insertFirst(el, player.el());
  }

  // Update specific tag settings, in case they were overridden
  var attrs = ['autoplay','preload','loop','muted'];
  for (var i = attrs.length - 1; i >= 0; i--) {
    var attr = attrs[i];
    if (player.options_[attr] !== null) {
      el[attr] = player.options_[attr];
    }
  }

  return el;
  // jenniisawesome = true;
};

// Make video events trigger player events
// May seem verbose here, but makes other APIs possible.
vjs.Html5.prototype.setupTriggers = function(){
  for (var i = vjs.Html5.Events.length - 1; i >= 0; i--) {
    vjs.on(this.el_, vjs.Html5.Events[i], vjs.bind(this.player_, this.eventHandler));
  }
};
// Triggers removed using this.off when disposed

vjs.Html5.prototype.eventHandler = function(e){
  // We'll be triggring play ourselves, thank you.
  if (e.type === 'play') return;

  this.trigger(e);

  // No need for media events to bubble up.
  e.stopPropagation();
};


vjs.Html5.prototype.play = function(){ this.el_.play(); };
vjs.Html5.prototype.pause = function(){ this.el_.pause(); };
vjs.Html5.prototype.paused = function(){ return this.el_.paused; };

vjs.Html5.prototype.currentTime = function(){ return this.el_.currentTime; };
vjs.Html5.prototype.setCurrentTime = function(seconds){
  try {
    this.el_.currentTime = seconds;
  } catch(e) {
    vjs.log(e, 'Video is not ready. (Video.js)');
    // this.warning(VideoJS.warnings.videoNotReady);
  }
};

vjs.Html5.prototype.duration = function(){ return this.el_.duration || 0; };
vjs.Html5.prototype.buffered = function(){ return this.el_.buffered; };

vjs.Html5.prototype.volume = function(){ return this.el_.volume; };
vjs.Html5.prototype.setVolume = function(percentAsDecimal){ this.el_.volume = percentAsDecimal; };
vjs.Html5.prototype.muted = function(){ return this.el_.muted; };
vjs.Html5.prototype.setMuted = function(muted){ this.el_.muted = muted; };

vjs.Html5.prototype.width = function(){ return this.el_.offsetWidth; };
vjs.Html5.prototype.height = function(){ return this.el_.offsetHeight; };

vjs.Html5.prototype.supportsFullScreen = function(){
  if (typeof this.el_.webkitEnterFullScreen == 'function') {

    // Seems to be broken in Chromium/Chrome && Safari in Leopard
    if (!navigator.userAgent.match('Chrome') && !navigator.userAgent.match('Mac OS X 10.5')) {
      return true;
    }
  }
  return false;
};

vjs.Html5.prototype.enterFullScreen = function(){
  try {
    this.el_.webkitEnterFullScreen();
  } catch (e) {
    if (e.code == 11) {
      // this.warning(VideoJS.warnings.videoNotReady);
      vjs.log('Video.js: Video not ready.');
    }
  }
};
vjs.Html5.prototype.exitFullScreen = function(){
    try {
      this.el_.webkitExitFullScreen();
    } catch (e) {
      if (e.code == 11) {
        // this.warning(VideoJS.warnings.videoNotReady);
        vjs.log('Video.js: Video not ready.');
      }
    }
};
vjs.Html5.prototype.src = function(src){ this.el_.src = src; };
vjs.Html5.prototype.load = function(){ this.el_.load(); };
vjs.Html5.prototype.currentSrc = function(){ return this.el_.currentSrc; };

vjs.Html5.prototype.preload = function(){ return this.el_.preload; };
vjs.Html5.prototype.setPreload = function(val){ this.el_.preload = val; };
vjs.Html5.prototype.autoplay = function(){ return this.el_.autoplay; };
vjs.Html5.prototype.setAutoplay = function(val){ this.el_.autoplay = val; };
vjs.Html5.prototype.loop = function(){ return this.el_.loop; };
vjs.Html5.prototype.setLoop = function(val){ this.el_.loop = val; };

vjs.Html5.prototype.error = function(){ return this.el_.error; };
  // networkState: function(){ return this.el_.networkState; },
  // readyState: function(){ return this.el_.readyState; },
vjs.Html5.prototype.seeking = function(){ return this.el_.seeking; };
  // initialTime: function(){ return this.el_.initialTime; },
  // startOffsetTime: function(){ return this.el_.startOffsetTime; },
  // played: function(){ return this.el_.played; },
  // seekable: function(){ return this.el_.seekable; },
vjs.Html5.prototype.ended = function(){ return this.el_.ended; };
  // videoTracks: function(){ return this.el_.videoTracks; },
  // audioTracks: function(){ return this.el_.audioTracks; },
  // videoWidth: function(){ return this.el_.videoWidth; },
  // videoHeight: function(){ return this.el_.videoHeight; },
  // textTracks: function(){ return this.el_.textTracks; },
  // defaultPlaybackRate: function(){ return this.el_.defaultPlaybackRate; },
  // playbackRate: function(){ return this.el_.playbackRate; },
  // mediaGroup: function(){ return this.el_.mediaGroup; },
  // controller: function(){ return this.el_.controller; },
vjs.Html5.prototype.defaultMuted = function(){ return this.el_.defaultMuted; };

/* HTML5 Support Testing ---------------------------------------------------- */

vjs.Html5.isSupported = function(){
  return !!document.createElement('video').canPlayType;
};

vjs.Html5.canPlaySource = function(srcObj){
  return !!document.createElement('video').canPlayType(srcObj.type);
  // TODO: Check Type
  // If no Type, check ext
  // Check Media Type
};

// List of all HTML5 events (various uses).
vjs.Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');


// HTML5 Feature detection and Device Fixes --------------------------------- //
vjs.Html5.prototype.features = {

  // Support for video element specific full screen. (webkitEnterFullScreen, not requestFullscreen which we use on the player div)
  // http://developer.apple.com/library/safari/#documentation/AudioVideo/Reference/HTMLVideoElementClassReference/HTMLVideoElement/HTMLVideoElement.html
  // Seems to be broken in Chromium/Chrome && Safari in Leopard
  fullscreen: (vjs.TEST_VID.webkitEnterFullScreen)
    ? ((!vjs.USER_AGENT.match('Chrome') && !vjs.USER_AGENT.match('Mac OS X 10.5')
      ? true
      : false))
    : false,

  // In iOS, if you move a video element in the DOM, it breaks video playback.
  movingMediaElementInDOM: !vjs.IS_IOS

};

// Android
if (vjs.IS_ANDROID) {

  // Override Android 2.2 and less canPlayType method which is broken
  if (vjs.ANDROID_VERSION < 3) {
    document.createElement('video').constructor.prototype.canPlayType = function(type){
      return (type && type.toLowerCase().indexOf('video/mp4') != -1) ? 'maybe' : '';
    };
  }
}

/**
 * @fileoverview VideoJS-SWF - Custom Flash Player with HTML5-ish API
 * https://github.com/zencoder/video-js-swf
 * Not using setupTriggers. Using global onEvent func to distribute events
 */

goog.provide('vjs.Flash');

goog.require('vjs.MediaTechController');

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
vjs.Flash = function(player, options, ready){
  goog.base(this, player, options, ready);

  var source = options['source'],

      // Which element to embed in
      parentEl = options['parentEl'],

      // Create a temporary element to be replaced by swf object
      placeHolder = this.el_ = vjs.createEl('div', { id: player.id() + '_temp_flash' }),

      // Generate ID for swf object
      objId = player.id()+'_flash_api',

      // Store player options in local var for optimization
      // TODO: switch to using player methods instead of options
      // e.g. player.autoplay();
      playerOptions = player.options_,

      // Merge default flashvars with ones passed in to init
      flashVars = vjs.merge({

        // SWF Callback Functions
        'readyFunction': 'videojs.Flash.onReady',
        'eventProxyFunction': 'videojs.Flash.onEvent',
        'errorEventProxyFunction': 'videojs.Flash.onError',

        // Player Settings
        'autoplay': playerOptions.autoplay,
        'preload': playerOptions.preload,
        'loop': playerOptions.loop,
        'muted': playerOptions.muted

      }, options['flashVars']),

      // Merge default parames with ones passed in
      params = vjs.merge({
        'wmode': 'opaque', // Opaque is needed to overlay controls, but can affect playback performance
        'bgcolor': '#000000' // Using bgcolor prevents a white flash when the object is loading
      }, options['params']),

      // Merge default attributes with ones passed in
      attributes = vjs.merge({
        'id': objId,
        'name': objId, // Both ID and Name needed or swf to identifty itself
        'class': 'vjs-tech'
      }, options['attributes'])
  ;

  // If source was supplied pass as a flash var.
  if (source) {
    flashVars['src'] = encodeURIComponent(vjs.getAbsoluteURL(source.src));
  }

  // Add placeholder to player div
  vjs.insertFirst(placeHolder, parentEl);

  // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
  // This allows resetting the playhead when we catch the reload
  if (options['startTime']) {
    this.ready(function(){
      this.load();
      this.play();
      this.currentTime(options['startTime']);
    });
  }

  // Flash iFrame Mode
  // In web browsers there are multiple instances where changing the parent element or visibility of a plugin causes the plugin to reload.
  // - Firefox just about always. https://bugzilla.mozilla.org/show_bug.cgi?id=90268 (might be fixed by version 13)
  // - Webkit when hiding the plugin
  // - Webkit and Firefox when using requestFullScreen on a parent element
  // Loading the flash plugin into a dynamically generated iFrame gets around most of these issues.
  // Issues that remain include hiding the element and requestFullScreen in Firefox specifically

  // There's on particularly annoying issue with this method which is that Firefox throws a security error on an offsite Flash object loaded into a dynamically created iFrame.
  // Even though the iframe was inserted into a page on the web, Firefox + Flash considers it a local app trying to access an internet file.
  // I tried mulitple ways of setting the iframe src attribute but couldn't find a src that worked well. Tried a real/fake source, in/out of domain.
  // Also tried a method from stackoverflow that caused a security error in all browsers. http://stackoverflow.com/questions/2486901/how-to-set-document-domain-for-a-dynamically-generated-iframe
  // In the end the solution I found to work was setting the iframe window.location.href right before doing a document.write of the Flash object.
  // The only downside of this it seems to trigger another http request to the original page (no matter what's put in the href). Not sure why that is.

  // NOTE (2012-01-29): Cannot get Firefox to load the remote hosted SWF into a dynamically created iFrame
  // Firefox 9 throws a security error, unleess you call location.href right before doc.write.
  //    Not sure why that even works, but it causes the browser to look like it's continuously trying to load the page.
  // Firefox 3.6 keeps calling the iframe onload function anytime I write to it, causing an endless loop.

  if (options['iFrameMode'] === true && !vjs.IS_FIREFOX) {

    // Create iFrame with vjs-tech class so it's 100% width/height
    var iFrm = vjs.createEl('iframe', {
      'id': objId + '_iframe',
      'name': objId + '_iframe',
      'className': 'vjs-tech',
      'scrolling': 'no',
      'marginWidth': 0,
      'marginHeight': 0,
      'frameBorder': 0
    });

    // Update ready function names in flash vars for iframe window
    flashVars['readyFunction'] = 'ready';
    flashVars['eventProxyFunction'] = 'events';
    flashVars['errorEventProxyFunction'] = 'errors';

    // Tried multiple methods to get this to work in all browsers

    // Tried embedding the flash object in the page first, and then adding a place holder to the iframe, then replacing the placeholder with the page object.
    // The goal here was to try to load the swf URL in the parent page first and hope that got around the firefox security error
    // var newObj = vjs.Flash.embed(options['swf'], placeHolder, flashVars, params, attributes);
    // (in onload)
    //  var temp = vjs.createEl('a', { id:'asdf', innerHTML: 'asdf' } );
    //  iDoc.body.appendChild(temp);

    // Tried embedding the flash object through javascript in the iframe source.
    // This works in webkit but still triggers the firefox security error
    // iFrm.src = 'javascript: document.write('"+vjs.Flash.getEmbedCode(options['swf'], flashVars, params, attributes)+"');";

    // Tried an actual local iframe just to make sure that works, but it kills the easiness of the CDN version if you require the user to host an iframe
    // We should add an option to host the iframe locally though, because it could help a lot of issues.
    // iFrm.src = "iframe.html";

    // Wait until iFrame has loaded to write into it.
    vjs.on(iFrm, 'load', vjs.bind(this, function(){

      var iDoc,
          iWin = iFrm.contentWindow;

      // The one working method I found was to use the iframe's document.write() to create the swf object
      // This got around the security issue in all browsers except firefox.
      // I did find a hack where if I call the iframe's window.location.href='', it would get around the security error
      // However, the main page would look like it was loading indefinitely (URL bar loading spinner would never stop)
      // Plus Firefox 3.6 didn't work no matter what I tried.
      // if (vjs.USER_AGENT.match('Firefox')) {
      //   iWin.location.href = '';
      // }

      // Get the iFrame's document depending on what the browser supports
      iDoc = iFrm.contentDocument ? iFrm.contentDocument : iFrm.contentWindow.document;

      // Tried ensuring both document domains were the same, but they already were, so that wasn't the issue.
      // Even tried adding /. that was mentioned in a browser security writeup
      // document.domain = document.domain+'/.';
      // iDoc.domain = document.domain+'/.';

      // Tried adding the object to the iframe doc's innerHTML. Security error in all browsers.
      // iDoc.body.innerHTML = swfObjectHTML;

      // Tried appending the object to the iframe doc's body. Security error in all browsers.
      // iDoc.body.appendChild(swfObject);

      // Using document.write actually got around the security error that browsers were throwing.
      // Again, it's a dynamically generated (same domain) iframe, loading an external Flash swf.
      // Not sure why that's a security issue, but apparently it is.
      iDoc.write(vjs.Flash.getEmbedCode(options['swf'], flashVars, params, attributes));

      // Setting variables on the window needs to come after the doc write because otherwise they can get reset in some browsers
      // So far no issues with swf ready event being called before it's set on the window.
      iWin['player'] = this.player_;

      // Create swf ready function for iFrame window
      iWin['ready'] = vjs.bind(this.player_, function(currSwf){
        var el = iDoc.getElementById(currSwf),
            player = this,
            tech = player.tech;

        // Update reference to playback technology element
        tech.el_ = el;

        // Now that the element is ready, make a click on the swf play the video
        vjs.on(el, 'click', tech.bind(tech.onClick));

        // Make sure swf is actually ready. Sometimes the API isn't actually yet.
        vjs.Flash.checkReady(tech);
      });

      // Create event listener for all swf events
      iWin['events'] = vjs.bind(this.player_, function(swfID, eventName){
        var player = this;
        if (player && player.techName === 'flash') {
          player.trigger(eventName);
        }
      });

      // Create error listener for all swf errors
      iWin['errors'] = vjs.bind(this.player_, function(swfID, eventName){
        vjs.log('Flash Error', eventName);
      });

    }));

    // Replace placeholder with iFrame (it will load now)
    placeHolder.parentNode.replaceChild(iFrm, placeHolder);

  // If not using iFrame mode, embed as normal object
  } else {
    vjs.Flash.embed(options['swf'], placeHolder, flashVars, params, attributes);
  }

};
goog.inherits(vjs.Flash, vjs.MediaTechController);

vjs.Flash.prototype.dispose = function(){
  goog.base(this, 'dispose');
};

vjs.Flash.prototype.play = function(){
  this.el_.vjs_play();
};

vjs.Flash.prototype.pause = function(){
  this.el_.vjs_pause();
};

vjs.Flash.prototype.src = function(src){
  // Make sure source URL is abosolute.
  src = vjs.getAbsoluteURL(src);

  this.el_.vjs_src(src);

  // Currently the SWF doesn't autoplay if you load a source later.
  // e.g. Load player w/ no source, wait 2s, set src.
  if (this.player_.autoplay()) {
    var tech = this;
    setTimeout(function(){ tech.play(); }, 0);
  }
};

vjs.Flash.prototype.load = function(){
  this.el_.vjs_load();
};

vjs.Flash.prototype.poster = function(){
  this.el_.vjs_getProperty('poster');
};

vjs.Flash.prototype.buffered = function(){
  return vjs.createTimeRange(0, this.el_.vjs_getProperty('buffered'));
};

vjs.Flash.prototype.supportsFullScreen = function(){
  return false; // Flash does not allow fullscreen through javascript
};

vjs.Flash.prototype.enterFullScreen = function(){
  return false;
};


// Create setters and getters for attributes
var api = vjs.Flash.prototype,
    readWrite = 'preload,currentTime,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(','),
    readOnly = 'error,currentSrc,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks'.split(',');
    // Overridden: buffered

/**
 * @this {*}
 */
var createSetter = function(attr){
  var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
  api['set'+attrUpper] = function(val){ return this.el_.vjs_setProperty(attr, val); };
};

/**
 * @this {*}
 */
var createGetter = function(attr){
  api[attr] = function(){ return this.el_.vjs_getProperty(attr); };
};

// Create getter and setters for all read/write attributes
for (var i = 0; i < readWrite.length; i++) {
  createGetter(readWrite[i]);
  createSetter(readWrite[i]);
}

// Create getters for read-only attributes
for (var i = 0; i < readOnly.length; i++) {
  createGetter(readOnly[i]);
}

/* Flash Support Testing -------------------------------------------------------- */

vjs.Flash.isSupported = function(){
  return vjs.Flash.version()[0] >= 10;
  // return swfobject.hasFlashPlayerVersion('10');
};

vjs.Flash.canPlaySource = function(srcObj){
  if (srcObj.type in vjs.Flash.prototype.features.formats) { return 'maybe'; }
};

vjs.Flash.prototype.features = {
  formats: {
    'video/flv': 'FLV',
    'video/x-flv': 'FLV',
    'video/mp4': 'MP4',
    'video/m4v': 'MP4'
  },

  // Optional events that we can manually mimic with timers
  // currently not triggered by video-js-swf
  progressEvents: false,
  timeupdateEvents: false,

  // Resizing plugins using request fullscreen reloads the plugin
  fullscreenResize: false,

  // Resizing plugins in Firefox always reloads the plugin (e.g. full window mode)
  parentResize: !(vjs.USER_AGENT.match('Firefox'))
};

vjs.Flash['onReady'] = function(currSwf){
  var el = vjs.el(currSwf);

  // Get player from box
  // On firefox reloads, el might already have a player
  var player = el['player'] || el.parentNode['player'],
      tech = player.tech;

  // Reference player on tech element
  el['player'] = player;

  // Update reference to playback technology element
  tech.el_ = el;

  // Now that the element is ready, make a click on the swf play the video
  tech.on('click', tech.onClick);

  vjs.Flash.checkReady(tech);
};

// The SWF isn't alwasy ready when it says it is. Sometimes the API functions still need to be added to the object.
// If it's not ready, we set a timeout to check again shortly.
vjs.Flash.checkReady = function(tech){

  // Check if API property exists
  if (tech.el().vjs_getProperty) {

    // If so, tell tech it's ready
    tech.triggerReady();

  // Otherwise wait longer.
  } else {

    setTimeout(function(){
      vjs.Flash.checkReady(tech);
    }, 50);

  }
};

// Trigger events from the swf on the player
vjs.Flash['onEvent'] = function(swfID, eventName){
  // Triggering play in the play method to allow for preventDefault
  if (eventName === 'play') return;

  var player = vjs.el(swfID)['player'];
  player.trigger(eventName);
};

// Log errors from the swf
vjs.Flash['onError'] = function(swfID, err){
  var player = vjs.el(swfID)['player'];
  player.trigger('error');
  vjs.log('Flash Error', err, swfID);
};

// Flash Version Check
vjs.Flash.version = function(){
  var version = '0,0,0';

  // IE
  try {
    version = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];

  // other browsers
  } catch(e) {
    try {
      if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin){
        version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
      }
    } catch(err) {}
  }
  return version.split(',');
};

// Flash embedding method. Only used in non-iframe mode
vjs.Flash.embed = function(swf, placeHolder, flashVars, params, attributes){
  var code = vjs.Flash.getEmbedCode(swf, flashVars, params, attributes),

      // Get element by embedding code and retrieving created element
      obj = vjs.createEl('div', { innerHTML: code }).childNodes[0],

      par = placeHolder.parentNode
  ;

  placeHolder.parentNode.replaceChild(obj, placeHolder);

  // IE6 seems to have an issue where it won't initialize the swf object after injecting it.
  // This is a dumb fix
  var newObj = par.childNodes[0];
  setTimeout(function(){
    newObj.style.display = 'block';
  }, 1000);

  return obj;

};

vjs.Flash.getEmbedCode = function(swf, flashVars, params, attributes){

  var objTag = '<object type="application/x-shockwave-flash"',
      flashVarsString = '',
      paramsString = '',
      attrsString = '';

  // Convert flash vars to string
  if (flashVars) {
    vjs.eachProp(flashVars, function(key, val){
      flashVarsString += (key + '=' + val + '&amp;');
    });
  }

  // Add swf, flashVars, and other default params
  params = vjs.merge({
    'movie': swf,
    'flashvars': flashVarsString,
    'allowScriptAccess': 'always', // Required to talk to swf
    'allowNetworking': 'all' // All should be default, but having security issues.
  }, params);

  // Create param tags string
  vjs.eachProp(params, function(key, val){
    paramsString += '<param name="'+key+'" value="'+val+'" />';
  });

  attributes = vjs.merge({
    // Add swf to attributes (need both for IE and Others to work)
    'data': swf,

    // Default to 100% width/height
    'width': '100%',
    'height': '100%'

  }, attributes);

  // Create Attributes string
  vjs.eachProp(attributes, function(key, val){
    attrsString += (key + '="' + val + '" ');
  });

  return objTag + attrsString + '>' + paramsString + '</object>';
};
/**
 * @fileoverview Text Tracks
 * Text tracks are tracks of timed text events.
 * Captions - text displayed over the video for the hearing impared
 * Subtitles - text displayed over the video for those who don't understand langauge in the video
 * Chapters - text displayed in a menu allowing the user to jump to particular points (chapters) in the video
 * Descriptions (not supported yet) - audio descriptions that are read back to the user by a screen reading device
 */

goog.provide('vjs.TextTrack');

goog.require('vjs.Menu');
goog.require('vjs.MenuItem');
goog.require('vjs.Component');


// Player Additions - Functions add to the player object for easier access to tracks

/**
 * List of associated text tracks
 * @type {Array}
 * @private
 */
vjs.Player.prototype.textTracks_;

/**
 * Get an array of associated text tracks. captions, subtitles, chapters, descriptions
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
 * @return {Array}           Array of track objects
 */
vjs.Player.prototype.textTracks = function(){
  this.textTracks_ = this.textTracks_ || [];
  return this.textTracks_;
};

/**
 * Add a text track
 * In addition to the W3C settings we allow adding additional info through options.
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
 * @param {String}  kind        Captions, subtitles, chapters, descriptions, or metadata
 * @param {String=} label       Optional label
 * @param {String=} language    Optional language
 * @param {Object=} options     Additional track options, like src
 */
vjs.Player.prototype.addTextTrack = function(kind, label, language, options){
  var tracks = this.textTracks_ = this.textTracks_ || [];
  options = options || {};

  options['kind'] = kind;
  options['label'] = label;
  options['language'] = language;

  // HTML5 Spec says default to subtitles.
  // Uppercase first letter to match class names
  var Kind = vjs.capitalize(kind || 'subtitles');

  // Create correct texttrack class. CaptionsTrack, etc.
  var track = new window['videojs'][Kind + 'Track'](this, options);

  tracks.push(track);

  // If track.dflt() is set, start showing immediately
  // TODO: Add a process to deterime the best track to show for the specific kind
  // Incase there are mulitple defaulted tracks of the same kind
  // Or the user has a set preference of a specific language that should override the default
  // if (track.dflt()) {
  //   this.ready(vjs.bind(track, track.show));
  // }

  return track;
};

/**
 * Add an array of text tracks. captions, subtitles, chapters, descriptions
 * Track objects will be stored in the player.textTracks() array
 * @param {Array} trackList Array of track elements or objects (fake track elements)
 */
vjs.Player.prototype.addTextTracks = function(trackList){
  var trackObj;

  for (var i = 0; i < trackList.length; i++) {
    trackObj = trackList[i];
    this.addTextTrack(trackObj['kind'], trackObj['label'], trackObj['language'], trackObj);
  }

  return this;
};

// Show a text track
// disableSameKind: disable all other tracks of the same kind. Value should be a track kind (captions, etc.)
vjs.Player.prototype.showTextTrack = function(id, disableSameKind){
  var tracks = this.textTracks_,
      i = 0,
      j = tracks.length,
      track, showTrack, kind;

  // Find Track with same ID
  for (;i<j;i++) {
    track = tracks[i];
    if (track.id() === id) {
      track.show();
      showTrack = track;

    // Disable tracks of the same kind
    } else if (disableSameKind && track.kind() == disableSameKind && track.mode() > 0) {
      track.disable();
    }
  }

  // Get track kind from shown track or disableSameKind
  kind = (showTrack) ? showTrack.kind() : ((disableSameKind) ? disableSameKind : false);

  // Trigger trackchange event, captionstrackchange, subtitlestrackchange, etc.
  if (kind) {
    this.trigger(kind+'trackchange');
  }

  return this;
};

/**
 * Track Class
 * Contains track methods for loading, showing, parsing cues of tracks
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.TextTrack = function(player, options){
  goog.base(this, player, options);

  // Apply track info to track object
  // Options will often be a track element

  // Build ID if one doesn't exist
  this.id_ = options['id'] || ('vjs_' + options['kind'] + '_' + options['language'] + '_' + vjs.guid++);
  this.src_ = options['src'];
  // 'default' is a reserved keyword in js so we use an abbreviated version
  this.dflt_ = options['default'] || options['dflt'];
  this.title_ = options['title'];
  this.language_ = options['srclang'];
  this.label_ = options['label'];
  this.cues_ = [];
  this.activeCues_ = [];
  this.readyState_ = 0;
  this.mode_ = 0;
};
goog.inherits(vjs.TextTrack, vjs.Component);

/**
 * Track kind value. Captions, subtitles, etc.
 * @private
 */
vjs.TextTrack.prototype.kind_;

/**
 * Get the track kind value
 * @return {String}
 */
vjs.TextTrack.prototype.kind = function(){
  return this.kind_;
};

/**
 * Track src value
 * @private
 */
vjs.TextTrack.prototype.src_;

/**
 * Get the track src value
 * @return {String}
 */
vjs.TextTrack.prototype.src = function(){
  return this.src_;
};

/**
 * Track default value
 * If default is used, subtitles/captions to start showing
 * @private
 */
vjs.TextTrack.prototype.dflt_;

/**
 * Get the track default value
 * 'default' is a reserved keyword
 * @return {Boolean}
 */
vjs.TextTrack.prototype.dflt = function(){
  return this.dflt_;
};

/**
 * Track title value
 * @private
 */
vjs.TextTrack.prototype.title_;

/**
 * Get the track title value
 * @return {String}
 */
vjs.TextTrack.prototype.title = function(){
  return this.title_;
};

/**
 * Language - two letter string to represent track language, e.g. 'en' for English
 * Spec def: readonly attribute DOMString language;
 * @private
 */
vjs.TextTrack.prototype.language_;

/**
 * Get the track language value
 * @return {String}
 */
vjs.TextTrack.prototype.language = function(){
  return this.language_;
};

/**
 * Track label e.g. 'English'
 * Spec def: readonly attribute DOMString label;
 * @private
 */
vjs.TextTrack.prototype.label_;

/**
 * Get the track label value
 * @return {String}
 */
vjs.TextTrack.prototype.label = function(){
  return this.label_;
};

/**
 * All cues of the track. Cues have a startTime, endTime, text, and other properties.
 * Spec def: readonly attribute TextTrackCueList cues;
 * @private
 */
vjs.TextTrack.prototype.cues_;

/**
 * Get the track cues
 * @return {Array}
 */
vjs.TextTrack.prototype.cues = function(){
  return this.cues_;
};

/**
 * ActiveCues is all cues that are currently showing
 * Spec def: readonly attribute TextTrackCueList activeCues;
 * @private
 */
vjs.TextTrack.prototype.activeCues_;

/**
 * Get the track active cues
 * @return {Array}
 */
vjs.TextTrack.prototype.activeCues = function(){
  return this.activeCues_;
};

/**
 * ReadyState describes if the text file has been loaded
 * const unsigned short NONE = 0;
 * const unsigned short LOADING = 1;
 * const unsigned short LOADED = 2;
 * const unsigned short ERROR = 3;
 * readonly attribute unsigned short readyState;
 * @private
 */
vjs.TextTrack.prototype.readyState_;

/**
 * Get the track readyState
 * @return {Number}
 */
vjs.TextTrack.prototype.readyState = function(){
  return this.readyState_;
};

/**
 * Mode describes if the track is showing, hidden, or disabled
 * const unsigned short OFF = 0;
 * const unsigned short HIDDEN = 1; (still triggering cuechange events, but not visible)
 * const unsigned short SHOWING = 2;
 * attribute unsigned short mode;
 * @private
 */
vjs.TextTrack.prototype.mode_;

/**
 * Get the track mode
 * @return {Number}
 */
vjs.TextTrack.prototype.mode = function(){
  return this.mode_;
};

/**
 * Create basic div to hold cue text
 * @return {Element}
 */
vjs.TextTrack.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-' + this.kind_ + ' vjs-text-track'
  });
};

/**
 * Show: Mode Showing (2)
 * Indicates that the text track is active. If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
 * The user agent is maintaining a list of which cues are active, and events are being fired accordingly.
 * In addition, for text tracks whose kind is subtitles or captions, the cues are being displayed over the video as appropriate;
 * for text tracks whose kind is descriptions, the user agent is making the cues available to the user in a non-visual fashion;
 * and for text tracks whose kind is chapters, the user agent is making available to the user a mechanism by which the user can navigate to any point in the media resource by selecting a cue.
 * The showing by default state is used in conjunction with the default attribute on track elements to indicate that the text track was enabled due to that attribute.
 * This allows the user agent to override the state if a later track is discovered that is more appropriate per the user's preferences.
 */
vjs.TextTrack.prototype.show = function(){
  this.activate();

  this.mode_ = 2;

  // Show element.
  goog.base(this, 'show');
};

/**
 * Hide: Mode Hidden (1)
 * Indicates that the text track is active, but that the user agent is not actively displaying the cues.
 * If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
 * The user agent is maintaining a list of which cues are active, and events are being fired accordingly.
 */
vjs.TextTrack.prototype.hide = function(){
  // When hidden, cues are still triggered. Disable to stop triggering.
  this.activate();

  this.mode_ = 1;

  // Hide element.
  goog.base(this, 'hide');
};

/**
 * Disable: Mode Off/Disable (0)
 * Indicates that the text track is not active. Other than for the purposes of exposing the track in the DOM, the user agent is ignoring the text track.
 * No cues are active, no events are fired, and the user agent will not attempt to obtain the track's cues.
 */
vjs.TextTrack.prototype.disable = function(){
  // If showing, hide.
  if (this.mode_ == 2) { this.hide(); }

  // Stop triggering cues
  this.deactivate();

  // Switch Mode to Off
  this.mode_ = 0;
};

/**
 * Turn on cue tracking. Tracks that are showing OR hidden are active.
 */
vjs.TextTrack.prototype.activate = function(){
  // Load text file if it hasn't been yet.
  if (this.readyState_ === 0) { this.load(); }

  // Only activate if not already active.
  if (this.mode_ === 0) {
    // Update current cue on timeupdate
    // Using unique ID for bind function so other tracks don't remove listener
    this.player_.on('timeupdate', vjs.bind(this, this.update, this.id_));

    // Reset cue time on media end
    this.player_.on('ended', vjs.bind(this, this.reset, this.id_));

    // Add to display
    if (this.kind_ === 'captions' || this.kind_ === 'subtitles') {
      this.player_.getChild('textTrackDisplay').addChild(this);
    }
  }
};

/**
 * Turn off cue tracking.
 */
vjs.TextTrack.prototype.deactivate = function(){
  // Using unique ID for bind function so other tracks don't remove listener
  this.player_.off('timeupdate', vjs.bind(this, this.update, this.id_));
  this.player_.off('ended', vjs.bind(this, this.reset, this.id_));
  this.reset(); // Reset

  // Remove from display
  this.player_.getChild('textTrackDisplay').removeChild(this);
};

// A readiness state
// One of the following:
//
// Not loaded
// Indicates that the text track is known to exist (e.g. it has been declared with a track element), but its cues have not been obtained.
//
// Loading
// Indicates that the text track is loading and there have been no fatal errors encountered so far. Further cues might still be added to the track.
//
// Loaded
// Indicates that the text track has been loaded with no fatal errors. No new cues will be added to the track except if the text track corresponds to a MutableTextTrack object.
//
// Failed to load
// Indicates that the text track was enabled, but when the user agent attempted to obtain it, this failed in some way (e.g. URL could not be resolved, network error, unknown text track format). Some or all of the cues are likely missing and will not be obtained.
vjs.TextTrack.prototype.load = function(){

  // Only load if not loaded yet.
  if (this.readyState_ === 0) {
    this.readyState_ = 1;
    vjs.get(this.src_, vjs.bind(this, this.parseCues), vjs.bind(this, this.onError));
  }

};

vjs.TextTrack.prototype.onError = function(err){
  this.error = err;
  this.readyState_ = 3;
  this.trigger('error');
};

// Parse the WebVTT text format for cue times.
// TODO: Separate parser into own class so alternative timed text formats can be used. (TTML, DFXP)
vjs.TextTrack.prototype.parseCues = function(srcContent) {
  var cue, time, text,
      lines = srcContent.split('\n'),
      line = '', id;

  for (var i=1, j=lines.length; i<j; i++) {
    // Line 0 should be 'WEBVTT', so skipping i=0

    line = vjs.trim(lines[i]); // Trim whitespace and linebreaks

    if (line) { // Loop until a line with content

      // First line could be an optional cue ID
      // Check if line has the time separator
      if (line.indexOf('-->') == -1) {
        id = line;
        // Advance to next line for timing.
        line = vjs.trim(lines[++i]);
      } else {
        id = this.cues_.length;
      }

      // First line - Number
      cue = {
        id: id, // Cue Number
        index: this.cues_.length // Position in Array
      };

      // Timing line
      time = line.split(' --> ');
      cue.startTime = this.parseCueTime(time[0]);
      cue.endTime = this.parseCueTime(time[1]);

      // Additional lines - Cue Text
      text = [];

      // Loop until a blank line or end of lines
      // Assumeing trim('') returns false for blank lines
      while (lines[++i] && (line = vjs.trim(lines[i]))) {
        text.push(line);
      }

      cue.text = text.join('<br/>');

      // Add this cue
      this.cues_.push(cue);
    }
  }

  this.readyState_ = 2;
  this.trigger('loaded');
};


vjs.TextTrack.prototype.parseCueTime = function(timeText) {
  var parts = timeText.split(':'),
      time = 0,
      hours, minutes, other, seconds, ms;

  // Check if optional hours place is included
  // 00:00:00.000 vs. 00:00.000
  if (parts.length == 3) {
    hours = parts[0];
    minutes = parts[1];
    other = parts[2];
  } else {
    hours = 0;
    minutes = parts[0];
    other = parts[1];
  }

  // Break other (seconds, milliseconds, and flags) by spaces
  // TODO: Make additional cue layout settings work with flags
  other = other.split(/\s+/);
  // Remove seconds. Seconds is the first part before any spaces.
  seconds = other.splice(0,1)[0];
  // Could use either . or , for decimal
  seconds = seconds.split(/\.|,/);
  // Get milliseconds
  ms = parseFloat(seconds[1]);
  seconds = seconds[0];

  // hours => seconds
  time += parseFloat(hours) * 3600;
  // minutes => seconds
  time += parseFloat(minutes) * 60;
  // Add seconds
  time += parseFloat(seconds);
  // Add milliseconds
  if (ms) { time += ms/1000; }

  return time;
};

// Update active cues whenever timeupdate events are triggered on the player.
vjs.TextTrack.prototype.update = function(){
  if (this.cues_.length > 0) {

    // Get curent player time
    var time = this.player_.currentTime();

    // Check if the new time is outside the time box created by the the last update.
    if (this.prevChange === undefined || time < this.prevChange || this.nextChange <= time) {
      var cues = this.cues_,

          // Create a new time box for this state.
          newNextChange = this.player_.duration(), // Start at beginning of the timeline
          newPrevChange = 0, // Start at end

          reverse = false, // Set the direction of the loop through the cues. Optimized the cue check.
          newCues = [], // Store new active cues.

          // Store where in the loop the current active cues are, to provide a smart starting point for the next loop.
          firstActiveIndex, lastActiveIndex,
          cue, i; // Loop vars

      // Check if time is going forwards or backwards (scrubbing/rewinding)
      // If we know the direction we can optimize the starting position and direction of the loop through the cues array.
      if (time >= this.nextChange || this.nextChange === undefined) { // NextChange should happen
        // Forwards, so start at the index of the first active cue and loop forward
        i = (this.firstActiveIndex !== undefined) ? this.firstActiveIndex : 0;
      } else {
        // Backwards, so start at the index of the last active cue and loop backward
        reverse = true;
        i = (this.lastActiveIndex !== undefined) ? this.lastActiveIndex : cues.length - 1;
      }

      while (true) { // Loop until broken
        cue = cues[i];

        // Cue ended at this point
        if (cue.endTime <= time) {
          newPrevChange = Math.max(newPrevChange, cue.endTime);

          if (cue.active) {
            cue.active = false;
          }

          // No earlier cues should have an active start time.
          // Nevermind. Assume first cue could have a duration the same as the video.
          // In that case we need to loop all the way back to the beginning.
          // if (reverse && cue.startTime) { break; }

        // Cue hasn't started
        } else if (time < cue.startTime) {
          newNextChange = Math.min(newNextChange, cue.startTime);

          if (cue.active) {
            cue.active = false;
          }

          // No later cues should have an active start time.
          if (!reverse) { break; }

        // Cue is current
        } else {

          if (reverse) {
            // Add cue to front of array to keep in time order
            newCues.splice(0,0,cue);

            // If in reverse, the first current cue is our lastActiveCue
            if (lastActiveIndex === undefined) { lastActiveIndex = i; }
            firstActiveIndex = i;
          } else {
            // Add cue to end of array
            newCues.push(cue);

            // If forward, the first current cue is our firstActiveIndex
            if (firstActiveIndex === undefined) { firstActiveIndex = i; }
            lastActiveIndex = i;
          }

          newNextChange = Math.min(newNextChange, cue.endTime);
          newPrevChange = Math.max(newPrevChange, cue.startTime);

          cue.active = true;
        }

        if (reverse) {
          // Reverse down the array of cues, break if at first
          if (i === 0) { break; } else { i--; }
        } else {
          // Walk up the array fo cues, break if at last
          if (i === cues.length - 1) { break; } else { i++; }
        }

      }

      this.activeCues_ = newCues;
      this.nextChange = newNextChange;
      this.prevChange = newPrevChange;
      this.firstActiveIndex = firstActiveIndex;
      this.lastActiveIndex = lastActiveIndex;

      this.updateDisplay();

      this.trigger('cuechange');
    }
  }
};

// Add cue HTML to display
vjs.TextTrack.prototype.updateDisplay = function(){
  var cues = this.activeCues_,
      html = '',
      i=0,j=cues.length;

  for (;i<j;i++) {
    html += '<span class="vjs-tt-cue">'+cues[i].text+'</span>';
  }

  this.el_.innerHTML = html;
};

// Set all loop helper values back
vjs.TextTrack.prototype.reset = function(){
  this.nextChange = 0;
  this.prevChange = this.player_.duration();
  this.firstActiveIndex = 0;
  this.lastActiveIndex = 0;
};

// Create specific track types
/**
 * @constructor
 */
vjs.CaptionsTrack = function(player, options, ready){
  goog.base(this, player, options, ready);
};
goog.inherits(vjs.CaptionsTrack, vjs.TextTrack);
vjs.CaptionsTrack.prototype.kind_ = 'captions';
// Exporting here because Track creation requires the track kind
// to be available on global object. e.g. new window['videojs'][Kind + 'Track']

/**
 * @constructor
 */
vjs.SubtitlesTrack = function(player, options, ready){
  goog.base(this, player, options, ready);
};
goog.inherits(vjs.SubtitlesTrack, vjs.TextTrack);
vjs.SubtitlesTrack.prototype.kind_ = 'subtitles';

/**
 * @constructor
 */
vjs.ChaptersTrack = function(player, options, ready){
  goog.base(this, player, options, ready);
};
goog.inherits(vjs.ChaptersTrack, vjs.TextTrack);
vjs.ChaptersTrack.prototype.kind_ = 'chapters';


/* Text Track Display
============================================================================= */
// Global container for both subtitle and captions text. Simple div container.

/**
 * @constructor
 */
vjs.TextTrackDisplay = function(player, options, ready){
  goog.base(this, player, options, ready);

  // This used to be called during player init, but was causing an error
  // if a track should show by default and the display hadn't loaded yet.
  // Should probably be moved to an external track loader when we support
  // tracks that don't need a display.
  if (player.options_['tracks'] && player.options_['tracks'].length > 0) {
    this.player_.addTextTracks(player.options_['tracks']);
  }
};
goog.inherits(vjs.TextTrackDisplay, vjs.Component);

vjs.TextTrackDisplay.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-text-track-display'
  });
};


/* Text Track Menu Items
============================================================================= */
/**
 * @constructor
 */
vjs.TextTrackMenuItem = function(player, options){
  var track = this.track = options['track'];

  // Modify options for parent MenuItem class's init.
  options['label'] = track.label();
  options['selected'] = track.dflt();
  goog.base(this, player, options);

  this.player_.on(track.kind() + 'trackchange', vjs.bind(this, this.update));
};
goog.inherits(vjs.TextTrackMenuItem, vjs.MenuItem);

vjs.TextTrackMenuItem.prototype.onClick = function(){
  goog.base(this, 'onClick');
  this.player_.showTextTrack(this.track.id(), this.track.kind());
};

vjs.TextTrackMenuItem.prototype.update = function(){
  if (this.track.mode() == 2) {
    this.selected(true);
  } else {
    this.selected(false);
  }
};

/**
 * @constructor
 */
vjs.OffTextTrackMenuItem = function(player, options){
  // Create pseudo track info
  // Requires options['kind']
  options['track'] = {
    kind: function() { return options['kind']; },
    player: player,
    label: function(){ return 'Off'; },
    dflt: function(){ return false; },
    mode: function(){ return false; }
  };
  goog.base(this, player, options);
};
goog.inherits(vjs.OffTextTrackMenuItem, vjs.TextTrackMenuItem);

vjs.OffTextTrackMenuItem.prototype.onClick = function(){
  goog.base(this, 'onClick');
  this.player_.showTextTrack(this.track.id(), this.track.kind());
};

vjs.OffTextTrackMenuItem.prototype.update = function(){
  var tracks = this.player_.textTracks(),
      i=0, j=tracks.length, track,
      off = true;

  for (;i<j;i++) {
    track = tracks[i];
    if (track.kind() == this.track.kind() && track.mode() == 2) {
      off = false;
    }
  }

  if (off) {
    this.selected(true);
  } else {
    this.selected(false);
  }
};

/* Captions Button
================================================================================ */
/**
 * @constructor
 */
vjs.TextTrackButton = function(player, options){
  goog.base(this, player, options);

  this.menu = this.createMenu();

  if (this.items.length === 0) {
    this.hide();
  }
};
goog.inherits(vjs.TextTrackButton, vjs.Button);

vjs.TextTrackButton.prototype.createMenu = function(){
  var menu = new vjs.Menu(this.player_);

  // Add a title list item to the top
  menu.el().appendChild(vjs.createEl('li', {
    className: 'vjs-menu-title',
    innerHTML: vjs.capitalize(this.kind_)
  }));

  // Add an OFF menu item to turn all tracks off
  menu.addItem(new vjs.OffTextTrackMenuItem(this.player_, { 'kind': this.kind_ }));

  this.items = this.createItems();

  // Add menu items to the menu
  for (var i = 0; i < this.items.length; i++) {
    menu.addItem(this.items[i]);
  }

  // Add list to element
  this.addChild(menu);

  return menu;
};

// Create a menu item for each text track
vjs.TextTrackButton.prototype.createItems = function(){
  var items = [], track;

  for (var i = 0; i < this.player_.textTracks().length; i++) {
    track = this.player_.textTracks()[i];
    if (track.kind() === this.kind_) {
      items.push(new vjs.TextTrackMenuItem(this.player_, {
        'track': track
      }));
    }
  }

  return items;
};

vjs.TextTrackButton.prototype.buildCSSClass = function(){
  return this.className + ' vjs-menu-button ' + goog.base(this, 'buildCSSClass');
};

// Focus - Add keyboard functionality to element
vjs.TextTrackButton.prototype.onFocus = function(){
  // Show the menu, and keep showing when the menu items are in focus
  this.menu.lockShowing();
  // this.menu.el_.style.display = 'block';

  // When tabbing through, the menu should hide when focus goes from the last menu item to the next tabbed element.
  vjs.one(this.menu.el_.childNodes[this.menu.el_.childNodes.length - 1], 'blur', vjs.bind(this, function(){
    this.menu.unlockShowing();
  }));
};
// Can't turn off list display that we turned on with focus, because list would go away.
vjs.TextTrackButton.prototype.onBlur = function(){};

vjs.TextTrackButton.prototype.onClick = function(){
  // When you click the button it adds focus, which will show the menu indefinitely.
  // So we'll remove focus when the mouse leaves the button.
  // Focus is needed for tab navigation.
  this.one('mouseout', vjs.bind(this, function(){
    this.menu.unlockShowing();
    this.el_.blur();
  }));
};

/**
 * @constructor
 */
vjs.CaptionsButton = function(player, options, ready){
  goog.base(this, player, options, ready);
};
goog.inherits(vjs.CaptionsButton, vjs.TextTrackButton);
vjs.CaptionsButton.prototype.kind_ = 'captions';
vjs.CaptionsButton.prototype.buttonText = 'Captions';
vjs.CaptionsButton.prototype.className = 'vjs-captions-button';

/**
 * @constructor
 */
vjs.SubtitlesButton = function(player, options, ready){
  goog.base(this, player, options, ready);
};
goog.inherits(vjs.SubtitlesButton, vjs.TextTrackButton);
vjs.SubtitlesButton.prototype.kind_ = 'subtitles';
vjs.SubtitlesButton.prototype.buttonText = 'Subtitles';
vjs.SubtitlesButton.prototype.className = 'vjs-subtitles-button';

// Chapters act much differently than other text tracks
// Cues are navigation vs. other tracks of alternative languages
/**
 * @constructor
 */
vjs.ChaptersButton = function(player, options, ready){
  goog.base(this, player, options, ready);
};
goog.inherits(vjs.ChaptersButton, vjs.TextTrackButton);
vjs.ChaptersButton.prototype.kind_ = 'chapters';
vjs.ChaptersButton.prototype.buttonText = 'Chapters';
vjs.ChaptersButton.prototype.className = 'vjs-chapters-button';

// Create a menu item for each text track
vjs.ChaptersButton.prototype.createItems = function(){
  var items = [], track;

  for (var i = 0; i < this.player_.textTracks().length; i++) {
    track = this.player_.textTracks()[i];
    if (track.kind() === this.kind_) {
      items.push(new vjs.TextTrackMenuItem(this.player_, {
        'track': track
      }));
    }
  }

  return items;
};

vjs.ChaptersButton.prototype.createMenu = function(){
  var tracks = this.player_.textTracks(),
      i = 0,
      j = tracks.length,
      track, chaptersTrack,
      items = this.items = [];

  for (;i<j;i++) {
    track = tracks[i];
    if (track.kind() == this.kind_ && track.dflt()) {
      if (track.readyState() < 2) {
        this.chaptersTrack = track;
        track.on('loaded', vjs.bind(this, this.createMenu));
        return;
      } else {
        chaptersTrack = track;
        break;
      }
    }
  }

  var menu = this.menu = new vjs.Menu(this.player_);

  menu.el_.appendChild(vjs.createEl('li', {
    className: 'vjs-menu-title',
    innerHTML: vjs.capitalize(this.kind_)
  }));

  if (chaptersTrack) {
    var cues = chaptersTrack.cues_, cue, mi;
    i = 0;
    j = cues.length;

    for (;i<j;i++) {
      cue = cues[i];

      mi = new vjs.ChaptersTrackMenuItem(this.player_, {
        'track': chaptersTrack,
        'cue': cue
      });

      items.push(mi);

      menu.addChild(mi);
    }
  }

  // Add list to element
  this.addChild(menu);

  if (this.items.length > 0) {
    this.show();
  }

  return menu;
};


/**
 * @constructor
 */
vjs.ChaptersTrackMenuItem = function(player, options){
  var track = this.track = options['track'],
      cue = this.cue = options['cue'],
      currentTime = player.currentTime();

  // Modify options for parent MenuItem class's init.
  options['label'] = cue.text;
  options['selected'] = (cue.startTime <= currentTime && currentTime < cue.endTime);
  goog.base(this, player, options);

  track.on('cuechange', vjs.bind(this, this.update));
};
goog.inherits(vjs.ChaptersTrackMenuItem, vjs.MenuItem);

vjs.ChaptersTrackMenuItem.prototype.onClick = function(){
  goog.base(this, 'onClick');
  this.player_.currentTime(this.cue.startTime);
  this.update(this.cue.startTime);
};

vjs.ChaptersTrackMenuItem.prototype.update = function(){
  var cue = this.cue,
      currentTime = this.player_.currentTime();

  // vjs.log(currentTime, cue.startTime);
  if (cue.startTime <= currentTime && currentTime < cue.endTime) {
    this.selected(true);
  } else {
    this.selected(false);
  }
};

// Add Buttons to controlBar
vjs.merge(vjs.ControlBar.prototype.options_['children'], {
  'subtitlesButton': {},
  'captionsButton': {},
  'chaptersButton': {}
});

// vjs.Cue = vjs.Component.extend({
//   init: function(player, options){
//     goog.base(this, player, options);
//   }
// });
goog.provide('vjs.JSON');

/**
 * Javascript JSON implementation
 * (Parse Method Only)
 * https://github.com/douglascrockford/JSON-js/blob/master/json2.js
 * Only using for parse method when parsing data-setup attribute JSON.
 * @type {Object}
 */
vjs.JSON;

if (JSON && JSON.parse === 'function') {
  vjs.JSON = JSON;

} else {
  vjs.JSON = {};

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  vjs.JSON.parse = function (text, reviver) {
      var j;

      function walk(holder, key) {
          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }
      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

          j = eval('(' + text + ')');

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

      throw new SyntaxError('JSON.parse');
  };
}
/**
 * @fileoverview Functions for automatically setting up a player
 * based on the data-setup attribute of the video tag
 */

goog.provide('vjs.autoSetup');

goog.require('vjs.JSON');
goog.require('vjs.events');

// Automatically set up any tags that have a data-setup attribute
vjs.autoSetup = function(){
  var options, vid, player,
      vids = document.getElementsByTagName('video');

  // Check if any media elements exist
  if (vids && vids.length > 0) {

    for (var i=0,j=vids.length; i<j; i++) {
      vid = vids[i];

      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == 'object' instead of 'function' like expected, at least when loading the player immediately.
      if (vid && vid.getAttribute) {

        // Make sure this player hasn't already been set up.
        if (vid['player'] === undefined) {
          options = vid.getAttribute('data-setup');

          // Check if data-setup attr exists.
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {

            // Parse options JSON
            // If empty string, make it a parsable json object.
            options = vjs.JSON.parse(options || '{}');

            // Create new video.js instance.
            player = videojs(vid, options);
          }
        }

      // If getAttribute isn't defined, we need to wait for the DOM.
      } else {
        vjs.autoSetupTimeout(1);
        break;
      }
    }

  // No videos were found, so keep looping unless page is finisehd loading.
  } else if (!vjs.windowLoaded) {
    vjs.autoSetupTimeout(1);
  }
};

// Pause to let the DOM keep processing
vjs.autoSetupTimeout = function(wait){
  setTimeout(vjs.autoSetup, wait);
};

vjs.one(window, 'load', function(){
  vjs.windowLoaded = true;
});

// Run Auto-load players
vjs.autoSetup();
/**
 * @fileoverview Exports for Video.js.
 * Exports are publically available variables.
 * All other variables (including function names) will probably
 * be renamed by closure compiler.
 */

//goog.require('vjs');
//goog.require('vjs.Component');
//goog.require('vjs.Player');
//goog.require('vjs.Control');
//goog.require('vjs.Html5');
//goog.require('vjs.Flash');
//goog.require('vjs.TextTrack');
//goog.require('vjs.autoSetup');

/**
 * vjs (internal only) = videojs = _V_ (external only)
 *
 * vjs is the same as the goog var in Closure Library. It holds all variables
 * used in Video.js development. Closure compiler will rename all variables,
 * including class prototype functions, except those specifcally
 * exported (eports.js). Don't assume any function you can use in Video.js
 * development will be available on window.videojs for use with other js.
 *
 * For example, vjs.trim is an internal function and will be renamed by compiler
 * to something like 'a.b', or actually more likely 'a' removing it from
 * a parent object.
 *
 * videojs is a var that helps bridge bewteen internal and external development.
 * Avoid using it over vjs when developing the Video.js core.
 *
 * _V_ is only external. It's just cute and short(er). Like jQuery === $.
 * Also because it's nice having a different var for internal (vjs) vs.
 * external (_V_) because it makes it clearer what context we're in.
 */
//goog.exportSymbol('videojs', vjs);
//goog.exportSymbol('_V_', vjs);
//goog.exportSymbol('vjs', vjs);

//goog.exportSymbol('videojs.options', vjs.options);

//// Allow external components to use global cache
//goog.exportSymbol('videojs.cache', vjs.cache);

//goog.exportSymbol('videojs.Component', vjs.Component);
//goog.exportProperty(vjs.Component.prototype, 'dispose', vjs.Component.prototype.dispose);
//goog.exportProperty(vjs.Component.prototype, 'createEl', vjs.Component.prototype.createEl);
//goog.exportProperty(vjs.Component.prototype, 'getEl', vjs.Component.prototype.getEl);
//goog.exportProperty(vjs.Component.prototype, 'addChild', vjs.Component.prototype.addChild);
//goog.exportProperty(vjs.Component.prototype, 'getChildren', vjs.Component.prototype.getChildren);
//goog.exportProperty(vjs.Component.prototype, 'on', vjs.Component.prototype.on);
//goog.exportProperty(vjs.Component.prototype, 'off', vjs.Component.prototype.off);
//goog.exportProperty(vjs.Component.prototype, 'one', vjs.Component.prototype.one);
//goog.exportProperty(vjs.Component.prototype, 'trigger', vjs.Component.prototype.trigger);
//goog.exportProperty(vjs.Component.prototype, 'show', vjs.Component.prototype.show);
//goog.exportProperty(vjs.Component.prototype, 'hide', vjs.Component.prototype.hide);
//goog.exportProperty(vjs.Component.prototype, 'width', vjs.Component.prototype.width);
//goog.exportProperty(vjs.Component.prototype, 'height', vjs.Component.prototype.height);
//goog.exportProperty(vjs.Component.prototype, 'dimensions', vjs.Component.prototype.dimensions);

//goog.exportSymbol('videojs.Player', vjs.Player);

//goog.exportSymbol('videojs.MediaLoader', vjs.MediaLoader);
//goog.exportSymbol('videojs.PosterImage', vjs.PosterImage);
//goog.exportSymbol('videojs.LoadingSpinner', vjs.LoadingSpinner);
//goog.exportSymbol('videojs.BigPlayButton', vjs.BigPlayButton);
//goog.exportSymbol('videojs.ControlBar', vjs.ControlBar);
//goog.exportSymbol('videojs.TextTrackDisplay', vjs.TextTrackDisplay);

//goog.exportSymbol('videojs.Control', vjs.Control);
//goog.exportSymbol('videojs.ControlBar', vjs.ControlBar);
//goog.exportSymbol('videojs.Button', vjs.Button);
//goog.exportSymbol('videojs.PlayButton', vjs.PlayButton);
//goog.exportSymbol('videojs.PauseButton', vjs.PauseButton);
//goog.exportSymbol('videojs.PlayToggle', vjs.PlayToggle);
//goog.exportSymbol('videojs.FullscreenToggle', vjs.FullscreenToggle);
//goog.exportSymbol('videojs.BigPlayButton', vjs.BigPlayButton);
//goog.exportSymbol('videojs.LoadingSpinner', vjs.LoadingSpinner);
//goog.exportSymbol('videojs.CurrentTimeDisplay', vjs.CurrentTimeDisplay);
//goog.exportSymbol('videojs.DurationDisplay', vjs.DurationDisplay);
//goog.exportSymbol('videojs.TimeDivider', vjs.TimeDivider);
//goog.exportSymbol('videojs.RemainingTimeDisplay', vjs.RemainingTimeDisplay);
//goog.exportSymbol('videojs.Slider', vjs.Slider);
//goog.exportSymbol('videojs.ProgressControl', vjs.ProgressControl);
//goog.exportSymbol('videojs.SeekBar', vjs.SeekBar);
//goog.exportSymbol('videojs.LoadProgressBar', vjs.LoadProgressBar);
//goog.exportSymbol('videojs.PlayProgressBar', vjs.PlayProgressBar);
//goog.exportSymbol('videojs.SeekHandle', vjs.SeekHandle);
//goog.exportSymbol('videojs.VolumeControl', vjs.VolumeControl);
//goog.exportSymbol('videojs.VolumeBar', vjs.VolumeBar);
//goog.exportSymbol('videojs.VolumeLevel', vjs.VolumeLevel);
//goog.exportSymbol('videojs.VolumeHandle', vjs.VolumeHandle);
//goog.exportSymbol('videojs.MuteToggle', vjs.MuteToggle);
//goog.exportSymbol('videojs.PosterImage', vjs.PosterImage);
//goog.exportSymbol('videojs.Menu', vjs.Menu);
//goog.exportSymbol('videojs.MenuItem', vjs.MenuItem);

//goog.exportSymbol('videojs.SubtitlesButton', vjs.SubtitlesButton);
//goog.exportSymbol('videojs.CaptionsButton', vjs.CaptionsButton);
//goog.exportSymbol('videojs.ChaptersButton', vjs.ChaptersButton);

//goog.exportSymbol('videojs.MediaTechController', vjs.MediaTechController);

//goog.exportSymbol('videojs.Html5', vjs.Html5);
//goog.exportProperty(vjs.Html5, 'Events', vjs.Html5.Events);
//goog.exportProperty(vjs.Html5, 'isSupported', vjs.Html5.isSupported);
//goog.exportProperty(vjs.Html5, 'canPlaySource', vjs.Html5.canPlaySource);

//// Export non-standard HTML5 video API methods.
//// Standard method names already protected by default externs.
//goog.exportProperty(vjs.Html5.prototype, 'setCurrentTime', vjs.Html5.prototype.setCurrentTime);
//goog.exportProperty(vjs.Html5.prototype, 'setVolume', vjs.Html5.prototype.setVolume);
//goog.exportProperty(vjs.Html5.prototype, 'setMuted', vjs.Html5.prototype.setMuted);
//goog.exportProperty(vjs.Html5.prototype, 'setPreload', vjs.Html5.prototype.setPreload);
//goog.exportProperty(vjs.Html5.prototype, 'setAutoplay', vjs.Html5.prototype.setAutoplay);
//goog.exportProperty(vjs.Html5.prototype, 'setLoop', vjs.Html5.prototype.setLoop);

//goog.exportSymbol('videojs.Flash', vjs.Flash);
//goog.exportProperty(vjs.Flash, 'isSupported', vjs.Flash.isSupported);
//goog.exportProperty(vjs.Flash, 'canPlaySource', vjs.Flash.canPlaySource);
//goog.exportProperty(vjs.Flash, 'onReady', vjs.Flash['onReady']);

//goog.exportSymbol('videojs.TextTrack', vjs.TextTrack);
//goog.exportProperty(vjs.TextTrack.prototype, 'label', vjs.TextTrack.prototype.label);

//goog.exportSymbol('videojs.CaptionsTrack', vjs.CaptionsTrack);
//goog.exportSymbol('videojs.SubtitlesTrack', vjs.SubtitlesTrack);
//goog.exportSymbol('videojs.ChaptersTrack', vjs.ChaptersTrack);

//goog.exportSymbol('videojs.autoSetup', vjs.autoSetup);

//goog.exportSymbol('videojs.PauseAfter', vjs.PauseAfter);
videojs = vjsl
})(videojs);
_V_ = videojs;
