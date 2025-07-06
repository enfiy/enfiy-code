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

test('should be able to search the web', async (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `what planet do we live on`;
  const result = await rig.run(prompt);

  assert.ok(result.toLowerCase().includes('earth'));
});
