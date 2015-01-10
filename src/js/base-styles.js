/**
* This code injects the required base styles in the head of the document.
*/

(function prependStylesToHead(styles) {
  if (window.VIDEOJS_NO_BASE_THEME) return;
  var styleNode = document.createElement('style');
  styleNode.innerHTML = styles;
  document.head.insertBefore(styleNode, document.head.firstChild);
})('{{GENERATED_STYLES}}');
