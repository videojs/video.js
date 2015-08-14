import document from 'global/document';

/*
 * Helper to insert a single rule into the stylesheet
 */
let addRule = function(sheet, selector, rules, location) {
  if (sheet.insertRule) {
    // these try catches are in case a selector (like fullscreen) fails
    try {
      sheet.insertRule(selector + ' { ' + rules + ' } ', location);
    } catch (e) {}
  } else {
    try {
      sheet.addRule(selector, rules, location);
    } catch (e) {}
  }
};

/*
 * Helper to remove a single rule from a stylesheet
 */
let deleteRule = function(sheet, location) {
  if (sheet.deleteRule) {
    sheet.deleteRule(location);
  } else {
    sheet.removeRule(location);
  }
};

/**
 * Add a stylesheet rule to the document (may be better practice, however,
 * to dynamically change classes, so style information can be kept in
 * genuine stylesheets (and avoid adding extra elements to the DOM))
 * Note that an array is needed for declarations and rules since ECMAScript does
 * not afford a predictable object iteration order and since CSS is 
 * order-dependent (i.e., it is cascading); those without need of
 * cascading rules could build a more accessor-friendly object-based API.
 * @param {Array} rules Accepts an array of JSON-encoded declarations
 * @example
addStylesheetRules([
  ['h2', // Also accepts a second argument as an array of arrays instead
    ['color', 'red'],
    ['background-color', 'green', true] // 'true' for !important rules 
  ], 
  ['.myClass', 
    ['background-color', 'yellow']
  ]
]);

 * Modified from https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule
 */
export let addCssRules = function addStylesheetRules (styleSheet, rules) {
  for (let i = 0, rl = rules.length; i < rl; i++) {
    let j = 1, rule = rules[i], selector = rules[i][0], propStr = '';
    // If the second argument of a rule is an array of arrays, correct our variables.
    if (Object.prototype.toString.call(rule[1][0]) === '[object Array]') {
      rule = rule[1];
      j = 0;
    }

    for (let pl = rule.length; j < pl; j++) {
      let prop = rule[j];
      propStr += prop[0] + ':' + prop[1] + (prop[2] ? ' !important' : '') + ';\n';
    }

    // Insert CSS Rule
    addRule(styleSheet, selector, propStr, styleSheet.cssRules.length);
  }
};

export let getStyleElement = function(className) {
  let style = document.createElement('style');
  style.className = className;

  return style;
};

export let clearStylesheet = function(sheet) {
  let i = sheet.cssRules.length;
  while (i--) {
    deleteRule(sheet, i);    
  }
};
