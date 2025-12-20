import type { StickyColor, StickyDimensions, StickyNoteData } from '../types';
import { StickyNote } from './StickyNote';
import { StorageService } from './StorageService';

export class StickyManager {
  private notes: Map<string, StickyNote> = new Map();
  private container: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private baseZIndex: number;
  private maxZIndex: number;
  private areNotesVisible = true;
  private onNoteCreatedCallback: ((note: StickyNote) => void) | null = null;

  constructor() {
    const settings = StorageService.getInstance().getSettings();
    this.baseZIndex = settings.baseZIndex;
    this.maxZIndex = this.baseZIndex;
    // Shadow DOMホストを作成
    this.container = document.createElement('div');
    this.container.id = 'sticky-notes-container';
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });

    // スタイルを注入
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot.appendChild(style);

    document.body.appendChild(this.container);
  }

  private getStyles(): string {
    return `
      .sticky-note {
        position: fixed;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-sizing: border-box;
      }

      .sticky-note-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        cursor: grab;
        user-select: none;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        min-height: 24px;
      }

      .sticky-note-header:active {
        cursor: grabbing;
      }

      .drag-icon {
        color: rgba(0, 0, 0, 0.3);
        font-size: 12px;
        letter-spacing: -2px;
        display: flex;
        align-items: center;
      }

      .sticky-note-header-actions {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 6px;
      }

      .sticky-note-action-btn {
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.8);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: all 0.15s ease;
        line-height: 0;
      }

      .sticky-note-action-btn svg {
        display: block;
      }

      .sticky-note-action-btn:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #333;
      }

      .sticky-note-delete:hover {
        background: rgba(255, 0, 0, 0.15);
        color: #e03131;
      }

      .sticky-note-copy.copied {
        background: rgba(47, 158, 68, 0.2);
      }

      /* カラーピッカー */
      .sticky-note-picker {
        position: absolute;
        top: 28px;
        right: 4px;
        background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        padding: 8px;
        z-index: 2147483645;
        display: flex;
        gap: 6px;
      }

      .sticky-note-color-picker {
        flex-wrap: wrap;
        width: 116px;
      }

      .sticky-note-picker-swatch {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .sticky-note-picker-swatch:hover {
        transform: scale(1.1);
      }

      .sticky-note-picker-swatch.active {
        border-color: #333;
      }

      .sticky-note-textarea {
        flex: 1;
        border: none;
        background: transparent;
        resize: none;
        padding: 8px;
        font-size: 14px;
        font-family: inherit;
        line-height: 1.5;
        color: #333;
        outline: none;
      }

      .sticky-note-textarea::-webkit-scrollbar {
        width: 8px;
      }

      .sticky-note-textarea::-webkit-scrollbar-track {
        background: transparent;
      }

      .sticky-note-textarea::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }

      .sticky-note-textarea::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }

      .sticky-note-textarea::placeholder {
        color: var(--placeholder-color, rgba(0, 0, 0, 0.35));
      }

      .sticky-note-resize {
        position: absolute;
        bottom: 2px;
        right: 4px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.3);
        cursor: se-resize;
        user-select: none;
        line-height: 1;
      }
    `;
  }

  private generateId(): string {
    return `sticky-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public createNote(
    color: StickyColor,
    size: StickyDimensions,
    position: { x: number; y: number }
  ): StickyNote {
    const data: StickyNoteData = {
      id: this.generateId(),
      text: '',
      color,
      position,
      size,
      createdAt: Date.now(),
    };

    const note = new StickyNote(data);
    note.setOnDelete((id) => this.deleteNote(id));
    note.bringToFront(++this.maxZIndex);

    this.notes.set(data.id, note);
    this.shadowRoot.appendChild(note.getElement());

    // 非表示状態なら作成した付箋も非表示に
    if (!this.areNotesVisible) {
      note.setVisible(false);
    }

    // 付箋作成コールバックを呼び出し
    this.onNoteCreatedCallback?.(note);

    return note;
  }

  public onNoteCreated(callback: (note: StickyNote) => void): void {
    this.onNoteCreatedCallback = callback;
  }

  public deleteNote(id: string): void {
    const note = this.notes.get(id);
    if (note) {
      note.destroy();
      this.notes.delete(id);
    }
  }

  public clearAll(): void {
    this.notes.forEach((note) => note.destroy());
    this.notes.clear();
  }

  public getAllNotes(): StickyNote[] {
    return Array.from(this.notes.values());
  }

  public getNote(id: string): StickyNote | undefined {
    return this.notes.get(id);
  }

  public toggleVisibility(): boolean {
    this.areNotesVisible = !this.areNotesVisible;
    this.notes.forEach((note) => note.setVisible(this.areNotesVisible));
    return this.areNotesVisible;
  }

  public isVisible(): boolean {
    return this.areNotesVisible;
  }

  public bringToFront(id: string): void {
    const note = this.notes.get(id);
    if (note) {
      // オーバーフロー防止: 上限に近づいたらz-indexを再計算
      const MAX_SAFE_ZINDEX = 2147483600;
      if (this.maxZIndex >= MAX_SAFE_ZINDEX) {
        this.rebalanceZIndices();
      }
      ++this.maxZIndex;
      note.bringToFront(this.maxZIndex);
    }
  }

  private rebalanceZIndices(): void {
    // 全付箋のz-indexを基準値から再割り当て
    this.maxZIndex = this.baseZIndex;
    this.notes.forEach((n) => {
      n.bringToFront(++this.maxZIndex);
    });
  }

  public updateBaseZIndex(newBaseZIndex: number): void {
    const offset = this.maxZIndex - this.baseZIndex;
    this.baseZIndex = newBaseZIndex;
    this.maxZIndex = newBaseZIndex + offset;
    // 全付箋のz-indexを再計算
    this.rebalanceZIndices();
  }

  public getNotesCount(): number {
    return this.notes.size;
  }
}
