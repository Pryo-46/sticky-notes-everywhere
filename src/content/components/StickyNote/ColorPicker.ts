import type { StickyColor } from '../../../types';
import { STICKY_COLORS } from '../../../types';
import { StorageService } from '../../managers/StorageService';

export class ColorPicker {
  private element: HTMLDivElement | null = null;
  private parentElement: HTMLElement;
  private currentColor: StickyColor;
  private onColorSelected: (color: StickyColor) => void;
  private handleOutsideClick: (e: MouseEvent) => void;

  constructor(
    parentElement: HTMLElement,
    currentColor: StickyColor,
    onColorSelected: (color: StickyColor) => void
  ) {
    this.parentElement = parentElement;
    this.currentColor = currentColor;
    this.onColorSelected = onColorSelected;
    this.handleOutsideClick = this.onOutsideClick.bind(this);
  }

  private getColorValue(color: StickyColor): string {
    return StorageService.getInstance().getSettings().colors[color];
  }

  public toggle(): void {
    if (this.element) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'sticky-note-picker sticky-note-color-picker';

    STICKY_COLORS.forEach((color) => {
      const swatch = document.createElement('button');
      swatch.className = `sticky-note-picker-swatch${color === this.currentColor ? ' active' : ''}`;
      swatch.style.backgroundColor = this.getColorValue(color);
      swatch.title = color;
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onColorSelected(color);
        this.close();
      });
      this.element!.appendChild(swatch);
    });

    this.parentElement.appendChild(this.element);

    // 外側クリックで閉じるリスナーを追加
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 0);
  }

  public close(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
      document.removeEventListener('click', this.handleOutsideClick);
    }
  }

  public updateCurrentColor(color: StickyColor): void {
    this.currentColor = color;
  }

  private onOutsideClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!this.parentElement.contains(target)) {
      this.close();
    }
  }

  public destroy(): void {
    this.close();
  }
}
