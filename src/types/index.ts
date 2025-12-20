/** 付箋の色（8色） */
export type StickyColor = 'color1' | 'color2' | 'color3' | 'color4' | 'color5' | 'color6' | 'color7' | 'color8';

/** 付箋のサイズプリセット */
export type StickySize = 'small' | 'medium' | 'large';

/** 付箋のサイズ（ピクセル） */
export interface StickyDimensions {
  width: number;
  height: number;
}

/** サイズプリセットの定義 */
export const SIZE_PRESETS: Record<StickySize, StickyDimensions> = {
  small: { width: 200, height: 150 },
  medium: { width: 250, height: 200 },
  large: { width: 350, height: 250 },
};

/** カラープリセット名 */
export type ColorPresetName = 'light' | 'dark' | 'user1' | 'user2';

/** カラープリセットの定義 */
export type ColorPreset = Record<StickyColor, string>;

/** ライトモードプリセット */
export const LIGHT_PRESET: ColorPreset = {
  color1: '#FFF59D', // 黄色
  color2: '#FFCC80', // オレンジ
  color3: '#F8BBD9', // ピンク
  color4: '#EF9A9A', // 赤
  color5: '#C5E1A5', // 緑
  color6: '#90CAF9', // 青
  color7: '#CE93D8', // 紫
  color8: '#E0E0E0', // グレー
};

/** ダークモードプリセット */
export const DARK_PRESET: ColorPreset = {
  color1: '#A59730', // 黄色
  color2: '#B37332', // オレンジ
  color3: '#9E4D6E', // ピンク
  color4: '#A54545', // 赤
  color5: '#5E8C4A', // 緑
  color6: '#4A7AB3', // 青
  color7: '#7E5A9E', // 紫
  color8: '#5A5A5A', // グレー
};

/** 全カラープリセット */
export const COLOR_PRESETS: Record<ColorPresetName, ColorPreset> = {
  light: LIGHT_PRESET,
  dark: DARK_PRESET,
  user1: { ...LIGHT_PRESET },
  user2: { ...DARK_PRESET },
};

/** カラー値の定義（後方互換性のため、ライトプリセットをデフォルトとして使用） */
export const COLOR_VALUES: ColorPreset = LIGHT_PRESET;

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

/** メニューバーのモード */
export type MenuBarMode = 'bar' | 'floating';

/** メニューバーの位置（バーモード時） */
export type MenuBarPosition = 'top' | 'bottom' | 'left' | 'right';

/** フローティング位置 */
export interface FloatingPosition {
  x: number;
  y: number;
}

/** メニューボタンサイズ */
export type ButtonSize = 'small' | 'medium' | 'large';

/** ボタンサイズの定義（ピクセル） */
export const BUTTON_SIZE_PRESETS: Record<ButtonSize, number> = {
  small: 32,
  medium: 40,
  large: 48,
};

/** 拡張機能の設定 */
export interface ExtensionSettings {
  /** 現在のカラープリセット */
  activePreset: ColorPresetName;
  /** カスタムカラー値（現在のプリセットに基づく） */
  colors: ColorPreset;
  /** ユーザー定義プリセット */
  userPresets: {
    user1: ColorPreset;
    user2: ColorPreset;
  };
  /** カスタムサイズプリセット */
  sizes: Record<StickySize, StickyDimensions>;
  /** デフォルトサイズ */
  defaultSize: StickySize;
  /** メニューボタンサイズ */
  buttonSize: ButtonSize;
  /** メニューバーのモード */
  menuBarMode: MenuBarMode;
  /** メニューバーの位置（バーモード時） */
  menuBarPosition: MenuBarPosition;
  /** フローティング時の位置 */
  floatingPosition: FloatingPosition;
}

/** デフォルト設定 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  activePreset: 'light',
  colors: { ...LIGHT_PRESET },
  userPresets: {
    user1: { ...LIGHT_PRESET },
    user2: { ...DARK_PRESET },
  },
  sizes: { ...SIZE_PRESETS },
  defaultSize: 'medium',
  buttonSize: 'medium',
  menuBarMode: 'bar',
  menuBarPosition: 'top',
  floatingPosition: { x: 100, y: 100 },
};
