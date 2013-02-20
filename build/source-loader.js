(function(window){

  var projectRoot = window.projectRoot || '';

  window.loadScript = function(url, callback) {
    // adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.src = url;

    // then bind the event to the callback function
    // there are several events for cross browser compatibility
    script.onreadystatechange = callback;
    script.onload = callback;

    // fire the loading
    head.appendChild(script);
  }

  window.loadScript(projectRoot + 'src/js/dependency-map.js', function(){
    loadScript(projectRoot + 'build/simple-deps.js', function(){});
  });

})(window);

// Ditching this file for now because we loading scripts in order
// gets complicated when you load them dynamically, becuase
// they become asynchrounus.
// Loading simple-deps.js diretly allows us to just use document.write
// If we go this far in the future we might consider requirejs more
// but for now still trying to avoid the overhead of it
