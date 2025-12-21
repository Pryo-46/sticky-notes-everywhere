// Service Worker for Sticky Notes Everywhere
// アイコンクリック時にContent Scriptにメッセージを送信

import type { BlacklistEntry } from './types';

const DISABLED_PAGES_KEY = 'stickyNotesDisabledPages';
const BLACKLIST_KEY = 'stickyNotesBlacklist';

// セッション無効化（メモリ内で管理）
const sessionDisabledPages = new Set<string>();

/** 現在のページURLを取得（ホスト+パス） */
function getPageUrl(url: string | undefined): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch {
    return '';
  }
}

/** URLからドメインを取得 */
function getDomain(url: string | undefined): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/** 無効化ページ一覧を読み込む（永続的） */
async function loadDisabledPages(): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get(DISABLED_PAGES_KEY);
    return (result[DISABLED_PAGES_KEY] as string[]) || [];
  } catch {
    return [];
  }
}

/** ブラックリストを読み込む */
async function loadBlacklist(): Promise<BlacklistEntry[]> {
  try {
    const result = await chrome.storage.local.get(BLACKLIST_KEY);
    return (result[BLACKLIST_KEY] as BlacklistEntry[]) || [];
  } catch {
    return [];
  }
}

/** ドメインがブラックリストに登録されているか */
async function isBlacklisted(url: string): Promise<boolean> {
  const domain = getDomain(url);
  if (!domain) return false;
  const blacklist = await loadBlacklist();
  return blacklist.some((entry) => entry.domain === domain);
}

/** ドメインをブラックリストに追加 */
async function addToBlacklist(domain: string): Promise<void> {
  const blacklist = await loadBlacklist();
  if (blacklist.some((entry) => entry.domain === domain)) {
    return;
  }
  blacklist.push({ domain, addedAt: Date.now() });
  await chrome.storage.local.set({ [BLACKLIST_KEY]: blacklist });
}

/** ドメインをブラックリストから削除 */
async function removeFromBlacklist(domain: string): Promise<void> {
  const blacklist = await loadBlacklist();
  const filtered = blacklist.filter((entry) => entry.domain !== domain);
  await chrome.storage.local.set({ [BLACKLIST_KEY]: filtered });
}

/** セッション無効化をトグル */
function toggleSessionDisabled(pageUrl: string): boolean {
  if (sessionDisabledPages.has(pageUrl)) {
    sessionDisabledPages.delete(pageUrl);
    return false;
  } else {
    sessionDisabledPages.add(pageUrl);
    return true;
  }
}

/** セッション無効化状態をチェック */
function isSessionDisabled(pageUrl: string): boolean {
  return sessionDisabledPages.has(pageUrl);
}

type BadgeState = 'none' | 'off' | 'blacklist';

/** アイコンのバッジを更新 */
async function updateBadge(tabId: number, state: BadgeState): Promise<void> {
  switch (state) {
    case 'off':
      await chrome.action.setBadgeText({ tabId, text: 'OFF' });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: '#666666' });
      break;
    case 'blacklist':
      await chrome.action.setBadgeText({ tabId, text: 'BL' });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: '#CC0000' });
      break;
    case 'none':
    default:
      await chrome.action.setBadgeText({ tabId, text: '' });
      break;
  }
}

/** タブのURLに基づいてバッジを更新 */
async function updateBadgeForTab(tabId: number, url: string | undefined): Promise<void> {
  const pageUrl = getPageUrl(url);
  if (!pageUrl || !url) return;

  // ブラックリストをチェック
  if (await isBlacklisted(url)) {
    await updateBadge(tabId, 'blacklist');
    return;
  }

  // セッション無効化をチェック
  if (isSessionDisabled(pageUrl)) {
    await updateBadge(tabId, 'off');
    return;
  }

  await updateBadge(tabId, 'none');
}

/** コンテキストメニューを更新 */
async function updateContextMenus(url: string | undefined): Promise<void> {
  const pageUrl = getPageUrl(url);
  const isBlacklistedDomain = url ? await isBlacklisted(url) : false;
  const isSessionOff = pageUrl ? isSessionDisabled(pageUrl) : false;

  // 全ての動的メニューを削除して再作成（visibleが効かないため）
  try {
    await chrome.contextMenus.remove('toggleSessionDisabled');
  } catch {
    // 存在しない場合は無視
  }
  try {
    await chrome.contextMenus.remove('addToBlacklist');
  } catch {
    // 存在しない場合は無視
  }
  try {
    await chrome.contextMenus.remove('removeFromBlacklist');
  } catch {
    // 存在しない場合は無視
  }

  if (isBlacklistedDomain) {
    // ブラックリスト解除メニューのみを表示
    chrome.contextMenus.create({
      id: 'removeFromBlacklist',
      title: 'このドメインのブラックリストを解除',
      contexts: ['action'],
    });
  } else {
    // セッション無効化メニューを表示
    chrome.contextMenus.create({
      id: 'toggleSessionDisabled',
      title: isSessionOff ? 'このページで一時的に有効化' : 'このページで一時的に無効化',
      contexts: ['action'],
    });

    // ブラックリスト追加メニューを表示
    chrome.contextMenus.create({
      id: 'addToBlacklist',
      title: 'このドメインを常に無効化',
      contexts: ['action'],
    });
  }
}

// タブが更新されたときにバッジを更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // loading時点でもURLが確定していればバッジを更新（早期表示）
  if (changeInfo.url || changeInfo.status === 'complete') {
    if (tab.url) {
      await updateBadgeForTab(tabId, tab.url);
      await updateContextMenus(tab.url);
    }
  }
});

// ナビゲーション開始時にバッジを更新（リロード対応）
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // メインフレームのみ
  if (details.frameId === 0) {
    await updateBadgeForTab(details.tabId, details.url);
    await updateContextMenus(details.url);
  }
});

// タブがアクティブになったときにバッジを更新
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  await updateBadgeForTab(activeInfo.tabId, tab.url);
  await updateContextMenus(tab.url);
});

/** セッション無効化をトグルして結果を返す */
async function handleToggleSessionDisabled(tabId: number, url: string): Promise<void> {
  const pageUrl = getPageUrl(url);
  if (!pageUrl) return;

  // ブラックリストに登録されている場合はセッション無効化できない
  if (await isBlacklisted(url)) {
    return;
  }

  const isNowDisabled = toggleSessionDisabled(pageUrl);
  await updateBadge(tabId, isNowDisabled ? 'off' : 'none');
  await updateContextMenus(url);

  // Content Scriptにメッセージを送信
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'toggleSessionDisabled', disabled: isNowDisabled });
  } catch {
    // Content Scriptがない場合は無視
  }
}

/** ブラックリストに追加 */
async function handleAddToBlacklist(tabId: number, url: string): Promise<void> {
  const domain = getDomain(url);
  if (!domain) return;

  await addToBlacklist(domain);
  await updateBadge(tabId, 'blacklist');
  await updateContextMenus(url);

  // Content Scriptにメッセージを送信
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'blacklistAdded', domain });
  } catch {
    // Content Scriptがない場合は無視
  }
}

/** ブラックリストから削除 */
async function handleRemoveFromBlacklist(tabId: number, url: string): Promise<void> {
  const domain = getDomain(url);
  if (!domain) return;

  await removeFromBlacklist(domain);
  await updateBadge(tabId, 'none');
  await updateContextMenus(url);

  // Content Scriptにメッセージを送信（再初期化を促す）
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'blacklistRemoved', domain });
  } catch {
    // Content Scriptがない場合は無視
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  // ブラックリストに登録されている場合は何もしない
  if (await isBlacklisted(tab.url)) {
    return;
  }

  // 左クリックでセッション無効化をトグル
  await handleToggleSessionDisabled(tab.id, tab.url);
});

// コンテキストメニューを作成
chrome.runtime.onInstalled.addListener(() => {
  // 既存のメニューを削除してから作成
  chrome.contextMenus.removeAll(() => {
    // toggleSessionDisabled / addToBlacklist / removeFromBlacklist は updateContextMenus で動的に作成

    chrome.contextMenus.create({
      id: 'separator',
      type: 'separator',
      contexts: ['action'],
    });

    chrome.contextMenus.create({
      id: 'manageBlacklist',
      title: 'ブラックリストを管理',
      contexts: ['action'],
    });
  });
});

// コンテキストメニューのクリックを処理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id || !tab?.url) return;

  switch (info.menuItemId) {
    case 'toggleSessionDisabled':
      await handleToggleSessionDisabled(tab.id, tab.url);
      break;
    case 'addToBlacklist':
      await handleAddToBlacklist(tab.id, tab.url);
      break;
    case 'removeFromBlacklist':
      await handleRemoveFromBlacklist(tab.id, tab.url);
      break;
    case 'manageBlacklist':
      chrome.runtime.openOptionsPage();
      break;
  }
});

// メッセージリスナー（Content Scriptからの問い合わせ用）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkStatus') {
    const url = sender.tab?.url;
    if (!url) {
      sendResponse({ sessionDisabled: false, blacklisted: false });
      return true;
    }

    const pageUrl = getPageUrl(url);
    (async () => {
      const blacklisted = await isBlacklisted(url);
      const sessionDisabled = isSessionDisabled(pageUrl);
      sendResponse({ sessionDisabled, blacklisted });
    })();
    return true;
  }

  return false;
});

// Service Worker起動時に全タブのバッジを更新
async function updateAllTabsBadges(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        await updateBadgeForTab(tab.id, tab.url);
      }
    }
  } catch {
    // エラーが発生する場合がある
  }
}

// 起動時に実行
updateAllTabsBadges();

// ストレージ変更を監視（オプションページからの変更を反映）
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[BLACKLIST_KEY]) {
    updateAllTabsBadges();
  }
});
