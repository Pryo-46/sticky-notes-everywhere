import type { ButtonSize, ColorPresetName, ExtensionSettings, StickyColor, StickySize } from '../types';
import { DEFAULT_SETTINGS, LIGHT_PRESET, DARK_PRESET } from '../types';
import { StorageService } from './StorageService';
import { ICONS } from './icons';
import { BUTTON_RADIUS } from './MenuBar';

const COLORS: StickyColor[] = ['color1', 'color2', 'color3', 'color4', 'color5', 'color6', 'color7', 'color8'];
const SIZES: StickySize[] = ['small', 'medium', 'large'];
const SIZE_LABELS: Record<StickySize, string> = {
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

type SettingsSavedCallback = (settings: ExtensionSettings) => void;

export class SettingsModal {
  private element: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private storageService: StorageService;
  private tempSettings: ExtensionSettings;
  private savedCallback: SettingsSavedCallback | null = null;

  constructor() {
    this.storageService = StorageService.getInstance();
    this.tempSettings = this.deepCopySettings(this.storageService.getSettings());

    this.element = document.createElement('div');
    this.element.id = 'sticky-notes-settings-host';
    this.shadowRoot = this.element.attachShadow({ mode: 'closed' });

    this.render();
  }

  private deepCopySettings(settings: ExtensionSettings): ExtensionSettings {
    return {
      activePreset: settings.activePreset,
      colors: { ...settings.colors },
      userPresets: {
        user1: { ...settings.userPresets.user1 },
        user2: { ...settings.userPresets.user2 },
      },
      sizes: {
        small: { ...settings.sizes.small },
        medium: { ...settings.sizes.medium },
        large: { ...settings.sizes.large },
      },
      defaultSize: settings.defaultSize,
      buttonSize: settings.buttonSize,
      menuBarMode: settings.menuBarMode,
      menuBarPosition: settings.menuBarPosition,
      floatingPosition: { ...settings.floatingPosition },
    };
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot.appendChild(style);

    const modal = document.createElement('div');
    modal.className = 'settings-overlay hidden';
    modal.innerHTML = this.getModalHTML();
    this.shadowRoot.appendChild(modal);

    this.setupEventListeners(modal);
  }

  private getStyles(): string {
    return `
      .settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .settings-overlay.hidden {
        display: none;
      }

      .settings-modal {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        width: 480px;
        max-width: 90vw;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e9ecef;
        background: #f8f9fa;
      }

      .settings-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #212529;
      }

      .close-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: ${BUTTON_RADIUS}px;
        background: transparent;
        cursor: pointer;
        color: #868e96;
        transition: all 0.15s ease;
      }

      .close-btn:hover {
        background: #e9ecef;
        color: #495057;
      }

      .settings-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }

      .settings-section {
        margin-bottom: 24px;
      }

      .settings-section:last-child {
        margin-bottom: 0;
      }

      .settings-section h3 {
        font-size: 14px;
        font-weight: 600;
        color: #495057;
        margin: 0 0 12px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .preset-selector {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }

      .preset-btn {
        flex: 1;
        padding: 8px 12px;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: #495057;
        transition: all 0.15s ease;
      }

      .preset-btn:hover {
        border-color: #adb5bd;
        background: #f8f9fa;
      }

      .preset-btn.active {
        border-color: #4dabf7;
        background: #e7f5ff;
        color: #1c7ed6;
      }

      .preset-btn.user-preset {
        border-style: dashed;
      }

      .color-settings {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .color-setting-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .color-picker-input {
        width: 32px;
        height: 32px;
        padding: 0;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: ${BUTTON_RADIUS}px;
        cursor: pointer;
        background: none;
        transition: transform 0.15s ease;
      }

      .color-picker-input:hover {
        transform: scale(1.1);
      }

      .color-picker-input::-webkit-color-swatch-wrapper {
        padding: 2px;
      }

      .color-picker-input::-webkit-color-swatch {
        border: none;
        border-radius: 4px;
      }

      .color-picker-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .color-picker-input:disabled:hover {
        transform: none;
      }

      .color-input {
        width: 90px;
        padding: 4px 8px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
      }

      .color-input:focus {
        outline: none;
        border-color: #4dabf7;
        box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
      }

      .color-input:disabled {
        opacity: 0.6;
        background: #f8f9fa;
        cursor: not-allowed;
      }

      .size-settings {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .size-setting-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .size-label {
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        min-width: 70px;
      }

      .size-inputs {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .size-input-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .size-input-group label {
        font-size: 12px;
        color: #868e96;
      }

      .size-input {
        width: 60px;
        padding: 4px 8px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 13px;
        text-align: center;
      }

      .size-input:focus {
        outline: none;
        border-color: #4dabf7;
        box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
      }

      .size-default-radio {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: auto;
        cursor: pointer;
      }

      .size-default-radio input[type="radio"] {
        width: 16px;
        height: 16px;
        margin: 0;
        cursor: pointer;
        accent-color: #4dabf7;
      }

      .size-default-radio span {
        font-size: 12px;
        color: #868e96;
      }

      .size-default-radio:has(input:checked) span {
        color: #4dabf7;
        font-weight: 500;
      }

      .button-size-selector {
        display: flex;
        gap: 8px;
      }

      .button-size-btn {
        flex: 1;
        padding: 8px 12px;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: #495057;
        transition: all 0.15s ease;
      }

      .button-size-btn:hover {
        border-color: #adb5bd;
        background: #f8f9fa;
      }

      .button-size-btn.active {
        border-color: #4dabf7;
        background: #e7f5ff;
        color: #1c7ed6;
      }

      .settings-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
      }

      .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .btn-secondary {
        background: #fff;
        border: 1px solid #ced4da;
        color: #495057;
      }

      .btn-secondary:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
      }

      .btn-primary {
        background: #4dabf7;
        border: 1px solid #339af0;
        color: #fff;
      }

      .btn-primary:hover {
        background: #339af0;
      }

      .btn-danger {
        background: #fff;
        border: 1px solid #fa5252;
        color: #fa5252;
      }

      .btn-danger:hover {
        background: #fff5f5;
      }

      .footer-left {
        display: flex;
        gap: 8px;
      }

      .footer-right {
        display: flex;
        gap: 8px;
      }
    `;
  }

  private getModalHTML(): string {
    const settings = this.storageService.getSettings();
    const activePreset = settings.activePreset || 'light';
    const isUserPreset = activePreset === 'user1' || activePreset === 'user2';

    const presetButtons = (['light', 'dark', 'user1', 'user2'] as ColorPresetName[]).map(
      (preset) => {
        const isActive = preset === activePreset;
        const isUser = preset === 'user1' || preset === 'user2';
        return `<button class="preset-btn${isActive ? ' active' : ''}${isUser ? ' user-preset' : ''}" data-preset="${preset}">${PRESET_LABELS[preset]}</button>`;
      }
    ).join('');

    const colorSettings = COLORS.map(
      (color) => `
        <div class="color-setting-item">
          <input type="color" class="color-picker-input" data-color="${color}" value="${settings.colors[color]}"${!isUserPreset ? ' disabled' : ''}>
          <input type="text" class="color-input" data-color="${color}" value="${settings.colors[color]}" placeholder="#ffffff"${!isUserPreset ? ' disabled' : ''}>
        </div>
      `
    ).join('');

    const sizeSettings = SIZES.map(
      (size) => `
        <div class="size-setting-item">
          <span class="size-label">${SIZE_LABELS[size]}</span>
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

    const buttonSizeButtons = BUTTON_SIZES.map(
      (size) => `<button class="button-size-btn${settings.buttonSize === size ? ' active' : ''}" data-button-size="${size}">${BUTTON_SIZE_LABELS[size]}</button>`
    ).join('');

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

  private setupEventListeners(modal: HTMLDivElement): void {
    // 閉じるボタン
    modal.querySelector('.close-btn')?.addEventListener('click', () => this.hide());

    // キャンセルボタン
    modal.querySelector('.cancel-btn')?.addEventListener('click', () => this.hide());

    // 保存ボタン
    modal.querySelector('.save-btn')?.addEventListener('click', () => this.save());

    // リセットボタン
    modal.querySelector('.reset-btn')?.addEventListener('click', () => this.resetToDefaults());

    // オーバーレイクリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hide();
      }
    });

    // プリセット切り替え
    modal.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const preset = target.dataset.preset as ColorPresetName;
        this.switchPreset(modal, preset);
      });
    });

    // カラーピッカー（input[type="color"]）の変更
    modal.querySelectorAll('.color-picker-input').forEach((picker) => {
      picker.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const color = target.dataset.color as StickyColor;
        const newColor = target.value;

        this.tempSettings.colors[color] = newColor;
        // ユーザープリセットの場合は保存用にも更新
        const activePreset = this.tempSettings.activePreset;
        if (activePreset === 'user1' || activePreset === 'user2') {
          this.tempSettings.userPresets[activePreset][color] = newColor;
        }

        // テキスト入力も同期
        const textInput = modal.querySelector(`.color-input[data-color="${color}"]`) as HTMLInputElement;
        if (textInput) {
          textInput.value = newColor;
        }
      });
    });

    // テキスト入力の変更
    modal.querySelectorAll('.color-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const color = target.dataset.color as StickyColor;
        const value = target.value;

        if (this.isValidHexColor(value)) {
          this.tempSettings.colors[color] = value;
          // ユーザープリセットの場合は保存用にも更新
          const activePreset = this.tempSettings.activePreset;
          if (activePreset === 'user1' || activePreset === 'user2') {
            this.tempSettings.userPresets[activePreset][color] = value;
          }

          // カラーピッカーも同期
          const picker = modal.querySelector(`.color-picker-input[data-color="${color}"]`) as HTMLInputElement;
          if (picker) {
            picker.value = value;
          }
        }
      });
    });

    // サイズ入力の変更
    modal.querySelectorAll('.size-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const size = target.dataset.size as StickySize;
        const dim = target.dataset.dim as 'width' | 'height';
        const value = parseInt(target.value, 10);

        if (!isNaN(value) && value > 0) {
          this.tempSettings.sizes[size][dim] = value;
        }
      });
    });

    // デフォルトサイズの変更
    modal.querySelectorAll('input[name="defaultSize"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.tempSettings.defaultSize = target.value as StickySize;
      });
    });

    // メニューボタンサイズの変更
    modal.querySelectorAll('.button-size-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const size = target.dataset.buttonSize as ButtonSize;
        this.tempSettings.buttonSize = size;

        // アクティブ状態を更新
        modal.querySelectorAll('.button-size-btn').forEach((b) => b.classList.remove('active'));
        target.classList.add('active');
      });
    });
  }

  private switchPreset(modal: HTMLDivElement, preset: ColorPresetName): void {
    this.tempSettings.activePreset = preset;

    // プリセットに応じた色を設定
    let colors;
    switch (preset) {
      case 'light':
        colors = { ...LIGHT_PRESET };
        break;
      case 'dark':
        colors = { ...DARK_PRESET };
        break;
      case 'user1':
        colors = { ...this.tempSettings.userPresets.user1 };
        break;
      case 'user2':
        colors = { ...this.tempSettings.userPresets.user2 };
        break;
    }
    this.tempSettings.colors = colors;

    // ボタンのactive状態を更新
    modal.querySelectorAll('.preset-btn').forEach((btn) => {
      const btnPreset = (btn as HTMLButtonElement).dataset.preset;
      btn.classList.toggle('active', btnPreset === preset);
    });

    // 色入力の値を更新し、ユーザープリセット以外は無効化
    const isUserPreset = preset === 'user1' || preset === 'user2';
    COLORS.forEach((color) => {
      const picker = modal.querySelector(`.color-picker-input[data-color="${color}"]`) as HTMLInputElement;
      const textInput = modal.querySelector(`.color-input[data-color="${color}"]`) as HTMLInputElement;
      if (picker) {
        picker.value = colors[color];
        picker.disabled = !isUserPreset;
      }
      if (textInput) {
        textInput.value = colors[color];
        textInput.disabled = !isUserPreset;
      }
    });
  }

  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }

  private async save(): Promise<void> {
    await this.storageService.saveSettings(this.tempSettings);
    this.savedCallback?.(this.tempSettings);
    this.hide();
  }

  private async resetToDefaults(): Promise<void> {
    const confirmed = window.confirm('設定をデフォルトに戻しますか？');
    if (!confirmed) return;

    this.tempSettings = this.deepCopySettings(DEFAULT_SETTINGS);
    await this.storageService.resetToDefaults();
    this.updateUIFromSettings();
    this.savedCallback?.(this.tempSettings);
  }

  private updateUIFromSettings(): void {
    const modal = this.shadowRoot.querySelector('.settings-overlay');
    if (!modal) return;

    const activePreset = this.tempSettings.activePreset || 'light';
    const isUserPreset = activePreset === 'user1' || activePreset === 'user2';

    // プリセットボタンの状態を更新
    modal.querySelectorAll('.preset-btn').forEach((btn) => {
      const btnPreset = (btn as HTMLButtonElement).dataset.preset;
      btn.classList.toggle('active', btnPreset === activePreset);
    });

    // カラー設定を更新
    COLORS.forEach((color) => {
      const textInput = modal.querySelector(`.color-input[data-color="${color}"]`) as HTMLInputElement;
      const picker = modal.querySelector(`.color-picker-input[data-color="${color}"]`) as HTMLInputElement;

      if (textInput) {
        textInput.value = this.tempSettings.colors[color];
        textInput.disabled = !isUserPreset;
      }
      if (picker) {
        picker.value = this.tempSettings.colors[color];
        picker.disabled = !isUserPreset;
      }
    });

    // サイズ設定を更新
    SIZES.forEach((size) => {
      const widthInput = modal.querySelector(`.size-input[data-size="${size}"][data-dim="width"]`) as HTMLInputElement;
      const heightInput = modal.querySelector(`.size-input[data-size="${size}"][data-dim="height"]`) as HTMLInputElement;

      if (widthInput) {
        widthInput.value = String(this.tempSettings.sizes[size].width);
      }
      if (heightInput) {
        heightInput.value = String(this.tempSettings.sizes[size].height);
      }
    });
  }

  public show(): void {
    if (!this.element.parentElement) {
      document.body.appendChild(this.element);
    }

    // 現在の設定を読み込む
    this.tempSettings = this.deepCopySettings(this.storageService.getSettings());
    this.updateUIFromSettings();

    this.shadowRoot.querySelector('.settings-overlay')?.classList.remove('hidden');
  }

  public hide(): void {
    this.shadowRoot.querySelector('.settings-overlay')?.classList.add('hidden');
  }

  public onSettingsSaved(callback: SettingsSavedCallback): void {
    this.savedCallback = callback;
  }
}
