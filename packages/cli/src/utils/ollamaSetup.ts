/**
 * @license
 * Copyright 2025 Google LLC
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on original work by Google LLC (2025)
 * Modified and extended by Hayate Esaki (2025)
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);

export interface OllamaInstallationStatus {
  isInstalled: boolean;
  isRunning: boolean;
  version?: string;
  installedModels: string[];
  recommendedModels: RecommendedModel[];
}

export interface RecommendedModel {
  name: string;
  displayName: string;
  description: string;
  size: string;
  useCase: string;
  isInstalled: boolean;
}

export interface ModelInstallProgress {
  model: string;
  status: 'downloading' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

const RECOMMENDED_MODELS: Array<Omit<RecommendedModel, 'isInstalled'>> = [
  {
    name: 'llama3.2:3b',
    displayName: 'Llama 3.2 3B',
    description: '高速で軽量なモデル（日本語対応）',
    size: '2.0GB',
    useCase: '軽量・高速',
  },
  {
    name: 'llama3.2:8b',
    displayName: 'Llama 3.2 8B',
    description: 'バランスの良い性能（推奨）',
    size: '4.7GB',
    useCase: '推奨・バランス型',
  },
  {
    name: 'qwen2.5:7b',
    displayName: 'Qwen 2.5 7B',
    description: '日本語に優秀なモデル',
    size: '4.4GB',
    useCase: '日本語特化',
  },
  {
    name: 'codellama:7b',
    displayName: 'Code Llama 7B',
    description: 'プログラミング専用モデル',
    size: '3.8GB',
    useCase: 'コード生成',
  },
  {
    name: 'gemma2:2b',
    displayName: 'Gemma 2 2B',
    description: '非常に軽量なモデル',
    size: '1.6GB',
    useCase: '超軽量',
  },
];

/**
 * Ollamaのインストール状況を確認
 */
export async function checkOllamaInstallation(): Promise<OllamaInstallationStatus> {
  const status: OllamaInstallationStatus = {
    isInstalled: false,
    isRunning: false,
    installedModels: [],
    recommendedModels: [],
  };

  try {
    // Ollamaがインストールされているかチェック
    const { stdout } = await execAsync('ollama --version');
    status.isInstalled = true;
    status.version = stdout.trim();
  } catch {
    status.isInstalled = false;
    status.recommendedModels = RECOMMENDED_MODELS.map(model => ({
      ...model,
      isInstalled: false,
    }));
    return status;
  }

  try {
    // Ollamaが実行中かチェック
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      status.isRunning = true;
      const data = await response.json();
      status.installedModels = data.models?.map((m: {name: string}) => m.name) || [];
    }
  } catch {
    status.isRunning = false;
  }

  // 推奨モデルの情報を更新
  status.recommendedModels = RECOMMENDED_MODELS.map(model => ({
    ...model,
    isInstalled: status.installedModels.includes(model.name),
  }));

  return status;
}

/**
 * Ollamaのインストール方法を取得
 */
export function getOllamaInstallInstructions(): string {
  const currentPlatform = platform();
  
  switch (currentPlatform) {
    case 'darwin': // macOS
      return `macOSにOllamaをインストールする方法:

1. Homebrewを使用:
   brew install ollama

2. または公式サイトからダウンロード:
   https://ollama.ai/download

3. インストール後、Ollamaを起動:
   ollama serve

4. 推奨モデルをダウンロード:
   ollama pull llama3.2:8b`;

    case 'linux':
      return `LinuxにOllamaをインストールする方法:

1. 公式インストールスクリプトを実行:
   curl -fsSL https://ollama.ai/install.sh | sh

2. Ollamaサービスを開始:
   sudo systemctl start ollama
   sudo systemctl enable ollama

3. または手動で起動:
   ollama serve

4. 推奨モデルをダウンロード:
   ollama pull llama3.2:8b`;

    case 'win32': // Windows
      return `WindowsにOllamaをインストールする方法:

1. 公式サイトからインストーラーをダウンロード:
   https://ollama.ai/download

2. ダウンロードしたexeファイルを実行してインストール

3. Ollamaが自動的に起動します

4. PowerShellまたはコマンドプロンプトで推奨モデルをダウンロード:
   ollama pull llama3.2:8b`;

    default:
      return `Ollamaをインストールする方法:

1. 公式サイトにアクセス:
   https://ollama.ai/download

2. お使いのOSに対応したバージョンをダウンロード・インストール

3. Ollamaを起動:
   ollama serve

4. 推奨モデルをダウンロード:
   ollama pull llama3.2:8b`;
  }
}

/**
 * Ollamaサービスを開始
 */
export async function startOllamaService(): Promise<boolean> {
  try {
    const currentPlatform = platform();
    
    if (currentPlatform === 'linux') {
      await execAsync('sudo systemctl start ollama');
    } else {
      // macOS, Windows, その他の場合は ollama serve を実行
      // バックグラウンドで実行するために非同期で開始
      exec('ollama serve');
      
      // 少し待機してサービスが開始されるのを待つ
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // サービスが開始されたかチェック
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * モデルをインストール
 */
export async function installOllamaModel(
  modelName: string,
  onProgress?: (progress: ModelInstallProgress) => void
): Promise<boolean> {
  try {
    onProgress?.({
      model: modelName,
      status: 'downloading',
      progress: 0,
    });

    const { stdout: _stdout, stderr } = await execAsync(`ollama pull ${modelName}`);
    
    if (stderr && !stderr.includes('success')) {
      onProgress?.({
        model: modelName,
        status: 'error',
        error: stderr,
      });
      return false;
    }

    onProgress?.({
      model: modelName,
      status: 'completed',
      progress: 100,
    });

    return true;
  } catch (error) {
    onProgress?.({
      model: modelName,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * インストール済みのモデル一覧を取得
 */
export async function getInstalledModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.models?.map((m: {name: string}) => m.name) || [];
  } catch {
    return [];
  }
}

/**
 * モデルをアンインストール
 */
export async function uninstallOllamaModel(modelName: string): Promise<boolean> {
  try {
    await execAsync(`ollama rm ${modelName}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ollamaの設定を最適化
 */
export async function optimizeOllamaConfig(): Promise<void> {
  try {
    // メモリ使用量やその他の設定を最適化する場合の処理
    // 現在は基本的な確認のみ
    const status = await checkOllamaInstallation();
    
    if (status.isRunning && status.installedModels.length === 0) {
      // モデルがインストールされていない場合、推奨モデルのインストールを提案
      console.log('推奨モデル llama3.2:8b をインストールすることをお勧めします');
    }
  } catch (error) {
    console.warn('Ollama設定の最適化中にエラーが発生しました:', error);
  }
}