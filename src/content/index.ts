// Content Script エントリポイント
import { MenuBar } from './components/MenuBar';
import { StickyManager } from './managers/StickyManager';
import { DragCreateHandler } from './handlers/DragCreateHandler';
import { DragMoveHandler } from './handlers/DragMoveHandler';
import { ResizeHandler } from './handlers/ResizeHandler';
import { ExportHandler } from './handlers/ExportHandler';
import { getStorageService } from './services/ServiceContainer';
import { SettingsModal } from './components/SettingsModal';
import type { ExtensionMessage } from '../types';
import type { IStorageService } from './types/storage';

// シングルトンインスタンス
let menuBar: MenuBar | null = null;
let stickyManager: StickyManager | null = null;
let dragCreateHandler: DragCreateHandler | null = null;
let dragMoveHandler: DragMoveHandler | null = null;
let resizeHandler: ResizeHandler | null = null;
let exportHandler: ExportHandler | null = null;
let settingsModal: SettingsModal | null = null;
let storageService: IStorageService | null = null;

/** 全付箋データを保存 */
async function saveAllNotes(): Promise<void> {
  if (!stickyManager || !storageService) return;
  const notesData = stickyManager.getAllNotesData();
  await storageService.saveStickyNotes(notesData);
}

async function initialize(): Promise<void> {
  if (menuBar) return; // 既に初期化済み

  // ストレージサービスを取得し、設定を読み込む
  storageService = getStorageService();
  await storageService.loadSettings();

  // 各コンポーネントを初期化
  menuBar = new MenuBar();
  stickyManager = new StickyManager();
  dragCreateHandler = new DragCreateHandler(stickyManager, () => menuBar!.getSelectedSize());
  dragMoveHandler = new DragMoveHandler(stickyManager);
  resizeHandler = new ResizeHandler(stickyManager);
  exportHandler = new ExportHandler();
  settingsModal = new SettingsModal();

  // 付箋が作成されたときにドラッグ移動・リサイズ機能をセットアップ
  stickyManager.onNoteCreated((note) => {
    dragMoveHandler!.setupNote(note);
    resizeHandler!.setupNote(note);
    // データ変更時の保存コールバックを設定
    note.setOnDataChanged(() => saveAllNotes());
    // 新規作成時は即座に保存
    saveAllNotes();
  });

  // 付箋削除時に保存
  stickyManager.onNoteDeleted(() => {
    saveAllNotes();
  });

  // 保存済み付箋を復元
  const savedNotes = await storageService.loadStickyNotes();
  for (const noteData of savedNotes) {
    stickyManager.createNoteFromData(noteData);
  }

  // メニューバーのカラースウォッチにドラッグハンドラーを設定
  menuBar.onColorSwatchSetup((element, color) => {
    dragCreateHandler!.setupColorSwatch(element, color);
  });

  // 一括表示/非表示トグル
  menuBar.onVisibilityToggle(() => {
    return stickyManager!.toggleVisibility();
  });

  // 一括クリア
  menuBar.onClearAll(async () => {
    stickyManager!.clearAll();
    await storageService!.clearStickyNotes();
  });

  // クリップボードにコピー
  menuBar.onCopyAll(() => {
    exportHandler!.exportToClipboard(stickyManager!.getAllNotes());
  });

  // 設定画面を開く
  menuBar.onSettings(() => {
    settingsModal!.show();
  });

  // 設定保存後にメニューバーを更新
  settingsModal.onSettingsSaved(() => {
    menuBar!.updateColorSwatches();
    menuBar!.refreshStyles();
  });
}

async function getMenuBar(): Promise<MenuBar> {
  await initialize();
  return menuBar!;
}

// バックグラウンドスクリプトからのメッセージを受信
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.action === 'toggleMenu') {
    getMenuBar().then((menu) => {
      menu.toggle();
      sendResponse({ success: true });
    });
    return true; // 非同期レスポンスを示す
  }
  return false;
});

// ページ読み込み時に自動初期化
initialize().then(() => {
  console.log('Sticky Notes Everywhere: 自動初期化完了');
});
