/* eslint-disable no-console */
const pa11y = require('pa11y');
const path = require('path');

const testFiles = [
  path.join(__dirname, '..', 'sandbox', 'descriptions.test-a11y.html')
];

const options = {
  standard: 'WCAG2AA',
  includeWarnings: true,
  includeNotices: false,
  ignore: [
    // Ignore warning about contrast of the "vjs-no-js" fallback link
    'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgImage'
  ]
};

Promise.all(testFiles.map((file) => pa11y(`file://${file}`, options))).
  then((results) => {
    let errorCount = 0;

    results.forEach((result) => {
      console.log(`\nTesting ${result.pageUrl}\n`);

      if (!result.issues.length) {
        console.log('  no issues found');
        return;
      }

      result.issues.forEach((issue) => {
        errorCount += issue.type === 'error' ? 1 : 0;
        console.log(`  [${issue.type}] ${issue.code}`);
        console.log(`    ${issue.message}`);
        console.log(`    ${issue.selector}`);
      });
    });

    if (errorCount) {
      console.log(`\n${errorCount} accessibility errors\n`);
      process.exit(1);
    }

    console.log('\nAccessibility tests passed\n');
  }).
  catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
