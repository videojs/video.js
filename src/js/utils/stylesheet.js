import document from 'global/document';

export let createStyleElement = function(className) {
  let style = document.createElement('style');
  style.className = className;

  return style;
};

export let setTextContent = function(el, content) {
  if (el.styleSheet) {
    el.styleSheet.cssText = content;
  } else {
    el.textContent = content;
  }
};
