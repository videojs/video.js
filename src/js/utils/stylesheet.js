import document from 'global/document';

export const createStyleElement = function(className) {
  const style = document.createElement('style');

  style.className = className;

  return style;
};

export const setTextContent = function(el, content) {
  if (el.styleSheet) {
    el.styleSheet.cssText = content;
  } else {
    el.textContent = content;
  }
};
