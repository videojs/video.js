(function(){

  var simpleDeps = {};

  simpleDeps.addDep = function(dep, depsMap, sourcelist) {
    if (sourcelist.indexOf(dep) === -1) {
      if (depsMap[dep]) {
        depsMap[dep].forEach(function(val){
          simpleDeps.addDep(val, depsMap, sourcelist);
        });
      }
      sourcelist.push(dep);
    }
  }

  simpleDeps.generateSourceList = function(depsMap, options){
    // Load config from file string
    // Only works in a node env
    if (typeof depsMap === 'string') {
      depsMap = simpleDeps.getMapConfig(depsMap, options);
    }

    options = options || {};
    var sourcelist = [];

    // Source Directory. Allows for simplifying source paths
    // in deps map.
    // The Video.js deps will have depsBase = 'src/js/'
    // You can still includes files in a sibling dir
    // e.g. '../../lib/lib.js'
    var baseDir = options.baseDir || '';
    var loadNow = options.loadNow || false;

    for (dep in depsMap) {
      simpleDeps.addDep(dep, depsMap, sourcelist);
    }

    // Adust root and source dir of each file
    for (var i = 0; i < sourcelist.length; i++) {
      sourcelist[i] = baseDir + sourcelist[i];
    }

    if (loadNow) {
      for (var i = 0; i < sourcelist.length; i++) {
        document.write("<script src='" + sourcelist[i] + "'><\/script>");
      };

      // var prevCallback = function(){ console.log('asdf') };
      // for (var i = sourcelist.length - 1; i >= 0; i--){
      //   prevCallback = (function(src, callback){
      //     return function(){
      //       window.loadScript(src, callback);
      //     };
      //   })(sourcelist[i], prevCallback);
      // }
      // prevCallback();
    }

    return sourcelist;
  };

  simpleDeps.getMapConfig = function(filepath){
    // Nodejs libs.
    var fs = require('fs');

    var contents = fs.readFileSync(String(filepath)).toString();
    eval(contents);
    if (typeof deps === 'undefined') {
      throw new Error('No map defined in ' + filepath);
    }

    return deps;
  };

  // Provide as a node module.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = simpleDeps;
    }
    exports.simpleDeps = simpleDeps;
  }

  // If a dependency map exists in the window scope, load it
  if (typeof deps !== 'undefined' && typeof window !== 'undefined') {
    var scripts, src, match, base;

    // Get base directory of scripts
    if (typeof depsBaseDir === 'undefined') {
      // Assume it's in the same dir as the directory map
      scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        src = scripts[i].src;
        match = src.match(/(.*)dependencies.js/);
        if (match && match[1]) {
          depsBaseDir = match[1];
          break;
        }
      };
    }

    simpleDeps.generateSourceList(deps, {
      baseDir: depsBaseDir,
      loadNow: true
    });
  }

})();
