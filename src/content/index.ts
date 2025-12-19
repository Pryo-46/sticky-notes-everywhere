// Content Script エントリポイント
import { MenuBar } from './MenuBar';
import { StickyManager } from './StickyManager';
import { DragCreateHandler } from './DragCreateHandler';
import { DragMoveHandler } from './DragMoveHandler';
import { ResizeHandler } from './ResizeHandler';
import { ExportHandler } from './ExportHandler';
import { StorageService } from './StorageService';
import { SettingsModal } from './SettingsModal';
import type { ExtensionMessage } from '../types';

// シングルトンインスタンス
let menuBar: MenuBar | null = null;
let stickyManager: StickyManager | null = null;
let dragCreateHandler: DragCreateHandler | null = null;
let dragMoveHandler: DragMoveHandler | null = null;
let resizeHandler: ResizeHandler | null = null;
let exportHandler: ExportHandler | null = null;
let settingsModal: SettingsModal | null = null;
let storageService: StorageService | null = null;

async function initialize(): Promise<void> {
  if (menuBar) return; // 既に初期化済み

  // ストレージサービスを初期化し、設定を読み込む
  storageService = StorageService.getInstance();
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
  });

  // メニューバーのカラースウォッチにドラッグハンドラーを設定
  menuBar.onColorSwatchSetup((element, color) => {
    dragCreateHandler!.setupColorSwatch(element, color);
  });

  // 一括表示/非表示トグル
  menuBar.onVisibilityToggle(() => {
    return stickyManager!.toggleVisibility();
  });

  // 一括クリア
  menuBar.onClearAll(() => {
    stickyManager!.clearAll();
  });

  // クリップボードにコピー
  menuBar.onCopyAll(() => {
    exportHandler!.exportToClipboard(stickyManager!.getAllNotes());
  });

  // 設定画面を開く
  menuBar.onSettings(() => {
    settingsModal!.show();
  });

  // 設定保存後にメニューバーの色を更新
  settingsModal.onSettingsSaved(() => {
    menuBar!.updateColorSwatches();
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

// 初期化ログ
console.log('Sticky Notes Everywhere: Content Script loaded');
