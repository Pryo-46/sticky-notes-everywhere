// Service Worker for Sticky Notes Everywhere
// アイコンクリック時にContent Scriptにメッセージを送信

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // まずメッセージを送信してみる（Content Scriptが既に存在するか確認）
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleMenu' });
    // 成功したら既に注入済み
    return;
  } catch {
    // Content Scriptがまだ存在しない場合、注入する
  }

  // Content Scriptを注入
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });

    // 注入後にメッセージを送信
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleMenu' });
  } catch (error) {
    console.error('Failed to inject or send message:', error);
  }
});
