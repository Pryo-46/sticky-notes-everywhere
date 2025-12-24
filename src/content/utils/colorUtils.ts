/**
 * 色関連のユーティリティ関数
 */

// UI色のコントラスト設定
/** 暗い色のUI色（黒に近い付箋用） */
const DARK_COLOR_UI = '#cccccc';
/** 暗い色と判定する輝度の閾値（0.0〜1.0） */
const DARK_LUMINANCE_THRESHOLD = 0.15;
/** フォント色設定 - 暗い背景用 */
const LIGHT_TEXT_COLOR = '#ffffff';
/** フォント色設定 - 明るい背景用 */
const DARK_TEXT_COLOR = '#333333';
/** プレースホルダー色 - 暗い背景用 */
const LIGHT_PLACEHOLDER_COLOR = 'rgba(255, 255, 255, 0.9)';
/** プレースホルダー色 - 明るい背景用 */
const DARK_PLACEHOLDER_COLOR = 'rgba(0, 0, 0, 0.35)';
/** フォント色を切り替える輝度の閾値（0.0〜1.0） */
const TEXT_LUMINANCE_THRESHOLD = 0.6;

/**
 * 16進数カラーコードから輝度を計算
 * @param hex - #rrggbb 形式のカラーコード
 * @returns 0-1の範囲（0が暗い、1が明るい）
 */
export function getLuminance(hex: string): number {
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 背景色に応じた適切なテキスト色を返す
 * @param hex - 背景色（#rrggbb形式）
 */
export function getTextColor(hex: string): string {
  const luminance = getLuminance(hex);
  return luminance < TEXT_LUMINANCE_THRESHOLD ? LIGHT_TEXT_COLOR : DARK_TEXT_COLOR;
}

/**
 * 背景色に応じた適切なプレースホルダー色を返す
 * @param hex - 背景色（#rrggbb形式）
 */
export function getPlaceholderColor(hex: string): string {
  const luminance = getLuminance(hex);
  return luminance < TEXT_LUMINANCE_THRESHOLD ? LIGHT_PLACEHOLDER_COLOR : DARK_PLACEHOLDER_COLOR;
}

/**
 * 背景色に対してコントラストのある色を生成
 * 暗い色なら明るく、明るい色なら暗くする
 * @param hex - 背景色（#rrggbb形式）
 * @param percent - 調整率（0-100）
 */
export function getContrastColor(hex: string, percent: number): string {
  const luminance = getLuminance(hex);

  // 非常に暗い色（黒に近い）の場合は白っぽい色を直接返す
  if (luminance < DARK_LUMINANCE_THRESHOLD) {
    return DARK_COLOR_UI;
  }

  const num = parseInt(hex.slice(1), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  // 暗い色の場合はより強いコントラストを適用
  const adjustedPercent = luminance < TEXT_LUMINANCE_THRESHOLD ? percent * 2.2 : percent;
  const delta = Math.round((255 * adjustedPercent) / 100);

  if (luminance < TEXT_LUMINANCE_THRESHOLD) {
    // 明るくする
    const newR = Math.min(255, r + delta);
    const newG = Math.min(255, g + delta);
    const newB = Math.min(255, b + delta);
    return `#${((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0')}`;
  } else {
    // 暗くする
    const newR = Math.max(0, r - delta);
    const newG = Math.max(0, g - delta);
    const newB = Math.max(0, b - delta);
    return `#${((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0')}`;
  }
}

/**
 * 有効な16進数カラーコードかどうかを判定
 * @param color - 検証する文字列
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}
