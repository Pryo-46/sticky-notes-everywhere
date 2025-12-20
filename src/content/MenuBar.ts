import type { StickyColor, StickySize, MenuBarMode, MenuBarPosition } from '../types';
import { BUTTON_SIZE_PRESETS } from '../types';
import { ICONS } from './icons';
import { StorageService } from './StorageService';

const POSITION_CYCLE: MenuBarPosition[] = ['top', 'left', 'bottom', 'right'];
// 現在の位置から次の位置へ移動するアイコン（押したらどこに行くか）
const NEXT_POSITION_ICONS: Record<MenuBarPosition, string> = {
  top: ICONS.moveLeft,    // 上にいる → 左へ移動
  left: ICONS.moveDown,   // 左にいる → 下へ移動
  bottom: ICONS.moveRight, // 下にいる → 右へ移動
  right: ICONS.moveUp,    // 右にいる → 上へ移動
};

const COLORS: StickyColor[] = ['color1', 'color2', 'color3', 'color4', 'color5', 'color6', 'color7', 'color8'];
const SIZES: StickySize[] = ['small', 'medium', 'large'];

// UI定数
export const BUTTON_RADIUS = 4;
export const BUTTON_GAP = 8;

const SIZE_LABELS: Record<StickySize, string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
};

type ColorSwatchCallback = (element: HTMLElement, color: StickyColor) => void;
type VisibilityToggleCallback = () => boolean;
type ClearAllCallback = () => void;
type CopyAllCallback = () => void;
type SettingsCallback = () => void;

export class MenuBar {
  private element: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private selectedSize: StickySize = 'medium';
  private isVisible = false;
  private colorSwatchCallback: ColorSwatchCallback | null = null;
  private visibilityToggleCallback: VisibilityToggleCallback | null = null;
  private clearAllCallback: ClearAllCallback | null = null;
  private copyAllCallback: CopyAllCallback | null = null;
  private settingsCallback: SettingsCallback | null = null;
  private notesVisible = true;

  // メニューバーモード・位置
  private currentMode: MenuBarMode = 'bar';
  private currentPosition: MenuBarPosition = 'top';

  // ドラッグ用状態
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private floatingPosition = { x: 100, y: 100 };

  constructor() {
    // Shadow DOMホストを作成
    this.element = document.createElement('div');
    this.element.id = 'sticky-notes-everywhere-host';
    this.shadowRoot = this.element.attachShadow({ mode: 'closed' });

    // 設定から初期値を取得
    const settings = StorageService.getInstance().getSettings();
    this.currentMode = settings.menuBarMode;
    this.currentPosition = settings.menuBarPosition;
    this.floatingPosition = { ...settings.floatingPosition };
    this.selectedSize = settings.defaultSize;

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
    const settings = StorageService.getInstance().getSettings();
    const BUTTON_SIZE = BUTTON_SIZE_PRESETS[settings.buttonSize];

    return `
      .sticky-notes-menu-bar {
        position: fixed;
        background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-sizing: border-box;
      }

      .sticky-notes-menu-bar.hidden {
        display: none;
      }

      /* バーモード - 上部 */
      .sticky-notes-menu-bar.bar-top {
        top: 0;
        left: 0;
        right: 0;
        height: ${BUTTON_SIZE + 16}px;
        flex-direction: row;
        padding: 0 16px;
        border-bottom: 1px solid #ddd;
      }

      /* バーモード - 下部 */
      .sticky-notes-menu-bar.bar-bottom {
        bottom: 0;
        left: 0;
        right: 0;
        height: ${BUTTON_SIZE + 16}px;
        flex-direction: row;
        padding: 0 16px;
        border-top: 1px solid #ddd;
      }

      /* バーモード - 左部 */
      .sticky-notes-menu-bar.bar-left {
        top: 0;
        left: 0;
        bottom: 0;
        width: ${BUTTON_SIZE + 16}px;
        flex-direction: column;
        padding: 16px 0;
        border-right: 1px solid #ddd;
      }

      /* バーモード - 右部 */
      .sticky-notes-menu-bar.bar-right {
        top: 0;
        right: 0;
        bottom: 0;
        width: ${BUTTON_SIZE + 16}px;
        flex-direction: column;
        padding: 16px 0;
        border-left: 1px solid #ddd;
      }

      /* フローティングモード */
      .sticky-notes-menu-bar.floating {
        border-radius: 8px;
        border: 1px solid #ddd;
        padding: 12px;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      /* フローティング時は2列レイアウト */
      .floating .menu-content {
        display: flex;
        flex-direction: row;
        gap: 12px;
      }

      /* 左列：ボタン群 */
      .floating .button-column {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
      }


      /* ドラッグハンドル */
      .drag-handle {
        display: none;
        cursor: move;
        padding: 4px;
        color: #adb5bd;
        user-select: none;
      }

      .floating .drag-handle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
        margin-bottom: 4px;
      }

      .menu-section {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* 縦向きレイアウト */
      .bar-left .menu-section,
      .bar-right .menu-section,
      .floating .menu-section {
        flex-direction: column;
        gap: 8px;
      }

      .menu-divider {
        width: 1px;
        height: 24px;
        background: #ddd;
      }

      /* 縦向きの仕切り */
      .bar-left .menu-divider,
      .bar-right .menu-divider,
      .floating .menu-divider {
        width: 24px;
        height: 1px;
      }

      .color-palette {
        display: flex;
        gap: ${BUTTON_GAP}px;
      }

      /* 縦向きカラーパレット */
      .bar-left .color-palette,
      .bar-right .color-palette {
        flex-direction: column;
        gap: ${BUTTON_GAP}px;
      }

      .floating .color-palette {
        flex-direction: column;
        flex-wrap: nowrap;
        max-width: none;
      }

      .color-swatch {
        width: ${BUTTON_SIZE}px;
        height: ${BUTTON_SIZE}px;
        border-radius: ${BUTTON_RADIUS}px;
        cursor: grab;
        border: 1px solid rgba(0, 0, 0, 0.2);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        flex-shrink: 0;
        box-sizing: border-box;
      }

      .color-swatch:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      }

      .color-swatch:active {
        cursor: grabbing;
      }

      .size-presets {
        display: flex;
        gap: 8px;
      }

      /* 縦向きサイズプリセット */
      .bar-left .size-presets,
      .bar-right .size-presets {
        flex-direction: column;
      }

      .size-btn {
        width: ${BUTTON_SIZE}px;
        height: ${BUTTON_SIZE}px;
        padding: 0;
        border: 1px solid #ccc;
        border-radius: ${BUTTON_RADIUS}px;
        background: #fff;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        color: #333;
        transition: all 0.15s ease;
        box-sizing: border-box;
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
        width: ${BUTTON_SIZE}px;
        height: ${BUTTON_SIZE}px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: ${BUTTON_RADIUS}px;
        background: transparent;
        cursor: pointer;
        font-size: 18px;
        color: #495057;
        transition: all 0.15s ease;
        flex-shrink: 0;
        box-sizing: border-box;
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

      /* 縦向きスペーサー */
      .bar-left .menu-spacer,
      .bar-right .menu-spacer {
        flex: 1;
        width: 100%;
      }

      .floating .menu-spacer {
        display: none;
      }

      .close-btn {
        color: #868e96;
      }

      .close-btn:hover {
        color: #495057;
        background: #ffe3e3;
      }

      /* 位置切替ボタン（フローティング時は非表示） */
      .floating .position-btn {
        display: none;
      }

      .actions-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .floating .actions-row {
        flex-wrap: wrap;
        justify-content: center;
      }
    `;
  }

  private getMenuBarHTML(): string {
    const settings = StorageService.getInstance().getSettings();
    const colorSwatches = COLORS.map(
      (color) => `<div class="color-swatch ${color}" data-color="${color}" draggable="true" style="background-color: ${settings.colors[color]}"></div>`
    ).join('');

    const sizeButtons = SIZES.map(
      (size) =>
        `<button class="size-btn ${size === this.selectedSize ? 'active' : ''}" data-size="${size}">${SIZE_LABELS[size]}</button>`
    ).join('');

    const positionIcon = NEXT_POSITION_ICONS[this.currentPosition];
    const modeIcon = this.currentMode === 'bar' ? ICONS.floating : ICONS.barMode;

    // メニューバーレイアウト（バーモード用）
    const barLayout = `
      <div class="menu-section color-palette">
        ${colorSwatches}
      </div>
      <div class="menu-divider"></div>
      <div class="menu-section size-presets">
        ${sizeButtons}
      </div>
      <div class="menu-divider"></div>
      <div class="menu-section actions-row">
        <button class="icon-btn visibility-btn" title="全付箋の表示/非表示">${ICONS.visibility}</button>
        <button class="icon-btn copy-btn" title="メモをコピー">${ICONS.copy}</button>
        <button class="icon-btn clear-btn" title="全付箋を削除">${ICONS.delete}</button>
        <div class="menu-divider"></div>
        <button class="icon-btn position-btn" title="メニューの位置を変更">${positionIcon}</button>
        <button class="icon-btn mode-btn" title="表示モードを変更">${modeIcon}</button>
        <div class="menu-divider"></div>
        <button class="icon-btn settings-btn" title="設定">${ICONS.settings}</button>
      </div>
    `;

    // フローティングモード用（2列レイアウト）
    const floatingLayout = `
      <div class="drag-handle">${ICONS.dragHandle}</div>
      <div class="menu-content">
        <div class="button-column">
          <div class="menu-section size-presets">
            ${sizeButtons}
          </div>
          <button class="icon-btn visibility-btn" title="全付箋の表示/非表示">${ICONS.visibility}</button>
          <button class="icon-btn copy-btn" title="メモをコピー">${ICONS.copy}</button>
          <button class="icon-btn clear-btn" title="全付箋を削除">${ICONS.delete}</button>
          <button class="icon-btn mode-btn" title="表示モードを変更">${modeIcon}</button>
          <button class="icon-btn settings-btn" title="設定">${ICONS.settings}</button>
        </div>
        <div class="menu-section color-palette">
          ${colorSwatches}
        </div>
      </div>
      <button class="icon-btn close-btn" title="閉じる">${ICONS.close}</button>
    `;

    // モードに応じてレイアウトを返す
    if (this.currentMode === 'floating') {
      return floatingLayout;
    }

    return `
      <div class="drag-handle">${ICONS.dragHandle}</div>
      ${barLayout}
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

    // 設定ボタン
    menuBar.querySelector('.settings-btn')?.addEventListener('click', () => {
      this.settingsCallback?.();
    });

    // 位置切替ボタン
    menuBar.querySelector('.position-btn')?.addEventListener('click', () => {
      this.cyclePosition(menuBar);
    });

    // モード切替ボタン
    menuBar.querySelector('.mode-btn')?.addEventListener('click', () => {
      this.toggleMode(menuBar);
    });

    // ドラッグハンドル
    this.setupDragHandlers(menuBar);

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
    const menuBar = this.shadowRoot.querySelector('.sticky-notes-menu-bar') as HTMLDivElement;
    if (menuBar) {
      menuBar.classList.remove('hidden');
      this.applyModeAndPosition(menuBar);
    }
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

  public onSettings(callback: SettingsCallback): void {
    this.settingsCallback = callback;
  }

  /** 設定変更後にカラースウォッチを更新 */
  public updateColorSwatches(): void {
    const settings = StorageService.getInstance().getSettings();
    const menuBar = this.shadowRoot.querySelector('.sticky-notes-menu-bar');
    if (!menuBar) return;

    COLORS.forEach((color) => {
      const swatch = menuBar.querySelector(`.color-swatch.${color}`) as HTMLElement;
      if (swatch) {
        swatch.style.backgroundColor = settings.colors[color];
      }
    });
  }

  /** 設定変更後にスタイルを再適用 */
  public refreshStyles(): void {
    const styleElement = this.shadowRoot.querySelector('style');
    if (styleElement) {
      styleElement.textContent = this.getStyles();
    }

    // デフォルトサイズも更新
    const settings = StorageService.getInstance().getSettings();
    this.selectedSize = settings.defaultSize;

    // サイズボタンのアクティブ状態を更新
    const menuBar = this.shadowRoot.querySelector('.sticky-notes-menu-bar') as HTMLDivElement;
    if (menuBar) {
      menuBar.querySelectorAll('.size-btn').forEach((btn) => {
        btn.classList.toggle('active', (btn as HTMLButtonElement).dataset.size === this.selectedSize);
      });
    }
  }

  /** モードと位置に応じたクラスを適用 */
  private applyModeAndPosition(menuBar: HTMLDivElement): void {
    // すべてのモード・位置クラスを削除
    menuBar.classList.remove('bar-top', 'bar-bottom', 'bar-left', 'bar-right', 'floating');

    if (this.currentMode === 'floating') {
      menuBar.classList.add('floating');
      menuBar.style.left = `${this.floatingPosition.x}px`;
      menuBar.style.top = `${this.floatingPosition.y}px`;
      menuBar.style.right = '';
      menuBar.style.bottom = '';
    } else {
      menuBar.classList.add(`bar-${this.currentPosition}`);
      menuBar.style.left = '';
      menuBar.style.top = '';
      menuBar.style.right = '';
      menuBar.style.bottom = '';
    }
  }

  /** 位置をサイクルで切り替え */
  private cyclePosition(menuBar: HTMLDivElement): void {
    const currentIndex = POSITION_CYCLE.indexOf(this.currentPosition);
    const nextIndex = (currentIndex + 1) % POSITION_CYCLE.length;
    this.currentPosition = POSITION_CYCLE[nextIndex];

    // アイコンを更新
    const btn = menuBar.querySelector('.position-btn');
    if (btn) {
      btn.innerHTML = NEXT_POSITION_ICONS[this.currentPosition];
    }

    this.applyModeAndPosition(menuBar);
    this.saveSettings();
  }

  /** モードを切り替え */
  private toggleMode(menuBar: HTMLDivElement): void {
    this.currentMode = this.currentMode === 'bar' ? 'floating' : 'bar';

    // HTMLを再生成（レイアウトが異なるため）
    menuBar.innerHTML = this.getMenuBarHTML();
    this.setupEventListeners(menuBar);

    this.applyModeAndPosition(menuBar);
    this.saveSettings();
  }

  /** ドラッグハンドラーのセットアップ */
  private setupDragHandlers(menuBar: HTMLDivElement): void {
    const dragHandle = menuBar.querySelector('.drag-handle') as HTMLElement;
    if (!dragHandle) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;

      let newX = e.clientX - this.dragOffset.x;
      let newY = e.clientY - this.dragOffset.y;

      // 画面外に出ないように制限
      const rect = menuBar.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      this.floatingPosition = { x: newX, y: newY };
      menuBar.style.left = `${newX}px`;
      menuBar.style.top = `${newY}px`;
    };

    const onMouseUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        this.saveSettings();
      }
    };

    dragHandle.addEventListener('mousedown', (e: MouseEvent) => {
      if (this.currentMode !== 'floating') return;

      this.isDragging = true;
      const rect = menuBar.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    });
  }

  /** 設定を保存 */
  private async saveSettings(): Promise<void> {
    const storage = StorageService.getInstance();
    const settings = storage.getSettings();
    settings.menuBarMode = this.currentMode;
    settings.menuBarPosition = this.currentPosition;
    settings.floatingPosition = { ...this.floatingPosition };
    await storage.saveSettings(settings);
  }
}
