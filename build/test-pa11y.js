const pa11y = require('pa11y');
const path = require('path');

const testFile = path.join(__dirname, '..', 'sandbox', 'descriptions.test-a11y.html');
const config = {
  ignore: [
    // Ignore warning about contrast of the "vjs-no-js" fallback link
    'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgImage'
  ],
  includeWarnings: true,
  levelCapWhenNeedsReview: 'warning',
  standard: 'WCAG2AA'
};

pa11y(testFile, config).then((results) => {
  process.stdout.write(JSON.stringify(results, null, 2));
});