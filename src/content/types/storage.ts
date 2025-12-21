import type { BlacklistEntry, ExtensionSettings, PageHistory, StickyNoteData, StickyNoteSet } from '../../types';

/**
 * StorageServiceのインターフェース
 * テスト時にモックを注入可能にする
 */
export interface IStorageService {
  loadSettings(): Promise<ExtensionSettings>;
  saveSettings(settings: ExtensionSettings): Promise<void>;
  resetToDefaults(): Promise<void>;
  getSettings(): ExtensionSettings;
  onSettingsChanged(callback: (settings: ExtensionSettings) => void): () => void;
  loadStickyNotes(): Promise<StickyNoteData[]>;
  saveStickyNotes(notes: StickyNoteData[], url?: string): Promise<void>;
  clearStickyNotes(): Promise<void>;
  getLastSavedUrl(): Promise<string>;

  // セット管理
  loadSets(): Promise<StickyNoteSet[]>;
  saveSet(set: StickyNoteSet): Promise<void>;
  deleteSet(setId: string): Promise<void>;
  updateSetName(setId: string, newName: string): Promise<void>;

  // ページ履歴
  loadPageHistory(): Promise<PageHistory[]>;
  savePageHistory(history: PageHistory): Promise<void>;
  clearPageHistory(): Promise<void>;

  // ストレージ使用量
  getStorageUsage(): Promise<number>;

  // 無効化ページ管理
  loadDisabledPages(): Promise<string[]>;
  isPageDisabled(url: string): Promise<boolean>;
  togglePageDisabled(url: string): Promise<boolean>;

  // ブラックリスト管理
  loadBlacklist(): Promise<BlacklistEntry[]>;
  addToBlacklist(domain: string): Promise<void>;
  removeFromBlacklist(domain: string): Promise<void>;
  isBlacklisted(url: string): Promise<boolean>;
}
