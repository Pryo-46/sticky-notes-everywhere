# ブラックリスト機能 実装計画

## 概要

現在の「一時的なOFF」機能に加えて、「永続的なブラックリスト（ドメイン単位）」を追加し、ブラックリスト管理画面を別タブで開けるようにする。

## 機能の整理

| 機能 | トリガー | 保存先 | 解除方法 |
|------|---------|--------|---------|
| 一時OFF | アイコン左クリック | メモリ（セッション） | 再度クリック or ブラウザ再起動 |
| ブラックリスト | 右クリックメニュー | chrome.storage | オプションページで削除 |

## UI/UX

### アイコンクリック時の動作
- **左クリック**: セッション無効化トグル（バッジ「OFF」表示）
- **右クリック**: コンテキストメニュー表示
  - 「このページで一時的に無効化」
  - 「このドメインを常に無効化」
  - 「ブラックリストを管理」

### バッジ表示
- セッション無効化: 「OFF」（グレー）
- ブラックリスト: 「BL」（赤）

### オプションページ
- ブラックリストに登録されたドメイン一覧
- 各ドメインの削除ボタン
- 手動でドメインを追加するフォーム

---

## 実装ステップ

### Step 1: 型定義の追加
**ファイル:** `src/types/index.ts`

```typescript
/** ブラックリストエントリ */
export interface BlacklistEntry {
  domain: string;
  addedAt: number;
}
```

### Step 2: StorageService の拡張
**ファイル:** `src/content/managers/StorageService.ts`, `src/content/types/storage.ts`

- ブラックリスト用ストレージキー追加: `stickyNotesBlacklist`
- メソッド追加:
  - `loadBlacklist(): Promise<BlacklistEntry[]>`
  - `addToBlacklist(domain: string): Promise<void>`
  - `removeFromBlacklist(domain: string): Promise<void>`
  - `isBlacklisted(url: string): Promise<boolean>`

### Step 3: background.ts の修正
**ファイル:** `src/background.ts`

- セッション無効化用の `Set<string>` をメモリ内で管理
- コンテキストメニューを拡張:
  - 「このページで一時的に無効化」（既存を変更）
  - 「このドメインを常に無効化」（新規）
  - 「ブラックリストを管理」（新規）
- 左クリック: セッション無効化トグル
- ブラックリスト判定を追加

### Step 4: content/index.ts の修正
**ファイル:** `src/content/index.ts`

- `initialize()` でブラックリストチェックを追加
- セッション無効化とブラックリストの両方を判定

### Step 5: オプションページの作成
**新規ファイル:**
- `public/options.html`
- `src/options.ts`

**内容:**
- ブラックリスト一覧表示
- ドメインの追加/削除
- シンプルなHTML/CSS

### Step 6: ビルド設定の更新
**ファイル:** `vite.config.ts`, `public/manifest.json`

- vite.config.ts: options エントリーポイント追加
- manifest.json: `options_ui` 設定追加

---

## 主要ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/types/index.ts` | BlacklistEntry 型追加 |
| `src/content/types/storage.ts` | IStorageService にメソッド追加 |
| `src/content/managers/StorageService.ts` | ブラックリスト管理メソッド追加 |
| `src/background.ts` | セッション管理 + コンテキストメニュー拡張 |
| `src/content/index.ts` | 初期化時のブラックリストチェック |
| `public/manifest.json` | options_ui 追加 |
| `vite.config.ts` | options エントリーポイント追加 |
| `public/options.html` | 新規作成 |
| `src/options.ts` | 新規作成 |

---

## 処理フロー

```
ページ読み込み
    ↓
Step 1: ブラックリストチェック（ドメイン単位）
    isBlacklisted(domain) → true → 初期化しない（BLバッジ）
    ↓ false
Step 2: セッション無効化チェック
    isSessionDisabled(pageUrl) → true → 初期化しない（OFFバッジ）
    ↓ false
Step 3: 通常初期化
    → メニューバー表示
```
