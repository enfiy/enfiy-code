/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */

import {
  allowEditorTypeInSandbox,
  checkHasEditorType,
  type EditorType,
} from '@enfiy/core';

export interface EditorDisplay {
  name: string;
  type: EditorType | 'not_set';
  disabled: boolean;
}

export const EDITOR_DISPLAY_NAMES: Record<EditorType, string> = {
  zed: 'Zed',
  vscode: 'VS Code',
  windsurf: 'Windsurf',
  cursor: 'Cursor',
  vim: 'Vim',
};

class EditorSettingsManager {
  private readonly availableEditors: EditorDisplay[];

  constructor() {
    const editorTypes: EditorType[] = [
      'zed',
      'vscode',
      'windsurf',
      'cursor',
      'vim',
    ];
    this.availableEditors = [
      {
        name: 'None',
        type: 'not_set',
        disabled: false,
      },
      ...editorTypes.map((type) => {
        const hasEditor = checkHasEditorType(type);
        const isAllowedInSandbox = allowEditorTypeInSandbox(type);

        let labelSuffix = !isAllowedInSandbox
          ? ' (Not available in sandbox)'
          : '';
        labelSuffix = !hasEditor ? ' (Not installed)' : labelSuffix;

        return {
          name: EDITOR_DISPLAY_NAMES[type] + labelSuffix,
          type,
          disabled: !hasEditor || !isAllowedInSandbox,
        };
      }),
    ];
  }

  getAvailableEditorDisplays(): EditorDisplay[] {
    return this.availableEditors;
  }
}

export const editorSettingsManager = new EditorSettingsManager();
