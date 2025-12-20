import type { ButtonSize, ColorPresetName, ExtensionSettings, StickySize } from '../types';
import { STICKY_COLORS, STICKY_SIZES } from '../types';
import { ICONS } from './icons';

const SIZE_LABELS_FULL: Record<StickySize, string> = {
  small: 'S（小）',
  medium: 'M（中）',
  large: 'L（大）',
};

const BUTTON_SIZES: ButtonSize[] = ['small', 'medium', 'large'];
const BUTTON_SIZE_LABELS: Record<ButtonSize, string> = {
  small: '小（32px）',
  medium: '中（40px）',
  large: '大（48px）',
};

const PRESET_LABELS: Record<ColorPresetName, string> = {
  light: 'ライト',
  dark: 'ダーク',
  user1: 'ユーザー1',
  user2: 'ユーザー2',
};

/**
 * SettingsModalのHTML生成を担当
 */
export class SettingsModalRenderer {
  public renderModal(settings: ExtensionSettings): string {
    const activePreset = settings.activePreset || 'light';
    const isUserPreset = activePreset === 'user1' || activePreset === 'user2';

    const presetButtons = this.renderPresetButtons(activePreset);
    const colorSettings = this.renderColorSettings(settings, isUserPreset);
    const sizeSettings = this.renderSizeSettings(settings);
    const buttonSizeButtons = this.renderButtonSizeButtons(settings.buttonSize);

    return `
      <div class="settings-modal">
        <div class="settings-header">
          <h2>設定</h2>
          <button class="close-btn" title="閉じる">${ICONS.close}</button>
        </div>
        <div class="settings-body">
          <div class="settings-section">
            <h3>カラープリセット</h3>
            <div class="preset-selector">
              ${presetButtons}
            </div>
            <div class="color-settings">
              ${colorSettings}
            </div>
          </div>
          <div class="settings-section">
            <h3>サイズプリセット（ピクセル）</h3>
            <div class="size-settings">
              ${sizeSettings}
            </div>
          </div>
          <div class="settings-section">
            <h3>メニューボタンサイズ</h3>
            <div class="button-size-selector">
              ${buttonSizeButtons}
            </div>
          </div>
          <div class="settings-section">
            <h3>重なり順（z-index）</h3>
            <div class="zindex-setting">
              <input type="number" class="zindex-input" id="baseZIndex" value="${settings.baseZIndex}" min="1" max="2147483600">
              <span class="zindex-hint">付箋が他の要素より前面に出ない場合は値を上げてください（最大: 2147483647）</span>
            </div>
          </div>
        </div>
        <div class="settings-footer">
          <div class="footer-left">
            <button class="btn btn-danger reset-btn">デフォルトに戻す</button>
          </div>
          <div class="footer-right">
            <button class="btn btn-secondary cancel-btn">キャンセル</button>
            <button class="btn btn-primary save-btn">保存</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderPresetButtons(activePreset: ColorPresetName): string {
    return (['light', 'dark', 'user1', 'user2'] as ColorPresetName[]).map(
      (preset) => {
        const isActive = preset === activePreset;
        const isUser = preset === 'user1' || preset === 'user2';
        return `<button class="preset-btn${isActive ? ' active' : ''}${isUser ? ' user-preset' : ''}" data-preset="${preset}">${PRESET_LABELS[preset]}</button>`;
      }
    ).join('');
  }

  private renderColorSettings(settings: ExtensionSettings, isUserPreset: boolean): string {
    return STICKY_COLORS.map(
      (color) => `
        <div class="color-setting-item">
          <input type="color" class="color-picker-input" data-color="${color}" value="${settings.colors[color]}"${!isUserPreset ? ' disabled' : ''}>
          <input type="text" class="color-input" data-color="${color}" value="${settings.colors[color]}" placeholder="#ffffff"${!isUserPreset ? ' disabled' : ''}>
        </div>
      `
    ).join('');
  }

  private renderSizeSettings(settings: ExtensionSettings): string {
    return STICKY_SIZES.map(
      (size) => `
        <div class="size-setting-item">
          <span class="size-label">${SIZE_LABELS_FULL[size]}</span>
          <div class="size-inputs">
            <div class="size-input-group">
              <label>幅</label>
              <input type="number" class="size-input" data-size="${size}" data-dim="width" value="${settings.sizes[size].width}" min="150" max="600">
            </div>
            <div class="size-input-group">
              <label>高さ</label>
              <input type="number" class="size-input" data-size="${size}" data-dim="height" value="${settings.sizes[size].height}" min="100" max="400">
            </div>
          </div>
          <label class="size-default-radio">
            <input type="radio" name="defaultSize" value="${size}" ${settings.defaultSize === size ? 'checked' : ''}>
            <span>デフォルト</span>
          </label>
        </div>
      `
    ).join('');
  }

  private renderButtonSizeButtons(currentSize: ButtonSize): string {
    return BUTTON_SIZES.map(
      (size) => `<button class="button-size-btn${currentSize === size ? ' active' : ''}" data-button-size="${size}">${BUTTON_SIZE_LABELS[size]}</button>`
    ).join('');
  }
}
