// Service Worker for Sticky Notes Everywhere
// アイコンクリック時にContent Scriptにメッセージを送信

const DISABLED_PAGES_KEY = 'stickyNotesDisabledPages';

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

/** 無効化ページ一覧を読み込む */
async function loadDisabledPages(): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get(DISABLED_PAGES_KEY);
    return (result[DISABLED_PAGES_KEY] as string[]) || [];
  } catch {
    return [];
  }
}

/** ページの無効化状態をトグル */
async function togglePageDisabled(url: string): Promise<boolean> {
  const disabledPages = await loadDisabledPages();
  const index = disabledPages.indexOf(url);

  if (index >= 0) {
    disabledPages.splice(index, 1);
    await chrome.storage.local.set({ [DISABLED_PAGES_KEY]: disabledPages });
    return false;
  } else {
    disabledPages.push(url);
    await chrome.storage.local.set({ [DISABLED_PAGES_KEY]: disabledPages });
    return true;
  }
}

/** アイコンのバッジを更新 */
async function updateBadge(tabId: number, isDisabled: boolean): Promise<void> {
  if (isDisabled) {
    await chrome.action.setBadgeText({ tabId, text: 'OFF' });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#666666' });
  } else {
    await chrome.action.setBadgeText({ tabId, text: '' });
  }
}

/** タブのURLに基づいてバッジを更新 */
async function updateBadgeForTab(tabId: number, url: string | undefined): Promise<void> {
  const pageUrl = getPageUrl(url);
  if (!pageUrl) return;

  const disabledPages = await loadDisabledPages();
  const isDisabled = disabledPages.includes(pageUrl);
  await updateBadge(tabId, isDisabled);
}

// タブが更新されたときにバッジを更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await updateBadgeForTab(tabId, tab.url);
  }
});

// タブがアクティブになったときにバッジを更新
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  await updateBadgeForTab(activeInfo.tabId, tab.url);
});

/** 無効化状態をトグルして結果を返す */
async function handleToggleDisabled(tabId: number, url: string): Promise<void> {
  const pageUrl = getPageUrl(url);
  if (!pageUrl) return;

  const isNowDisabled = await togglePageDisabled(pageUrl);
  await updateBadge(tabId, isNowDisabled);

  // コンテキストメニューのタイトルを更新
  chrome.contextMenus.update('toggleStickyNotes', {
    title: isNowDisabled ? 'このページで付箋を有効化' : 'このページで付箋を無効化',
  });

  // Content Scriptにメッセージを送信
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'toggleDisabled' });
  } catch {
    // Content Scriptがない場合は無視
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  // 左クリックで無効化をトグル
  await handleToggleDisabled(tab.id, tab.url);
});

// コンテキストメニューを作成
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'toggleStickyNotes',
    title: 'このページで付箋を無効化',
    contexts: ['action'],
  });
});

// コンテキストメニューのクリックを処理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'toggleStickyNotes' && tab?.id && tab?.url) {
    await handleToggleDisabled(tab.id, tab.url);
  }
});
