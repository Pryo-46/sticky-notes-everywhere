import type { StickyColor, StickyDimensions, StickyNoteData } from '../types';
import { ICONS } from './icons';
import { StorageService } from './StorageService';

const STICKY_COLORS: StickyColor[] = ['color1', 'color2', 'color3', 'color4', 'color5', 'color6', 'color7', 'color8'];

// UI色のコントラスト設定
// 暗い色のUI色（黒に近い付箋用）: #000000〜#ffffff の範囲で調整可能
const DARK_COLOR_UI = '#cccccc';
// 暗い色と判定する輝度の閾値（0.0〜1.0）: 低いほど黒に近い色のみが対象
const DARK_LUMINANCE_THRESHOLD = 0.15;
// フォント色設定
const LIGHT_TEXT_COLOR = '#ffffff'; // 暗い背景用
const DARK_TEXT_COLOR = '#333333';  // 明るい背景用
// プレースホルダー色設定
const LIGHT_PLACEHOLDER_COLOR = 'rgba(255, 255, 255, 0.9)'; // 暗い背景用
const DARK_PLACEHOLDER_COLOR = 'rgba(0, 0, 0, 0.35)';       // 明るい背景用
// フォント色を切り替える輝度の閾値（0.0〜1.0）
const TEXT_LUMINANCE_THRESHOLD = 0.5;

export class StickyNote {
  private element: HTMLDivElement;
  private data: StickyNoteData;
  private textArea: HTMLTextAreaElement;
  private onDelete: ((id: string) => void) | null = null;
  private colorPicker: HTMLDivElement | null = null;
  private placeholderStyle: HTMLStyleElement | null = null;

  constructor(data: StickyNoteData) {
    this.data = data;
    this.element = document.createElement('div');
    this.element.className = 'sticky-note';
    this.element.dataset.id = data.id;
    this.textArea = document.createElement('textarea');
    this.textArea.id = `sticky-textarea-${data.id}`;
    this.render();
  }

  private render(): void {
    this.element.innerHTML = '';
    this.applyStyles();

    // ヘッダー部分（移動用）
    const header = document.createElement('div');
    header.className = 'sticky-note-header';
    const uiColor = this.getContrastColor(this.getColorValue(this.data.color), 30);
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
    const colorValue = this.getColorValue(this.data.color);
    this.textArea.style.color = this.getTextColor(colorValue);
    this.updatePlaceholderStyle(colorValue);
    this.textArea.addEventListener('input', () => {
      this.data.text = this.textArea.value;
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
    const colorValue = this.getColorValue(color);
    const uiColor = this.getContrastColor(colorValue, 30);
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
    this.textArea.style.color = this.getTextColor(colorValue);
    this.updatePlaceholderStyle(colorValue);
  }

  private createColorIcon(color: StickyColor): string {
    const fillColor = this.getColorValue(color);
    const strokeColor = this.getContrastColor(fillColor, 30);
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
    </svg>`;
  }

  private createDeleteIcon(color: StickyColor): string {
    const fillColor = this.getColorValue(color);
    const strokeColor = this.getContrastColor(fillColor, 30);
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
      <path d="M9 9L15 15M15 9L9 15" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  private createCopyIcon(color: StickyColor): string {
    const strokeColor = this.getContrastColor(this.getColorValue(color), 30);
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

  private getLuminance(hex: string): number {
    // 輝度を計算（0-1の範囲、0が暗い、1が明るい）
    const num = parseInt(hex.slice(1), 16);
    const r = (num >> 16) / 255;
    const g = ((num >> 8) & 0xFF) / 255;
    const b = (num & 0xFF) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  private getTextColor(hex: string): string {
    // 背景色の輝度に応じてテキスト色を返す
    const luminance = this.getLuminance(hex);
    return luminance < TEXT_LUMINANCE_THRESHOLD ? LIGHT_TEXT_COLOR : DARK_TEXT_COLOR;
  }

  private getPlaceholderColor(hex: string): string {
    // 背景色の輝度に応じてプレースホルダー色を返す
    const luminance = this.getLuminance(hex);
    return luminance < TEXT_LUMINANCE_THRESHOLD ? LIGHT_PLACEHOLDER_COLOR : DARK_PLACEHOLDER_COLOR;
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
        color: ${this.getPlaceholderColor(colorValue)} !important;
      }
    `;
    this.element.appendChild(this.placeholderStyle);
  }

  private getContrastColor(hex: string, percent: number): string {
    // 暗い色なら明るく、明るい色なら暗くする
    const luminance = this.getLuminance(hex);

    // 非常に暗い色（黒に近い）の場合は白っぽい色を直接返す
    if (luminance < DARK_LUMINANCE_THRESHOLD) {
      return DARK_COLOR_UI;
    }

    const num = parseInt(hex.slice(1), 16);
    const r = (num >> 16);
    const g = ((num >> 8) & 0xFF);
    const b = (num & 0xFF);
    // 暗い色の場合はより強いコントラストを適用
    const adjustedPercent = luminance < 0.5 ? percent * 2.2 : percent;
    const delta = Math.round(255 * adjustedPercent / 100);

    if (luminance < 0.5) {
      // 明るくする
      const newR = Math.min(255, r + delta);
      const newG = Math.min(255, g + delta);
      const newB = Math.min(255, b + delta);
      return `#${(newR << 16 | newG << 8 | newB).toString(16).padStart(6, '0')}`;
    } else {
      // 暗くする
      const newR = Math.max(0, r - delta);
      const newG = Math.max(0, g - delta);
      const newB = Math.max(0, b - delta);
      return `#${(newR << 16 | newG << 8 | newB).toString(16).padStart(6, '0')}`;
    }
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
      swatch.style.backgroundColor = this.getColorValue(color);
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
