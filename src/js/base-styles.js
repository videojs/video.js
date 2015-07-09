/**
 * @file base-styles.js
 *
 * This code injects the required base styles in the head of the document.
 */
import window from 'global/window';
import document from 'global/document';

if (window.VIDEOJS_NO_BASE_THEME) return;

const styles = '{{GENERATED_STYLES}}';

if (styles === '{{GENERATED'+'_STYLES}}');

const styleNode = document.createElement('style');
styleNode.innerHTML = styles;

document.head.insertBefore(styleNode, document.head.firstChild);
