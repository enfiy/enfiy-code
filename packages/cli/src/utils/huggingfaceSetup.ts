/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);

export interface HuggingFaceSetupStatus {
  localServerAvailable: boolean;
  pythonInstalled: boolean;
  transformersInstalled: boolean;
  recommendedServers: LocalServerOption[];
  localServerUrl?: string;
  supportedMethods: HFSetupMethod[];
}

export interface LocalServerOption {
  name: string;
  displayName: string;
  description: string;
  requirements: string[];
  installCommand: string;
  startCommand: string;
  defaultPort: number;
  memoryRequirement: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface HFSetupMethod {
  type: 'cloud' | 'local' | 'inference-endpoints';
  name: string;
  description: string;
  requirements: string[];
  steps: string[];
  pros: string[];
  cons: string[];
}

const LOCAL_SERVER_OPTIONS: LocalServerOption[] = [
  {
    name: 'text-generation-inference',
    displayName: 'Text Generation Inference (TGI)',
    description: 'HuggingFaceの公式推論サーバー（推奨）',
    requirements: ['Docker'],
    installCommand:
      'docker pull ghcr.io/huggingface/text-generation-inference:latest',
    startCommand:
      'docker run -p 8080:80 -v $PWD/data:/data ghcr.io/huggingface/text-generation-inference:latest --model-id microsoft/DialoGPT-medium',
    defaultPort: 8080,
    memoryRequirement: '4GB以上',
    difficulty: 'easy',
  },
  {
    name: 'vllm',
    displayName: 'vLLM',
    description: '高速な推論が可能なサーバー',
    requirements: ['Python 3.8+', 'CUDA（GPU使用時）'],
    installCommand: 'pip install vllm',
    startCommand:
      'python -m vllm.entrypoints.openai.api_server --model microsoft/DialoGPT-medium --port 8000',
    defaultPort: 8000,
    memoryRequirement: '8GB以上',
    difficulty: 'medium',
  },
  {
    name: 'transformers-api',
    displayName: 'Transformers API Server',
    description: 'シンプルなFlask/FastAPIサーバー',
    requirements: ['Python 3.8+', 'transformers', 'torch'],
    installCommand: 'pip install transformers torch flask',
    startCommand: 'python transformers_server.py',
    defaultPort: 5000,
    memoryRequirement: '4GB以上',
    difficulty: 'medium',
  },
  {
    name: 'ollama-hf',
    displayName: 'Ollama + HuggingFace Models',
    description: 'OllamaでHuggingFaceモデルを実行',
    requirements: ['Ollama'],
    installCommand: 'ollama pull huggingface/CodeBERTa-small-v1',
    startCommand: 'ollama serve',
    defaultPort: 11434,
    memoryRequirement: '2GB以上',
    difficulty: 'easy',
  },
];

const SETUP_METHODS: HFSetupMethod[] = [
  {
    type: 'cloud',
    name: 'HuggingFace Inference API（クラウド）',
    description: 'HuggingFaceのホストされたAPIを使用',
    requirements: ['HuggingFace APIキー'],
    steps: [
      'https://huggingface.co/settings/tokens でAPIキーを取得',
      'CLI設定でAPIキーを入力',
      'モデルを選択して使用開始',
    ],
    pros: ['セットアップが簡単', '豊富なモデルが利用可能', 'インフラ管理不要'],
    cons: [
      'インターネット接続が必要',
      '使用量に応じて課金',
      'レスポンス時間がやや長い',
    ],
  },
  {
    type: 'local',
    name: 'ローカル推論サーバー',
    description: '自分のマシンで推論サーバーを実行',
    requirements: ['Docker または Python環境', '十分なメモリ'],
    steps: [
      '推論サーバーをインストール',
      'モデルをダウンロード',
      'サーバーを起動',
      'CLI設定でローカルURLを指定',
    ],
    pros: [
      'プライバシー保護',
      'オフライン利用可能',
      '応答速度が高速',
      '使用量制限なし',
    ],
    cons: [
      'セットアップが複雑',
      'システムリソースが必要',
      '利用可能なモデルが限定的',
    ],
  },
  {
    type: 'inference-endpoints',
    name: 'HuggingFace Inference Endpoints',
    description: '専用のエンドポイントを作成',
    requirements: ['HuggingFaceアカウント', '課金設定'],
    steps: [
      'HuggingFace Hubでエンドポイントを作成',
      'モデルと設定を選択',
      'エンドポイントURLを取得',
      'CLI設定でエンドポイントURLを指定',
    ],
    pros: ['高い安定性', 'カスタマイズ可能', '専用リソース'],
    cons: ['月額料金が発生', 'セットアップが複雑', '最低利用料金あり'],
  },
];

/**
 * HuggingFaceのセットアップ状況をチェック
 */
export async function checkHuggingFaceSetup(): Promise<HuggingFaceSetupStatus> {
  const status: HuggingFaceSetupStatus = {
    localServerAvailable: false,
    pythonInstalled: false,
    transformersInstalled: false,
    recommendedServers: LOCAL_SERVER_OPTIONS,
    supportedMethods: SETUP_METHODS,
  };

  try {
    // Python がインストールされているかチェック
    await execAsync('python --version');
    status.pythonInstalled = true;
  } catch {
    try {
      await execAsync('python3 --version');
      status.pythonInstalled = true;
    } catch {
      status.pythonInstalled = false;
    }
  }

  try {
    // transformers ライブラリがインストールされているかチェック
    await execAsync('python -c "import transformers"');
    status.transformersInstalled = true;
  } catch {
    try {
      await execAsync('python3 -c "import transformers"');
      status.transformersInstalled = true;
    } catch {
      status.transformersInstalled = false;
    }
  }

  // ローカルサーバーが実行中かチェック
  const commonPorts = [8080, 8000, 5000, 11434];
  for (const port of commonPorts) {
    try {
      const response = await fetch(`http://localhost:${port}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        status.localServerAvailable = true;
        status.localServerUrl = `http://localhost:${port}`;
        break;
      }
    } catch {
      // ポートが応答しない場合は続行
    }
  }

  return status;
}

/**
 * Python環境セットアップのガイダンスを取得
 */
export function _getPythonSetupInstructions(): string {
  const currentPlatform = platform();

  switch (currentPlatform) {
    case 'darwin': // macOS
      return `macOSにPython環境をセットアップ:

1. Homebrewをインストール:
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

2. Pythonをインストール:
   brew install python

3. pipをアップグレード:
   python3 -m pip install --upgrade pip

4. 必要なライブラリをインストール:
   pip3 install transformers torch flask`;

    case 'linux':
      return `LinuxにPython環境をセットアップ:

1. システムパッケージマネージャーでPythonをインストール:
   # Ubuntu/Debian:
   sudo apt update && sudo apt install python3 python3-pip
   
   # CentOS/RHEL:
   sudo yum install python3 python3-pip

2. pipをアップグレード:
   python3 -m pip install --upgrade pip

3. 必要なライブラリをインストール:
   pip3 install transformers torch flask`;

    case 'win32': // Windows
      return `WindowsにPython環境をセットアップ:

1. 公式サイトからPythonをダウンロード・インストール:
   https://www.python.org/downloads/

2. インストール時に "Add Python to PATH" をチェック

3. PowerShellで以下を実行:
   python -m pip install --upgrade pip

4. 必要なライブラリをインストール:
   pip install transformers torch flask`;

    default:
      return `Python環境をセットアップ:

1. https://www.python.org/ からPythonをインストール

2. pipをアップグレード:
   python -m pip install --upgrade pip

3. 必要なライブラリをインストール:
   pip install transformers torch flask`;
  }
}

/**
 * Docker環境セットアップのガイダンスを取得
 */
export function _getDockerSetupInstructions(): string {
  const currentPlatform = platform();

  switch (currentPlatform) {
    case 'darwin': // macOS
      return `macOSにDockerをセットアップ:

1. Docker Desktopをダウンロード・インストール:
   https://www.docker.com/products/docker-desktop

2. Docker Desktopを起動

3. Dockerが動作していることを確認:
   docker --version`;

    case 'linux':
      return `LinuxにDockerをセットアップ:

1. Dockerの公式インストールスクリプトを実行:
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

2. ユーザーをdockerグループに追加:
   sudo usermod -aG docker $USER

3. システムを再起動またはログアウト・ログイン

4. Dockerが動作していることを確認:
   docker --version`;

    case 'win32': // Windows
      return `WindowsにDockerをセットアップ:

1. Docker Desktopをダウンロード・インストール:
   https://www.docker.com/products/docker-desktop

2. WSL2が有効になっていることを確認

3. Docker Desktopを起動

4. PowerShellで動作確認:
   docker --version`;

    default:
      return `Dockerをセットアップ:

1. https://www.docker.com/products/docker-desktop からDocker Desktopをダウンロード・インストール

2. Dockerが動作していることを確認:
   docker --version`;
  }
}

/**
 * Text Generation Inference (TGI) サーバーを開始
 */
export async function startTGIServer(
  modelId: string = 'microsoft/DialoGPT-medium',
  port: number = 8080,
): Promise<boolean> {
  try {
    const command = `docker run -d -p ${port}:80 -v $PWD/data:/data ghcr.io/huggingface/text-generation-inference:latest --model-id ${modelId}`;

    await execAsync(command);

    // サーバーが起動するまで待機
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // ヘルスチェック
    const response = await fetch(`http://localhost:${port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * vLLM サーバーを開始
 */
export async function startVLLMServer(
  modelId: string = 'microsoft/DialoGPT-medium',
  port: number = 8000,
): Promise<boolean> {
  try {
    const command = `python -m vllm.entrypoints.openai.api_server --model ${modelId} --port ${port}`;

    // バックグラウンドで実行
    exec(command);

    // サーバーが起動するまで待機
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // ヘルスチェック
    const response = await fetch(`http://localhost:${port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * HuggingFace APIキーの形式を検証
 */
export function _validateHuggingFaceAPIKey(apiKey: string): boolean {
  // HuggingFace APIキーの形式: hf_[A-Za-z0-9]{34}
  const hfApiKeyRegex = /^hf_[A-Za-z0-9]{34}$/;
  return hfApiKeyRegex.test(apiKey);
}

/**
 * 推奨モデル一覧を取得
 */
export function getRecommendedHFModels(): Array<{
  name: string;
  displayName: string;
  description: string;
  useCase: string;
  size: string;
  localCompatible: boolean;
}> {
  return [
    {
      name: 'microsoft/DialoGPT-medium',
      displayName: 'DialoGPT Medium',
      description: '会話に特化したモデル',
      useCase: '一般的な会話',
      size: '345MB',
      localCompatible: true,
    },
    {
      name: 'microsoft/DialoGPT-large',
      displayName: 'DialoGPT Large',
      description: '高品質な会話生成',
      useCase: '高品質会話',
      size: '774MB',
      localCompatible: true,
    },
    {
      name: 'facebook/blenderbot-400M-distill',
      displayName: 'BlenderBot 400M',
      description: '軽量な会話モデル',
      useCase: '軽量会話',
      size: '400MB',
      localCompatible: true,
    },
    {
      name: 'codellama/CodeLlama-7b-Instruct-hf',
      displayName: 'Code Llama 7B',
      description: 'コード生成特化モデル',
      useCase: 'プログラミング',
      size: '13GB',
      localCompatible: false,
    },
    {
      name: 'mistralai/Mistral-7B-Instruct-v0.1',
      displayName: 'Mistral 7B Instruct',
      description: '汎用的な指示特化モデル',
      useCase: '指示実行',
      size: '13GB',
      localCompatible: false,
    },
  ];
}
