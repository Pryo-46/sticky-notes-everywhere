import { StickyManager } from './StickyManager';
import { StickyNote } from './StickyNote';

interface DragState {
  note: StickyNote;
  startX: number;
  startY: number;
  initialLeft: number;
  initialTop: number;
}

export class DragMoveHandler {
  private stickyManager: StickyManager;
  private dragState: DragState | null = null;

  constructor(stickyManager: StickyManager) {
    this.stickyManager = stickyManager;
    this.setupGlobalListeners();
  }

  private setupGlobalListeners(): void {
    // mousemoveとmouseupはdocumentレベルで捕捉
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * 付箋にドラッグ移動機能をセットアップ
   */
  public setupNote(note: StickyNote): void {
    const header = note.getHeaderElement();
    if (!header) return;

    header.addEventListener('mousedown', (e: MouseEvent) => {
      this.handleMouseDown(e, note);
    });

    // 付箋本体をクリックしたときに最前面に持ってくる
    note.getElement().addEventListener('mousedown', () => {
      this.stickyManager.bringToFront(note.getId());
    });
  }

  private handleMouseDown(e: MouseEvent, note: StickyNote): void {
    // 左クリックのみ
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const element = note.getElement();
    const rect = element.getBoundingClientRect();

    this.dragState = {
      note,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    };

    // 最前面に持ってくる
    this.stickyManager.bringToFront(note.getId());

    // ドラッグ中のカーソルを変更
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.dragState) return;

    e.preventDefault();

    const { note, startX, startY, initialLeft, initialTop } = this.dragState;

    // 移動量を計算
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // 新しい位置を計算
    let newX = initialLeft + deltaX;
    let newY = initialTop + deltaY;

    // 画面端での制限
    const element = note.getElement();
    const noteWidth = element.offsetWidth;
    const noteHeight = element.offsetHeight;

    // ビューポートのサイズを取得
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 最小表示領域（付箋の一部が必ず見えるように）
    const minVisible = 50;

    // 画面外に出ないように制限
    newX = Math.max(-noteWidth + minVisible, Math.min(newX, viewportWidth - minVisible));
    newY = Math.max(0, Math.min(newY, viewportHeight - minVisible));

    note.setPosition(newX, newY);
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (!this.dragState) return;

    // ドラッグ状態をリセット
    this.dragState = null;

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
