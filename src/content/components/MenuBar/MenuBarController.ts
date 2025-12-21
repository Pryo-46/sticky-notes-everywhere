import type { StickyColor, StickySize, MenuBarMode, MenuBarPosition } from '../../../types';
import { STICKY_COLORS } from '../../../types';
import { DRAG_THRESHOLD } from '../../constants';
import { MenuBarRenderer } from './MenuBarRenderer';

const POSITION_CYCLE: MenuBarPosition[] = ['top', 'left', 'bottom', 'right'];

export interface MenuBarCallbacks {
  onColorSwatchSetup?: (element: HTMLElement, color: StickyColor) => void;
  onVisibilityToggle?: () => boolean;
  onClearAll?: () => void;
  onCopyAll?: () => void;
  onSettings?: () => void;
  onSetManager?: () => void;
  onSizeChange?: (size: StickySize) => void;
  onModeChange?: () => void;
  onPositionChange?: () => void;
  onToggle?: () => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  onPinToggle?: () => boolean;
}

/**
 * MenuBarのイベント処理を担当
 */
export class MenuBarController {
  private callbacks: MenuBarCallbacks = {};
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };

  public setCallbacks(callbacks: MenuBarCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public setupEventListeners(
    container: HTMLDivElement,
    currentMode: MenuBarMode,
    floatingPosition: { x: number; y: number }
  ): void {
    this.setupSizeButtons(container);
    this.setupIconButton(container, currentMode);
    this.setupActionButtons(container);
    this.setupPositionButton(container);
    this.setupModeButton(container);
    this.setupDragHandlers(container, currentMode, floatingPosition);
    this.setupColorSwatches(container);
  }

  private setupSizeButtons(container: HTMLDivElement): void {
    container.querySelectorAll('.size-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const size = target.dataset.size as StickySize;
        this.callbacks.onSizeChange?.(size);
      });
    });
  }

  private setupIconButton(container: HTMLDivElement, currentMode: MenuBarMode): void {
    if (currentMode !== 'floating') {
      container.querySelector('.sticky-icon-btn')?.addEventListener('click', () => {
        this.callbacks.onToggle?.();
      });
    }
  }

  private setupActionButtons(container: HTMLDivElement): void {
    container.querySelector('.pin-btn')?.addEventListener('click', () => {
      this.callbacks.onPinToggle?.();
    });

    container.querySelector('.visibility-btn')?.addEventListener('click', () => {
      this.callbacks.onVisibilityToggle?.();
    });

    container.querySelector('.clear-btn')?.addEventListener('click', () => {
      if (this.callbacks.onClearAll) {
        const confirmed = window.confirm('画面上のすべての付箋を削除しますか？');
        if (confirmed) {
          this.callbacks.onClearAll();
        }
      }
    });

    container.querySelector('.copy-btn')?.addEventListener('click', () => {
      this.callbacks.onCopyAll?.();
    });

    container.querySelector('.settings-btn')?.addEventListener('click', () => {
      this.callbacks.onSettings?.();
    });

    container.querySelector('.set-manager-btn')?.addEventListener('click', () => {
      this.callbacks.onSetManager?.();
    });
  }

  private setupPositionButton(container: HTMLDivElement): void {
    container.querySelector('.position-btn')?.addEventListener('click', () => {
      this.callbacks.onPositionChange?.();
    });
  }

  private setupModeButton(container: HTMLDivElement): void {
    container.querySelector('.mode-btn')?.addEventListener('click', () => {
      this.callbacks.onModeChange?.();
    });
  }

  private setupColorSwatches(container: HTMLDivElement): void {
    container.querySelectorAll('.color-swatch').forEach((swatch) => {
      const color = (swatch as HTMLElement).dataset.color as StickyColor;
      this.callbacks.onColorSwatchSetup?.(swatch as HTMLElement, color);
    });
  }

  private setupDragHandlers(
    container: HTMLDivElement,
    currentMode: MenuBarMode,
    floatingPosition: { x: number; y: number }
  ): void {
    const iconBtn = container.querySelector('.sticky-icon-btn') as HTMLElement;
    if (!iconBtn) return;

    let localFloatingPosition = { ...floatingPosition };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;

      let newX = e.clientX - this.dragOffset.x;
      let newY = e.clientY - this.dragOffset.y;

      const rect = container.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      localFloatingPosition = { x: newX, y: newY };
      container.style.left = `${newX}px`;
      container.style.top = `${newY}px`;
    };

    const onMouseUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        this.callbacks.onDragEnd?.(localFloatingPosition);
      }
    };

    iconBtn.addEventListener('mousedown', (e: MouseEvent) => {
      if (currentMode !== 'floating') return;

      const startX = e.clientX;
      const startY = e.clientY;
      let hasMoved = false;

      const checkMove = (moveE: MouseEvent) => {
        const dx = Math.abs(moveE.clientX - startX);
        const dy = Math.abs(moveE.clientY - startY);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          hasMoved = true;
          this.isDragging = true;
          const rect = container.getBoundingClientRect();
          this.dragOffset = {
            x: startX - rect.left,
            y: startY - rect.top,
          };
          document.removeEventListener('mousemove', checkMove);
          document.addEventListener('mousemove', onMouseMove);
        }
      };

      const handleUp = () => {
        document.removeEventListener('mousemove', checkMove);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', handleUp);
        if (this.isDragging) {
          this.isDragging = false;
          this.callbacks.onDragEnd?.(localFloatingPosition);
        } else if (!hasMoved) {
          this.callbacks.onToggle?.();
        }
      };

      document.addEventListener('mousemove', checkMove);
      document.addEventListener('mouseup', handleUp);
      e.preventDefault();
    });
  }

  public getNextPosition(current: MenuBarPosition): MenuBarPosition {
    const currentIndex = POSITION_CYCLE.indexOf(current);
    const nextIndex = (currentIndex + 1) % POSITION_CYCLE.length;
    return POSITION_CYCLE[nextIndex];
  }

  /** サイズボタンのアクティブ状態を更新 */
  public updateSizeButtonUI(container: HTMLElement, selectedSize: StickySize): void {
    container.querySelectorAll('.size-btn').forEach((btn) => {
      btn.classList.toggle('active', (btn as HTMLButtonElement).dataset.size === selectedSize);
    });
  }

  /** 表示/非表示ボタンのアイコンと状態を更新 */
  public updateVisibilityIcon(container: HTMLElement, renderer: MenuBarRenderer, visible: boolean): void {
    const btn = container.querySelector('.visibility-btn');
    if (btn) {
      btn.innerHTML = renderer.getVisibilityIcon(visible);
      btn.classList.toggle('active', visible);
      const title = visible ? '全付箋を非表示' : '全付箋を表示';
      btn.setAttribute('title', title);
    }
  }

  /** ピンボタンのアイコンと状態を更新 */
  public updatePinIcon(container: HTMLElement, renderer: MenuBarRenderer, pinned: boolean): void {
    const btn = container.querySelector('.pin-btn');
    if (btn) {
      btn.innerHTML = renderer.getPinIcon(pinned);
      btn.classList.toggle('active', pinned);
      const title = pinned ? 'ピン留め解除（ページ移動時に付箋をクリア）' : 'ピン留め（ページ移動時も付箋を維持）';
      btn.setAttribute('title', title);
    }
  }

  /** ポジションボタンのアイコンを更新 */
  public updatePositionIcon(container: HTMLElement, renderer: MenuBarRenderer, position: MenuBarPosition): void {
    const btn = container.querySelector('.position-btn');
    if (btn) {
      btn.innerHTML = renderer.getPositionIcon(position);
    }
  }

  /** モードとポジションに応じたコンテナのクラスとスタイルを適用 */
  public applyModeAndPosition(
    container: HTMLDivElement,
    mode: MenuBarMode,
    position: MenuBarPosition,
    floatingPosition: { x: number; y: number }
  ): void {
    container.classList.remove('bar-top', 'bar-bottom', 'bar-left', 'bar-right', 'floating');

    if (mode === 'floating') {
      container.classList.add('floating');
      container.style.left = `${floatingPosition.x}px`;
      container.style.top = `${floatingPosition.y}px`;
      container.style.right = '';
      container.style.bottom = '';
    } else {
      container.classList.add(`bar-${position}`);
      container.style.left = '';
      container.style.top = '';
      container.style.right = '';
      container.style.bottom = '';
    }
  }

  /** カラースウォッチの色を更新 */
  public updateColorSwatches(container: HTMLElement, colors: Record<StickyColor, string>): void {
    STICKY_COLORS.forEach((color) => {
      const swatch = container.querySelector(`.color-swatch.${color}`) as HTMLElement;
      if (swatch) {
        swatch.style.backgroundColor = colors[color];
      }
    });
  }
}
