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

import { themeManager } from './themes/theme-manager.js';
import { ColorsTheme } from './themes/theme.js';

export const Colors: ColorsTheme = {
  get type() {
    return themeManager.getActiveTheme().colors.type;
  },
  get Foreground() {
    return themeManager.getActiveTheme().colors.Foreground;
  },
  get Background() {
    return themeManager.getActiveTheme().colors.Background;
  },
  get LightBlue() {
    return themeManager.getActiveTheme().colors.LightBlue;
  },
  get AccentBlue() {
    return themeManager.getActiveTheme().colors.AccentBlue;
  },
  get AccentPurple() {
    return themeManager.getActiveTheme().colors.AccentPurple;
  },
  get AccentCyan() {
    return themeManager.getActiveTheme().colors.AccentCyan;
  },
  get AccentGreen() {
    return themeManager.getActiveTheme().colors.AccentGreen;
  },
  get AccentYellow() {
    return themeManager.getActiveTheme().colors.AccentYellow;
  },
  get AccentRed() {
    return themeManager.getActiveTheme().colors.AccentRed;
  },
  get Comment() {
    return themeManager.getActiveTheme().colors.Comment;
  },
  get Gray() {
    return themeManager.getActiveTheme().colors.Gray;
  },
  get BorderGray() {
    return themeManager.getActiveTheme().colors.BorderGray;
  },
  get GradientColors() {
    return themeManager.getActiveTheme().colors.GradientColors;
  },
};
