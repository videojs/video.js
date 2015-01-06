/**
* This code injects the required base styles in the head of the document.
*/

(function prependStylesToHead(styles) {
  var styleNode = document.createElement('style');
  styleNode.innerHTML = styles;
  document.head.insertBefore(styleNode, document.head.firstChild);
})('{{GENERATED_STYLES}}');
