import type { BlacklistEntry, ExtensionSettings, PageHistory, StickyNoteData, StickyNoteSet } from '../../types';
import { DEFAULT_SETTINGS } from '../../types';
import type { IStorageService } from '../types/storage';

const STORAGE_KEY = 'stickyNotesSettings';
const STICKY_NOTES_KEY = 'stickyNotesData';
const STICKY_NOTES_URL_KEY = 'stickyNotesLastUrl';
const SETS_KEY = 'stickyNotesSets';
const PAGE_HISTORY_KEY = 'stickyNotesPageHistory';
const DISABLED_PAGES_KEY = 'stickyNotesDisabledPages';
const BLACKLIST_KEY = 'stickyNotesBlacklist';
const MAX_PAGE_HISTORY = 50;

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
  public async saveStickyNotes(notes: StickyNoteData[], url?: string): Promise<void> {
    try {
      const data: Record<string, unknown> = { [STICKY_NOTES_KEY]: notes };
      if (url) {
        data[STICKY_NOTES_URL_KEY] = url;
      }
      await chrome.storage.local.set(data);
    } catch (error) {
      console.error('Failed to save sticky notes:', error);
    }
  }

  /** 最後に保存した付箋のURLを取得する */
  public async getLastSavedUrl(): Promise<string> {
    try {
      const result = await chrome.storage.local.get(STICKY_NOTES_URL_KEY);
      return (result[STICKY_NOTES_URL_KEY] as string) || '';
    } catch (error) {
      console.error('Failed to get last saved URL:', error);
      return '';
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
        stickyPinned: DEFAULT_SETTINGS.stickyPinned,
        autoShowMenu: DEFAULT_SETTINGS.autoShowMenu,
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
      stickyPinned: saved.stickyPinned ?? DEFAULT_SETTINGS.stickyPinned,
      autoShowMenu: saved.autoShowMenu ?? DEFAULT_SETTINGS.autoShowMenu,
    };
  }

  // ========================================
  // セット管理
  // ========================================

  /** セット一覧を読み込む */
  public async loadSets(): Promise<StickyNoteSet[]> {
    try {
      const result = await chrome.storage.local.get(SETS_KEY);
      return (result[SETS_KEY] as StickyNoteSet[]) || [];
    } catch (error) {
      console.error('Failed to load sets:', error);
      return [];
    }
  }

  /** セットを保存する（新規または上書き） */
  public async saveSet(set: StickyNoteSet): Promise<void> {
    try {
      const sets = await this.loadSets();
      const existingIndex = sets.findIndex((s) => s.id === set.id);

      if (existingIndex >= 0) {
        sets[existingIndex] = set;
      } else {
        sets.push(set);
      }

      await chrome.storage.local.set({ [SETS_KEY]: sets });
    } catch (error) {
      console.error('Failed to save set:', error);
      throw error;
    }
  }

  /** セットを削除する */
  public async deleteSet(setId: string): Promise<void> {
    try {
      const sets = await this.loadSets();
      const filtered = sets.filter((s) => s.id !== setId);
      await chrome.storage.local.set({ [SETS_KEY]: filtered });
    } catch (error) {
      console.error('Failed to delete set:', error);
      throw error;
    }
  }

  /** セット名を更新する */
  public async updateSetName(setId: string, newName: string): Promise<void> {
    try {
      const sets = await this.loadSets();
      const set = sets.find((s) => s.id === setId);

      if (set) {
        set.name = newName;
        set.updatedAt = Date.now();
        await chrome.storage.local.set({ [SETS_KEY]: sets });
      }
    } catch (error) {
      console.error('Failed to update set name:', error);
      throw error;
    }
  }

  // ========================================
  // ページ履歴
  // ========================================

  /** ページ履歴を読み込む */
  public async loadPageHistory(): Promise<PageHistory[]> {
    try {
      const result = await chrome.storage.local.get(PAGE_HISTORY_KEY);
      return (result[PAGE_HISTORY_KEY] as PageHistory[]) || [];
    } catch (error) {
      console.error('Failed to load page history:', error);
      return [];
    }
  }

  /** ページ履歴を保存する（同一URLは上書き、最大50件） */
  public async savePageHistory(history: PageHistory): Promise<void> {
    try {
      const histories = await this.loadPageHistory();
      const existingIndex = histories.findIndex((h) => h.url === history.url);

      if (existingIndex >= 0) {
        histories.splice(existingIndex, 1);
      }

      histories.unshift(history);

      if (histories.length > MAX_PAGE_HISTORY) {
        histories.length = MAX_PAGE_HISTORY;
      }

      await chrome.storage.local.set({ [PAGE_HISTORY_KEY]: histories });
    } catch (error) {
      console.error('Failed to save page history:', error);
    }
  }

  /** ページ履歴をすべて削除する */
  public async clearPageHistory(): Promise<void> {
    try {
      await chrome.storage.local.remove(PAGE_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear page history:', error);
    }
  }

  // ========================================
  // ストレージ使用量
  // ========================================

  /** ストレージ使用量を取得する（バイト） */
  public async getStorageUsage(): Promise<number> {
    try {
      return await chrome.storage.local.getBytesInUse();
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return 0;
    }
  }

  // ========================================
  // 無効化ページ管理
  // ========================================

  /** 無効化ページ一覧を読み込む */
  public async loadDisabledPages(): Promise<string[]> {
    try {
      const result = await chrome.storage.local.get(DISABLED_PAGES_KEY);
      return (result[DISABLED_PAGES_KEY] as string[]) || [];
    } catch (error) {
      console.error('Failed to load disabled pages:', error);
      return [];
    }
  }

  /** ページが無効化されているかチェック */
  public async isPageDisabled(url: string): Promise<boolean> {
    const disabledPages = await this.loadDisabledPages();
    return disabledPages.includes(url);
  }

  /** ページの無効化状態をトグル */
  public async togglePageDisabled(url: string): Promise<boolean> {
    try {
      const disabledPages = await this.loadDisabledPages();
      const index = disabledPages.indexOf(url);

      if (index >= 0) {
        // 有効化（リストから削除）
        disabledPages.splice(index, 1);
        await chrome.storage.local.set({ [DISABLED_PAGES_KEY]: disabledPages });
        return false; // 無効化解除
      } else {
        // 無効化（リストに追加）
        disabledPages.push(url);
        await chrome.storage.local.set({ [DISABLED_PAGES_KEY]: disabledPages });
        return true; // 無効化
      }
    } catch (error) {
      console.error('Failed to toggle page disabled:', error);
      return false;
    }
  }

  // ========================================
  // ブラックリスト管理
  // ========================================

  /** ブラックリストを読み込む */
  public async loadBlacklist(): Promise<BlacklistEntry[]> {
    try {
      const result = await chrome.storage.local.get(BLACKLIST_KEY);
      return (result[BLACKLIST_KEY] as BlacklistEntry[]) || [];
    } catch (error) {
      console.error('Failed to load blacklist:', error);
      return [];
    }
  }

  /** ドメインをブラックリストに追加 */
  public async addToBlacklist(domain: string): Promise<void> {
    try {
      const blacklist = await this.loadBlacklist();
      // 既に存在する場合は追加しない
      if (blacklist.some((entry) => entry.domain === domain)) {
        return;
      }
      blacklist.push({ domain, addedAt: Date.now() });
      await chrome.storage.local.set({ [BLACKLIST_KEY]: blacklist });
    } catch (error) {
      console.error('Failed to add to blacklist:', error);
      throw error;
    }
  }

  /** ドメインをブラックリストから削除 */
  public async removeFromBlacklist(domain: string): Promise<void> {
    try {
      const blacklist = await this.loadBlacklist();
      const filtered = blacklist.filter((entry) => entry.domain !== domain);
      await chrome.storage.local.set({ [BLACKLIST_KEY]: filtered });
    } catch (error) {
      console.error('Failed to remove from blacklist:', error);
      throw error;
    }
  }

  /** URLのドメインがブラックリストに登録されているかチェック */
  public async isBlacklisted(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const blacklist = await this.loadBlacklist();
      return blacklist.some((entry) => entry.domain === domain);
    } catch (error) {
      console.error('Failed to check blacklist:', error);
      return false;
    }
  }
}
