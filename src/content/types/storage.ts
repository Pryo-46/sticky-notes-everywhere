import type { ExtensionSettings, StickyNoteData } from '../../types';

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
}
