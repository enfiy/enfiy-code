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

test('should be able to run a shell command', async (t) => {
  const rig = new TestRig();
  rig.setup(t.name);
  rig.createFile('blah.txt', 'some content');

  const prompt = `Can you use ls to list the contexts of the current folder`;
  const result = await rig.run(prompt);

  assert.ok(result.includes('blah.txt'));
});
