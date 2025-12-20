import type { StickyColor, StickySize, MenuBarMode, MenuBarPosition } from '../../../types';
import { BUTTON_SIZE_PRESETS, STICKY_COLORS } from '../../../types';
import { ICONS } from '../../icons';
import { StorageService } from '../../managers/StorageService';
import { getMenuBarStyles } from '../../styles/menubar.css';
import { createShadowDOM } from '../../utils/shadowDOM';
import { MenuBarRenderer } from './MenuBarRenderer';
import { MenuBarController } from './MenuBarController';
import { BUTTON_RADIUS, BUTTON_GAP } from '../../constants';

// constants.ts から再エクスポート（後方互換性）
export { BUTTON_RADIUS, BUTTON_GAP };

type ColorSwatchCallback = (element: HTMLElement, color: StickyColor) => void;
type VisibilityToggleCallback = () => boolean;
type ClearAllCallback = () => void;
type CopyAllCallback = () => void;
type SettingsCallback = () => void;

export class MenuBar {
  private element: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private selectedSize: StickySize = 'medium';
  private isVisible = false;
  private colorSwatchCallback: ColorSwatchCallback | null = null;
  private visibilityToggleCallback: VisibilityToggleCallback | null = null;
  private clearAllCallback: ClearAllCallback | null = null;
  private copyAllCallback: CopyAllCallback | null = null;
  private settingsCallback: SettingsCallback | null = null;
  private notesVisible = true;

  private currentMode: MenuBarMode = 'bar';
  private currentPosition: MenuBarPosition = 'top';
  private floatingPosition = { x: 100, y: 100 };

  private renderer: MenuBarRenderer;
  private controller: MenuBarController;

  constructor() {
    this.renderer = new MenuBarRenderer();
    this.controller = new MenuBarController();

    const settings = StorageService.getInstance().getSettings();
    this.currentMode = settings.menuBarMode;
    this.currentPosition = settings.menuBarPosition;
    this.floatingPosition = { ...settings.floatingPosition };
    this.selectedSize = settings.defaultSize;

    const { host, shadowRoot } = createShadowDOM({
      id: 'sticky-notes-everywhere-host',
      styles: '',
      appendToBody: false,
    });
    this.element = host;
    this.shadowRoot = shadowRoot;

    this.setupControllerCallbacks();
    this.render();
    this.updateCSSVariables();

    document.body.appendChild(this.element);
    const container = this.shadowRoot.querySelector('.sticky-menu-container') as HTMLDivElement;
    if (container) {
      this.applyModeAndPosition(container);
    }
  }

  private setupControllerCallbacks(): void {
    this.controller.setCallbacks({
      onColorSwatchSetup: (element, color) => {
        this.colorSwatchCallback?.(element, color);
      },
      onVisibilityToggle: () => {
        if (this.visibilityToggleCallback) {
          this.notesVisible = this.visibilityToggleCallback();
          this.updateVisibilityIcon();
        }
        return this.notesVisible;
      },
      onClearAll: () => {
        this.clearAllCallback?.();
      },
      onCopyAll: () => {
        this.copyAllCallback?.();
      },
      onSettings: () => {
        this.settingsCallback?.();
      },
      onSizeChange: (size) => {
        this.setSelectedSize(size);
      },
      onModeChange: () => {
        this.toggleMode();
      },
      onPositionChange: () => {
        this.cyclePosition();
      },
      onToggle: () => {
        this.toggle();
      },
      onDragEnd: (position) => {
        this.floatingPosition = position;
        this.saveSettings();
      },
    });
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = getMenuBarStyles();
    this.shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'sticky-menu-container hidden';
    container.innerHTML = this.getContainerHTML();
    this.shadowRoot.appendChild(container);

    this.setupEventListeners(container);
  }

  private updateCSSVariables(): void {
    const settings = StorageService.getInstance().getSettings();
    const buttonSize = BUTTON_SIZE_PRESETS[settings.buttonSize];
    const barHeight = buttonSize + 16;
    const iconSize = Math.round(buttonSize * 0.6);

    this.element.style.setProperty('--button-size', `${buttonSize}px`);
    this.element.style.setProperty('--bar-height', `${barHeight}px`);
    this.element.style.setProperty('--bar-radius', `${barHeight / 2}px`);
    this.element.style.setProperty('--icon-size', `${iconSize}px`);
  }

  private getContainerHTML(): string {
    return `
      <button class="sticky-icon-btn" title="メニューを開閉">${ICONS.stickyNote}</button>
      <div class="sticky-notes-menu-bar">
        ${this.getMenuBarHTML()}
      </div>
    `;
  }

  private getMenuBarHTML(): string {
    const settings = StorageService.getInstance().getSettings();
    return this.renderer.renderMenuBar({
      selectedSize: this.selectedSize,
      currentMode: this.currentMode,
      currentPosition: this.currentPosition,
      settings,
    });
  }

  private setupEventListeners(container: HTMLDivElement): void {
    this.controller.setupEventListeners(container, this.currentMode, this.floatingPosition);
  }

  private updateVisibilityIcon(): void {
    const menuBar = this.shadowRoot.querySelector('.sticky-menu-container');
    const btn = menuBar?.querySelector('.visibility-btn');
    if (btn) {
      btn.innerHTML = this.renderer.getVisibilityIcon(this.notesVisible);
    }
  }

  public onColorSwatchSetup(callback: ColorSwatchCallback): void {
    this.colorSwatchCallback = callback;
    this.controller.setCallbacks({
      onColorSwatchSetup: (element, color) => {
        callback(element, color);
      },
    });
    // 既に表示されている場合は再セットアップ
    const container = this.shadowRoot.querySelector('.sticky-menu-container') as HTMLDivElement;
    if (container) {
      container.querySelectorAll('.color-swatch').forEach((swatch) => {
        const color = (swatch as HTMLElement).dataset.color as StickyColor;
        callback(swatch as HTMLElement, color);
      });
    }
  }

  private setSelectedSize(size: StickySize): void {
    this.selectedSize = size;
    const menuBar = this.shadowRoot.querySelector('.sticky-menu-container');
    menuBar?.querySelectorAll('.size-btn').forEach((btn) => {
      btn.classList.toggle('active', (btn as HTMLButtonElement).dataset.size === size);
    });
  }

  public getSelectedSize(): StickySize {
    return this.selectedSize;
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public show(): void {
    const container = this.shadowRoot.querySelector('.sticky-menu-container') as HTMLDivElement;
    if (container) {
      requestAnimationFrame(() => {
        container.classList.remove('hidden');
      });
    }
    this.isVisible = true;
  }

  public hide(): void {
    const container = this.shadowRoot.querySelector('.sticky-menu-container');
    container?.classList.add('hidden');
    this.isVisible = false;
  }

  public isMenuVisible(): boolean {
    return this.isVisible;
  }

  public onVisibilityToggle(callback: VisibilityToggleCallback): void {
    this.visibilityToggleCallback = callback;
  }

  public onClearAll(callback: ClearAllCallback): void {
    this.clearAllCallback = callback;
  }

  public onCopyAll(callback: CopyAllCallback): void {
    this.copyAllCallback = callback;
  }

  public onSettings(callback: SettingsCallback): void {
    this.settingsCallback = callback;
  }

  public updateColorSwatches(): void {
    const settings = StorageService.getInstance().getSettings();
    const menuBar = this.shadowRoot.querySelector('.sticky-notes-menu-bar');
    if (!menuBar) return;

    STICKY_COLORS.forEach((color) => {
      const swatch = menuBar.querySelector(`.color-swatch.${color}`) as HTMLElement;
      if (swatch) {
        swatch.style.backgroundColor = settings.colors[color];
      }
    });
  }

  public refreshStyles(): void {
    this.updateCSSVariables();

    const settings = StorageService.getInstance().getSettings();
    this.selectedSize = settings.defaultSize;

    const menuBar = this.shadowRoot.querySelector('.sticky-notes-menu-bar') as HTMLDivElement;
    if (menuBar) {
      menuBar.querySelectorAll('.size-btn').forEach((btn) => {
        btn.classList.toggle('active', (btn as HTMLButtonElement).dataset.size === this.selectedSize);
      });
    }
  }

  private applyModeAndPosition(container: HTMLDivElement): void {
    container.classList.remove('bar-top', 'bar-bottom', 'bar-left', 'bar-right', 'floating');

    if (this.currentMode === 'floating') {
      container.classList.add('floating');
      container.style.left = `${this.floatingPosition.x}px`;
      container.style.top = `${this.floatingPosition.y}px`;
      container.style.right = '';
      container.style.bottom = '';
    } else {
      container.classList.add(`bar-${this.currentPosition}`);
      container.style.left = '';
      container.style.top = '';
      container.style.right = '';
      container.style.bottom = '';
    }
  }

  private cyclePosition(): void {
    const container = this.shadowRoot.querySelector('.sticky-menu-container') as HTMLDivElement;
    if (!container) return;

    this.currentPosition = this.controller.getNextPosition(this.currentPosition);

    const btn = container.querySelector('.position-btn');
    if (btn) {
      btn.innerHTML = this.renderer.getPositionIcon(this.currentPosition);
    }

    this.applyModeAndPosition(container);
    this.saveSettings();
  }

  private toggleMode(): void {
    const container = this.shadowRoot.querySelector('.sticky-menu-container') as HTMLDivElement;
    if (!container) return;

    this.currentMode = this.currentMode === 'bar' ? 'floating' : 'bar';

    container.innerHTML = this.getContainerHTML();
    this.setupEventListeners(container);

    this.applyModeAndPosition(container);
    this.saveSettings();
  }

  private async saveSettings(): Promise<void> {
    const storage = StorageService.getInstance();
    const settings = storage.getSettings();
    settings.menuBarMode = this.currentMode;
    settings.menuBarPosition = this.currentPosition;
    settings.floatingPosition = { ...this.floatingPosition };
    await storage.saveSettings(settings);
  }
}
