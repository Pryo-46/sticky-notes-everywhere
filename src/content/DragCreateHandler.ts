import type { StickyColor, StickySize } from '../types';
import { SIZE_PRESETS, COLOR_VALUES } from '../types';
import type { StickyManager } from './StickyManager';

export class DragCreateHandler {
  private stickyManager: StickyManager;
  private getSizeCallback: () => StickySize;
  private dragPreview: HTMLDivElement | null = null;
  private currentColor: StickyColor | null = null;
  private shadowHost: HTMLDivElement;
  private shadowRoot: ShadowRoot;

  constructor(stickyManager: StickyManager, getSizeCallback: () => StickySize) {
    this.stickyManager = stickyManager;
    this.getSizeCallback = getSizeCallback;

    // ドラッグプレビュー用のShadow DOMホスト
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'sticky-drag-preview-host';
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot.appendChild(style);

    document.body.appendChild(this.shadowHost);

    this.setupGlobalListeners();
  }

  private getStyles(): string {
    return `
      .drag-preview {
        position: fixed;
        pointer-events: none;
        opacity: 0.8;
        border-radius: 4px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.5);
      }
    `;
  }

  private setupGlobalListeners(): void {
    // ドラッグオーバー（ドロップを許可するため）
    document.addEventListener('dragover', (e) => {
      if (this.currentColor) {
        e.preventDefault();
        this.updatePreviewPosition(e.clientX, e.clientY);
      }
    });

    // ドロップ
    document.addEventListener('drop', (e) => {
      if (this.currentColor) {
        e.preventDefault();
        this.createNoteAtPosition(e.clientX, e.clientY);
        this.hidePreview();
      }
    });

    // ドラッグ終了（キャンセル時など）
    document.addEventListener('dragend', () => {
      this.hidePreview();
    });
  }

  public setupColorSwatch(element: HTMLElement, color: StickyColor): void {
    element.addEventListener('dragstart', (e) => {
      this.currentColor = color;

      // デフォルトのドラッグイメージを非表示に
      const emptyImg = document.createElement('img');
      emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer?.setDragImage(emptyImg, 0, 0);

      this.showPreview(color, e.clientX, e.clientY);
    });

    element.addEventListener('dragend', () => {
      this.hidePreview();
    });
  }

  private showPreview(color: StickyColor, x: number, y: number): void {
    const size = SIZE_PRESETS[this.getSizeCallback()];

    this.dragPreview = document.createElement('div');
    this.dragPreview.className = 'drag-preview';
    this.dragPreview.style.width = `${size.width}px`;
    this.dragPreview.style.height = `${size.height}px`;
    this.dragPreview.style.backgroundColor = COLOR_VALUES[color];
    this.dragPreview.style.left = `${x - size.width / 2}px`;
    this.dragPreview.style.top = `${y - size.height / 2}px`;
    this.dragPreview.textContent = 'ここにドロップ';

    this.shadowRoot.appendChild(this.dragPreview);
  }

  private updatePreviewPosition(x: number, y: number): void {
    if (this.dragPreview) {
      const size = SIZE_PRESETS[this.getSizeCallback()];
      this.dragPreview.style.left = `${x - size.width / 2}px`;
      this.dragPreview.style.top = `${y - size.height / 2}px`;
    }
  }

  private hidePreview(): void {
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
    this.currentColor = null;
  }

  private createNoteAtPosition(x: number, y: number): void {
    if (!this.currentColor) return;

    const size = SIZE_PRESETS[this.getSizeCallback()];

    // 付箋の中心がドロップ位置になるよう調整
    const position = {
      x: Math.max(0, x - size.width / 2),
      y: Math.max(0, y - size.height / 2),
    };

    // 画面端からはみ出さないよう調整
    position.x = Math.min(position.x, window.innerWidth - size.width);
    position.y = Math.min(position.y, window.innerHeight - size.height);

    this.stickyManager.createNote(this.currentColor, size, position);
  }
}
