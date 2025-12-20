import type { StickyNote } from './StickyNote';
import { createShadowDOM } from './utils/shadowDOM';

export class ExportHandler {
  private toastElement: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot;

  constructor() {
    const { shadowRoot } = createShadowDOM({
      id: 'sticky-notes-toast-host',
      styles: this.getToastStyles(),
    });
    this.shadowRoot = shadowRoot;
  }

  private getToastStyles(): string {
    return `
      .toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #333;
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 2147483647;
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
      }

      .toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }

      .toast.success {
        background: #2f9e44;
      }

      .toast.error {
        background: #e03131;
      }
    `;
  }

  public async exportToClipboard(notes: StickyNote[]): Promise<boolean> {
    // テキストがある付箋のみフィルタリング
    const notesWithText = notes.filter((note) => note.getText().trim() !== '');

    if (notesWithText.length === 0) {
      this.showToast('コピーするメモがありません', 'error');
      return false;
    }

    // テキストを整形
    const text = this.formatNotes(notesWithText);

    try {
      await navigator.clipboard.writeText(text);
      this.showToast(`${notesWithText.length}件のメモをコピーしました`, 'success');
      return true;
    } catch {
      this.showToast('コピーに失敗しました', 'error');
      return false;
    }
  }

  private formatNotes(notes: StickyNote[]): string {
    // 付箋を左上から右下の順にソート（Y座標優先、同じY座標ならX座標順）
    const sortedNotes = [...notes].sort((a, b) => {
      const aData = a.getData();
      const bData = b.getData();
      const yDiff = aData.position.y - bData.position.y;
      if (Math.abs(yDiff) > 50) return yDiff; // Y座標が50px以上離れていれば行が違う
      return aData.position.x - bData.position.x;
    });

    const url = window.location.href;
    const lines = [
      '# Web付箋メモ',
      '※左上から右下にかけて順番にコピーしています。',
      `URL: ${url}`,
      '',
    ];

    sortedNotes.forEach((note, index) => {
      const text = note.getText().trim();
      lines.push(`${index + 1}.`);
      lines.push(text);
      lines.push('');
    });

    return lines.join('\n').trimEnd();
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    // 既存のトーストを削除
    if (this.toastElement) {
      this.toastElement.remove();
    }

    // 新しいトーストを作成
    this.toastElement = document.createElement('div');
    this.toastElement.className = `toast ${type}`;
    this.toastElement.textContent = message;
    this.shadowRoot.appendChild(this.toastElement);

    // アニメーション開始
    requestAnimationFrame(() => {
      this.toastElement?.classList.add('show');
    });

    // 3秒後に非表示
    setTimeout(() => {
      this.toastElement?.classList.remove('show');
      setTimeout(() => {
        this.toastElement?.remove();
        this.toastElement = null;
      }, 300);
    }, 3000);
  }
}
