import type { StickyColor, StickySize } from '../types';
import { ICONS } from './icons';

const COLORS: StickyColor[] = ['red', 'orange', 'yellow', 'green', 'cyan', 'gray', 'white'];
const SIZES: StickySize[] = ['small', 'medium', 'large'];
const SIZE_LABELS: Record<StickySize, string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
};

type ColorSwatchCallback = (element: HTMLElement, color: StickyColor) => void;
type VisibilityToggleCallback = () => boolean;
type ClearAllCallback = () => void;
type CopyAllCallback = () => void;

export class MenuBar {
  private element: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private selectedSize: StickySize = 'medium';
  private isVisible = false;
  private colorSwatchCallback: ColorSwatchCallback | null = null;
  private visibilityToggleCallback: VisibilityToggleCallback | null = null;
  private clearAllCallback: ClearAllCallback | null = null;
  private copyAllCallback: CopyAllCallback | null = null;
  private notesVisible = true;

  constructor() {
    // Shadow DOMホストを作成
    this.element = document.createElement('div');
    this.element.id = 'sticky-notes-everywhere-host';
    this.shadowRoot = this.element.attachShadow({ mode: 'closed' });

    this.render();
  }

  private render(): void {
    // スタイルを注入
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot.appendChild(style);

    // メニューバーを作成
    const menuBar = document.createElement('div');
    menuBar.className = 'sticky-notes-menu-bar hidden';
    menuBar.innerHTML = this.getMenuBarHTML();
    this.shadowRoot.appendChild(menuBar);

    this.setupEventListeners(menuBar);
  }

  private getStyles(): string {
    return `
      .sticky-notes-menu-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 48px;
        background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
        border-bottom: 1px solid #ddd;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 16px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-sizing: border-box;
      }

      .sticky-notes-menu-bar.hidden {
        display: none;
      }

      .menu-section {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .menu-divider {
        width: 1px;
        height: 24px;
        background: #ddd;
      }

      .color-palette {
        display: flex;
        gap: 4px;
      }

      .color-swatch {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        cursor: grab;
        border: 1px solid rgba(0, 0, 0, 0.2);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      .color-swatch:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      }

      .color-swatch:active {
        cursor: grabbing;
      }

      .color-swatch.red { background-color: #ff6b6b; }
      .color-swatch.orange { background-color: #ffa94d; }
      .color-swatch.yellow { background-color: #ffd43b; }
      .color-swatch.green { background-color: #69db7c; }
      .color-swatch.cyan { background-color: #66d9e8; }
      .color-swatch.gray { background-color: #adb5bd; }
      .color-swatch.white { background-color: #ffffff; }

      .size-presets {
        display: flex;
        gap: 4px;
      }

      .size-btn {
        padding: 4px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        color: #333;
        transition: all 0.15s ease;
      }

      .size-btn:hover {
        background: #f0f0f0;
      }

      .size-btn.active {
        background: #4dabf7;
        border-color: #339af0;
        color: #fff;
      }

      .icon-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        font-size: 18px;
        color: #495057;
        transition: all 0.15s ease;
      }

      .icon-btn:hover {
        background: #e9ecef;
      }

      .icon-btn:active {
        background: #dee2e6;
      }

      .menu-spacer {
        flex: 1;
      }

      .close-btn {
        color: #868e96;
      }

      .close-btn:hover {
        color: #495057;
        background: #ffe3e3;
      }
    `;
  }

  private getMenuBarHTML(): string {
    const colorSwatches = COLORS.map(
      (color) => `<div class="color-swatch ${color}" data-color="${color}" draggable="true"></div>`
    ).join('');

    const sizeButtons = SIZES.map(
      (size) =>
        `<button class="size-btn ${size === this.selectedSize ? 'active' : ''}" data-size="${size}">${SIZE_LABELS[size]}</button>`
    ).join('');

    return `
      <div class="menu-section color-palette">
        ${colorSwatches}
      </div>
      <div class="menu-divider"></div>
      <div class="menu-section size-presets">
        ${sizeButtons}
      </div>
      <div class="menu-divider"></div>
      <div class="menu-section">
        <button class="icon-btn visibility-btn" title="全付箋の表示/非表示">${ICONS.visibility}</button>
        <button class="icon-btn clear-btn" title="全付箋を削除">${ICONS.delete}</button>
        <button class="icon-btn copy-btn" title="メモをコピー">${ICONS.copy}</button>
      </div>
      <div class="menu-spacer"></div>
      <button class="icon-btn close-btn" title="閉じる">${ICONS.close}</button>
    `;
  }

  private setupEventListeners(menuBar: HTMLDivElement): void {
    // サイズボタンのクリック
    menuBar.querySelectorAll('.size-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const size = target.dataset.size as StickySize;
        this.setSelectedSize(size, menuBar);
      });
    });

    // 閉じるボタン
    menuBar.querySelector('.close-btn')?.addEventListener('click', () => {
      this.hide();
    });

    // 表示/非表示トグルボタン
    menuBar.querySelector('.visibility-btn')?.addEventListener('click', () => {
      if (this.visibilityToggleCallback) {
        this.notesVisible = this.visibilityToggleCallback();
        this.updateVisibilityIcon(menuBar);
      }
    });

    // 一括クリアボタン
    menuBar.querySelector('.clear-btn')?.addEventListener('click', () => {
      if (this.clearAllCallback) {
        const confirmed = window.confirm('すべての付箋を削除しますか？');
        if (confirmed) {
          this.clearAllCallback();
        }
      }
    });

    // コピーボタン
    menuBar.querySelector('.copy-btn')?.addEventListener('click', () => {
      this.copyAllCallback?.();
    });

    // カラースウォッチのセットアップ
    this.setupColorSwatches(menuBar);
  }

  private updateVisibilityIcon(menuBar: HTMLDivElement): void {
    const btn = menuBar.querySelector('.visibility-btn');
    if (btn) {
      btn.innerHTML = this.notesVisible ? ICONS.visibility : ICONS.visibilityOff;
    }
  }

  private setupColorSwatches(menuBar: HTMLDivElement): void {
    menuBar.querySelectorAll('.color-swatch').forEach((swatch) => {
      const color = (swatch as HTMLElement).dataset.color as StickyColor;
      if (this.colorSwatchCallback) {
        this.colorSwatchCallback(swatch as HTMLElement, color);
      }
    });
  }

  public onColorSwatchSetup(callback: ColorSwatchCallback): void {
    this.colorSwatchCallback = callback;
    // 既に表示されている場合は再セットアップ
    const menuBar = this.shadowRoot.querySelector('.sticky-notes-menu-bar') as HTMLDivElement;
    if (menuBar) {
      this.setupColorSwatches(menuBar);
    }
  }

  private setSelectedSize(size: StickySize, menuBar: HTMLDivElement): void {
    this.selectedSize = size;
    menuBar.querySelectorAll('.size-btn').forEach((btn) => {
      btn.classList.toggle('active', (btn as HTMLButtonElement).dataset.size === size);
    });
  }

  public getSelectedSize(): StickySize {
    return this.selectedSize;
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public show(): void {
    if (!this.element.parentElement) {
      document.body.appendChild(this.element);
    }
    this.shadowRoot.querySelector('.sticky-notes-menu-bar')?.classList.remove('hidden');
    this.isVisible = true;
  }

  public hide(): void {
    this.shadowRoot.querySelector('.sticky-notes-menu-bar')?.classList.add('hidden');
    this.isVisible = false;
  }

  public isMenuVisible(): boolean {
    return this.isVisible;
  }

  public onVisibilityToggle(callback: VisibilityToggleCallback): void {
    this.visibilityToggleCallback = callback;
  }

  public onClearAll(callback: ClearAllCallback): void {
    this.clearAllCallback = callback;
  }

  public onCopyAll(callback: CopyAllCallback): void {
    this.copyAllCallback = callback;
  }
}
