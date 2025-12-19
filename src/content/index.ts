// Content Script エントリポイント
import { MenuBar } from './MenuBar';
import type { ExtensionMessage } from '../types';

// メニューバーのシングルトンインスタンス
let menuBar: MenuBar | null = null;

function getMenuBar(): MenuBar {
  if (!menuBar) {
    menuBar = new MenuBar();
  }
  return menuBar;
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
