import type { StickyColor, StickyDimensions, StickyNoteData } from '../../../types';
import { ICONS } from '../../icons';
import { StorageService } from '../../managers/StorageService';
import { getTextColor, getPlaceholderColor, getContrastColor } from '../../utils/colorUtils';
import { ColorPicker } from './ColorPicker';

export class StickyNote {
  private element: HTMLDivElement;
  private data: StickyNoteData;
  private textArea: HTMLTextAreaElement;
  private onDelete: ((id: string) => void) | null = null;
  private onDataChanged: (() => void) | null = null;
  private colorPicker: ColorPicker;
  private placeholderStyle: HTMLStyleElement | null = null;
  private saveTimeout: number | null = null;

  constructor(data: StickyNoteData) {
    this.data = data;
    this.element = document.createElement('div');
    this.element.className = 'sticky-note';
    this.element.dataset.id = data.id;
    this.textArea = document.createElement('textarea');
    this.textArea.id = `sticky-textarea-${data.id}`;
    this.colorPicker = new ColorPicker(this.element, data.color, (color) => {
      this.setColor(color);
    });
    this.render();
  }

  private render(): void {
    this.element.innerHTML = '';
    this.applyStyles();

    // ヘッダー部分（移動用）
    const header = document.createElement('div');
    header.className = 'sticky-note-header';
    const uiColor = getContrastColor(this.getColorValue(this.data.color), 30);
    header.style.borderBottomColor = uiColor;
    header.innerHTML = `<span class="drag-icon" style="color: ${uiColor}">${ICONS.dragHandle}</span>`;

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
      this.colorPicker.toggle();
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
    const colorValue = this.getColorValue(this.data.color);
    this.textArea.style.color = getTextColor(colorValue);
    this.updatePlaceholderStyle(colorValue);
    this.textArea.addEventListener('input', () => {
      this.data.text = this.textArea.value;
      this.scheduleSave();
    });

    // リサイズハンドル
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'sticky-note-resize';
    resizeHandle.style.color = uiColor;
    resizeHandle.innerHTML = ICONS.resize;

    this.element.appendChild(header);
    this.element.appendChild(this.textArea);
    this.element.appendChild(resizeHandle);
  }

  private getColorValue(color: StickyColor): string {
    return StorageService.getInstance().getSettings().colors[color];
  }

  private applyStyles(): void {
    const { position, size, color } = this.data;
    const colorValue = this.getColorValue(color);
    const baseZIndex = StorageService.getInstance().getSettings().baseZIndex;
    this.element.style.cssText = `
      position: fixed;
      left: ${position.x}px;
      top: ${position.y}px;
      width: ${size.width}px;
      height: ${size.height}px;
      background-color: ${colorValue};
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      z-index: ${baseZIndex};
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
    this.colorPicker.updateCurrentColor(color);
    const colorValue = this.getColorValue(color);
    const uiColor = getContrastColor(colorValue, 30);
    this.element.style.backgroundColor = colorValue;
    // ヘッダー下線の色も更新
    const header = this.element.querySelector('.sticky-note-header') as HTMLElement;
    if (header) {
      header.style.borderBottomColor = uiColor;
    }
    // ドラッグアイコンの色も更新
    const dragIcon = this.element.querySelector('.drag-icon') as HTMLElement;
    if (dragIcon) {
      dragIcon.style.color = uiColor;
    }
    // リサイズハンドルの色も更新
    const resizeHandle = this.element.querySelector('.sticky-note-resize') as HTMLElement;
    if (resizeHandle) {
      resizeHandle.style.color = uiColor;
    }
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
    // テキストエリアのフォント色とプレースホルダー色も更新
    this.textArea.style.color = getTextColor(colorValue);
    this.updatePlaceholderStyle(colorValue);
  }

  private createColorIcon(color: StickyColor): string {
    const fillColor = this.getColorValue(color);
    const strokeColor = getContrastColor(fillColor, 30);
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
    </svg>`;
  }

  private createDeleteIcon(color: StickyColor): string {
    const fillColor = this.getColorValue(color);
    const strokeColor = getContrastColor(fillColor, 30);
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
      <path d="M9 9L15 15M15 9L9 15" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  private createCopyIcon(color: StickyColor): string {
    const strokeColor = getContrastColor(this.getColorValue(color), 30);
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

  private updatePlaceholderStyle(colorValue: string): void {
    // 既存のスタイルを削除
    if (this.placeholderStyle) {
      this.placeholderStyle.remove();
    }
    // 動的にスタイル要素を作成してプレースホルダー色を設定
    this.placeholderStyle = document.createElement('style');
    this.placeholderStyle.textContent = `
      #${this.textArea.id}::placeholder {
        color: ${getPlaceholderColor(colorValue)} !important;
      }
    `;
    this.element.appendChild(this.placeholderStyle);
  }

  public setOnDelete(callback: (id: string) => void): void {
    this.onDelete = callback;
  }

  /** データ変更時のコールバックを設定 */
  public setOnDataChanged(callback: () => void): void {
    this.onDataChanged = callback;
  }

  /** デバウンス付きで保存をスケジュール */
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = window.setTimeout(() => {
      this.onDataChanged?.();
      this.saveTimeout = null;
    }, 1000); // 1秒後に保存
  }

  /** 即座に保存を通知 */
  public notifyChange(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.onDataChanged?.();
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'flex' : 'none';
  }

  /** 設定変更後に色を再適用する */
  public refreshColor(): void {
    this.setColor(this.data.color);
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

  public destroy(): void {
    this.colorPicker.destroy();
    this.element.remove();
  }
}
