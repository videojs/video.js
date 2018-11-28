#!/usr/bin/env node

const generateExample = require('./generate-example.js').default;

generateExample({skipBuild: true});
