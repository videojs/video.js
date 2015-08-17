import document from 'global/document';

export default function getStyleElement (className) {
  let style = document.createElement('style');
  style.className = className;

  return style;
};
