#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Bundle size tracking
const BUNDLE_SIZE_HISTORY = path.join(projectRoot, 'bundle-size-history.json');
const MAX_BUNDLE_SIZE = 5 * 1024 * 1024; // 5MB threshold for CLI tools (increased for cross-platform compatibility)

function analyzeBundleSize() {
  const bundlePath = path.join(projectRoot, 'bundle');

  if (!fs.existsSync(bundlePath)) {
    console.error('Bundle directory not found. Run build first.');
    process.exit(1);
  }

  const files = fs.readdirSync(bundlePath);
  const jsFiles = files.filter((f) => f.endsWith('.js') && !f.includes('.map'));

  if (jsFiles.length === 0) {
    console.error('No JS files found in bundle directory.');
    process.exit(1);
  }

  let totalSize = 0;
  const filesSizes = {};

  jsFiles.forEach((file) => {
    const filePath = path.join(bundlePath, file);
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);

    filesSizes[file] = {
      size: stats.size,
      sizeFormatted: `${sizeInMB}MB`,
    };

    totalSize += stats.size;

    console.log(`[File] ${file}: ${sizeInMB}MB`);
  });

  const totalSizeInMB = (totalSize / 1024 / 1024).toFixed(2);
  console.log(`\n[Summary] Total bundle size: ${totalSizeInMB}MB`);

  // Load history
  let history = [];
  if (fs.existsSync(BUNDLE_SIZE_HISTORY)) {
    try {
      history = JSON.parse(fs.readFileSync(BUNDLE_SIZE_HISTORY, 'utf8'));
    } catch {
      console.warn('Failed to load bundle size history');
    }
  }

  // Add current measurement
  const currentEntry = {
    timestamp: new Date().toISOString(),
    totalSize,
    totalSizeFormatted: `${totalSizeInMB}MB`,
    files: filesSizes,
  };

  history.push(currentEntry);

  // Keep only last 50 entries
  if (history.length > 50) {
    history = history.slice(-50);
  }

  // Save history
  fs.writeFileSync(BUNDLE_SIZE_HISTORY, JSON.stringify(history, null, 2));

  // Compare with previous build
  if (history.length > 1) {
    const previousEntry = history[history.length - 2];
    const sizeDiff = totalSize - previousEntry.totalSize;
    const diffMB = (sizeDiff / 1024 / 1024).toFixed(2);

    if (sizeDiff > 0) {
      console.log(`[Growth] Size increased by ${diffMB}MB from previous build`);
    } else if (sizeDiff < 0) {
      console.log(
        `[Reduction] Size decreased by ${Math.abs(diffMB)}MB from previous build`,
      );
    } else {
      console.log(`[Stable] Size unchanged from previous build`);
    }
  }

  // Size warnings
  if (totalSize > MAX_BUNDLE_SIZE) {
    console.warn(
      `\n[WARNING] Bundle size (${totalSizeInMB}MB) exceeds recommended limit (${(MAX_BUNDLE_SIZE / 1024 / 1024).toFixed(1)}MB)`,
    );

    console.log('\n[Suggestions] Optimization suggestions:');
    console.log('   - Enable more aggressive tree shaking');
    console.log('   - Move heavy dependencies to external');
    console.log('   - Implement dynamic imports for large components');
    console.log('   - Consider code splitting');

    if (totalSize > MAX_BUNDLE_SIZE * 2) {
      console.error(
        `\n[ERROR] Bundle size is critically large! Consider major refactoring.`,
      );
      process.exit(1);
    }
  } else {
    console.log(`\n[OK] Bundle size is within acceptable limits`);
  }

  // Performance recommendations
  if (totalSize > 1 * 1024 * 1024) {
    console.log('\n[Performance] Performance recommendations:');
    console.log('   - Consider lazy loading for non-critical components');
    console.log('   - Implement component-level code splitting');
    console.log('   - Use dynamic imports for features');
  }

  return {
    totalSize,
    totalSizeFormatted: `${totalSizeInMB}MB`,
    files: filesSizes,
    withinLimits: totalSize <= MAX_BUNDLE_SIZE,
  };
}

// Run analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = analyzeBundleSize();
    console.log('\nAnalysis complete!');

    if (!result.withinLimits) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

export { analyzeBundleSize };
