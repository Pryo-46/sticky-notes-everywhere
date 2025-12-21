// Content Script エントリポイント
import { MenuBar } from './components/MenuBar';
import { StickyManager } from './managers/StickyManager';
import { DragCreateHandler } from './handlers/DragCreateHandler';
import { DragMoveHandler } from './handlers/DragMoveHandler';
import { ResizeHandler } from './handlers/ResizeHandler';
import { ExportHandler } from './handlers/ExportHandler';
import { KeyboardShortcutHandler } from './handlers/KeyboardShortcutHandler';
import { getStorageService } from './services/ServiceContainer';
import { SettingsModal } from './components/SettingsModal';
import { SetManager } from './components/SetManager';
import type { ExtensionMessage, PageHistory, StickyNoteData } from '../types';
import type { IStorageService } from './types/storage';
import type { LoadMode } from './components/SetManager/SetManagerController';

// シングルトンインスタンス
let menuBar: MenuBar | null = null;
let stickyManager: StickyManager | null = null;
let dragCreateHandler: DragCreateHandler | null = null;
let dragMoveHandler: DragMoveHandler | null = null;
let resizeHandler: ResizeHandler | null = null;
let exportHandler: ExportHandler | null = null;
let keyboardShortcutHandler: KeyboardShortcutHandler | null = null;
let settingsModal: SettingsModal | null = null;
let setManager: SetManager | null = null;
let storageService: IStorageService | null = null;

/** 現在のページURLを取得（ホスト+パス） */
function getCurrentPageUrl(): string {
  return window.location.origin + window.location.pathname;
}

/** ページ履歴を保存 */
async function savePageHistory(): Promise<void> {
  if (!stickyManager || !storageService) return;

  const notesData = stickyManager.getAllNotesData();
  // 付箋がない場合は履歴を保存しない
  if (notesData.length === 0) return;

  const history: PageHistory = {
    url: getCurrentPageUrl(),
    title: document.title || getCurrentPageUrl(),
    notes: notesData,
    savedAt: Date.now(),
  };

  await storageService.savePageHistory(history);
}

/** 全付箋データを保存 */
async function saveAllNotes(): Promise<void> {
  if (!stickyManager || !storageService) return;
  const notesData = stickyManager.getAllNotesData();
  await storageService.saveStickyNotes(notesData, getCurrentPageUrl());
}

/** 付箋データを保存し、ページ履歴も更新 */
async function saveAllNotesWithHistory(): Promise<void> {
  await saveAllNotes();
  await savePageHistory();
}

/** 付箋を読み込む（置換またはマージ） */
function loadNotes(notes: StickyNoteData[], mode: LoadMode): void {
  if (!stickyManager || !storageService) return;

  if (mode === 'replace') {
    // 既存の付箋をすべて削除
    stickyManager.clearAll();
  }

  // 付箋を作成（マージの場合はIDを再生成）
  for (const noteData of notes) {
    if (mode === 'merge') {
      // マージの場合は新しいIDで作成
      const newData = {
        ...noteData,
        id: `sticky-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };
      stickyManager.createNoteFromData(newData);
    } else {
      stickyManager.createNoteFromData(noteData);
    }
  }

  // 保存
  saveAllNotes();
}

async function initialize(): Promise<void> {
  if (menuBar) return; // 既に初期化済み

  // ストレージサービスを取得し、設定を読み込む
  storageService = getStorageService();
  const settings = await storageService.loadSettings();

  // 各コンポーネントを初期化
  menuBar = new MenuBar();
  stickyManager = new StickyManager();
  dragCreateHandler = new DragCreateHandler(stickyManager, () => menuBar!.getSelectedSize());
  dragMoveHandler = new DragMoveHandler(stickyManager);
  resizeHandler = new ResizeHandler(stickyManager);
  exportHandler = new ExportHandler();
  keyboardShortcutHandler = new KeyboardShortcutHandler(
    stickyManager,
    () => menuBar!.getSelectedSize(),
    () => stickyManager!.toggleVisibility(),
    async () => {
      stickyManager!.clearAll();
      await storageService!.clearStickyNotes();
    },
    () => {
      exportHandler!.exportToClipboard(stickyManager!.getAllNotes());
    }
  );
  settingsModal = new SettingsModal();
  setManager = new SetManager({
    getCurrentNotes: () => stickyManager!.getAllNotesData(),
  });

  // SetManagerの読み込みコールバックを設定
  setManager.onLoadNotes((notes, mode) => {
    loadNotes(notes, mode);
  });

  // 付箋が作成されたときにドラッグ移動・リサイズ機能をセットアップ
  stickyManager.onNoteCreated((note) => {
    dragMoveHandler!.setupNote(note);
    resizeHandler!.setupNote(note);
    // データ変更時の保存コールバックを設定（履歴も更新）
    note.setOnDataChanged(() => saveAllNotesWithHistory());
    // 新規作成時は即座に保存（履歴も更新）
    saveAllNotesWithHistory();
  });

  // 付箋削除時に保存（履歴も更新）
  stickyManager.onNoteDeleted(() => {
    saveAllNotesWithHistory();
  });

  // ピン留め時は保存済み付箋を復元
  if (settings.stickyPinned) {
    const savedNotes = await storageService.loadStickyNotes();
    if (savedNotes.length > 0) {
      for (const noteData of savedNotes) {
        stickyManager.createNoteFromData(noteData);
      }
    }
  } else {
    // ピン留めがオフの場合は保存済み付箋をクリア
    await storageService.clearStickyNotes();
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

  // セット管理画面を開く
  menuBar.onSetManager(() => {
    setManager!.show();
  });

  // 設定保存後にメニューバーと付箋を更新
  settingsModal.onSettingsSaved(() => {
    menuBar!.updateColorSwatches();
    menuBar!.refreshStyles();
    stickyManager!.refreshAllColors();
  });

  // autoShowMenuがオンの場合、メニューを自動展開
  if (settings.autoShowMenu) {
    menuBar.show();
  }
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

// ページ離脱時に履歴を保存
window.addEventListener('beforeunload', () => {
  // 同期的に保存を試みる（beforeunloadでは非同期が保証されない）
  if (stickyManager && storageService) {
    const notesData = stickyManager.getAllNotesData();
    if (notesData.length > 0) {
      const history: PageHistory = {
        url: getCurrentPageUrl(),
        title: document.title || getCurrentPageUrl(),
        notes: notesData,
        savedAt: Date.now(),
      };
      // sendBeaconは使えないのでローカルストレージへの非同期保存を試みる
      storageService.savePageHistory(history);
    }
  }
});

// ページ読み込み時に自動初期化
initialize().then(() => {
  //console.log('Sticky Notes Everywhere: 自動初期化完了');
});
