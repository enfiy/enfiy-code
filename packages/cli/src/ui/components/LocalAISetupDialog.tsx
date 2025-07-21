/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { ProviderType } from '@enfiy/core';
// import { t } from '../utils/i18n.js'; // Currently unused
import {
  checkOllamaInstallation,
  getOllamaInstallInstructions,
  startOllamaService,
  installOllamaModel,
  type OllamaInstallationStatus,
  type ModelInstallProgress,
} from '../../utils/ollamaSetup.js';
import {
  checkHuggingFaceSetup,
  _getPythonSetupInstructions,
  _getDockerSetupInstructions,
  _validateHuggingFaceAPIKey,
  getRecommendedHFModels,
  type HuggingFaceSetupStatus,
} from '../../utils/huggingfaceSetup.js';

interface LocalAISetupDialogProps {
  provider: ProviderType.OLLAMA | ProviderType.LMSTUDIO;
  onComplete: (config: LocalAIConfig) => void;
  onCancel: () => void;
  terminalWidth: number;
}

interface LocalAIConfig {
  type: ProviderType;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  setupMethod: 'local' | 'cloud' | 'custom';
}

type SetupStep =
  | 'ollama-check'
  | 'ollama-install'
  | 'ollama-start'
  | 'ollama-models'
  | 'model-selection'
  | 'installation-progress'
  | 'complete';

export const LocalAISetupDialog: React.FC<LocalAISetupDialogProps> = ({
  provider,
  onComplete,
  onCancel,
  terminalWidth,
}) => {
  const [step, setStep] = useState<SetupStep>(
    provider === ProviderType.OLLAMA ? 'ollama-check' : 'complete',
  );
  const [setupMethod, setSetupMethod] = useState<'local' | 'cloud' | 'custom'>(
    'local',
  );
  const [_currentInput, _setCurrentInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Ollama関連の状態
  const [ollamaStatus, setOllamaStatus] =
    useState<OllamaInstallationStatus | null>(null);
  const [modelInstallProgress, setModelInstallProgress] =
    useState<ModelInstallProgress | null>(null);

  // LM Studio関連の状態
  const [lmStudioStatus, setLmStudioStatus] = useState<any | null>(null);
  const [_apiKey, _setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedLMSMethod, setSelectedLMSMethod] = useState<
    'local' | null
  >(null);

  // プロバイダー別の初期チェック
  useEffect(() => {
    if (provider === ProviderType.OLLAMA) {
      checkOllamaInstallation().then(setOllamaStatus);
    } else if (provider === ProviderType.LMSTUDIO) {
      // Check LM Studio installation - for now just set a placeholder
      setLmStudioStatus({ isInstalled: false, isRunning: false });
    }
  }, [provider]);

  // Ollamaステータス確認後の処理
  useEffect(() => {
    if (ollamaStatus && step === 'ollama-check') {
      if (!ollamaStatus.isInstalled) {
        setStep('ollama-install');
      } else if (!ollamaStatus.isRunning) {
        setStep('ollama-start');
      } else if (ollamaStatus.installedModels.length === 0) {
        setStep('ollama-models');
      } else {
        setStep('model-selection');
      }
    }
  }, [ollamaStatus, step]);

  // LM Studioステータス確認後の処理
  useEffect(() => {
    if (lmStudioStatus && step === 'model-selection') {
      // ローカルAIカテゴリーなので、ローカル実行のみ
      setSetupMethod('local');
      setStep('model-selection');
    }
  }, [lmStudioStatus, step]);

  const getAvailableModels = useCallback(() => {
    if (provider === ProviderType.OLLAMA && ollamaStatus) {
      return ollamaStatus.installedModels.length > 0
        ? ollamaStatus.installedModels
        : ollamaStatus.recommendedModels.map((m) => m.name);
    }
    if (provider === ProviderType.LMSTUDIO) {
      return ['local-model', 'downloaded-model-1', 'downloaded-model-2'];
    }
    return [];
  }, [provider, ollamaStatus]);

  const getLocalEndpoint = useCallback(() => {
    if (provider === ProviderType.OLLAMA) return 'http://localhost:11434';
    if (provider === ProviderType.LMSTUDIO) {
      return 'http://localhost:1234';
    }
    return 'http://localhost:8080';
  }, [provider]);

  const handleEnterKey = useCallback(async () => {
    switch (step) {
      case 'ollama-install':
        // Ollamaインストール画面から戻る
        onCancel();
        break;

      case 'ollama-start':
        if (highlightedIndex === 0) {
          const started = await startOllamaService();
          if (started) {
            const status = await checkOllamaInstallation();
            setOllamaStatus(status);
          }
        } else {
          onCancel();
        }
        break;

      case 'ollama-models':
        if (
          ollamaStatus &&
          highlightedIndex < ollamaStatus.recommendedModels.length
        ) {
          const model = ollamaStatus.recommendedModels[highlightedIndex];
          if (!model.isInstalled) {
            setStep('installation-progress');
            const success = await installOllamaModel(
              model.name,
              setModelInstallProgress,
            );
            if (success) {
              setSelectedModel(model.name);
              setStep('complete');
            }
          } else {
            setSelectedModel(model.name);
            setStep('complete');
          }
        }
        break;


      case 'model-selection': {
        const models = getAvailableModels();
        if (highlightedIndex < models.length) {
          setSelectedModel(models[highlightedIndex]);
          setStep('complete');
        }
        break;
      }

      case 'complete':
        onComplete({
          type: provider,
          setupMethod,
          apiKey: setupMethod === 'cloud' ? _apiKey : undefined,
          model: selectedModel,
          endpoint: setupMethod === 'local' ? getLocalEndpoint() : undefined,
        });
        break;

      default:
        // No action needed for other steps
        break;
    }
  }, [
    step,
    highlightedIndex,
    ollamaStatus,
    selectedModel,
    onCancel,
    onComplete,
    provider,
    setupMethod,
    getAvailableModels,
    getLocalEndpoint,
    _apiKey,
  ]);

  const handleInput = useCallback(
    (input: string, key: Record<string, boolean>) => {
      if (key.escape || (key.ctrl && input === 'c')) {
        onCancel();
        return;
      }

      // 矢印キーナビゲーション
      if (key.upArrow) {
        setHighlightedIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (key.downArrow) {
        let maxIndex = 0;
        if (step === 'ollama-models')
          maxIndex = ollamaStatus?.recommendedModels.length || 0;
        else if (step === 'model-selection')
          maxIndex = getAvailableModels().length - 1;

        setHighlightedIndex((prev) => Math.min(maxIndex, prev + 1));
        return;
      }

      // Enterキー処理
      if (key.return) {
        handleEnterKey();
      }
    },
    [step, ollamaStatus, onCancel, getAvailableModels, handleEnterKey],
  );

  useInput(handleInput);

  const renderContent = () => {
    const width = Math.min(terminalWidth - 4, 80);

    switch (step) {
      case 'ollama-install':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentRed}>
              Ollamaがインストールされていません
            </Text>
            <Text> </Text>
            <Text>{getOllamaInstallInstructions()}</Text>
            <Text> </Text>
            <Text color={Colors.AccentYellow}>
              インストール完了後、Enterキーを押して続行してください
            </Text>
          </Box>
        );

      case 'ollama-start':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentYellow}>
              Ollamaが実行されていません
            </Text>
            <Text> </Text>
            <Text
              color={
                highlightedIndex === 0 ? Colors.AccentGreen : Colors.Foreground
              }
            >
              {highlightedIndex === 0 ? '▶ ' : '  '}Ollamaサービスを開始
            </Text>
            <Text
              color={
                highlightedIndex === 1 ? Colors.AccentGreen : Colors.Foreground
              }
            >
              {highlightedIndex === 1 ? '▶ ' : '  '}キャンセル
            </Text>
          </Box>
        );

      case 'ollama-models':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentBlue}>
              推奨モデルを選択してください
            </Text>
            <Text> </Text>
            {ollamaStatus?.recommendedModels.map((model, index) => (
              <Box key={model.name} flexDirection="column">
                <Text
                  color={
                    highlightedIndex === index
                      ? Colors.AccentGreen
                      : Colors.Foreground
                  }
                >
                  {highlightedIndex === index ? '▶ ' : '  '}
                  {model.displayName} ({model.size})
                  {model.isInstalled && ' (installed)'}
                </Text>
                <Text color={Colors.Gray}> {model.description}</Text>
              </Box>
            ))}
          </Box>
        );


      case 'installation-progress':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentBlue}>
              モデルをインストール中...
            </Text>
            <Text> </Text>
            {modelInstallProgress && (
              <>
                <Text>モデル: {modelInstallProgress.model}</Text>
                <Text>ステータス: {modelInstallProgress.status}</Text>
                {modelInstallProgress.progress && (
                  <Text>進行状況: {modelInstallProgress.progress}%</Text>
                )}
                {modelInstallProgress.error && (
                  <Text color={Colors.AccentRed}>
                    エラー: {modelInstallProgress.error}
                  </Text>
                )}
              </>
            )}
          </Box>
        );

      case 'complete':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentGreen}>
              セットアップ完了！
            </Text>
            <Text> </Text>
            <Text>プロバイダー: {provider}</Text>
            <Text>
              方法: {setupMethod === 'local' ? 'ローカル実行' : 'クラウドAPI'}
            </Text>
            <Text>モデル: {selectedModel}</Text>
            {setupMethod === 'local' && (
              <Text>エンドポイント: {getLocalEndpoint()}</Text>
            )}
            <Text> </Text>
            <Text color={Colors.AccentYellow}>
              Enterキーを押して設定を保存してください
            </Text>
          </Box>
        );

      default:
        return <Text>読み込み中...</Text>;
    }
  };

  return (
    <Box
      borderStyle="round"
      borderColor="blue"
      paddingX={2}
      paddingY={1}
      flexDirection="column"
    >
      {renderContent()}
      <Text> </Text>
      <Text color={Colors.Gray}>
        矢印キー: 移動 | Enter: 選択 | Esc: キャンセル
      </Text>
    </Box>
  );
};
