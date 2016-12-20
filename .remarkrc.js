var remarkrc = {
  settings: {
    bullet: '*',
    fence: '`',
    strong: '*',
    emphasis: '_',
    listItemIndent: 1,
    incrementListMarker: false
  },
  plugins: {
    'toc': {
      tight: true
    },
  }
};
var args = process.argv;

// only lint in non-output mode
if (args.indexOf('-o') === -1 && args.indexOf('--output') === -1) {
  remarkrc['validate-links'] = {};
  remarkrc.plugins.lint = {
    'blockquote-indentation': ['error', 2],
    'checkbox-character-style': ['warn'],
    'checkbox-content-indent': ['error'],
    'code-block-style': ['error', 'fenced'],
    'definition-case': ['off'],
    'definition-spacing': ['error'],
    'emphasis-marker': ['error', '_'],
    'fenced-code-flag': ['error'],
    'fenced-code-marker': ['error', '`'],
    'file-extension': ['error'],
    'final-definition': ['error'],
    'final-newline': ['off'],
    'first-heading-level': ['warn', 1],
    'hard-break-spaces': ['off'],
    'heading-increment': ['error'],
    'heading-style': ['error', 'atx'],
    'link-title-style': ['warn', '"'],
    'list-item-bullet-indent': ['error'],
    'list-item-content-indent': ['warn'],
    'list-item-indent': ['error', 'space'],
    'list-item-spacing': ['off'],
    'maximum-heading-length': ['off'],
    'maximum-line-length': ['off'],
    'no-auto-link-without-protocol': ['error'],
    'no-blockquote-without-caret': ['error'],
    'no-consecutive-blank-lines': ['error'],
    'no-duplicate-definitions': ['error'],
    'no-duplicate-headings-in-section': ['error'],
    'no-duplicate-headings': ['off'],
    'no-emphasis-as-heading': ['error'],
    'no-file-name-articles': ['off'],
    'no-file-name-consecutive-dashes': ['off'],
    'no-file-name-irregular-characters': ['warn', '\\.a-zA-Z0-9-_'],
    'no-file-name-mixed-case': ['error'],
    'no-file-name-outer-dashes': ['error'],
    'no-heading-content-indent': ['error'],
    'no-heading-indent': ['error'],
    'no-heading-punctuation': ['off'],
    'no-html': ['off'],
    'no-inline-padding': ['error'],
    'no-literal-urls': ['off'],
    'no-missing-blank-lines': ['off'],
    'no-multiple-toplevel-headings': ['error'],
    'no-reference-like-url': ['error'],
    'no-shell-dollars': ['error'],
    'no-shortcut-reference-iamge': ['off'],
    'no-shortcut-reference-link': ['off'],
    'no-table-indentation': ['error'],
    'no-tabs': ['error'],
    'no-undefined-references': ['error'],
    'no-unused-definitions': ['error'],
    'ordered-list-marker-style': ['error', '.'],
    'ordered-list-marker-value': ['error', 'one'],
    'rule-style': ['error', '***'],
    'strong-marker': ['error', '*'],
    'table-cell-padding': ['warn', 'padded'],
    'table-cell-alignment': ['warn'],
    'table-pipes': ['warn'],
    'unordered-list-marker-style': ['warn', '*']
  };
}

module.exports = remarkrc;
