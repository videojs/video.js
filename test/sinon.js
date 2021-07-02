/* eslint-disable no-undef */

const s = document.createElement('script');

// on IE11, load the last supported sinon version
if (/(?:MSIE|Trident\/7.0)/.test(navigator.userAgent)) {
  s.src = 'https://unpkg.com/sinon@9.2.4/pkg/sinon-no-sourcemaps.js';
} else {
  s.src = '/test/base/node_modules/sinon/pkg/sinon.js';
}

document.write(s.outerHTML);
