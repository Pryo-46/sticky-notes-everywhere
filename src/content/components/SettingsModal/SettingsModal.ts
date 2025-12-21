import type { ColorPresetName, ExtensionSettings } from '../../../types';
import { DEFAULT_SETTINGS, STICKY_COLORS, STICKY_SIZES } from '../../../types';
import { StorageService } from '../../managers/StorageService';
import { getSettingsModalStyles } from '../../styles/settings-modal.css';
import { createShadowDOM } from '../../utils/shadowDOM';
import { SettingsModalRenderer } from './SettingsModalRenderer';
import { SettingsModalController } from './SettingsModalController';

type SettingsSavedCallback = (settings: ExtensionSettings) => void;

export class SettingsModal {
  private element: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private storageService: StorageService;
  private tempSettings: ExtensionSettings;
  private savedCallback: SettingsSavedCallback | null = null;

  private renderer: SettingsModalRenderer;
  private controller: SettingsModalController;

  constructor() {
    this.storageService = StorageService.getInstance();
    this.tempSettings = this.deepCopySettings(this.storageService.getSettings());

    this.renderer = new SettingsModalRenderer();
    this.controller = new SettingsModalController();

    const { host, shadowRoot } = createShadowDOM({
      id: 'sticky-notes-settings-host',
      styles: '',
      appendToBody: false,
    });
    this.element = host;
    this.shadowRoot = shadowRoot;

    this.setupControllerCallbacks();
    this.render();
  }

  private setupControllerCallbacks(): void {
    this.controller.setCallbacks({
      onClose: () => this.hide(),
      onSave: () => this.save(),
      onReset: () => this.resetToDefaults(),
      onPresetChange: (preset) => this.switchPreset(preset),
      onColorChange: (color, value) => {
        this.tempSettings.colors[color] = value;
        const activePreset = this.tempSettings.activePreset;
        if (activePreset === 'user1' || activePreset === 'user2') {
          this.tempSettings.userPresets[activePreset][color] = value;
        }
      },
      onSizeChange: (size, dim, value) => {
        this.tempSettings.sizes[size][dim] = value;
      },
      onDefaultSizeChange: (size) => {
        this.tempSettings.defaultSize = size;
      },
      onButtonSizeChange: (size) => {
        this.tempSettings.buttonSize = size;
      },
      onZIndexChange: (value) => {
        this.tempSettings.baseZIndex = value;
      },
      onAutoShowMenuChange: (value) => {
        this.tempSettings.autoShowMenu = value;
      },
    });
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
      stickyPinned: settings.stickyPinned,
      autoShowMenu: settings.autoShowMenu,
    };
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = getSettingsModalStyles();
    this.shadowRoot.appendChild(style);

    const modal = document.createElement('div');
    modal.className = 'settings-overlay hidden';
    modal.innerHTML = this.renderer.renderModal(this.storageService.getSettings());
    this.shadowRoot.appendChild(modal);

    this.controller.setupEventListeners(modal);
  }

  private switchPreset(preset: ColorPresetName): void {
    this.tempSettings.activePreset = preset;

    const colors = this.controller.getColorsForPreset(preset, this.tempSettings.userPresets);
    this.tempSettings.colors = colors;

    const modal = this.shadowRoot.querySelector('.settings-overlay') as HTMLDivElement;
    if (modal) {
      this.controller.updatePresetUI(modal, preset, colors);
    }
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

    // 動作設定を更新
    const autoShowMenuCheckbox = modal.querySelector('#autoShowMenu') as HTMLInputElement;
    if (autoShowMenuCheckbox) {
      autoShowMenuCheckbox.checked = this.tempSettings.autoShowMenu;
    }
  }

  public show(): void {
    if (!this.element.parentElement) {
      document.body.appendChild(this.element);
    }

    this.tempSettings = this.deepCopySettings(this.storageService.getSettings());
    this.updateUIFromSettings();

    this.shadowRoot.querySelector('.settings-overlay')?.classList.remove('hidden');
  }

  public hide(): void {
    this.shadowRoot.querySelector('.settings-overlay')?.classList.add('hidden');
  }

  /** モーダルをDOMから完全に削除 */
  public destroy(): void {
    this.hide();
    this.element.remove();
  }

  public onSettingsSaved(callback: SettingsSavedCallback): void {
    this.savedCallback = callback;
  }
}
