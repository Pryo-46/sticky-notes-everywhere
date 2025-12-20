import type { StickySize, MenuBarMode, MenuBarPosition, ExtensionSettings } from '../../../types';
import { STICKY_COLORS, STICKY_SIZES, SIZE_LABELS } from '../../../types';
import { ICONS } from '../../icons';

// 現在の位置から次の位置へ移動するアイコン（押したらどこに行くか）
const NEXT_POSITION_ICONS: Record<MenuBarPosition, string> = {
  top: ICONS.moveLeft,
  left: ICONS.moveDown,
  bottom: ICONS.moveRight,
  right: ICONS.moveUp,
};

export interface MenuBarRenderOptions {
  selectedSize: StickySize;
  currentMode: MenuBarMode;
  currentPosition: MenuBarPosition;
  settings: ExtensionSettings;
}

/**
 * MenuBarのHTML生成を担当
 */
export class MenuBarRenderer {
  /** コンテナ全体のHTML（アイコン + メニューバー） */
  public renderContainer(): string {
    return `
      <button class="sticky-icon-btn" title="メニューを開閉">${ICONS.stickyNote}</button>
      <div class="sticky-notes-menu-bar">
      </div>
    `;
  }

  /** メニューバー内部のHTML */
  public renderMenuBar(options: MenuBarRenderOptions): string {
    const { selectedSize, currentMode, currentPosition, settings } = options;

    const colorSwatches = this.renderColorSwatches(settings);
    const sizeButtons = this.renderSizeButtons(selectedSize);
    const positionIcon = NEXT_POSITION_ICONS[currentPosition];
    const modeIcon = currentMode === 'bar' ? ICONS.floating : ICONS.barMode;

    if (currentMode === 'floating') {
      return this.renderFloatingLayout(sizeButtons, colorSwatches, modeIcon);
    }

    return this.renderBarLayout(sizeButtons, colorSwatches, positionIcon, modeIcon);
  }

  private renderColorSwatches(settings: ExtensionSettings): string {
    return STICKY_COLORS.map(
      (color) => `<div class="color-swatch ${color}" data-color="${color}" draggable="true" style="background-color: ${settings.colors[color]}"></div>`
    ).join('');
  }

  private renderSizeButtons(selectedSize: StickySize): string {
    return STICKY_SIZES.map(
      (size) =>
        `<button class="size-btn ${size === selectedSize ? 'active' : ''}" data-size="${size}">${SIZE_LABELS[size]}</button>`
    ).join('');
  }

  private renderFloatingLayout(sizeButtons: string, colorSwatches: string, modeIcon: string): string {
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

  private renderBarLayout(
    sizeButtons: string,
    colorSwatches: string,
    positionIcon: string,
    modeIcon: string
  ): string {
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

  /** 位置切替ボタンのアイコンを取得 */
  public getPositionIcon(position: MenuBarPosition): string {
    return NEXT_POSITION_ICONS[position];
  }

  /** モード切替ボタンのアイコンを取得 */
  public getModeIcon(mode: MenuBarMode): string {
    return mode === 'bar' ? ICONS.floating : ICONS.barMode;
  }

  /** 表示/非表示アイコンを取得 */
  public getVisibilityIcon(visible: boolean): string {
    return visible ? ICONS.visibility : ICONS.visibilityOff;
  }
}
