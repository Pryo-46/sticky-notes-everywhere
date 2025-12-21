import type { ExtensionSettings, PageHistory, StickyNoteData, StickyNoteSet } from '../../types';

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
  saveStickyNotes(notes: StickyNoteData[]): Promise<void>;
  clearStickyNotes(): Promise<void>;

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
}
