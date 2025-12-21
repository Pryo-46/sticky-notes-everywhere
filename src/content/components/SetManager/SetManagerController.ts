import type { PageHistory, StickyNoteData, StickyNoteSet } from '../../../types';
import { ICONS } from '../../icons';

export type LoadMode = 'replace' | 'merge';

export interface SetManagerCallbacks {
  onClose?: () => void;
  onSaveCurrentNotes?: (name: string) => void;
  onOverwriteSet?: (setId: string) => void;
  onLoadSet?: (notes: StickyNoteData[], mode: LoadMode) => void;
  onDeleteSet?: (setId: string) => void;
  onRenameSet?: (setId: string, newName: string) => void;
  onLoadHistory?: (notes: StickyNoteData[], mode: LoadMode) => void;
  onClearHistory?: () => void;
}

/**
 * SetManagerのイベント処理を担当
 */
export class SetManagerController {
  private callbacks: SetManagerCallbacks = {};
  private sets: StickyNoteSet[] = [];
  private history: PageHistory[] = [];

  public setCallbacks(callbacks: SetManagerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public setData(sets: StickyNoteSet[], history: PageHistory[]): void {
    this.sets = sets;
    this.history = history;
  }

  public setupEventListeners(modal: HTMLDivElement): void {
    this.setupCloseButton(modal);
    this.setupSaveButton(modal);
    this.setupOverwriteButtons(modal);
    this.setupSetList(modal);
    this.setupHistoryList(modal);
    this.setupClearHistoryButton(modal);
    this.setupOverlayClick(modal);
  }

  private setupCloseButton(modal: HTMLDivElement): void {
    modal.querySelector('.close-btn')?.addEventListener('click', () => {
      this.callbacks.onClose?.();
    });
  }

  private setupOverlayClick(modal: HTMLDivElement): void {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.callbacks.onClose?.();
      }
    });
  }

  private setupSaveButton(modal: HTMLDivElement): void {
    modal.querySelector('.save-current-btn')?.addEventListener('click', () => {
      this.showNameInputDialog(modal, '新しいセットとして保存', '', (name) => {
        if (name.trim()) {
          this.callbacks.onSaveCurrentNotes?.(name.trim());
        }
      });
    });
  }

  private setupOverwriteButtons(modal: HTMLDivElement): void {
    modal.querySelectorAll('.overwrite-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const setId = (btn as HTMLElement).dataset.setId;
        const set = this.sets.find((s) => s.id === setId);
        if (set) {
          this.showOverwriteConfirmDialog(modal, set.name, () => {
            this.callbacks.onOverwriteSet?.(set.id);
          });
        }
      });
    });
  }

  private showOverwriteConfirmDialog(
    modal: HTMLDivElement,
    setName: string,
    onConfirm: () => void
  ): void {
    const overlay = document.createElement('div');
    overlay.className = 'name-input-overlay';
    overlay.innerHTML = `
      <div class="name-input-dialog">
        <h3>上書き保存の確認</h3>
        <p style="margin: 0 0 16px; color: #495057; font-size: 14px;">
          「${this.escapeHtml(setName)}」を現在の付箋で上書きしますか？
        </p>
        <div class="name-input-buttons">
          <button class="btn btn-secondary cancel-btn">キャンセル</button>
          <button class="btn btn-primary confirm-btn">上書き保存</button>
        </div>
      </div>
    `;

    const confirmBtn = overlay.querySelector('.confirm-btn') as HTMLButtonElement;
    const cancelBtn = overlay.querySelector('.cancel-btn') as HTMLButtonElement;

    const close = (): void => {
      overlay.remove();
    };

    confirmBtn.addEventListener('click', () => {
      onConfirm();
      close();
    });

    cancelBtn.addEventListener('click', close);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close();
      }
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        close();
      }
    });

    modal.appendChild(overlay);
    confirmBtn.focus();
  }

  private setupSetList(modal: HTMLDivElement): void {
    const setList = modal.querySelector('.set-list');
    if (!setList) return;

    setList.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // 編集ボタン
      const editBtn = target.closest('.action-btn.edit') as HTMLElement;
      if (editBtn) {
        e.stopPropagation();
        const setId = editBtn.dataset.setId;
        const set = this.sets.find((s) => s.id === setId);
        if (set) {
          this.showNameInputDialog(modal, 'セット名を編集', set.name, (newName) => {
            if (newName.trim() && newName.trim() !== set.name) {
              this.callbacks.onRenameSet?.(set.id, newName.trim());
            }
          });
        }
        return;
      }

      // 削除ボタン
      const deleteBtn = target.closest('.action-btn.delete') as HTMLElement;
      if (deleteBtn) {
        e.stopPropagation();
        const setId = deleteBtn.dataset.setId;
        const set = this.sets.find((s) => s.id === setId);
        if (set && window.confirm(`「${set.name}」を削除しますか？`)) {
          this.callbacks.onDeleteSet?.(set.id);
        }
        return;
      }

      // セットアイテムクリック
      const setItem = target.closest('.set-item') as HTMLElement;
      if (setItem) {
        const setId = setItem.dataset.setId;
        const set = this.sets.find((s) => s.id === setId);
        if (set) {
          this.showLoadDialog(modal, set.name, set.notes.length, 'set', (mode) => {
            this.callbacks.onLoadSet?.(set.notes, mode);
          });
        }
      }
    });
  }

  private setupHistoryList(modal: HTMLDivElement): void {
    const historyList = modal.querySelector('.history-list');
    if (!historyList) return;

    historyList.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const historyItem = target.closest('.history-item') as HTMLElement;

      if (historyItem) {
        const url = historyItem.dataset.url;
        const item = this.history.find((h) => h.url === url);
        if (item) {
          this.showLoadDialog(modal, item.title || item.url, item.notes.length, 'history', (mode) => {
            this.callbacks.onLoadHistory?.(item.notes, mode);
          });
        }
      }
    });
  }

  private setupClearHistoryButton(modal: HTMLDivElement): void {
    modal.querySelector('.clear-history-btn')?.addEventListener('click', () => {
      if (window.confirm('ページ履歴をすべて削除しますか？')) {
        this.callbacks.onClearHistory?.();
      }
    });
  }

  private showLoadDialog(
    modal: HTMLDivElement,
    name: string,
    noteCount: number,
    sourceType: 'set' | 'history',
    onConfirm: (mode: LoadMode) => void
  ): void {
    const sourceLabel = sourceType === 'set' ? 'セット' : '履歴';
    const overlay = document.createElement('div');
    overlay.className = 'load-dialog-overlay';
    overlay.innerHTML = `
      <div class="load-dialog">
        <h3>「${this.escapeHtml(name)}」を読み込み</h3>
        <p class="load-dialog-info">${noteCount}件の付箋</p>
        <p class="load-dialog-desc">
          <strong>置換:</strong> 現在の付箋を削除して${sourceLabel}の付箋を読み込みます<br>
          <strong>マージ:</strong> 現在の付箋に${sourceLabel}の付箋を追加して読み込みます
        </p>
        <div class="load-dialog-buttons">
          <button class="btn btn-secondary cancel-load-btn">キャンセル</button>
          <button class="btn btn-warning has-icon replace-btn">${ICONS.replace} 置換</button>
          <button class="btn btn-primary has-icon merge-btn">${ICONS.add} マージ</button>
        </div>
      </div>
    `;

    const cancelBtn = overlay.querySelector('.cancel-load-btn') as HTMLButtonElement;
    const replaceBtn = overlay.querySelector('.replace-btn') as HTMLButtonElement;
    const mergeBtn = overlay.querySelector('.merge-btn') as HTMLButtonElement;

    const close = (): void => {
      overlay.remove();
    };

    cancelBtn.addEventListener('click', close);

    replaceBtn.addEventListener('click', () => {
      onConfirm('replace');
      close();
    });

    mergeBtn.addEventListener('click', () => {
      onConfirm('merge');
      close();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close();
      }
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        close();
      }
    });

    modal.appendChild(overlay);
    mergeBtn.focus();
  }

  private showNameInputDialog(
    modal: HTMLDivElement,
    title: string,
    defaultValue: string,
    onConfirm: (name: string) => void
  ): void {
    const overlay = document.createElement('div');
    overlay.className = 'name-input-overlay';
    overlay.innerHTML = `
      <div class="name-input-dialog">
        <h3>${this.escapeHtml(title)}</h3>
        <input type="text" class="name-input-field" value="${this.escapeHtml(defaultValue)}" placeholder="セット名を入力...">
        <div class="name-input-buttons">
          <button class="btn btn-secondary cancel-name-btn">キャンセル</button>
          <button class="btn btn-primary confirm-name-btn">保存</button>
        </div>
      </div>
    `;

    const input = overlay.querySelector('.name-input-field') as HTMLInputElement;
    const confirmBtn = overlay.querySelector('.confirm-name-btn') as HTMLButtonElement;
    const cancelBtn = overlay.querySelector('.cancel-name-btn') as HTMLButtonElement;

    const close = (): void => {
      overlay.remove();
    };

    const confirm = (): void => {
      onConfirm(input.value);
      close();
    };

    confirmBtn.addEventListener('click', confirm);
    cancelBtn.addEventListener('click', close);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        confirm();
      } else if (e.key === 'Escape') {
        close();
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close();
      }
    });

    modal.appendChild(overlay);
    input.focus();
    input.select();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
