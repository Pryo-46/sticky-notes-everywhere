import type { ExtensionSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'stickyNotesSettings';

type SettingsChangeCallback = (settings: ExtensionSettings) => void;

export class StorageService {
  private static instance: StorageService | null = null;
  private settings: ExtensionSettings = DEFAULT_SETTINGS;
  private changeCallbacks: SettingsChangeCallback[] = [];
  private initialized = false;

  private constructor() {
    // 設定変更を監視
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        this.settings = this.mergeWithDefaults(changes[STORAGE_KEY].newValue);
        this.notifyChange();
      }
    });
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /** 設定を読み込む */
  public async loadSettings(): Promise<ExtensionSettings> {
    if (this.initialized) {
      return this.settings;
    }

    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      this.settings = this.mergeWithDefaults(result[STORAGE_KEY]);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = DEFAULT_SETTINGS;
    }

    return this.settings;
  }

  /** 設定を保存する */
  public async saveSettings(settings: ExtensionSettings): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: settings });
      this.settings = settings;
      this.notifyChange();
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /** デフォルト設定にリセット */
  public async resetToDefaults(): Promise<void> {
    await this.saveSettings({ ...DEFAULT_SETTINGS });
  }

  /** 現在の設定を取得 */
  public getSettings(): ExtensionSettings {
    return this.settings;
  }

  /** 設定変更を購読 */
  public onSettingsChanged(callback: SettingsChangeCallback): () => void {
    this.changeCallbacks.push(callback);
    // 購読解除関数を返す
    return () => {
      const index = this.changeCallbacks.indexOf(callback);
      if (index > -1) {
        this.changeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyChange(): void {
    this.changeCallbacks.forEach((callback) => callback(this.settings));
  }

  /** 保存されたデータとデフォルト値をマージ */
  private mergeWithDefaults(saved: Partial<ExtensionSettings> | undefined): ExtensionSettings {
    if (!saved) {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      colors: { ...DEFAULT_SETTINGS.colors, ...saved.colors },
      sizes: {
        small: { ...DEFAULT_SETTINGS.sizes.small, ...saved.sizes?.small },
        medium: { ...DEFAULT_SETTINGS.sizes.medium, ...saved.sizes?.medium },
        large: { ...DEFAULT_SETTINGS.sizes.large, ...saved.sizes?.large },
      },
      defaultSize: saved.defaultSize ?? DEFAULT_SETTINGS.defaultSize,
    };
  }
}
