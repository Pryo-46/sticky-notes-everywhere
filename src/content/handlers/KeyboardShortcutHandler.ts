import type { StickyColor, StickySize } from '../../types';
import { STICKY_COLORS } from '../../types';
import type { StickyManager } from '../managers/StickyManager';
import { StorageService } from '../managers/StorageService';

/** ショートカットキーの設定 */
const KEY_MAP: Record<string, number> = {
  '1': 0,  // color1
  '2': 1,  // color2
  '3': 2,  // color3
  '4': 3,  // color4
  '5': 4,  // color5
  '6': 5,  // color6
  '7': 6,  // color7
  '8': 7,  // color8
  '9': 8,  // color9
  '0': 9,  // color10
};

export class KeyboardShortcutHandler {
  private stickyManager: StickyManager;
  private getSizeCallback: () => StickySize;
  private onToggleVisibility: () => boolean;
  private onClearAll: () => void;
  private onCopyAll: () => void;
  private keydownHandler: (e: KeyboardEvent) => void;

  constructor(
    stickyManager: StickyManager,
    getSizeCallback: () => StickySize,
    onToggleVisibility: () => boolean,
    onClearAll: () => void,
    onCopyAll: () => void
  ) {
    this.stickyManager = stickyManager;
    this.getSizeCallback = getSizeCallback;
    this.onToggleVisibility = onToggleVisibility;
    this.onClearAll = onClearAll;
    this.onCopyAll = onCopyAll;
    this.keydownHandler = this.handleKeydown.bind(this);

    this.setupKeyboardListener();
  }

  private setupKeyboardListener(): void {
    document.addEventListener('keydown', this.keydownHandler);
  }

  /** イベントリスナーを削除 */
  public destroy(): void {
    document.removeEventListener('keydown', this.keydownHandler);
  }

  private handleKeydown(e: KeyboardEvent): void {
    // Altキーが押されていない場合は無視
    if (!e.altKey) return;

    // Ctrl + Alt + C: 全メモをコピー（入力中でも動作）
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      this.onCopyAll();
      return;
    }

    // 入力フィールドにフォーカスがある場合は以降のショートカットを無視
    const activeElement = document.activeElement;
    if (activeElement) {
      const tagName = activeElement.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || (activeElement as HTMLElement).isContentEditable) {
        return;
      }
    }

    // Alt + 数字キー: 付箋を追加
    if (e.key in KEY_MAP) {
      e.preventDefault();
      const colorIndex = KEY_MAP[e.key];
      const color = STICKY_COLORS[colorIndex];
      this.createNoteAtCenter(color);
      return;
    }

    // Alt + H: 表示/非表示トグル
    if (e.key.toLowerCase() === 'h') {
      e.preventDefault();
      this.onToggleVisibility();
      return;
    }

    // Alt + X: 全クリア（確認あり）
    if (e.key.toLowerCase() === 'x') {
      e.preventDefault();
      if (confirm('すべての付箋を削除しますか？')) {
        this.onClearAll();
      }
      return;
    }
  }

  private createNoteAtCenter(color: StickyColor): void {
    const settings = StorageService.getInstance().getSettings();
    const size = settings.sizes[this.getSizeCallback()];

    // 画面中央に配置
    const position = {
      x: Math.max(0, (window.innerWidth - size.width) / 2),
      y: Math.max(0, (window.innerHeight - size.height) / 2),
    };

    const note = this.stickyManager.createNote(color, size, position);
    // 作成後にテキストエリアにフォーカス
    note.focus();
  }
}
