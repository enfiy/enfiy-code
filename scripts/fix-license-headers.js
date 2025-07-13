#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

// Google LLC license header (for original Gemini CLI files)
const GOOGLE_LICENSE_HEADER = `/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
`;

// h.esaki license header (for new files)
const HESAKI_LICENSE_HEADER = `/**
 * @license
 * Copyright 2025 h.esaki
 * SPDX-License-Identifier: Apache-2.0
 */

`;

// Files that should have h.esaki license (new files created by h.esaki)
const HESAKI_LICENSE_FILES = [
  'packages/core/src/utils/debugLogger.ts',
  'scripts/bundle-analyzer.js',
];

// Common license patterns to remove
const DUPLICATE_PATTERNS = [
  /\/\*\s*\* Modifications Copyright 2025 The Enfiy Community Contributors[\s\S]*?\*\//g,
  /\/\*\s*Modifications Copyright 2025 The Enfiy Community Contributors[\s\S]*?\*\//g
];

function findSourceFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, dist, coverage, etc.
      if (!['node_modules', 'dist', 'coverage', '.git', 'build'].includes(entry.name)) {
        files.push(...findSourceFiles(fullPath));
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function shouldUseHEsakiLicense(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  return HESAKI_LICENSE_FILES.some(pattern => relativePath.includes(pattern));
}

function fixLicenseHeader(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let shebang = '';

  if (content.startsWith('#!')) {
    const lines = content.split('\n');
    shebang = lines.shift() + '\n';
    content = lines.join('\n');
  }
  
  // Remove all existing license headers and duplicate patterns
  let cleanContent = content;
  
  // Remove existing license headers
  cleanContent = cleanContent.replace(/^\/\*\*\s*\* @license[\s\S]*?\*\//m, '');
  
  // Remove duplicate modification notices
  for (const pattern of DUPLICATE_PATTERNS) {
    cleanContent = cleanContent.replace(pattern, '');
  }
  
  // Remove multiple blank lines at the start
  cleanContent = cleanContent.replace(/^\s*\n+/, '');
  
  // Determine which license header to use
  const useHEsakiLicense = shouldUseHEsakiLicense(filePath);
  const licenseHeader = useHEsakiLicense ? HESAKI_LICENSE_HEADER : GOOGLE_LICENSE_HEADER;
  
  // Add the appropriate license header  
  const finalContent = shebang + licenseHeader + cleanContent;
  
  fs.writeFileSync(filePath, finalContent);
  
  console.log(`Fixed: ${filePath} (${useHEsakiLicense ? 'h.esaki' : 'Google+Enfiy'} license)`);
}

function main() {
  console.log('Fixing license headers...');
  
  const projectRoot = process.cwd();
  const sourceFiles = findSourceFiles(projectRoot);
  
  let fixed = 0;
  
  for (const file of sourceFiles) {
    try {
      fixLicenseHeader(file);
      fixed++;
    } catch (error) {
      console.error(`Error fixing ${file}:`, error.message);
    }
  }
  
  console.log(`\nFixed ${fixed} files`);
  console.log('License header fix complete!');
}

main();