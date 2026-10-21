#!/usr/bin/env node

/**
 * Measure SPF bundle size
 *
 * Usage: pnpm size # Measure the HLS engine entry (@videojs/spf/hls) pnpm size:all # Measure all exports (all.ts)
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const measureAll = process.argv.includes('--all');
const measureEngine = process.argv.includes('--hls');

let entry, label, bundlePath;

if (measureAll) {
  entry = 'all.ts';
  label = 'All Exports';
  bundlePath = './dist/all.js';
} else if (measureEngine) {
  entry = 'hls.ts';
  label = 'HLS Engine';
  bundlePath = './dist/index.js';
} else {
  entry = 'index.ts';
  label = 'Public API';
  bundlePath = './dist/index.js';
}

console.log(`\n📦 Measuring ${label} bundle size...\n`);

// Temporarily modify the Vite+ config to use the correct pack entry and enable minification
const configPath = './vite.config.ts';
const originalConfig = readFileSync(configPath, 'utf8');

const tempConfig = `import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/${entry}'],
    platform: 'browser',
    format: 'es',
    sourcemap: false,
    clean: true,
    minify: true,
    dts: false,
  },
});
`;

try {
  // Write temporary config
  writeFileSync(configPath, tempConfig);

  // Build
  console.log('Building...');
  execSync('pnpm build', { stdio: 'inherit' });

  // Measure sizes
  const content = readFileSync(bundlePath);
  const gzipped = gzipSync(content);

  const minifiedSize = content.length;
  const gzippedSize = gzipped.length;

  // Format sizes
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;

    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  // Calculate percentage of 20KB target
  const targetKB = 20;
  const percentOfTarget = ((gzippedSize / 1024 / targetKB) * 100).toFixed(1);

  // Display results
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Bundle Size Report - ${label}`);
  console.log('='.repeat(50));
  console.log(`Minified:            ${formatSize(minifiedSize)}`);
  console.log(`Minified + Gzipped:  ${formatSize(gzippedSize)}`);
  console.log('─'.repeat(50));
  console.log(`Target:              ${targetKB} KB (minified + gzipped)`);
  console.log(`Used:                ${percentOfTarget}%`);
  console.log(`Remaining:           ${formatSize(targetKB * 1024 - gzippedSize)}`);
  console.log(`${'='.repeat(50)}\n`);

  // Status indicator
  if (gzippedSize / 1024 > targetKB) {
    console.log('⚠️  WARNING: Bundle exceeds target size!');
  } else if (gzippedSize / 1024 > targetKB * 0.8) {
    console.log('⚡ Getting close to target size');
  } else {
    console.log('✅ Well within target size');
  }

  console.log();
} finally {
  // Restore original config
  writeFileSync(configPath, originalConfig);
  console.log('Restored Vite+ pack config\n');
}
