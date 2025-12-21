import type { PageHistory, StickyNoteSet } from '../../../types';
import { ICONS } from '../../icons';

/**
 * SetManagerのHTML生成を担当
 */
export class SetManagerRenderer {
  public renderModal(sets: StickyNoteSet[], history: PageHistory[], hasCurrentNotes: boolean): string {
    const disabledClass = hasCurrentNotes ? '' : ' disabled';
    const disabledAttr = hasCurrentNotes ? '' : ' disabled';

    return `
      <div class="set-manager-modal">
        <div class="set-manager-header">
          <h2>付箋の保存・読み込み</h2>
          <button class="close-btn" title="閉じる">${ICONS.close}</button>
        </div>
        <div class="set-manager-body">
          <div class="two-column-layout">
            <!-- 左列: 保存（上） + 読み込み（下） -->
            <div class="column column-left">
              <!-- 保存セクション -->
              <div class="set-manager-section save-section${disabledClass}">
                <div class="section-header">
                  <h2>${ICONS.save} 保存</h2>
                  ${!hasCurrentNotes ? '<span class="section-note">付箋がありません</span>' : ''}
                </div>
                <button class="save-current-btn"${disabledAttr}>
                  + 新しいセットとして保存...
                </button>
                <div class="save-list">
                  ${this.renderSaveSetList(sets, hasCurrentNotes)}
                </div>
              </div>

              <!-- 読み込みセクション -->
              <div class="set-manager-section load-section">
                <div class="section-header">
                  <h2>${ICONS.folder} 読み込み</h2>
                </div>
                <div class="set-list">
                  ${this.renderLoadSetList(sets)}
                </div>
              </div>
            </div>

            <!-- 右列: 自動バックアップ -->
            <div class="column column-right">
              <div class="set-manager-section">
                <div class="section-header">
                  <h2>${ICONS.history} 自動バックアップ</h2>
                  ${history.length > 0 ? '<button class="clear-history-btn">すべて削除</button>' : ''}
                </div>
                <div class="history-list">
                  ${this.renderHistoryList(history)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /** 保存セクション用: 上書きボタン付きのセット一覧 */
  private renderSaveSetList(sets: StickyNoteSet[], hasCurrentNotes: boolean): string {
    if (sets.length === 0) {
      return '<div class="empty-message">保存済みセットはありません</div>';
    }

    const disabledAttr = hasCurrentNotes ? '' : ' disabled';
    const sortedSets = [...sets].sort((a, b) => b.updatedAt - a.updatedAt);

    return sortedSets
      .map(
        (set) => `
          <div class="save-set-item">
            <div class="save-set-item-info">
              <div class="save-set-item-name">${this.escapeHtml(set.name)}</div>
              <div class="save-set-item-meta">${set.notes.length}件 - ${this.formatDate(set.updatedAt)}</div>
            </div>
            <button class="overwrite-btn" data-set-id="${set.id}"${disabledAttr}>上書き</button>
          </div>
        `
      )
      .join('');
  }

  /** 読み込みセクション用: 編集・削除ボタン付きのセット一覧 */
  private renderLoadSetList(sets: StickyNoteSet[]): string {
    if (sets.length === 0) {
      return '<div class="empty-message">保存済みセットはありません</div>';
    }

    const sortedSets = [...sets].sort((a, b) => b.updatedAt - a.updatedAt);

    return sortedSets
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

    const sortedHistory = [...history].sort((a, b) => b.savedAt - a.savedAt);

    return sortedHistory
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
