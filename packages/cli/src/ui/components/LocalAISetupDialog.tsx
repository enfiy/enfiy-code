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
  provider: ProviderType.OLLAMA | ProviderType.HUGGINGFACE;
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
  | 'hf-check'
  | 'hf-method-selection'
  | 'hf-tgi-setup'
  | 'hf-vllm-setup'
  | 'hf-ollama-setup'
  | 'hf-server-start'
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
    provider === ProviderType.OLLAMA ? 'ollama-check' : 'hf-check'
  );
  const [setupMethod, setSetupMethod] = useState<'local' | 'cloud' | 'custom'>('local');
  const [_currentInput, _setCurrentInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  // Ollama関連の状態
  const [ollamaStatus, setOllamaStatus] = useState<OllamaInstallationStatus | null>(null);
  const [modelInstallProgress, setModelInstallProgress] = useState<ModelInstallProgress | null>(null);
  
  // HuggingFace関連の状態
  const [hfStatus, setHfStatus] = useState<HuggingFaceSetupStatus | null>(null);
  const [_apiKey, _setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedHFMethod, setSelectedHFMethod] = useState<'tgi' | 'vllm' | 'ollama' | null>(null);

  // プロバイダー別の初期チェック
  useEffect(() => {
    if (provider === ProviderType.OLLAMA) {
      checkOllamaInstallation().then(setOllamaStatus);
    } else if (provider === ProviderType.HUGGINGFACE) {
      checkHuggingFaceSetup().then(setHfStatus);
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

  // HuggingFaceステータス確認後の処理
  useEffect(() => {
    if (hfStatus && step === 'hf-check') {
      // ローカルAIカテゴリーなので、ローカル実行のみ
      setSetupMethod('local');
      setStep('hf-method-selection');
    }
  }, [hfStatus, step]);

  const handleInput = useCallback((input: string, key: Record<string, boolean>) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      onCancel();
      return;
    }

    // 矢印キーナビゲーション
    if (key.upArrow) {
      setHighlightedIndex(prev => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      let maxIndex = 0;
      if (step === 'ollama-models') maxIndex = ollamaStatus?.recommendedModels.length || 0;
      else if (step === 'hf-method-selection') maxIndex = 2; // TGI, vLLM, Ollama
      else if (step === 'model-selection') maxIndex = getAvailableModels().length - 1;
      
      setHighlightedIndex(prev => Math.min(maxIndex, prev + 1));
      return;
    }


    // Enterキー処理
    if (key.return) {
      handleEnterKey();
    }
  }, [step, _currentInput, ollamaStatus, onCancel]);

  useInput(handleInput);

  const handleEnterKey = async () => {
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
        if (ollamaStatus && highlightedIndex < ollamaStatus.recommendedModels.length) {
          const model = ollamaStatus.recommendedModels[highlightedIndex];
          if (!model.isInstalled) {
            setStep('installation-progress');
            const success = await installOllamaModel(
              model.name,
              setModelInstallProgress
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

      case 'hf-method-selection':
        if (highlightedIndex === 0) {
          setSelectedHFMethod('tgi');
          setStep('hf-tgi-setup');
        } else if (highlightedIndex === 1) {
          setSelectedHFMethod('vllm');
          setStep('hf-vllm-setup');
        } else if (highlightedIndex === 2) {
          setSelectedHFMethod('ollama');
          setStep('hf-ollama-setup');
        }
        break;

      case 'hf-tgi-setup':
      case 'hf-vllm-setup':
      case 'hf-ollama-setup':
        setStep('hf-server-start');
        break;

      case 'hf-server-start':
        if (highlightedIndex === 0) {
          // Start server automatically (if implemented)
          setStep('model-selection');
        } else {
          onCancel();
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
  };

  const getAvailableModels = () => {
    if (provider === ProviderType.OLLAMA && ollamaStatus) {
      return ollamaStatus.installedModels.length > 0 
        ? ollamaStatus.installedModels 
        : ollamaStatus.recommendedModels.map(m => m.name);
    }
    if (provider === ProviderType.HUGGINGFACE) {
      return getRecommendedHFModels().map(m => m.name);
    }
    return [];
  };

  const getLocalEndpoint = () => {
    if (provider === ProviderType.OLLAMA) return 'http://localhost:11434';
    if (provider === ProviderType.HUGGINGFACE) {
      if (selectedHFMethod === 'tgi') return 'http://localhost:8080';
      if (selectedHFMethod === 'vllm') return 'http://localhost:8000';
      if (selectedHFMethod === 'ollama') return 'http://localhost:11434';
      if (hfStatus?.localServerUrl) return hfStatus.localServerUrl;
    }
    return 'http://localhost:8080';
  };

  const renderContent = () => {
    const width = Math.min(terminalWidth - 4, 80);

    switch (step) {

      case 'ollama-install':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentRed}>Ollamaがインストールされていません</Text>
            <Text> </Text>
            <Text>{getOllamaInstallInstructions()}</Text>
            <Text> </Text>
            <Text color={Colors.AccentYellow}>インストール完了後、Enterキーを押して続行してください</Text>
          </Box>
        );

      case 'ollama-start':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentYellow}>Ollamaが実行されていません</Text>
            <Text> </Text>
            <Text color={highlightedIndex === 0 ? Colors.AccentGreen : Colors.Foreground}>
              {highlightedIndex === 0 ? '▶ ' : '  '}Ollamaサービスを開始
            </Text>
            <Text color={highlightedIndex === 1 ? Colors.AccentGreen : Colors.Foreground}>
              {highlightedIndex === 1 ? '▶ ' : '  '}キャンセル
            </Text>
          </Box>
        );

      case 'ollama-models':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentBlue}>推奨モデルを選択してください</Text>
            <Text> </Text>
            {ollamaStatus?.recommendedModels.map((model, index) => (
              <Box key={model.name} flexDirection="column">
                <Text color={highlightedIndex === index ? Colors.AccentGreen : Colors.Foreground}>
                  {highlightedIndex === index ? '▶ ' : '  '}
                  {model.displayName} ({model.size})
                  {model.isInstalled && ' ✓'}
                </Text>
                <Text color={Colors.Gray}>    {model.description}</Text>
              </Box>
            ))}
          </Box>
        );



      case 'hf-method-selection':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentBlue}>Select HuggingFace Setup Method</Text>
            <Text> </Text>
            <Text color={highlightedIndex === 0 ? Colors.AccentGreen : Colors.Foreground}>
              {highlightedIndex === 0 ? '▶ ' : '  '}Text Generation Inference (Recommended)
            </Text>
            <Text color={Colors.Gray}>    Docker-based, easy setup, official HuggingFace server</Text>
            <Text> </Text>
            <Text color={highlightedIndex === 1 ? Colors.AccentGreen : Colors.Foreground}>
              {highlightedIndex === 1 ? '▶ ' : '  '}vLLM Server
            </Text>
            <Text color={Colors.Gray}>    Fast inference, requires Python setup</Text>
            <Text> </Text>
            <Text color={highlightedIndex === 2 ? Colors.AccentGreen : Colors.Foreground}>
              {highlightedIndex === 2 ? '▶ ' : '  '}Ollama with HuggingFace Models
            </Text>
            <Text color={Colors.Gray}>    Use existing Ollama to run HuggingFace models</Text>
          </Box>
        );

      case 'hf-tgi-setup':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentBlue}>Text Generation Inference Setup</Text>
            <Text> </Text>
            <Text bold>Prerequisites:</Text>
            <Text>• Docker Desktop installed</Text>
            <Text>• At least 4GB free memory</Text>
            <Text> </Text>
            <Text bold>Installation Steps:</Text>
            <Text>1. Install Docker Desktop:</Text>
            <Text>   Visit: https://www.docker.com/products/docker-desktop</Text>
            <Text> </Text>
            <Text>2. Open terminal and run:</Text>
            <Text color={Colors.AccentYellow}>   docker run -p 8080:80 -v $PWD/data:/data \</Text>
            <Text color={Colors.AccentYellow}>   ghcr.io/huggingface/text-generation-inference:latest \</Text>
            <Text color={Colors.AccentYellow}>   --model-id microsoft/DialoGPT-medium</Text>
            <Text> </Text>
            <Text>3. Wait for model download and server start</Text>
            <Text>4. Server will be available at: http://localhost:8080</Text>
            <Text> </Text>
            <Text color={Colors.AccentGreen}>Press Enter to continue once server is running</Text>
          </Box>
        );

      case 'hf-vllm-setup':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentBlue}>vLLM Server Setup</Text>
            <Text> </Text>
            <Text bold>Prerequisites:</Text>
            <Text>• Python 3.8+ installed</Text>
            <Text>• At least 8GB free memory</Text>
            <Text>• CUDA (for GPU acceleration, optional)</Text>
            <Text> </Text>
            <Text bold>Installation Steps:</Text>
            <Text>1. Install vLLM:</Text>
            <Text color={Colors.AccentYellow}>   pip install vllm</Text>
            <Text> </Text>
            <Text>2. Start vLLM server:</Text>
            <Text color={Colors.AccentYellow}>   python -m vllm.entrypoints.openai.api_server \</Text>
            <Text color={Colors.AccentYellow}>   --model microsoft/DialoGPT-medium --port 8000</Text>
            <Text> </Text>
            <Text>3. Wait for model download and server start</Text>
            <Text>4. Server will be available at: http://localhost:8000</Text>
            <Text> </Text>
            <Text color={Colors.AccentGreen}>Press Enter to continue once server is running</Text>
          </Box>
        );

      case 'hf-ollama-setup':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentBlue}>Ollama + HuggingFace Setup</Text>
            <Text> </Text>
            <Text bold>Prerequisites:</Text>
            <Text>• Ollama installed and running</Text>
            <Text>• At least 2GB free memory</Text>
            <Text> </Text>
            <Text bold>Installation Steps:</Text>
            <Text>1. Ensure Ollama is running:</Text>
            <Text color={Colors.AccentYellow}>   ollama serve</Text>
            <Text> </Text>
            <Text>2. Pull HuggingFace model through Ollama:</Text>
            <Text color={Colors.AccentYellow}>   ollama pull huggingface/CodeBERTa-small-v1</Text>
            <Text> </Text>
            <Text>3. Server will be available at: http://localhost:11434</Text>
            <Text> </Text>
            <Text color={Colors.AccentGreen}>Press Enter to continue once model is downloaded</Text>
          </Box>
        );

      case 'hf-server-start':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentYellow}>Server Status Check</Text>
            <Text> </Text>
            <Text>Selected method: {selectedHFMethod?.toUpperCase()}</Text>
            <Text> </Text>
            <Text color={highlightedIndex === 0 ? Colors.AccentGreen : Colors.Foreground}>
              {highlightedIndex === 0 ? '▶ ' : '  '}Continue to Model Selection
            </Text>
            <Text color={highlightedIndex === 1 ? Colors.AccentGreen : Colors.Foreground}>
              {highlightedIndex === 1 ? '▶ ' : '  '}Cancel Setup
            </Text>
            <Text> </Text>
            <Text color={Colors.Gray}>Make sure your server is running before continuing</Text>
          </Box>
        );

      case 'installation-progress':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentBlue}>モデルをインストール中...</Text>
            <Text> </Text>
            {modelInstallProgress && (
              <>
                <Text>モデル: {modelInstallProgress.model}</Text>
                <Text>ステータス: {modelInstallProgress.status}</Text>
                {modelInstallProgress.progress && (
                  <Text>進行状況: {modelInstallProgress.progress}%</Text>
                )}
                {modelInstallProgress.error && (
                  <Text color={Colors.AccentRed}>エラー: {modelInstallProgress.error}</Text>
                )}
              </>
            )}
          </Box>
        );

      case 'complete':
        return (
          <Box flexDirection="column" width={width}>
            <Text bold color={Colors.AccentGreen}>セットアップ完了！</Text>
            <Text> </Text>
            <Text>プロバイダー: {provider}</Text>
            <Text>方法: {setupMethod === 'local' ? 'ローカル実行' : 'クラウドAPI'}</Text>
            <Text>モデル: {selectedModel}</Text>
            {setupMethod === 'local' && <Text>エンドポイント: {getLocalEndpoint()}</Text>}
            <Text> </Text>
            <Text color={Colors.AccentYellow}>Enterキーを押して設定を保存してください</Text>
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