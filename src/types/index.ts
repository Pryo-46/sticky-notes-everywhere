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

/** カラー値の定義 */
export const COLOR_VALUES: Record<StickyColor, string> = {
  red: '#ff6b6b',
  orange: '#ffa94d',
  yellow: '#ffd43b',
  green: '#69db7c',
  cyan: '#66d9e8',
  gray: '#adb5bd',
  white: '#ffffff',
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

/** 拡張機能の設定 */
export interface ExtensionSettings {
  /** カスタムカラー値 */
  colors: Record<StickyColor, string>;
  /** カスタムサイズプリセット */
  sizes: Record<StickySize, StickyDimensions>;
  /** デフォルトサイズ */
  defaultSize: StickySize;
}

/** デフォルト設定 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  colors: { ...COLOR_VALUES },
  sizes: { ...SIZE_PRESETS },
  defaultSize: 'medium',
};
