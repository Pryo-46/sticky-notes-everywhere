import type { ButtonSize, ColorPresetName, ExtensionSettings, StickyColor, StickySize } from '../types';
import { DEFAULT_SETTINGS, LIGHT_PRESET, DARK_PRESET, STICKY_COLORS, STICKY_SIZES } from '../types';
import { StorageService } from './StorageService';
import { ICONS } from './icons';
import { getSettingsModalStyles } from './styles/settings-modal.css';
import { isValidHexColor } from './utils/colorUtils';
import { createShadowDOM } from './utils/shadowDOM';

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

    const { host, shadowRoot } = createShadowDOM({
      id: 'sticky-notes-settings-host',
      styles: '',
      appendToBody: false,
    });
    this.element = host;
    this.shadowRoot = shadowRoot;

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
      baseZIndex: settings.baseZIndex,
      floatingIconPosition: settings.floatingIconPosition,
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
    return getSettingsModalStyles();
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

    const colorSettings = STICKY_COLORS.map(
      (color) => `
        <div class="color-setting-item">
          <input type="color" class="color-picker-input" data-color="${color}" value="${settings.colors[color]}"${!isUserPreset ? ' disabled' : ''}>
          <input type="text" class="color-input" data-color="${color}" value="${settings.colors[color]}" placeholder="#ffffff"${!isUserPreset ? ' disabled' : ''}>
        </div>
      `
    ).join('');

    const sizeSettings = STICKY_SIZES.map(
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

        if (isValidHexColor(value)) {
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

    // z-index基準値の変更
    const zIndexInput = modal.querySelector('#baseZIndex') as HTMLInputElement;
    zIndexInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 2147483600) {
        this.tempSettings.baseZIndex = value;
      }
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
    STICKY_COLORS.forEach((color) => {
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
    STICKY_COLORS.forEach((color) => {
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
    STICKY_SIZES.forEach((size) => {
      const widthInput = modal.querySelector(`.size-input[data-size="${size}"][data-dim="width"]`) as HTMLInputElement;
      const heightInput = modal.querySelector(`.size-input[data-size="${size}"][data-dim="height"]`) as HTMLInputElement;

      if (widthInput) {
        widthInput.value = String(this.tempSettings.sizes[size].width);
      }
      if (heightInput) {
        heightInput.value = String(this.tempSettings.sizes[size].height);
      }
    });

    // z-index設定を更新
    const zIndexInput = modal.querySelector('#baseZIndex') as HTMLInputElement;
    if (zIndexInput) {
      zIndexInput.value = String(this.tempSettings.baseZIndex);
    }
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
