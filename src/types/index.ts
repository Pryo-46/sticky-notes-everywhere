/** 付箋の色 */
export type StickyColor = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'gray' | 'white';

/** 付箋のサイズプリセット */
export type StickySize = 'small' | 'medium' | 'large';

/** 付箋のサイズ（ピクセル） */
export interface StickyDimensions {
  width: number;
  height: number;
}

/** サイズプリセットの定義 */
export const SIZE_PRESETS: Record<StickySize, StickyDimensions> = {
  small: { width: 150, height: 100 },
  medium: { width: 200, height: 150 },
  large: { width: 300, height: 200 },
};

/** 付箋データ */
export interface StickyNoteData {
  id: string;
  text: string;
  color: StickyColor;
  position: { x: number; y: number };
  size: StickyDimensions;
  createdAt: number;
}

/** メッセージ型 */
export interface ToggleMenuMessage {
  action: 'toggleMenu';
}

export type ExtensionMessage = ToggleMenuMessage;
