import type { StickyColor, StickyDimensions, StickyNoteData } from '../types';
import { COLOR_VALUES } from '../types';

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
    header.innerHTML = '<span class="drag-icon">⋮⋮</span>';

    // ヘッダー右側のボタンコンテナ
    const headerActions = document.createElement('div');
    headerActions.className = 'sticky-note-header-actions';

    // 色変更ボタン
    const colorBtn = document.createElement('button');
    colorBtn.className = 'sticky-note-action-btn sticky-note-color-btn';
    colorBtn.innerHTML = '🎨';
    colorBtn.title = '色を変更';
    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleColorPicker();
    });
    headerActions.appendChild(colorBtn);

    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'sticky-note-action-btn sticky-note-delete';
    deleteBtn.textContent = '×';
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

    // リサイズハンドル（Phase 5で実装）
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'sticky-note-resize';
    resizeHandle.innerHTML = '⋱';

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
