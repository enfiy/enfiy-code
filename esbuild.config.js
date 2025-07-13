/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
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
    drop: ['console', 'debugger'],
    // Enable more aggressive optimization
    ...(isProduction ? { mangleProps: /^_/ } : {}),
    plugins: [
      {
        name: 'enfiy-core-resolver',
        setup(build) {
          build.onResolve({ filter: /^@enfiy\/core$/ }, (args) => {
            return { path: path.resolve(__dirname, 'packages/core/index.ts') };
          });
        },
      },
    ],
    define: {
      'process.env.CLI_VERSION': JSON.stringify(pkg.version),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    banner: {
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url); globalThis.__filename = require('url').fileURLToPath(import.meta.url); globalThis.__dirname = require('path').dirname(globalThis.__filename);`,
    },
    metafile: true,
    logLevel: 'warning',
    splitting: false, // Keep single file for CLI optimization
    target: 'node18',
    keepNames: !isProduction,
    legalComments: isProduction ? 'none' : 'inline',
  })
  .then((result) => {
    if (result.metafile) {
      const analysis = esbuild.analyzeMetafileSync(result.metafile);
      
      if (isProduction) {
        console.log('Bundle analysis:', analysis);
      }
      
      // Bundle size monitoring - JS files only
      const outputFiles = Object.keys(result.metafile.outputs);
      let totalSize = 0;
      
      outputFiles.forEach(file => {
        const fileInfo = result.metafile.outputs[file];
        
        // Only count JS files, not source maps
        if (file.endsWith('.js') && !file.includes('.map')) {
          totalSize += fileInfo.bytes;
          const sizeInMB = (fileInfo.bytes / 1024 / 1024).toFixed(2);
          console.log(`  ${file.replace('bundle/', '')}: ${sizeInMB}MB`);
        }
      });
      
      const totalSizeInMB = (totalSize / 1024 / 1024).toFixed(2);
      console.log(`Bundle size (JS only): ${totalSizeInMB}MB`);
      
      // Size warnings - adjusted for CLI tools
      if (totalSize > 2 * 1024 * 1024) { // 2MB threshold for CLI
        console.warn('⚠️  Bundle size is larger than 2MB');
        if (totalSize > 4 * 1024 * 1024) { // 4MB critical threshold
          console.warn('❌ Bundle size is critically large (>4MB)');
        }
      } else {
        console.log('✅ Bundle size is optimized for CLI tool');
      }
    }
  })
  .catch(() => process.exit(1));
