import type { StickyColor, StickyDimensions, StickyNoteData } from '../types';
import { COLOR_VALUES } from '../types';
import { ICONS } from './icons';

const STICKY_COLORS: StickyColor[] = ['red', 'orange', 'yellow', 'green', 'cyan', 'gray', 'white'];

export class StickyNote {
  private element: HTMLDivElement;
  private data: StickyNoteData;
  private textArea: HTMLTextAreaElement;
  private onDelete: ((id: string) => void) | null = null;
  private colorPicker: HTMLDivElement | null = null;

  constructor(data: StickyNoteData) {
    this.data = data;
    this.element = document.createElement('div');
    this.element.className = 'sticky-note';
    this.element.dataset.id = data.id;
    this.textArea = document.createElement('textarea');
    this.render();
  }

  private render(): void {
    this.element.innerHTML = '';
    this.applyStyles();

    // ヘッダー部分（移動用）
    const header = document.createElement('div');
    header.className = 'sticky-note-header';
    header.innerHTML = `<span class="drag-icon">${ICONS.dragHandle}</span>`;

    // ヘッダー右側のボタンコンテナ
    const headerActions = document.createElement('div');
    headerActions.className = 'sticky-note-header-actions';

    // コピーボタン
    const copyBtn = document.createElement('button');
    copyBtn.className = 'sticky-note-action-btn sticky-note-copy';
    copyBtn.innerHTML = this.createCopyIcon(this.data.color);
    copyBtn.title = 'テキストをコピー';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyText();
    });
    headerActions.appendChild(copyBtn);

    // 色変更ボタン
    const colorBtn = document.createElement('button');
    colorBtn.className = 'sticky-note-action-btn sticky-note-color-btn';
    colorBtn.innerHTML = this.createColorIcon(this.data.color);
    colorBtn.title = '色を変更';
    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleColorPicker();
    });
    headerActions.appendChild(colorBtn);

    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'sticky-note-action-btn sticky-note-delete';
    deleteBtn.innerHTML = this.createDeleteIcon(this.data.color);
    deleteBtn.title = '削除';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onDelete?.(this.data.id);
    });
    headerActions.appendChild(deleteBtn);

    header.appendChild(headerActions);

    // テキストエリア
    this.textArea.className = 'sticky-note-textarea';
    this.textArea.placeholder = 'メモを入力...';
    this.textArea.value = this.data.text;
    this.textArea.addEventListener('input', () => {
      this.data.text = this.textArea.value;
    });

    // リサイズハンドル
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'sticky-note-resize';
    resizeHandle.innerHTML = ICONS.resize;

    this.element.appendChild(header);
    this.element.appendChild(this.textArea);
    this.element.appendChild(resizeHandle);
  }

  private applyStyles(): void {
    const { position, size, color } = this.data;
    this.element.style.cssText = `
      position: fixed;
      left: ${position.x}px;
      top: ${position.y}px;
      width: ${size.width}px;
      height: ${size.height}px;
      background-color: ${COLOR_VALUES[color]};
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      z-index: 2147483640;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-sizing: border-box;
    `;
  }

  public getElement(): HTMLDivElement {
    return this.element;
  }

  public getData(): StickyNoteData {
    return { ...this.data };
  }

  public getId(): string {
    return this.data.id;
  }

  public getText(): string {
    return this.data.text;
  }

  public getColor(): StickyColor {
    return this.data.color;
  }

  public setPosition(x: number, y: number): void {
    this.data.position = { x, y };
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  public setSize(size: StickyDimensions): void {
    this.data.size = size;
    this.element.style.width = `${size.width}px`;
    this.element.style.height = `${size.height}px`;
  }

  public setColor(color: StickyColor): void {
    this.data.color = color;
    this.element.style.backgroundColor = COLOR_VALUES[color];
    // コピーボタンのアイコンも更新
    const copyBtn = this.element.querySelector('.sticky-note-copy');
    if (copyBtn) {
      copyBtn.innerHTML = this.createCopyIcon(color);
    }
    // 色変更ボタンのアイコンも更新
    const colorBtn = this.element.querySelector('.sticky-note-color-btn');
    if (colorBtn) {
      colorBtn.innerHTML = this.createColorIcon(color);
    }
    // 削除ボタンのアイコンも更新
    const deleteBtn = this.element.querySelector('.sticky-note-delete');
    if (deleteBtn) {
      deleteBtn.innerHTML = this.createDeleteIcon(color);
    }
  }

  private createColorIcon(color: StickyColor): string {
    const fillColor = COLOR_VALUES[color];
    const strokeColor = this.darkenColor(fillColor, 30);
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
    </svg>`;
  }

  private createDeleteIcon(color: StickyColor): string {
    const fillColor = COLOR_VALUES[color];
    const strokeColor = this.darkenColor(fillColor, 30);
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
      <path d="M9 9L15 15M15 9L9 15" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  private createCopyIcon(color: StickyColor): string {
    const strokeColor = this.darkenColor(COLOR_VALUES[color], 30);
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="${strokeColor}">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>`;
  }

  private async copyText(): Promise<void> {
    const text = this.data.text.trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      // コピー成功のフィードバック（ボタンを一時的にハイライト）
      const copyBtn = this.element.querySelector('.sticky-note-copy');
      if (copyBtn) {
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 1000);
      }
    } catch {
      // コピー失敗時は何もしない
    }
  }

  private darkenColor(hex: string, percent: number): string {
    // #RRGGBB形式のHEXを暗くする
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * percent / 100));
    const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * percent / 100));
    const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * percent / 100));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  }

  public setOnDelete(callback: (id: string) => void): void {
    this.onDelete = callback;
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'flex' : 'none';
  }

  public bringToFront(zIndex: number): void {
    this.element.style.zIndex = String(zIndex);
  }

  public getHeaderElement(): HTMLElement | null {
    return this.element.querySelector('.sticky-note-header');
  }

  public getResizeHandle(): HTMLElement | null {
    return this.element.querySelector('.sticky-note-resize');
  }

  private toggleColorPicker(): void {
    // 既にピッカーが表示されていれば閉じる
    if (this.colorPicker) {
      this.closeColorPicker();
      return;
    }

    // カラーピッカーを作成
    this.colorPicker = document.createElement('div');
    this.colorPicker.className = 'sticky-note-picker sticky-note-color-picker';

    STICKY_COLORS.forEach((color) => {
      const swatch = document.createElement('button');
      swatch.className = `sticky-note-picker-swatch${color === this.data.color ? ' active' : ''}`;
      swatch.style.backgroundColor = COLOR_VALUES[color];
      swatch.title = color;
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setColor(color);
        this.closeColorPicker();
      });
      this.colorPicker!.appendChild(swatch);
    });

    this.element.appendChild(this.colorPicker);

    // 外側クリックで閉じるリスナーを追加
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 0);
  }

  private closeColorPicker(): void {
    if (this.colorPicker) {
      this.colorPicker.remove();
      this.colorPicker = null;
      document.removeEventListener('click', this.handleOutsideClick);
    }
  }

  private handleOutsideClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    if (!this.element.contains(target)) {
      this.closeColorPicker();
    }
  };

  public destroy(): void {
    this.closeColorPicker();
    document.removeEventListener('click', this.handleOutsideClick);
    this.element.remove();
  }
}
