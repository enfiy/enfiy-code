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
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require(path.resolve(__dirname, 'package.json'));

const isProduction = process.env.NODE_ENV === 'production';

// Dynamically determine external dependencies for CLI packaging
function getExternalDependencies() {
  const cliPkgPath = path.resolve(__dirname, 'packages/cli/package.json');
  const cliPkg = JSON.parse(fs.readFileSync(cliPkgPath, 'utf8'));

  // Dependencies that should remain external for CLI distribution
  const externalPatterns = [
    // Node.js built-ins are always external
    'node:*',
    'fs',
    'path',
    'os',
    'crypto',
    'util',
    'stream',
    'events',

    // UI Framework - too heavy for bundling, require installation
    'ink',
    'react',
    'react/jsx-runtime',
    'ink-select-input',
    'ink-spinner',
    'react-devtools-core',

    // Optional heavy dependencies that users can install separately
    '@opentelemetry/exporter-logs-otlp-grpc',
    '@opentelemetry/exporter-metrics-otlp-grpc',
    '@opentelemetry/exporter-trace-otlp-grpc',
    '@opentelemetry/instrumentation-http',
    '@opentelemetry/sdk-node',

    // System-specific utilities
    'open',
    'update-notifier',
  ];

  return externalPatterns;
}

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
    ignoreAnnotations: false,
    drop: isProduction ? ['console', 'debugger'] : [],
    minifyWhitespace: true,
    minifyIdentifiers: isProduction,
    minifySyntax: true,
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
    splitting: false,
    target: 'node18',
    keepNames: !isProduction,
    legalComments: isProduction ? 'none' : 'inline',
    external: getExternalDependencies(),
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
      console.log(`Bundle size: ${totalSizeInMB}MB`);

      // Reasonable size limits for CLI tools
      if (totalSize > 10 * 1024 * 1024) {
        // 10MB critical threshold
        console.error('ERROR: Bundle size is critically large (>10MB)');
        process.exit(1);
      } else if (totalSize > 5 * 1024 * 1024) {
        // 5MB warning threshold
        console.warn('WARNING: Bundle size is large (>5MB)');
      } else {
        console.log('Bundle size is acceptable for CLI tool');
      }
    }
  })
  .catch(() => process.exit(1));
