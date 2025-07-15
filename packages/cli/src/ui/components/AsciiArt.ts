/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import chalk from 'chalk';

// Orange-only ENFIY CODE logo with ASCII code icon
export const shortAsciiLogo =
  '\n\n' +
  chalk.hex('#f97316')(
    '███████╗███╗   ██╗███████╗██╗██╗   ██╗     ██████╗ ██████╗ ██████╗ ███████╗',
  ) +
  '\n' +
  chalk.hex('#fb923c')(
    '██╔════╝████╗  ██║██╔════╝██║╚██╗ ██╔╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝',
  ) +
  '\n' +
  chalk.hex('#fdba74')(
    '█████╗  ██╔██╗ ██║█████╗  ██║ ╚████╔╝     ██║     ██║   ██║██║  ██║█████╗  ',
  ) +
  '\n' +
  chalk.hex('#fed7aa')(
    '██╔══╝  ██║╚██╗██║██╔══╝  ██║  ╚██╔╝      ██║     ██║   ██║██║  ██║██╔══╝  ',
  ) +
  '\n' +
  chalk.hex('#ffedd5')(
    '███████╗██║ ╚████║██║     ██║   ██║       ╚██████╗╚██████╔╝██████╔╝███████╗',
  ) +
  '\n' +
  chalk.hex('#fff7ed')(
    '╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝   ╚═╝        ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝',
  ) +
  '\n';

export const longAsciiLogo = shortAsciiLogo;
