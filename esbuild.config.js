/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Modifications Copyright 2025 The Enfiy Community Contributors
 *
 * This file has been modified from its original version by contributors
 * to the Enfiy Community project.
 */

import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require(path.resolve(__dirname, 'package.json'));

const isProduction = process.env.NODE_ENV === 'production';

esbuild
  .build({
    entryPoints: ['packages/cli/index.ts'],
    bundle: true,
    outfile: 'bundle/enfiy.js',
    platform: 'node',
    format: 'esm',
    minify: isProduction,
    sourcemap: !isProduction,
    treeShaking: true,
    // More aggressive tree shaking in development too
    ignoreAnnotations: false,
    // Reduce bundle size even in development
    drop: isProduction ? ['console', 'debugger'] : ['debugger'],
    external: [
      '@enfiy/core', 
      'chalk', 
      '@opentelemetry/semantic-conventions',
      // Large dependencies that should remain external in all builds
      'react-devtools-core',
      'highlight.js',
      'lowlight',
      'update-notifier',
      // Heavy mapping tables and Unicode data
      'tr46',
      'whatwg-url',
      // Reduce React bundle in development
      ...(!isProduction ? ['react-reconciler'] : []),
      // Node.js built-ins
      'fs', 'path', 'url', 'util', 'os', 'crypto', 'events', 'stream',
      'child_process', 'readline', 'tty', 'net', 'http', 'https'
    ],
    define: {
      'process.env.CLI_VERSION': JSON.stringify(pkg.version),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    banner: {
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url); globalThis.__filename = require('url').fileURLToPath(import.meta.url); globalThis.__dirname = require('path').dirname(globalThis.__filename);`,
    },
    metafile: true,
    logLevel: isProduction ? 'warning' : 'info',
    splitting: false, // Disable code splitting for CLI
    target: 'node18',
    keepNames: !isProduction,
    legalComments: isProduction ? 'none' : 'inline',
  })
  .then((result) => {
    if (result.metafile && isProduction) {
      console.log('Bundle analysis:', esbuild.analyzeMetafileSync(result.metafile));
    }
  })
  .catch(() => process.exit(1));
