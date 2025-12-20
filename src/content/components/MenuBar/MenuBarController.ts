import type { StickyColor, StickySize, MenuBarMode, MenuBarPosition } from '../../../types';
import { DRAG_THRESHOLD } from '../../constants';

const POSITION_CYCLE: MenuBarPosition[] = ['top', 'left', 'bottom', 'right'];

type ColorSwatchCallback = (element: HTMLElement, color: StickyColor) => void;
type VisibilityToggleCallback = () => boolean;
type ClearAllCallback = () => void;
type CopyAllCallback = () => void;
type SettingsCallback = () => void;
type SizeChangeCallback = (size: StickySize) => void;
type ModeChangeCallback = (mode: MenuBarMode) => void;
type PositionChangeCallback = (position: MenuBarPosition) => void;
type DragEndCallback = (position: { x: number; y: number }) => void;

export interface MenuBarCallbacks {
  onColorSwatchSetup?: ColorSwatchCallback;
  onVisibilityToggle?: VisibilityToggleCallback;
  onClearAll?: ClearAllCallback;
  onCopyAll?: CopyAllCallback;
  onSettings?: SettingsCallback;
  onSizeChange?: SizeChangeCallback;
  onModeChange?: ModeChangeCallback;
  onPositionChange?: PositionChangeCallback;
  onToggle?: () => void;
  onDragEnd?: DragEndCallback;
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
    container.querySelector('.visibility-btn')?.addEventListener('click', () => {
      this.callbacks.onVisibilityToggle?.();
    });

    container.querySelector('.clear-btn')?.addEventListener('click', () => {
      if (this.callbacks.onClearAll) {
        const confirmed = window.confirm('すべての付箋を削除しますか？');
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
  }

  private setupPositionButton(container: HTMLDivElement): void {
    container.querySelector('.position-btn')?.addEventListener('click', () => {
      // position cycle is handled by the callback
      this.callbacks.onPositionChange?.(this.getNextPosition('top')); // placeholder
    });
  }

  private setupModeButton(container: HTMLDivElement): void {
    container.querySelector('.mode-btn')?.addEventListener('click', () => {
      // mode toggle is handled by the callback
      this.callbacks.onModeChange?.('floating'); // placeholder
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
}
