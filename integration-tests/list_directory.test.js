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

import { test } from 'node:test';
import { strict as assert } from 'assert';
import { TestRig } from './test-helper.js';

test('should be able to list a directory', async (t) => {
  const rig = new TestRig();
  rig.setup(t.name);
  rig.createFile('file1.txt', 'file 1 content');
  rig.mkdir('subdir');
  rig.sync();

  const prompt = `Can you list the files in the current directory`;
  const result = await rig.run(prompt);

  assert.ok(result.includes('file1.txt'));
  assert.ok(result.includes('subdir'));
});
