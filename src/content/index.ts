// Content Script エントリポイント
import { MenuBar } from './MenuBar';
import { StickyManager } from './StickyManager';
import { DragCreateHandler } from './DragCreateHandler';
import { DragMoveHandler } from './DragMoveHandler';
import { ResizeHandler } from './ResizeHandler';
import { ExportHandler } from './ExportHandler';
import type { ExtensionMessage } from '../types';

// シングルトンインスタンス
let menuBar: MenuBar | null = null;
let stickyManager: StickyManager | null = null;
let dragCreateHandler: DragCreateHandler | null = null;
let dragMoveHandler: DragMoveHandler | null = null;
let resizeHandler: ResizeHandler | null = null;
let exportHandler: ExportHandler | null = null;

function initialize(): void {
  if (menuBar) return; // 既に初期化済み

  // 各コンポーネントを初期化
  menuBar = new MenuBar();
  stickyManager = new StickyManager();
  dragCreateHandler = new DragCreateHandler(stickyManager, () => menuBar!.getSelectedSize());
  dragMoveHandler = new DragMoveHandler(stickyManager);
  resizeHandler = new ResizeHandler(stickyManager);
  exportHandler = new ExportHandler();

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
}

function getMenuBar(): MenuBar {
  initialize();
  return menuBar!;
}

// バックグラウンドスクリプトからのメッセージを受信
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.action === 'toggleMenu') {
    getMenuBar().toggle();
    sendResponse({ success: true });
  }
  return true;
});

// 初期化ログ
console.log('Sticky Notes Everywhere: Content Script loaded');
