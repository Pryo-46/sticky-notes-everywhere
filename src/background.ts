// Service Worker for Sticky Notes Everywhere
// アイコンクリック時にContent Scriptにメッセージを送信

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // Content Scriptを注入（まだ注入されていない場合）
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
  } catch (error) {
    // 既に注入済みの場合はエラーになる可能性があるが無視
    console.log('Script injection skipped or failed:', error);
  }

  // Content Scriptにトグルメッセージを送信
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleMenu' });
  } catch (error) {
    console.error('Failed to send message:', error);
  }
});
