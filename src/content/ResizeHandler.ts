import { StickyManager } from './StickyManager';
import { StickyNote } from './StickyNote';

interface ResizeState {
  note: StickyNote;
  startX: number;
  startY: number;
  initialWidth: number;
  initialHeight: number;
}

// 最小サイズの制限
const MIN_WIDTH = 100;
const MIN_HEIGHT = 80;

export class ResizeHandler {
  private stickyManager: StickyManager;
  private resizeState: ResizeState | null = null;

  constructor(stickyManager: StickyManager) {
    this.stickyManager = stickyManager;
    this.setupGlobalListeners();
  }

  private setupGlobalListeners(): void {
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * 付箋にリサイズ機能をセットアップ
   */
  public setupNote(note: StickyNote): void {
    const resizeHandle = note.getResizeHandle();
    if (!resizeHandle) return;

    resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
      this.handleMouseDown(e, note);
    });
  }

  private handleMouseDown(e: MouseEvent, note: StickyNote): void {
    // 左クリックのみ
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const element = note.getElement();

    this.resizeState = {
      note,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: element.offsetWidth,
      initialHeight: element.offsetHeight,
    };

    // 最前面に持ってくる
    this.stickyManager.bringToFront(note.getId());

    // リサイズ中のカーソルを変更
    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.resizeState) return;

    e.preventDefault();

    const { note, startX, startY, initialWidth, initialHeight } = this.resizeState;

    // サイズ変更量を計算
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // 新しいサイズを計算（最小サイズで制限）
    const newWidth = Math.max(MIN_WIDTH, initialWidth + deltaX);
    const newHeight = Math.max(MIN_HEIGHT, initialHeight + deltaY);

    note.setSize({ width: newWidth, height: newHeight });
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (!this.resizeState) return;

    // リサイズ状態をリセット
    this.resizeState = null;

    // カーソルを戻す
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  /**
   * クリーンアップ（必要に応じて）
   */
  public destroy(): void {
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
}
