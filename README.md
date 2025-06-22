# MCSR Portal

[English](README_EN.md) | 日本語

Minecraft 1.16のRTA（RSG、SSG、Ranked）のセットアップを簡単に行うためのツールです。

## 概要

MCSR（Minecraft Speedrunning）の環境構築を自動化するアプリケーションです。必要なファイルのダウンロードからインスタンス作成までを簡単に行えます。

## 対応ランチャー

- **MultiMC**
- **Prism Launcher**

## システム要件

- **OS**: Windows 10/11
    - Mac / Linuxのユーザーの方、ごめんなさい。
- **ネットワーク**: インターネット接続必須

## 言語の追加

新しい言語を追加する場合は、以下の手順で行います：

1. `src/renderer/data/locales/` フォルダに新しい言語ファイルを作成（例：`fr.yml`）
2. `src/renderer/data/locales.json` に言語設定を追加
3. 翻訳キーとテキストを追加

### 言語ファイルの例（fr.yml）
```yaml
# フランス語(fr)

# Global
next: "Suivant"
back: "Retour"
skip: "Passer"
cancel: "Annuler"
complete: "Terminé"
home: "Accueil"
# ... 他の翻訳キー
```

### locales.jsonへの追加
```json
{
  "languages": [
    { "code": "ja", "name": "日本語" },
    { "code": "en", "name": "English" },
    { "code": "fr", "name": "Français" }
  ]
}
```

## 他のOSへの対応

現在はWindowsのみ対応しています。
macOSやLinuxへの対応を希望される場合は、以下の手順でご協力ください：

1. このリポジトリをForkしてください
2. お使いのOSに対応するための実装を行ってください
3. プルリクエストを送信してください

### 対応が必要な項目
- **ビルド設定**: Electron Builderでの各OS向けビルド設定
- **ファイルパス処理**: OS固有のパス処理への対応
- **権限処理**: 各OSのセキュリティ機能への対応
- **インストーラの追加**: 他OSのインストーラへの対応
- **コマンドライン処理等の修正**: インストーラの自動実行などのために、`sudo-prompt`や`extract-zip`を使用しています。対応OSによりほかのライブラリが必要な場合は追加してください。
- **テスト**: 対応OSでの動作確認