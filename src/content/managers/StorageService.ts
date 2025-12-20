import type { ExtensionSettings, StickyNoteData } from '../../types';
import { DEFAULT_SETTINGS } from '../../types';
import type { IStorageService } from '../types/storage';

const STORAGE_KEY = 'stickyNotesSettings';
const STICKY_NOTES_KEY = 'stickyNotesData';

type SettingsChangeCallback = (settings: ExtensionSettings) => void;

export class StorageService implements IStorageService {
  private static instance: StorageService | null = null;
  private settings: ExtensionSettings = DEFAULT_SETTINGS;
  private changeCallbacks: SettingsChangeCallback[] = [];
  private initialized = false;

  private constructor() {
    // 設定変更を監視
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        this.settings = this.mergeWithDefaults(changes[STORAGE_KEY].newValue as Partial<ExtensionSettings> | undefined);
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
      this.settings = this.mergeWithDefaults(result[STORAGE_KEY] as Partial<ExtensionSettings> | undefined);
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

  // ========================================
  // 付箋データの保存・読み込み
  // ========================================

  /** 付箋データを読み込む */
  public async loadStickyNotes(): Promise<StickyNoteData[]> {
    try {
      const result = await chrome.storage.local.get(STICKY_NOTES_KEY);
      return (result[STICKY_NOTES_KEY] as StickyNoteData[]) || [];
    } catch (error) {
      console.error('Failed to load sticky notes:', error);
      return [];
    }
  }

  /** 付箋データを保存する */
  public async saveStickyNotes(notes: StickyNoteData[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [STICKY_NOTES_KEY]: notes });
    } catch (error) {
      console.error('Failed to save sticky notes:', error);
    }
  }

  /** 全付箋データを削除する */
  public async clearStickyNotes(): Promise<void> {
    try {
      await chrome.storage.local.remove(STICKY_NOTES_KEY);
    } catch (error) {
      console.error('Failed to clear sticky notes:', error);
    }
  }

  /** 保存されたデータとデフォルト値をマージ */
  private mergeWithDefaults(saved: Partial<ExtensionSettings> | undefined): ExtensionSettings {
    if (!saved) {
      return {
        activePreset: DEFAULT_SETTINGS.activePreset,
        colors: { ...DEFAULT_SETTINGS.colors },
        userPresets: {
          user1: { ...DEFAULT_SETTINGS.userPresets.user1 },
          user2: { ...DEFAULT_SETTINGS.userPresets.user2 },
        },
        sizes: { ...DEFAULT_SETTINGS.sizes },
        defaultSize: DEFAULT_SETTINGS.defaultSize,
        buttonSize: DEFAULT_SETTINGS.buttonSize,
        menuBarMode: DEFAULT_SETTINGS.menuBarMode,
        menuBarPosition: DEFAULT_SETTINGS.menuBarPosition,
        floatingPosition: { ...DEFAULT_SETTINGS.floatingPosition },
        baseZIndex: DEFAULT_SETTINGS.baseZIndex,
        floatingIconPosition: DEFAULT_SETTINGS.floatingIconPosition,
      };
    }

    return {
      activePreset: saved.activePreset ?? DEFAULT_SETTINGS.activePreset,
      colors: { ...DEFAULT_SETTINGS.colors, ...saved.colors },
      userPresets: {
        user1: { ...DEFAULT_SETTINGS.userPresets.user1, ...saved.userPresets?.user1 },
        user2: { ...DEFAULT_SETTINGS.userPresets.user2, ...saved.userPresets?.user2 },
      },
      sizes: {
        small: { ...DEFAULT_SETTINGS.sizes.small, ...saved.sizes?.small },
        medium: { ...DEFAULT_SETTINGS.sizes.medium, ...saved.sizes?.medium },
        large: { ...DEFAULT_SETTINGS.sizes.large, ...saved.sizes?.large },
      },
      defaultSize: saved.defaultSize ?? DEFAULT_SETTINGS.defaultSize,
      buttonSize: saved.buttonSize ?? DEFAULT_SETTINGS.buttonSize,
      menuBarMode: saved.menuBarMode ?? DEFAULT_SETTINGS.menuBarMode,
      menuBarPosition: saved.menuBarPosition ?? DEFAULT_SETTINGS.menuBarPosition,
      floatingPosition: { ...DEFAULT_SETTINGS.floatingPosition, ...saved.floatingPosition },
      baseZIndex: saved.baseZIndex ?? DEFAULT_SETTINGS.baseZIndex,
      floatingIconPosition: saved.floatingIconPosition ?? DEFAULT_SETTINGS.floatingIconPosition,
    };
  }
}
