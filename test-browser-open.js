#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-env node */

// Test browser opening functionality
import open from 'open';
import { spawn } from 'child_process';

const testUrl = 'https://google.com';

async function testBrowserOpen() {
  console.log('🧪 Testing browser opening capabilities...');
  console.log('');
  
  console.log('1. Testing with "open" package...');
  try {
    await open(testUrl);
    console.log('✅ open package worked');
  } catch (error) {
    console.log('❌ open package failed:', error.message);
  }
  
  console.log('');
  console.log('2. Testing with PowerShell (WSL)...');
  try {
    const result = spawn('powershell.exe', ['Start-Process', `'${testUrl}'`], { stdio: 'inherit' });
    result.on('error', (err) => {
      console.log('❌ PowerShell failed:', err.message);
    });
    result.on('close', (code) => {
      if (code === 0) {
        console.log('✅ PowerShell worked');
      } else {
        console.log('❌ PowerShell failed with code:', code);
      }
    });
  } catch (error) {
    console.log('❌ PowerShell command failed:', error.message);
  }
  
  console.log('');
  console.log('Please check if any browser opened with Google.com');
}

testBrowserOpen().catch(console.error);