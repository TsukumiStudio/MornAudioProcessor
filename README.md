<p align="center">
  <img src="static/banner.png" alt="MornAudioProcessor" />
</p>

<p align="center">
  <a href="https://tsukumistudio.github.io/MornAudioProcessor/">
    <img src="https://img.shields.io/badge/Open-Web%20App-a3a825" alt="Open Web App" />
  </a>
  <img src="https://img.shields.io/github/license/TsukumiStudio/MornAudioProcessor" alt="License" />
</p>

## 概要

MornAudioProcessor は、MP3・WAV・OGG ファイルをブラウザ上で一括加工できる Web アプリケーションです。
ffmpeg.wasm を利用してクライアントサイドで処理を行うため、ファイルがサーバーにアップロードされることはありません。

**https://tsukumistudio.github.io/MornAudioProcessor/**

## 機能

- **フォーマット変換** — MP3 / WAV / OGG 間の相互変換
- **音量調整** — ラウドネス正規化（LUFS指定）または dB 単位の増減
- **トリミング** — 開始・終了時間を指定してカット
- **ビットレート変更** — 64k 〜 320k から選択
- **サンプルレート変更** — 44.1 kHz / 48 kHz
- **無音削除** — 先頭・末尾の無音を自動検出して除去（閾値調整可能）
- **プレビュー再生** — 変換前・変換後の音声をその場で試聴
- **ドラッグ&ドロップ** — ファイルをウィンドウにドロップして追加
- **一括処理** — 複数ファイルを順次処理、進捗をリアルタイム表示

## ライセンス

[The Unlicense](LICENSE)
