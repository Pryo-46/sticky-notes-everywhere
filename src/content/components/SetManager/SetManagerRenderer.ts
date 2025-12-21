import type { PageHistory, StickyNoteSet } from '../../../types';
import { ICONS } from '../../icons';

/**
 * SetManagerのHTML生成を担当
 */
export class SetManagerRenderer {
  public renderModal(sets: StickyNoteSet[], history: PageHistory[], hasCurrentNotes: boolean): string {
    return `
      <div class="set-manager-modal">
        <div class="set-manager-header">
          <h2>付箋セット管理</h2>
          <button class="close-btn" title="閉じる">${ICONS.close}</button>
        </div>
        <div class="set-manager-body">
          <button class="save-current-btn"${!hasCurrentNotes ? ' disabled' : ''}>
            現在の付箋を保存...
          </button>

          <div class="set-manager-section">
            <div class="section-header">
              <h3>${ICONS.folder} 保存済みセット</h3>
            </div>
            <div class="set-list">
              ${this.renderSetList(sets)}
            </div>
          </div>

          <div class="set-manager-section">
            <div class="section-header">
              <h3>${ICONS.history} ページ履歴</h3>
              ${history.length > 0 ? '<button class="clear-history-btn">履歴をすべて削除</button>' : ''}
            </div>
            <div class="history-list">
              ${this.renderHistoryList(history)}
            </div>
          </div>
        </div>
        <div class="load-options">
          <span class="load-options-label">読み込み方法:</span>
          <label class="load-option">
            <input type="radio" name="loadMode" value="replace" checked>
            <span>置換</span>
          </label>
          <label class="load-option">
            <input type="radio" name="loadMode" value="merge">
            <span>マージ（追加）</span>
          </label>
        </div>
      </div>
    `;
  }

  private renderSetList(sets: StickyNoteSet[]): string {
    if (sets.length === 0) {
      return '<div class="empty-message">保存済みセットはありません</div>';
    }

    return sets
      .map(
        (set) => `
          <div class="set-item" data-set-id="${set.id}">
            <div class="set-item-info">
              <div class="set-item-name">${this.escapeHtml(set.name)}</div>
              <div class="set-item-meta">${set.notes.length}件の付箋 - ${this.formatDate(set.updatedAt)}</div>
            </div>
            <div class="set-item-actions">
              <button class="action-btn edit" title="名前を編集" data-set-id="${set.id}">${ICONS.edit}</button>
              <button class="action-btn delete" title="削除" data-set-id="${set.id}">${ICONS.delete}</button>
            </div>
          </div>
        `
      )
      .join('');
  }

  private renderHistoryList(history: PageHistory[]): string {
    if (history.length === 0) {
      return '<div class="empty-message">ページ履歴はありません</div>';
    }

    return history
      .map(
        (item) => `
          <div class="history-item" data-url="${this.escapeHtml(item.url)}">
            <div class="history-item-info">
              <div class="history-item-title">${this.escapeHtml(item.title || 'タイトルなし')}</div>
              <div class="history-item-url">${this.escapeHtml(item.url)}</div>
              <div class="history-item-meta">${item.notes.length}件の付箋 - ${this.formatDate(item.savedAt)}</div>
            </div>
          </div>
        `
      )
      .join('');
  }

  public renderNameInputDialog(title: string, defaultValue: string = ''): string {
    return `
      <div class="name-input-dialog">
        <h3>${this.escapeHtml(title)}</h3>
        <input type="text" class="name-input-field" value="${this.escapeHtml(defaultValue)}" placeholder="セット名を入力...">
        <div class="name-input-buttons">
          <button class="btn btn-secondary cancel-name-btn">キャンセル</button>
          <button class="btn btn-primary confirm-name-btn">保存</button>
        </div>
      </div>
    `;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
