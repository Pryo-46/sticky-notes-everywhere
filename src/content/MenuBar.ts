import type { StickyColor, StickySize, MenuBarMode, MenuBarPosition } from '../types';
import { BUTTON_SIZE_PRESETS, STICKY_COLORS, STICKY_SIZES, SIZE_LABELS } from '../types';
import { ICONS } from './icons';
import { StorageService } from './StorageService';
import { getMenuBarStyles } from './styles/menubar.css';

const POSITION_CYCLE: MenuBarPosition[] = ['top', 'left', 'bottom', 'right'];
// 現在の位置から次の位置へ移動するアイコン（押したらどこに行くか）
const NEXT_POSITION_ICONS: Record<MenuBarPosition, string> = {
  top: ICONS.moveLeft,    // 上にいる → 左へ移動
  left: ICONS.moveDown,   // 左にいる → 下へ移動
  bottom: ICONS.moveRight, // 下にいる → 右へ移動
  right: ICONS.moveUp,    // 右にいる → 上へ移動
};

// UI定数
export const BUTTON_RADIUS = 4;
export const BUTTON_GAP = 8;

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
    this.updateCSSVariables();

    // DOMに追加し、モード・位置を適用（アイコンを表示するため）
    document.body.appendChild(this.element);
    const container = this.shadowRoot.querySelector('.sticky-menu-container') as HTMLDivElement;
    if (container) {
      this.applyModeAndPosition(container);
    }
  }

  private render(): void {
    // スタイルを注入
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot.appendChild(style);

    // コンテナを作成（アイコン + メニューバー）
    const container = document.createElement('div');
    container.className = 'sticky-menu-container hidden';
    container.innerHTML = this.getContainerHTML();
    this.shadowRoot.appendChild(container);

    this.setupEventListeners(container);
  }

  private getStyles(): string {
    return getMenuBarStyles();
  }

  /** CSS変数を更新してボタンサイズを反映 */
  private updateCSSVariables(): void {
    const settings = StorageService.getInstance().getSettings();
    const buttonSize = BUTTON_SIZE_PRESETS[settings.buttonSize];
    const barHeight = buttonSize + 16;
    const iconSize = Math.round(buttonSize * 0.6);

    this.element.style.setProperty('--button-size', `${buttonSize}px`);
    this.element.style.setProperty('--bar-height', `${barHeight}px`);
    this.element.style.setProperty('--bar-radius', `${barHeight / 2}px`);
    this.element.style.setProperty('--icon-size', `${iconSize}px`);
  }

  /** コンテナ全体のHTML（アイコン + メニューバー） */
  private getContainerHTML(): string {
    return `
      <button class="sticky-icon-btn" title="メニューを開閉">${ICONS.stickyNote}</button>
      <div class="sticky-notes-menu-bar">
        ${this.getMenuBarHTML()}
      </div>
    `;
  }

  /** メニューバー内部のHTML */
  private getMenuBarHTML(): string {
    const settings = StorageService.getInstance().getSettings();
    const colorSwatches = STICKY_COLORS.map(
      (color) => `<div class="color-swatch ${color}" data-color="${color}" draggable="true" style="background-color: ${settings.colors[color]}"></div>`
    ).join('');

    const sizeButtons = STICKY_SIZES.map(
      (size) =>
        `<button class="size-btn ${size === this.selectedSize ? 'active' : ''}" data-size="${size}">${SIZE_LABELS[size]}</button>`
    ).join('');

    const positionIcon = NEXT_POSITION_ICONS[this.currentPosition];
    const modeIcon = this.currentMode === 'bar' ? ICONS.floating : ICONS.barMode;

    // フローティングモード用（2列レイアウト）
    if (this.currentMode === 'floating') {
      return `
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
      `;
    }

    // バーモード用
    return `
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
      <div class="menu-spacer"></div>
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

    // 付箋アイコンボタン（トグル）- バーモードのみクリックで処理
    // フローティングモードではドラッグハンドラー内で処理
    if (this.currentMode !== 'floating') {
      menuBar.querySelector('.sticky-icon-btn')?.addEventListener('click', () => {
        this.toggle();
      });
    }

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
    const container = this.shadowRoot.querySelector('.sticky-menu-container') as HTMLDivElement;
    if (container) {
      // 次のフレームで hidden を外す（transition を発火させるため）
      requestAnimationFrame(() => {
        container.classList.remove('hidden');
      });
    }
    this.isVisible = true;
  }

  public hide(): void {
    const container = this.shadowRoot.querySelector('.sticky-menu-container');
    container?.classList.add('hidden');
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

    STICKY_COLORS.forEach((color) => {
      const swatch = menuBar.querySelector(`.color-swatch.${color}`) as HTMLElement;
      if (swatch) {
        swatch.style.backgroundColor = settings.colors[color];
      }
    });
  }

  /** 設定変更後にスタイルを再適用 */
  public refreshStyles(): void {
    // CSS変数を更新（ボタンサイズなど）
    this.updateCSSVariables();

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
  private applyModeAndPosition(container: HTMLDivElement): void {
    // すべてのモード・位置クラスを削除
    container.classList.remove('bar-top', 'bar-bottom', 'bar-left', 'bar-right', 'floating');

    if (this.currentMode === 'floating') {
      container.classList.add('floating');
      container.style.left = `${this.floatingPosition.x}px`;
      container.style.top = `${this.floatingPosition.y}px`;
      container.style.right = '';
      container.style.bottom = '';
    } else {
      container.classList.add(`bar-${this.currentPosition}`);
      container.style.left = '';
      container.style.top = '';
      container.style.right = '';
      container.style.bottom = '';
    }
  }

  /** 位置をサイクルで切り替え */
  private cyclePosition(container: HTMLDivElement): void {
    const currentIndex = POSITION_CYCLE.indexOf(this.currentPosition);
    const nextIndex = (currentIndex + 1) % POSITION_CYCLE.length;
    this.currentPosition = POSITION_CYCLE[nextIndex];

    // アイコンを更新
    const btn = container.querySelector('.position-btn');
    if (btn) {
      btn.innerHTML = NEXT_POSITION_ICONS[this.currentPosition];
    }

    this.applyModeAndPosition(container);
    this.saveSettings();
  }

  /** モードを切り替え */
  private toggleMode(container: HTMLDivElement): void {
    this.currentMode = this.currentMode === 'bar' ? 'floating' : 'bar';

    // HTMLを再生成（レイアウトが異なるため）
    container.innerHTML = this.getContainerHTML();
    this.setupEventListeners(container);

    this.applyModeAndPosition(container);
    this.saveSettings();
  }

  /** ドラッグハンドラーのセットアップ（フローティング時のアイコンドラッグ） */
  private setupDragHandlers(container: HTMLDivElement): void {
    // フローティングモードでアイコンをドラッグ可能にする
    const iconBtn = container.querySelector('.sticky-icon-btn') as HTMLElement;
    if (!iconBtn) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;

      let newX = e.clientX - this.dragOffset.x;
      let newY = e.clientY - this.dragOffset.y;

      // 画面外に出ないように制限
      const rect = container.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      this.floatingPosition = { x: newX, y: newY };
      container.style.left = `${newX}px`;
      container.style.top = `${newY}px`;
    };

    const onMouseUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        this.saveSettings();
      }
    };

    iconBtn.addEventListener('mousedown', (e: MouseEvent) => {
      if (this.currentMode !== 'floating') return;

      // クリックとドラッグを区別するためのフラグ
      const startX = e.clientX;
      const startY = e.clientY;
      let hasMoved = false;

      const checkMove = (moveE: MouseEvent) => {
        const dx = Math.abs(moveE.clientX - startX);
        const dy = Math.abs(moveE.clientY - startY);
        if (dx > 5 || dy > 5) {
          hasMoved = true;
          this.isDragging = true;
          const rect = container.getBoundingClientRect();
          this.dragOffset = {
            x: startX - rect.left,
            y: startY - rect.top,
          };
          document.removeEventListener('mousemove', checkMove);
          document.addEventListener('mousemove', onMouseMove);
        }
      };

      const handleUp = () => {
        document.removeEventListener('mousemove', checkMove);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', handleUp);
        if (this.isDragging) {
          this.isDragging = false;
          this.saveSettings();
        } else if (!hasMoved) {
          // ドラッグしなかった場合はトグル
          this.toggle();
        }
      };

      document.addEventListener('mousemove', checkMove);
      document.addEventListener('mouseup', handleUp);
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
