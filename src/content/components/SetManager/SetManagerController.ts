import type { PageHistory, StickyNoteData, StickyNoteSet } from '../../../types';

export type LoadMode = 'replace' | 'merge';

export interface SetManagerCallbacks {
  onClose?: () => void;
  onSaveCurrentNotes?: (name: string) => void;
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
  private loadMode: LoadMode = 'replace';
  private sets: StickyNoteSet[] = [];
  private history: PageHistory[] = [];

  public setCallbacks(callbacks: SetManagerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public setData(sets: StickyNoteSet[], history: PageHistory[]): void {
    this.sets = sets;
    this.history = history;
  }

  public getLoadMode(): LoadMode {
    return this.loadMode;
  }

  public setupEventListeners(modal: HTMLDivElement): void {
    this.setupCloseButton(modal);
    this.setupSaveButton(modal);
    this.setupSetList(modal);
    this.setupHistoryList(modal);
    this.setupLoadOptions(modal);
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
      this.showNameInputDialog(modal, '現在の付箋を保存', '', (name) => {
        if (name.trim()) {
          this.callbacks.onSaveCurrentNotes?.(name.trim());
        }
      });
    });
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
          if (this.loadMode === 'replace' && !window.confirm('現在の付箋を置き換えますか？')) {
            return;
          }
          this.callbacks.onLoadSet?.(set.notes, this.loadMode);
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
          if (this.loadMode === 'replace' && !window.confirm('現在の付箋を置き換えますか？')) {
            return;
          }
          this.callbacks.onLoadHistory?.(item.notes, this.loadMode);
        }
      }
    });
  }

  private setupLoadOptions(modal: HTMLDivElement): void {
    modal.querySelectorAll('input[name="loadMode"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.loadMode = target.value as LoadMode;
      });
    });
  }

  private setupClearHistoryButton(modal: HTMLDivElement): void {
    modal.querySelector('.clear-history-btn')?.addEventListener('click', () => {
      if (window.confirm('ページ履歴をすべて削除しますか？')) {
        this.callbacks.onClearHistory?.();
      }
    });
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
