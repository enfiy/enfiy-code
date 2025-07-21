# CodeQL とは？

## 概要

**CodeQL**は、GitHubが提供する静的解析ツールで、コードベース内のセキュリティ脆弱性やバグを自動的に検出するためのツールです。

## 主な特徴

### 1. セマンティック解析

- 単純なパターンマッチングではなく、コードの意味を理解して解析
- データフローを追跡し、潜在的な脆弱性を発見

### 2. 検出可能な脆弱性の例

- **SQLインジェクション**: ユーザー入力が適切にサニタイズされずにSQL文に使用される
- **XSS（クロスサイトスクリプティング）**: 信頼できない入力がHTMLに直接出力される
- **パストラバーサル**: ファイルパスの検証不足による任意ファイルアクセス
- **コマンドインジェクション**: シェルコマンドへの安全でない入力
- **機密情報の漏洩**: ハードコードされたパスワードやAPIキー

### 3. 言語サポート

- JavaScript/TypeScript（Enfiy Codeで使用）
- Python, Java, C/C++, C#, Go, Ruby など

## Enfiy Code での利用

### なぜ必要か？

1. **セキュリティの自動化**: 手動レビューでは見逃しがちな脆弱性を検出
2. **継続的な監視**: プルリクエストごとに自動でセキュリティチェック
3. **開発者の負担軽減**: セキュリティ専門知識がなくても基本的な脆弱性を防げる

### 現在の状況

```
Security Analysis
fix: Format remaining 4 files for CI format check compliance #17
Warning: Code scanning is not enabled for this repository.
```

このメッセージは、CodeQLがリポジトリで有効化されていないことを示しています。

## 有効化の手順

### 1. リポジトリ管理者として

1. GitHubリポジトリの **Settings** → **Security & analysis** に移動
2. **Code scanning** セクションで **Enable** をクリック
3. **Set up with Advanced** を選択してカスタマイズ

### 2. 自動的に作成される設定

```yaml
name: 'CodeQL'

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  schedule:
    - cron: '30 1 * * 0' # 毎週日曜日に実行

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

## メリット

1. **早期発見**: 本番環境に出る前に脆弱性を発見
2. **自動化**: CI/CDパイプラインに統合され、自動実行
3. **詳細な報告**: 問題の場所と修正方法を具体的に提示
4. **無料**: パブリックリポジトリでは無料で利用可能

## デメリット・注意点

1. **偽陽性**: 実際には問題ないコードを脆弱性として報告することがある
2. **実行時間**: 大規模なコードベースでは解析に時間がかかる
3. **設定が必要**: リポジトリ管理者権限が必要

## まとめ

CodeQLは、Enfiy Codeのようなツールにとって重要なセキュリティ層を提供します。特に：

- ユーザー入力を扱う（ファイルパス、コマンド実行）
- 外部APIと通信する
- ファイルシステムを操作する

これらの機能を持つEnfiy Codeでは、CodeQLによる継続的なセキュリティ監視が推奨されます。
