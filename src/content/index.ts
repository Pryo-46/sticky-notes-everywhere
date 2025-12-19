// Content Script エントリポイント
import { MenuBar } from './MenuBar';
import { StickyManager } from './StickyManager';
import { DragCreateHandler } from './DragCreateHandler';
import type { ExtensionMessage } from '../types';

// シングルトンインスタンス
let menuBar: MenuBar | null = null;
let stickyManager: StickyManager | null = null;
let dragCreateHandler: DragCreateHandler | null = null;

function initialize(): void {
  if (menuBar) return; // 既に初期化済み

  // 各コンポーネントを初期化
  menuBar = new MenuBar();
  stickyManager = new StickyManager();
  dragCreateHandler = new DragCreateHandler(stickyManager, () => menuBar!.getSelectedSize());

  // メニューバーのカラースウォッチにドラッグハンドラーを設定
  menuBar.onColorSwatchSetup((element, color) => {
    dragCreateHandler!.setupColorSwatch(element, color);
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
