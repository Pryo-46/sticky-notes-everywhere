# 実装計画書：Web付箋拡張機能

## 1. 技術スタック

| 項目 | 技術 |
|------|------|
| 種別 | Chrome拡張機能（Manifest V3） |
| 言語 | TypeScript |
| UI | Vanilla DOM操作（フレームワークなし） |
| ビルド | Vite または esbuild |
| スタイル | CSS（Shadow DOM内に閉じ込め） |

※フレームワークを使わない理由：Content Scriptとして軽量に動作させるため

---

## 2. ファイル構成

```
sticky-note-extension/
├── src/
│   ├── manifest.json          # 拡張機能マニフェスト
│   ├── background.ts          # Service Worker（アイコンクリック検知）
│   ├── content/
│   │   ├── index.ts           # Content Script エントリポイント
│   │   ├── MenuBar.ts         # メニューバーUI
│   │   ├── StickyNote.ts      # 付箋クラス
│   │   ├── StickyManager.ts   # 付箋の管理（CRUD、表示状態）
│   │   ├── DragCreateHandler.ts # ドラッグで付箋作成
│   │   ├── DragMoveHandler.ts # ドラッグ移動処理
│   │   ├── ResizeHandler.ts   # リサイズ処理
│   │   ├── ExportHandler.ts   # エクスポート処理
│   │   └── styles.css         # スタイル
│   └── types/
│       └── index.ts           # 型定義
├── public/
│   └── icons/                 # 拡張機能アイコン
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. 型定義

```typescript
// types/index.ts

/** 付箋の色 */
type StickyColor = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'gray' | 'white';

/** 付箋のサイズプリセット */
type StickySize = 'small' | 'medium' | 'large';

/** 付箋のサイズ（ピクセル） */
interface StickyDimensions {
  width: number;
  height: number;
}

/** サイズプリセットの定義 */
const SIZE_PRESETS: Record<StickySize, StickyDimensions> = {
  small: { width: 200, height: 150 },
  medium: { width: 250, height: 200 },
  large: { width: 300, height: 250 },
};

/** 付箋データ */
interface StickyNoteData {
  id: string;
  text: string;
  color: StickyColor;
  position: { x: number; y: number };
  size: StickyDimensions;
  createdAt: number;
}
```

---

## 4. フェーズ別実装計画

### Phase 1: 基盤構築
**目標：拡張機能として動作する最小構成**

- [ ] プロジェクト初期化（Vite + TypeScript）
- [ ] manifest.json作成（Manifest V3）
- [ ] background.ts（Service Worker）でアイコンクリック検知
- [ ] Content Scriptの基本構成
- [ ] アイコンクリックでメニューバー表示/非表示

**完了条件：拡張機能アイコンクリックでメニューバーが表示/非表示される**

---

### Phase 2: メニューバーUI
**目標：メニューバーの見た目と基本動作**

- [ ] MenuBarクラス実装
  - 画面上部に固定表示
  - カラーパレット（7色）
  - サイズプリセット（S/M/L）
  - 各種アイコン（目・ゴミ箱・コピー・×）
- [ ] サイズ選択状態の管理
- [ ] ×ボタンでメニューバーを閉じる

**完了条件：メニューバーが表示され、サイズ選択ができる**

---

### Phase 3: ドラッグで付箋作成
**目標：カラーパレットからドラッグで付箋を作成**

- [ ] DragCreateHandler実装
  - カラーアイコンのdragstart
  - ドラッグ中のプレビュー表示
  - ドロップ位置に付箋を生成
- [ ] StickyNoteクラス実装
  - 付箋DOM要素の生成
  - ヘッダー部分（移動用、移動アイコン表示）
  - テキストエリア（入力・編集・選択）
  - 個別削除ボタン
- [ ] StickyManager実装
  - 付箋の追加・削除・一覧管理

**完了条件：色アイコンをドラッグ&ドロップで付箋が作成される**

---

### Phase 4: 付箋の移動
**目標：付箋を自由に移動できる**

- [ ] DragMoveHandler実装
  - mousedown/mousemove/mouseup イベント
  - position: fixed での座標更新
- [ ] 画面端での制限（画面外に出ないように）
- [ ] z-index管理（クリックで最前面へ）

**完了条件：付箋をドラッグして画面内の任意の位置に移動できる**

---

### Phase 5: リサイズ
**目標：付箋のサイズを変更できる**

- [ ] ResizeHandler実装
  - 右下角にリサイズハンドル（リサイズアイコン表示）
  - ドラッグでサイズ変更
- [ ] 最小サイズの制限
- [ ] 作成時は選択中のプリセットサイズを適用

**完了条件：ドラッグでサイズ変更できる、作成時はプリセットが適用される**

---

### Phase 6: 付箋の色・サイズ変更
**目標：作成後の付箋の色とサイズを変更できる**

- [ ] 付箋に色変更UI追加
  - クリックでカラーパレット表示
  - 色選択で即反映
- [ ] 付箋にサイズ変更UI追加
  - クリックでS/M/L選択表示
  - サイズ選択で即反映

**完了条件：既存の付箋の色とサイズをUIから変更できる**

---

### Phase 7: 一括操作
**目標：非表示/表示の切り替えと一括クリア**

- [ ] 一括非表示/表示トグル実装（目アイコン）
  - 表示状態をStickyManagerで管理
  - 全付箋のvisibilityを切り替え
  - アイコンの見た目も切り替え（Visibility ↔ VisibilityOff）
- [ ] 一括クリア実装（ゴミ箱アイコン）
  - 確認ダイアログ表示
  - 全付箋の削除

**完了条件：目アイコンで全付箋の非表示/表示、ゴミ箱で確認付き一括削除ができる**

---

### Phase 7: エクスポート
**目標：メモ一覧をクリップボードにコピー**

- [ ] ExportHandler実装
- [ ] 全付箋テキストの収集
- [ ] テキスト整形（番号付きリスト、色情報）
- [ ] Clipboard APIでコピー
- [ ] コピー完了のフィードバック表示（トースト等）

**完了条件：コピーアイコンクリックで全メモがクリップボードにコピーされる**

---

### Phase 9: 設定画面
目標：プリセットのカスタマイズ

 設定画面UI実装

メニューバーに歯車アイコン追加
モーダルまたはパネルで表示


 プリセットカラーのカスタマイズ

7色それぞれにカラーピッカー


 プリセットサイズのカスタマイズ

S/M/Lの幅・高さを数値入力


 設定の保存（chrome.storage.local）

完了条件：設定画面でプリセットの色とサイズを変更でき、次回以降も反映される
想定時間：2時間

### Phase 10: 仕上げ
目標：品質向上とリリース準備

 Shadow DOMで付箋・メニューバーのスタイルをカプセル化
 キーボードショートカット（メニューバー表示、付箋追加など）
 エッジケース対応

テキスト未入力の付箋をエクスポートから除外
画面リサイズ時の付箋位置調整


 アイコン作成（16x16, 48x48, 128x128）
 READMEの整備
 Chrome Web Store用の説明文・スクリーンショット準備

完了条件：Chrome Web Storeに公開できる状態


**完了条件：Chrome Web Storeに公開できる状態**

---

## 5. 実装上の注意点

### 5.1 Shadow DOMの使用
ホストページのCSSと干渉しないよう、付箋要素はShadow DOM内に配置する。

```typescript
const host = document.createElement('div');
const shadow = host.attachShadow({ mode: 'closed' });
// shadow内に付箋を追加
```

### 5.2 ドラッグ中のテキスト選択防止
```typescript
document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    e.preventDefault();
  }
});
```

### 5.3 z-indexの管理
付箋クリック時に最前面に移動させる。

```typescript
let maxZIndex = 10000;
note.style.zIndex = String(++maxZIndex);
```

### 5.4 Content ScriptとPopup間の通信
メモ一覧取得にはchrome.runtime.sendMessageを使用。

---

## 6. エクスポート形式（案）

```
# Web付箋メモ
URL: https://zenn.dev/example/article

1. [黄] ここの実装パターン参考になる
2. [青] エラーハンドリングの書き方
3. [ピンク] あとで試す
```

---

## 7. 見積もり（目安）

| フェーズ | 想定時間 |
|----------|----------|
| Phase 1 | 1時間 |
| Phase 2 | 2時間 |
| Phase 3 | 2時間 |
| Phase 4 | 1.5時間 |
| Phase 5 | 1.5時間 |
| Phase 6 | 1.5時間 |
| Phase 7 | 1時間 |
| Phase 8 | 1.5時間 |
| Phase 9 | 2時間 |
| Phase 10 | 2時間 |
| **合計** | **約16時間** |
