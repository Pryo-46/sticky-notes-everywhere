// Options page script for blacklist management
import type { BlacklistEntry } from './types';

const BLACKLIST_KEY = 'stickyNotesBlacklist';

/** ブラックリストを読み込む */
async function loadBlacklist(): Promise<BlacklistEntry[]> {
  try {
    const result = await chrome.storage.local.get(BLACKLIST_KEY);
    return (result[BLACKLIST_KEY] as BlacklistEntry[]) || [];
  } catch {
    return [];
  }
}

/** ブラックリストを保存 */
async function saveBlacklist(blacklist: BlacklistEntry[]): Promise<void> {
  await chrome.storage.local.set({ [BLACKLIST_KEY]: blacklist });
}

/** ドメインをブラックリストに追加 */
async function addToBlacklist(domain: string): Promise<boolean> {
  const blacklist = await loadBlacklist();
  if (blacklist.some((entry) => entry.domain === domain)) {
    return false; // 既に存在
  }
  blacklist.push({ domain, addedAt: Date.now() });
  await saveBlacklist(blacklist);
  return true;
}

/** ドメインをブラックリストから削除 */
async function removeFromBlacklist(domain: string): Promise<void> {
  const blacklist = await loadBlacklist();
  const filtered = blacklist.filter((entry) => entry.domain !== domain);
  await saveBlacklist(filtered);
}

/** 日付をフォーマット */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** ドメインを検証 */
function isValidDomain(domain: string): boolean {
  // 簡易的なドメイン検証
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

/** ブラックリストをレンダリング */
async function renderBlacklist(): Promise<void> {
  const container = document.getElementById('blacklist');
  if (!container) return;

  const blacklist = await loadBlacklist();

  if (blacklist.length === 0) {
    container.innerHTML = '<div class="empty-message">ブラックリストは空です</div>';
    return;
  }

  // 日付の新しい順にソート
  blacklist.sort((a, b) => b.addedAt - a.addedAt);

  container.innerHTML = blacklist
    .map(
      (entry) => `
    <div class="blacklist-item" data-domain="${entry.domain}">
      <div class="domain-info">
        <span class="domain-name">${entry.domain}</span>
        <span class="added-date">追加日: ${formatDate(entry.addedAt)}</span>
      </div>
      <button class="remove-btn" data-domain="${entry.domain}">削除</button>
    </div>
  `
    )
    .join('');

  // 削除ボタンにイベントを設定
  container.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLButtonElement;
      const domain = target.dataset.domain;
      if (domain) {
        await removeFromBlacklist(domain);
        await renderBlacklist();
      }
    });
  });
}

/** エラーメッセージを表示 */
function showError(message: string): void {
  const errorEl = document.getElementById('errorMessage');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 3000);
  }
}

/** 初期化 */
function init(): void {
  const domainInput = document.getElementById('domainInput') as HTMLInputElement;
  const addBtn = document.getElementById('addBtn') as HTMLButtonElement;

  // 追加ボタン
  addBtn.addEventListener('click', async () => {
    let domain = domainInput.value.trim().toLowerCase();

    // URLが入力された場合はドメインを抽出
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      try {
        const url = new URL(domain);
        domain = url.hostname;
      } catch {
        showError('無効なURLです');
        return;
      }
    }

    if (!domain) {
      showError('ドメインを入力してください');
      return;
    }

    if (!isValidDomain(domain)) {
      showError('無効なドメイン形式です');
      return;
    }

    const added = await addToBlacklist(domain);
    if (!added) {
      showError('このドメインは既に登録されています');
      return;
    }

    domainInput.value = '';
    await renderBlacklist();
  });

  // Enterキーで追加
  domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });

  // 初期表示
  renderBlacklist();

  // ストレージ変更を監視
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[BLACKLIST_KEY]) {
      renderBlacklist();
    }
  });
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', init);
