/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Theme, type ColorsTheme } from './theme.js';

export const orangeTheme: ColorsTheme = {
  type: 'dark',
  Background: '#1E1E2E',
  Foreground: '#fb923c',
  LightBlue: '#fb923c',
  AccentBlue: '#fb923c',
  AccentPurple: '#fb923c',
  AccentCyan: '#fb923c',
  AccentGreen: '#fb923c',
  AccentYellow: '#fb923c',
  AccentRed: '#fb923c',
  Comment: '#fb923c',
  Gray: '#fb923c',
  BorderGray: '#fb923c',
  GradientColors: ['#fb923c', '#f97316', '#fdba74'],
};

export const DefaultOrange: Theme = new Theme(
  'Orange',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: orangeTheme.Background,
      color: orangeTheme.Foreground,
    },
    'hljs-keyword': {
      color: orangeTheme.AccentBlue,
    },
    'hljs-literal': {
      color: orangeTheme.AccentBlue,
    },
    'hljs-symbol': {
      color: orangeTheme.AccentBlue,
    },
    'hljs-name': {
      color: orangeTheme.AccentBlue,
    },
    'hljs-link': {
      color: orangeTheme.AccentBlue,
      textDecoration: 'underline',
    },
    'hljs-built_in': {
      color: orangeTheme.AccentCyan,
    },
    'hljs-type': {
      color: orangeTheme.AccentCyan,
    },
    'hljs-number': {
      color: orangeTheme.AccentGreen,
    },
    'hljs-class': {
      color: orangeTheme.AccentGreen,
    },
    'hljs-string': {
      color: orangeTheme.AccentYellow,
    },
    'hljs-meta-string': {
      color: orangeTheme.AccentYellow,
    },
    'hljs-regexp': {
      color: orangeTheme.AccentRed,
    },
    'hljs-template-tag': {
      color: orangeTheme.AccentRed,
    },
    'hljs-subst': {
      color: orangeTheme.Foreground,
    },
    'hljs-function': {
      color: orangeTheme.Foreground,
    },
    'hljs-title': {
      color: orangeTheme.Foreground,
    },
    'hljs-params': {
      color: orangeTheme.Foreground,
    },
    'hljs-formula': {
      color: orangeTheme.Foreground,
    },
    'hljs-comment': {
      color: orangeTheme.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: orangeTheme.Comment,
      fontStyle: 'italic',
    },
    'hljs-doctag': {
      color: orangeTheme.Comment,
    },
    'hljs-meta': {
      color: orangeTheme.Gray,
    },
    'hljs-meta-keyword': {
      color: orangeTheme.Gray,
    },
    'hljs-tag': {
      color: orangeTheme.Gray,
    },
    'hljs-variable': {
      color: orangeTheme.AccentPurple,
    },
    'hljs-template-variable': {
      color: orangeTheme.AccentPurple,
    },
    'hljs-attr': {
      color: orangeTheme.LightBlue,
    },
    'hljs-attribute': {
      color: orangeTheme.LightBlue,
    },
    'hljs-builtin-name': {
      color: orangeTheme.LightBlue,
    },
    'hljs-section': {
      color: orangeTheme.AccentYellow,
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-bullet': {
      color: orangeTheme.AccentYellow,
    },
    'hljs-selector-tag': {
      color: orangeTheme.AccentYellow,
    },
    'hljs-selector-id': {
      color: orangeTheme.AccentYellow,
    },
    'hljs-selector-class': {
      color: orangeTheme.AccentYellow,
    },
    'hljs-selector-attr': {
      color: orangeTheme.AccentYellow,
    },
    'hljs-selector-pseudo': {
      color: orangeTheme.AccentYellow,
    },
    'hljs-addition': {
      backgroundColor: '#fb923c20',
      display: 'inline-block',
      width: '100%',
    },
    'hljs-deletion': {
      backgroundColor: '#fb923c40',
      display: 'inline-block',
      width: '100%',
    },
  },
  orangeTheme,
);