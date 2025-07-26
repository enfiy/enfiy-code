/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
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
    // Always drop console statements for cleaner output
    drop: ['console', 'debugger'],
    // More aggressive optimization settings
    minifyWhitespace: true,
    minifyIdentifiers: isProduction,
    minifySyntax: true,
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
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development',
      ),
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
    external: [
      'react-devtools-core',
      // OpenTelemetry packages (heavy but in dependencies - bundle them)
      // Commenting out to bundle these as they're in dependencies
      // '@opentelemetry/api-logs',
      // '@opentelemetry/otlp-exporter-base', 
      // '@opentelemetry/resources',
      // '@opentelemetry/sdk-logs',
      // '@opentelemetry/sdk-metrics',
      // '@opentelemetry/sdk-trace-node',
      // '@opentelemetry/semantic-conventions',
      
      // Only keep truly optional/heavy external dependencies
      '@opentelemetry/api',
      '@opentelemetry/exporter-logs-otlp-grpc',
      '@opentelemetry/exporter-metrics-otlp-grpc', 
      '@opentelemetry/exporter-trace-otlp-grpc',
      '@opentelemetry/instrumentation-http',
      '@opentelemetry/sdk-node',
      
      // UI related dependencies - keep external for now
      'ink',
      'react', 
      'react/jsx-runtime',
      'ink-select-input',
      'read-package-up',
      'open',
      'ink-spinner',
      
      // Large AI SDKs - keep external but they're in dependencies
      // Commenting out to bundle core functionality
      // '@google/genai',
      // 'openai',
      
      // Heavy utilities that aren't critical - keep external
      'lowlight',
      'highlight.js',
      // Bundle these for Windows compatibility:
      // 'gaxios', 
      // 'undici', 
      'google-auth-library',
      // 'simple-git', // Bundle this for Windows compatibility
      // 'html-to-text', // Bundle this for Windows compatibility
      'update-notifier',
      
      // Bundle all critical CLI dependencies that are in package.json dependencies
      // Removed: shell-quote, chalk, zod, mime-types, etc.
    ],
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

      outputFiles.forEach((file) => {
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
      if (totalSize > 2 * 1024 * 1024) {
        // 2MB threshold for CLI
        console.warn('WARNING: Bundle size is larger than 2MB');
        if (totalSize > 4 * 1024 * 1024) {
          // 4MB critical threshold
          console.warn('ERROR: Bundle size is critically large (>4MB)');
        }
      } else {
        console.log('Bundle size is optimized for CLI tool');
      }
    }
  })
  .catch(() => process.exit(1));
