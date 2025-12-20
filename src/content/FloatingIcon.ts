import type { FloatingIconPosition } from '../types';
import { ICONS } from './icons';
import { StorageService } from './StorageService';

/**
 * 常駐フローティングアイコン
 * クリックでメニューバーを表示/非表示する
 */
export class FloatingIcon {
  private container: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private iconButton: HTMLButtonElement;
  private position: FloatingIconPosition;
  private onClickCallback: (() => void) | null = null;

  constructor() {
    const settings = StorageService.getInstance().getSettings();
    this.position = settings.floatingIconPosition;

    // Shadow DOMホストを作成
    this.container = document.createElement('div');
    this.container.id = 'sticky-floating-icon-host';
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });

    // スタイルを注入
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot.appendChild(style);

    // アイコンボタンを作成
    this.iconButton = document.createElement('button');
    this.iconButton.className = 'floating-icon';
    this.iconButton.innerHTML = ICONS.stickyNote;
    this.iconButton.title = 'Sticky Notes メニューを開く';
    this.iconButton.addEventListener('click', () => {
      this.onClickCallback?.();
    });

    this.shadowRoot.appendChild(this.iconButton);
    this.updatePosition();

    document.body.appendChild(this.container);
  }

  private getStyles(): string {
    return `
      .floating-icon {
        position: fixed;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #FFF59D 0%, #FFCC80 100%);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483640;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        padding: 0;
      }

      .floating-icon:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .floating-icon:active {
        transform: scale(0.95);
      }

      .floating-icon svg {
        width: 24px;
        height: 24px;
        color: #5D4037;
      }

      /* 位置クラス */
      .floating-icon.top-left {
        top: 16px;
        left: 16px;
      }

      .floating-icon.top-right {
        top: 16px;
        right: 16px;
      }

      .floating-icon.bottom-left {
        bottom: 16px;
        left: 16px;
      }

      .floating-icon.bottom-right {
        bottom: 16px;
        right: 16px;
      }
    `;
  }

  private updatePosition(): void {
    // 既存の位置クラスを削除
    this.iconButton.classList.remove('top-left', 'top-right', 'bottom-left', 'bottom-right');
    // 新しい位置クラスを追加
    this.iconButton.classList.add(this.position);
  }

  /** クリック時のコールバックを設定 */
  public onClick(callback: () => void): void {
    this.onClickCallback = callback;
  }

  /** 位置を設定 */
  public setPosition(position: FloatingIconPosition): void {
    this.position = position;
    this.updatePosition();
  }

  /** 表示/非表示を切り替え */
  public setVisible(visible: boolean): void {
    this.iconButton.style.display = visible ? 'flex' : 'none';
  }

  /** 表示状態を取得 */
  public isVisible(): boolean {
    return this.iconButton.style.display !== 'none';
  }

  /** スタイルを更新 */
  public refreshStyles(): void {
    const settings = StorageService.getInstance().getSettings();
    this.position = settings.floatingIconPosition;
    this.updatePosition();
  }
}
