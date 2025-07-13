/**
 * @license
 * Copyright 2025 Hayate Esaki
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  checkOllamaInstallation,
  getOllamaInstallInstructions,
  startOllamaService,
  installOllamaModel,
  // getInstalledModels, // Currently unused
} from '../utils/ollamaSetup.js';
import {
  checkHuggingFaceSetup,
  _getPythonSetupInstructions,
  // _getDockerSetupInstructions, // Currently unused
  getRecommendedHFModels,
  // _validateHuggingFaceAPIKey, // Currently unused
} from '../utils/huggingfaceSetup.js';

export interface SetupCommandOptions {
  provider: 'ollama' | 'huggingface' | 'all';
  install?: boolean;
  start?: boolean;
  model?: string;
  check?: boolean;
  interactive?: boolean;
}

/**
 * ローカルAIのセットアップコマンド
 */
export async function setupLocalAI(options: SetupCommandOptions): Promise<void> {
  const { provider, install, start, model, check, interactive } = options;

  console.log('🤖 ローカルAI セットアップユーティリティ\n');

  if (provider === 'ollama' || provider === 'all') {
    await setupOllama({ install, start, model, check, interactive });
  }

  if (provider === 'huggingface' || provider === 'all') {
    await setupHuggingFace({ check, interactive });
  }
}

/**
 * Ollamaのセットアップ
 */
async function setupOllama(options: {
  install?: boolean;
  start?: boolean;
  model?: string;
  check?: boolean;
  interactive?: boolean;
}): Promise<void> {
  console.log('🦙 Ollama セットアップ\n');

  const status = await checkOllamaInstallation();

  if (options.check) {
    displayOllamaStatus(status);
    return;
  }

  if (!status.isInstalled) {
    console.log('❌ Ollamaがインストールされていません\n');
    console.log(getOllamaInstallInstructions());
    
    if (options.interactive) {
      console.log('\n⏳ インストール完了後、再度このコマンドを実行してください');
    }
    return;
  }

  console.log('✅ Ollama インストール済み');
  if (status.version) {
    console.log(`📦 バージョン: ${status.version}`);
  }

  if (!status.isRunning) {
    console.log('⚠️  Ollamaが実行されていません');
    
    if (options.start || options.interactive) {
      console.log('🚀 Ollamaサービスを開始中...');
      const started = await startOllamaService();
      
      if (started) {
        console.log('✅ Ollamaサービスが開始されました');
        // ステータスを再確認
        const newStatus = await checkOllamaInstallation();
        if (newStatus.isRunning) {
          status.isRunning = true;
          status.installedModels = newStatus.installedModels;
        }
      } else {
        console.log('❌ Ollamaサービスの開始に失敗しました');
        console.log('手動で開始してください: ollama serve');
        return;
      }
    } else {
      console.log('手動で開始してください: ollama serve');
      return;
    }
  } else {
    console.log('✅ Ollama 実行中');
  }

  // インストール済みモデルを表示
  console.log(`\n📚 インストール済みモデル: ${status.installedModels.length}個`);
  if (status.installedModels.length > 0) {
    status.installedModels.forEach(modelName => {
      console.log(`  • ${modelName}`);
    });
  }

  // モデルのインストール
  if (options.model) {
    if (!status.installedModels.includes(options.model)) {
      console.log(`\n⬇️  モデル ${options.model} をインストール中...`);
      const success = await installOllamaModel(options.model, (progress) => {
        if (progress.status === 'downloading') {
          process.stdout.write(`\r進行状況: ${progress.progress || 0}%`);
        } else if (progress.status === 'completed') {
          console.log('\n✅ インストール完了');
        } else if (progress.status === 'error') {
          console.log(`\n❌ エラー: ${progress.error}`);
        }
      });

      if (!success) {
        console.log('❌ モデルのインストールに失敗しました');
        return;
      }
    } else {
      console.log(`✅ モデル ${options.model} は既にインストール済みです`);
    }
  } else if (status.installedModels.length === 0) {
    console.log('\n💡 推奨: 最初のモデルをインストールしてください');
    console.log('例: enfiy setup ollama --model llama3.2:3b');
    
    status.recommendedModels.forEach(model => {
      console.log(`  • ${model.name} (${model.size}) - ${model.description}`);
    });
  }

  console.log('\n🎉 Ollama セットアップ完了！');
}

/**
 * HuggingFaceのセットアップ
 */
async function setupHuggingFace(options: {
  check?: boolean;
  interactive?: boolean;
}): Promise<void> {
  console.log('🤗 HuggingFace セットアップ\n');

  const status = await checkHuggingFaceSetup();

  if (options.check) {
    displayHuggingFaceStatus(status);
    return;
  }

  console.log('📋 HuggingFace セットアップオプション:\n');

  console.log('1️⃣ クラウドAPI（推奨）:');
  console.log('   • https://huggingface.co/settings/tokens でAPIキーを取得');
  console.log('   • CLI設定でAPIキーを入力');
  console.log('   • 豊富なモデルが即座に利用可能');

  console.log('\n2️⃣ ローカル実行:');
  console.log('   • Python環境またはDockerが必要');
  console.log('   • プライベート・高速・オフライン利用可能');

  if (!status.pythonInstalled) {
    console.log('\n⚠️  Python環境が検出されませんでした');
    console.log(_getPythonSetupInstructions());
  } else {
    console.log('\n✅ Python環境: 利用可能');
    
    if (!status.transformersInstalled) {
      console.log('⚠️  Transformersライブラリが未インストール');
      console.log('インストール: pip install transformers torch');
    } else {
      console.log('✅ Transformers: インストール済み');
    }
  }

  if (status.localServerAvailable) {
    console.log(`✅ ローカルサーバー: ${status.localServerUrl} で実行中`);
  } else {
    console.log('⚠️  ローカル推論サーバーが検出されませんでした');
    console.log('\nローカルサーバーのセットアップオプション:');
    status.recommendedServers.forEach(server => {
      console.log(`\n• ${server.displayName} (${server.difficulty})`);
      console.log(`  ${server.description}`);
      console.log(`  要件: ${server.requirements.join(', ')}`);
      console.log(`  インストール: ${server.installCommand}`);
    });
  }

  console.log('\n🎉 HuggingFace セットアップガイド完了！');
  console.log('CLI設定で詳細なセットアップを行えます');
}

/**
 * Ollamaの状況を表示
 */
function displayOllamaStatus(status: {isInstalled: boolean, version?: string, isRunning: boolean, installedModels: string[], recommendedModels: Array<{name: string, size: string, description: string, isInstalled: boolean}>}): void {
  console.log('🦙 Ollama ステータス\n');
  
  console.log(`インストール状況: ${status.isInstalled ? '✅ インストール済み' : '❌ 未インストール'}`);
  
  if (status.version) {
    console.log(`バージョン: ${status.version}`);
  }
  
  console.log(`サービス状況: ${status.isRunning ? '✅ 実行中' : '❌ 停止中'}`);
  
  console.log(`インストール済みモデル: ${status.installedModels.length}個`);
  if (status.installedModels.length > 0) {
    status.installedModels.forEach((model: string) => {
      console.log(`  • ${model}`);
    });
  }

  if (status.recommendedModels.length > 0) {
    console.log('\n推奨モデル:');
    status.recommendedModels.forEach((model: {name: string, size: string, description: string, isInstalled: boolean}) => {
      const icon = model.isInstalled ? '✅' : '⬇️';
      console.log(`  ${icon} ${model.name} (${model.size}) - ${model.description}`);
    });
  }
}

/**
 * HuggingFaceの状況を表示
 */
function displayHuggingFaceStatus(status: {pythonInstalled: boolean, transformersInstalled: boolean, localServerAvailable: boolean, localServerUrl?: string, recommendedServers: Array<{name: string, requirements: string[], installCommand: string}>}): void {
  console.log('🤗 HuggingFace ステータス\n');
  
  console.log(`Python環境: ${status.pythonInstalled ? '✅ 利用可能' : '❌ 未インストール'}`);
  console.log(`Transformers: ${status.transformersInstalled ? '✅ インストール済み' : '❌ 未インストール'}`);
  console.log(`ローカルサーバー: ${status.localServerAvailable ? `✅ ${status.localServerUrl}` : '❌ 検出されず'}`);

  if (status.recommendedServers.length > 0) {
    console.log('\n利用可能なローカルサーバーオプション:');
    status.recommendedServers.forEach((server: {name: string, requirements: string[], installCommand: string}) => {
      console.log(`  • ${server.name}`);
      console.log(`    要件: ${server.requirements.join(', ')}`);
      console.log(`    インストール: ${server.installCommand}`);
    });
  }

  const models = getRecommendedHFModels();
  console.log('\n推奨モデル:');
  models.forEach(model => {
    const compatibility = model.localCompatible ? '🏠 ローカル対応' : '☁️ クラウドのみ';
    console.log(`  • ${model.displayName} (${model.size}) - ${compatibility}`);
    console.log(`    ${model.description}`);
  });
}

/**
 * セットアップコマンドのヘルプ表示
 */
export function displaySetupHelp(): void {
  console.log('🤖 ローカルAI セットアップコマンド\n');
  
  console.log('使用法:');
  console.log('  enfiy setup <provider> [options]\n');
  
  console.log('プロバイダー:');
  console.log('  ollama       Ollamaのセットアップ');
  console.log('  huggingface  HuggingFaceのセットアップ');
  console.log('  all          両方のセットアップ\n');
  
  console.log('オプション:');
  console.log('  --check      現在のステータスを確認');
  console.log('  --install    自動インストールを試行');
  console.log('  --start      サービスを開始');
  console.log('  --model      指定したモデルをインストール');
  console.log('  --interactive 対話的セットアップ\n');
  
  console.log('例:');
  console.log('  enfiy setup ollama --check');
  console.log('  enfiy setup ollama --start --model llama3.2:3b');
  console.log('  enfiy setup huggingface --check');
  console.log('  enfiy setup all --interactive');
}