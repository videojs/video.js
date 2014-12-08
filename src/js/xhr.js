/**
 * Simple http request for retrieving external files (e.g. text tracks)
 *
 * ##### Example
 *
 *     // using url string
 *     videojs.xhr('http://example.com/myfile.vtt', function(error, response, responseBody){});
 *
 *     // or options block
 *     videojs.xhr({
 *       uri: 'http://example.com/myfile.vtt',
 *       method: 'GET',
 *       responseType: 'text'
 *     }, function(error, response, responseBody){
 *       if (error) {
 *         // log the error
 *       } else {
 *         // successful, do something with the response
 *       }
 *     });
 *
 *
 * API is modeled after the Raynos/xhr, which we hope to use after
 * getting browserify implemented.
 * https://github.com/Raynos/xhr/blob/master/index.js
 *
 * @param  {Object|String}  options   Options block or URL string
 * @param  {Function}       callback  The callback function
 * @returns {Object}                  The request
 */
vjs.xhr = function(options, callback){
  var XHR, request, urlInfo, winLoc, fileUrl, crossOrigin, abortTimeout, successHandler, errorHandler;

  // If options is a string it's the url
  if (typeof options === 'string') {
    options = {
      uri: options
    };
  }

  // Merge with default options
  videojs.util.mergeOptions({
    method: 'GET',
    timeout: 45 * 1000
  }, options);

  callback = callback || function(){};

  successHandler = function(){
    window.clearTimeout(abortTimeout);
    callback(null, request, request.response || request.responseText);
  };

  errorHandler = function(err){
    window.clearTimeout(abortTimeout);

    if (!err || typeof err === 'string') {
      err = new Error(err);
    }

    callback(err, request);
  };

  XHR = window.XMLHttpRequest;

  if (typeof XHR === 'undefined') {
    // Shim XMLHttpRequest for older IEs
    XHR = function () {
      try { return new window.ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch (e) {}
      try { return new window.ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch (f) {}
      try { return new window.ActiveXObject('Msxml2.XMLHTTP'); } catch (g) {}
      throw new Error('This browser does not support XMLHttpRequest.');
    };
  }

  request = new XHR();
  // Store a reference to the url on the request instance
  request.uri = options.uri;

  urlInfo = vjs.parseUrl(options.uri);
  winLoc = window.location;
  // Check if url is for another domain/origin
  // IE8 doesn't know location.origin, so we won't rely on it here
  crossOrigin = (urlInfo.protocol + urlInfo.host) !== (winLoc.protocol + winLoc.host);

  // XDomainRequest -- Use for IE if XMLHTTPRequest2 isn't available
  // 'withCredentials' is only available in XMLHTTPRequest2
  // Also XDomainRequest has a lot of gotchas, so only use if cross domain
  if (crossOrigin && window.XDomainRequest && !('withCredentials' in request)) {
    request = new window.XDomainRequest();
    request.onload = successHandler;
    request.onerror = errorHandler;
    // These blank handlers need to be set to fix ie9
    // http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
    request.onprogress = function(){};
    request.ontimeout = function(){};

  // XMLHTTPRequest
  } else {
    fileUrl = (urlInfo.protocol == 'file:' || winLoc.protocol == 'file:');

    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.timedout) {
          return errorHandler('timeout');
        }

        if (request.status === 200 || fileUrl && request.status === 0) {
          successHandler();
        } else {
          errorHandler();
        }
      }
    };

    if (options.timeout) {
      abortTimeout = window.setTimeout(function() {
        if (request.readyState !== 4) {
          request.timedout = true;
          request.abort();
        }
      }, options.timeout);
    }
  }

  // open the connection
  try {
    // Third arg is async, or ignored by XDomainRequest
    request.open(options.method || 'GET', options.uri, true);
  } catch(err) {
    return errorHandler(err);
  }

  // withCredentials only supported by XMLHttpRequest2
  if(options.withCredentials) {
    request.withCredentials = true;
  }

  if (options.responseType) {
    request.responseType = options.responseType;
  }

  // send the request
  try {
    request.send();
  } catch(err) {
    return errorHandler(err);
  }

  return request;
};
