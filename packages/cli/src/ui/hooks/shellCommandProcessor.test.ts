/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { useShellCommandProcessor } from './shellCommandProcessor.js';
import { Config, EnfiyClient } from '@enfiy/core';
import * as fs from 'fs';
import EventEmitter from 'events';

// Mock dependencies
vi.mock('child_process');
vi.mock('fs');
vi.mock('os', () => ({
  default: {
    platform: () => 'linux',
    tmpdir: () => '/tmp',
  },
  platform: () => 'linux',
  tmpdir: () => '/tmp',
}));
vi.mock('@enfiy/core');
vi.mock('../utils/textUtils.js', () => ({
  isBinary: vi.fn(),
}));

interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

describe('useShellCommandProcessor', () => {
  let spawnEmitter: MockChildProcess;
  let addItemToHistoryMock: Mock;
  let setPendingHistoryItemMock: Mock;
  let onExecMock: Mock;
  let onDebugMessageMock: Mock;
  let configMock: Config;
  let enfiyClientMock: EnfiyClient;

  beforeEach(async () => {
    const { spawn } = await import('child_process');
    const emitter = new EventEmitter() as MockChildProcess;
    emitter.stdout = new EventEmitter();
    emitter.stderr = new EventEmitter();
    spawnEmitter = emitter;
    (spawn as Mock).mockReturnValue(spawnEmitter);

    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('');
    vi.spyOn(fs, 'unlinkSync').mockReturnValue(undefined);

    addItemToHistoryMock = vi.fn();
    setPendingHistoryItemMock = vi.fn();
    onExecMock = vi.fn();
    onDebugMessageMock = vi.fn();

    configMock = {
      getTargetDir: () => '/test/dir',
    } as unknown as Config;

    enfiyClientMock = {
      addHistory: vi.fn(),
    } as unknown as EnfiyClient;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderProcessorHook = () =>
    renderHook(() =>
      useShellCommandProcessor(
        addItemToHistoryMock,
        setPendingHistoryItemMock,
        onExecMock,
        onDebugMessageMock,
        configMock,
        enfiyClientMock,
      ),
    );

  it('should execute a command and update history on success', async () => {
    const { result } = renderProcessorHook();
    const abortController = new AbortController();

    act(() => {
      result.current.handleShellCommand('ls -l', abortController.signal);
    });

    expect(onExecMock).toHaveBeenCalledTimes(1);
    const execPromise = onExecMock.mock.calls[0][0];

    // Simulate stdout
    act(() => {
      spawnEmitter.stdout.emit('data', Buffer.from('file1.txt\nfile2.txt'));
    });

    // Simulate process exit
    act(() => {
      spawnEmitter.emit('exit', 0, null);
    });

    await act(async () => {
      await execPromise;
    });

    expect(addItemToHistoryMock).toHaveBeenCalledTimes(2);
    expect(addItemToHistoryMock.mock.calls[1][0]).toEqual({
      type: 'info',
      text: 'file1.txt\nfile2.txt',
    });
    expect(enfiyClientMock.addHistory).toHaveBeenCalledTimes(1);
  });

  it('should handle binary output', async () => {
    const { result } = renderProcessorHook();
    const abortController = new AbortController();
    const { isBinary } = await import('../utils/textUtils.js');
    (isBinary as Mock).mockReturnValue(true);

    act(() => {
      result.current.handleShellCommand(
        'cat myimage.png',
        abortController.signal,
      );
    });

    expect(onExecMock).toHaveBeenCalledTimes(1);
    const execPromise = onExecMock.mock.calls[0][0];

    act(() => {
      spawnEmitter.stdout.emit('data', Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    });

    act(() => {
      spawnEmitter.emit('exit', 0, null);
    });

    await act(async () => {
      await execPromise;
    });

    expect(addItemToHistoryMock).toHaveBeenCalledTimes(2);
    expect(addItemToHistoryMock.mock.calls[1][0]).toEqual({
      type: 'info',
      text: '[Command produced binary output, which is not shown.]',
    });
  });

  it('should handle command failure', async () => {
    const { result } = renderProcessorHook();
    const abortController = new AbortController();

    act(() => {
      result.current.handleShellCommand(
        'a-bad-command',
        abortController.signal,
      );
    });

    const execPromise = onExecMock.mock.calls[0][0];

    act(() => {
      spawnEmitter.stderr.emit('data', Buffer.from('command not found'));
    });

    act(() => {
      spawnEmitter.emit('exit', 127, null);
    });

    await act(async () => {
      await execPromise;
    });

    expect(addItemToHistoryMock).toHaveBeenCalledTimes(2);
    expect(addItemToHistoryMock.mock.calls[1][0]).toEqual({
      type: 'error',
      text: 'Command exited with code 127.\ncommand not found',
    });
  });
});
