# Sticky Notes Everywhere - Claude Code Guide

このドキュメントはClaude Codeがプロジェクトを理解するためのガイドです。

## プロジェクト概要

Webページ上に付箋を貼り付けられるChrome拡張機能。TypeScript + Vite で構築。

## ビルドとテスト

```bash
npm install      # 依存関係のインストール
npm run build    # dist/ にビルド出力
npm run dev      # 開発モード（ファイル監視）
```

テストフレームワークは未導入。

## アーキテクチャ

### エントリーポイント

| ファイル | 役割 |
|---------|------|
| `src/background.ts` | Service Worker。拡張機能アイコンクリックを処理 |
| `src/content/index.ts` | Content Script。UIコンポーネントの初期化と統合 |

### ディレクトリ構造

```
src/
├── background.ts              # Service Worker
├── types/index.ts             # グローバル型定義
└── content/
    ├── index.ts               # Content Script エントリーポイント
    ├── constants.ts           # 定数（サイズ制限、閾値など）
    ├── icons.ts               # SVGアイコン
    ├── components/            # UIコンポーネント
    │   ├── MenuBar/           # メニューバー（Controller/Rendererパターン）
    │   ├── StickyNote/        # 付箋コンポーネント
    │   └── SettingsModal/     # 設定モーダル（Controller/Rendererパターン）
    ├── managers/              # 状態管理
    │   ├── StickyManager.ts   # 付箋の一元管理
    │   ├── StorageService.ts  # Chrome Storage API ラッパー（シングルトン）
    │   └── ZIndexManager.ts   # z-indexオーバーフロー防止
    ├── handlers/              # イベントハンドラ
    │   ├── DragCreateHandler.ts  # ドラッグで付箋作成
    │   ├── DragMoveHandler.ts    # 付箋の移動
    │   ├── ResizeHandler.ts      # 付箋のリサイズ
    │   └── ExportHandler.ts      # クリップボードへコピー
    ├── services/
    │   └── ServiceContainer.ts   # 依存性注入コンテナ
    ├── styles/                # CSS-in-TS スタイル
    └── utils/                 # ユーティリティ
        ├── shadowDOM.ts       # Shadow DOM生成
        └── colorUtils.ts      # 色の輝度計算
```

### 設計パターン

#### Controller/Renderer パターン
MenuBarとSettingsModalで採用。3つのファイルに分割：
- `*.ts` - メインファサード（状態管理、ライフサイクル）
- `*Controller.ts` - イベントハンドリング
- `*Renderer.ts` - HTML生成のみ

#### シングルトン
- `StorageService.getInstance()` - アプリ全体で単一インスタンス

#### コールバック/オブザーバー
- `MenuBar.onColorSwatchSetup()`, `onVisibilityToggle()`
- `StickyManager.onNoteCreated()`, `onNoteDeleted()`

#### Shadow DOM分離
各コンポーネントは独自のShadow DOM内にレンダリング。ページのCSSと干渉しない。

## 主要コンポーネント

### MenuBar
メインUI。バーモード（上下左右）またはフローティングモード（ドラッグ可能）。
- カラースワッチ（ドラッグで付箋作成）
- サイズボタン（S/M/L）
- アクションボタン（表示切替、全コピー、全削除、設定）

### StickyNote
個別の付箋。ドラッグ移動、リサイズ、テキスト編集、色変更が可能。
1秒のデバウンスで自動保存。

### StickyManager
全付箋の中央管理。作成・削除・表示切替・ストレージからの復元を担当。

### StorageService
Chrome Storage APIのラッパー。2つのキーを使用：
- `stickyNotesSettings` - 設定（色、サイズ、UIレイアウト）
- `stickyNotesData` - 付箋データ（内容、位置）

## 型定義（src/types/index.ts）

| 型 | 説明 |
|---|------|
| `StickyColor` | 8色のユニオン型 |
| `StickySize` | 'small' \| 'medium' \| 'large' |
| `StickyNoteData` | 付箋の永続化データ構造 |
| `ExtensionSettings` | 全ユーザー設定 |
| `MenuBarMode` | 'bar' \| 'floating' |
| `MenuBarPosition` | 'top' \| 'bottom' \| 'left' \| 'right' |

## コンポーネント間の通信フロー

```
拡張機能アイコンクリック
    ↓
background.ts → "toggleMenu" メッセージ送信
    ↓
content/index.ts
    ├→ MenuBar 初期化
    ├→ StickyManager 初期化
    ├→ 各Handler 初期化
    └→ コールバック登録
    ↓
MenuBar
    ├→ カラースワッチドラッグ → DragCreateHandler
    └→ 設定クリック → SettingsModal
    ↓
StickyManager
    ├→ StickyNote 作成
    └→ onNoteCreated コールバック実行
    ↓
StorageService → chrome.storage.local に永続化
```

## 定数（src/content/constants.ts）

- `MIN_STICKY_WIDTH`: 150px
- `MIN_STICKY_HEIGHT`: 100px
- `MIN_VISIBLE_AREA`: 50px（画面端での最小表示領域）
- `DRAG_THRESHOLD`: 5px（クリックとドラッグの識別）
- `DRAG_PREVIEW_ZINDEX`: 2147483647（最大安全z-index）

## 注意点

- Shadow DOMを使用しているため、通常のDOM操作ではコンポーネント内部にアクセスできない
- z-indexオーバーフロー防止のため、ZIndexManagerが自動的にリバランスを行う
- 色に応じてテキスト色が自動調整される（colorUtils.ts）
