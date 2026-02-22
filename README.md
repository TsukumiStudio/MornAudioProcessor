# MornAudioProcessor

<p align="center">
  <img src="static/icon.png" alt="MornAudioProcessor" width="128" />
</p>

<p align="center">
  ffmpeg を使った音声ファイル一括加工デスクトップアプリ
</p>

<p align="center">
  <a href="https://github.com/TsukumiStudio/MornAudioProcessor/releases/latest">
    <img src="https://img.shields.io/github/v/release/TsukumiStudio/MornAudioProcessor" alt="Release" />
  </a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey" alt="Platform" />
  <img src="https://img.shields.io/github/license/TsukumiStudio/MornAudioProcessor" alt="License" />
</p>

## 概要

MornAudioProcessor は、MP3・WAV・OGG ファイルを一括で加工できるクロスプラットフォーム GUI アプリケーションです。
ffmpeg をバックエンドとして利用し、ドラッグ&ドロップで手軽にファイルを追加・処理できます。

## 機能

- **フォーマット変換** — MP3 / WAV / OGG 間の相互変換
- **音量調整** — ラウドネス正規化（LUFS指定）またはdB単位の増減
- **トリミング** — 開始・終了時間を指定してカット
- **ビットレート変更** — 64k 〜 320k から選択
- **サンプルレート変更** — 44.1 kHz / 48 kHz
- **無音削除** — 先頭・末尾の無音を自動検出して除去（閾値調整可能）
- **ドラッグ&ドロップ** — ファイルをウィンドウにドロップして追加
- **一括処理** — 複数ファイルを順次処理、進捗をリアルタイム表示

## スクリーンショット

> TODO: スクリーンショットを追加

## インストール

### ダウンロード

[Releases](https://github.com/TsukumiStudio/MornAudioProcessor/releases/latest) ページから、お使いの OS に合ったインストーラをダウンロードしてください。

| OS | ファイル |
|---|---|
| macOS (Apple Silicon) | `MornAudioProcessor_x.x.x_aarch64.dmg` |
| Windows (x64) | `MornAudioProcessor_x.x.x_x64-setup.exe` |

### 初回起動時の注意

本アプリはコード署名されていないため、OS のセキュリティ警告が表示されます。

**macOS:** 「壊れているため開けません」と表示される場合、アプリケーションフォルダにコピー後、ターミナルで以下を実行してください。

```bash
xattr -cr /Applications/MornAudioProcessor.app
```

**Windows:** SmartScreen の警告が表示される場合、「詳細情報」→「実行」を選択してください。

### 前提条件

**ffmpeg のインストールが必要です。**

#### macOS

```bash
brew install ffmpeg
```

#### Windows

```bash
winget install ffmpeg
```

または [ffmpeg.org](https://ffmpeg.org/download.html) からダウンロードし、PATH を通してください。

## ライセンス

[The Unlicense](LICENSE)
