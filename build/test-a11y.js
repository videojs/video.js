const AccessSniff = require('access-sniff');
const path = require('path');

const testFiles = [
  path.join(__dirname, '..', 'sandbox', 'descriptions.test-a11y.html')
];

const options = {
  accessibilityLevel: 'WCAG2AA',
  reportLevels: {
    notice: false,
    warning: true,
    error: true
  },
  ignore: [
    // Ignore warning about contrast of the "vjs-no-js" fallback link
    'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgImage'
  ]
};

AccessSniff.default(testFiles, options).then(function(report) {
  AccessSniff.report(report);
}).catch(function() {

  // there were errors, which are already reported, exit with an error
  process.exit(1);
});
