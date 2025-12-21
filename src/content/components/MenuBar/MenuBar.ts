import type { StickyColor, StickySize, MenuBarMode, MenuBarPosition } from '../../../types';
import { BUTTON_SIZE_PRESETS } from '../../../types';
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
type SetManagerCallback = () => void;

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
  private setManagerCallback: SetManagerCallback | null = null;
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
    const container = this.getContainer();
    if (container) {
      this.controller.applyModeAndPosition(container, this.currentMode, this.currentPosition, this.floatingPosition);
    }
  }

  private getContainer(): HTMLDivElement | null {
    return this.shadowRoot.querySelector('.sticky-menu-container') as HTMLDivElement;
  }

  private setupControllerCallbacks(): void {
    this.controller.setCallbacks({
      onColorSwatchSetup: (element, color) => {
        this.colorSwatchCallback?.(element, color);
      },
      onVisibilityToggle: () => {
        if (this.visibilityToggleCallback) {
          this.notesVisible = this.visibilityToggleCallback();
          const container = this.getContainer();
          if (container) {
            this.controller.updateVisibilityIcon(container, this.renderer, this.notesVisible);
          }
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
      onSetManager: () => {
        this.setManagerCallback?.();
      },
      onSizeChange: (size) => {
        this.selectedSize = size;
        const container = this.getContainer();
        if (container) {
          this.controller.updateSizeButtonUI(container, size);
        }
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
    container.innerHTML = this.renderer.renderContainer();
    this.shadowRoot.appendChild(container);

    // メニューバーの内容を設定
    this.updateMenuBarContent();

    this.controller.setupEventListeners(container, this.currentMode, this.floatingPosition);
  }

  private updateMenuBarContent(): void {
    const menuBar = this.shadowRoot.querySelector('.sticky-notes-menu-bar');
    if (!menuBar) return;

    const settings = StorageService.getInstance().getSettings();
    menuBar.innerHTML = this.renderer.renderMenuBar({
      selectedSize: this.selectedSize,
      currentMode: this.currentMode,
      currentPosition: this.currentPosition,
      settings,
    });
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

  public onColorSwatchSetup(callback: ColorSwatchCallback): void {
    this.colorSwatchCallback = callback;
    this.controller.setCallbacks({
      onColorSwatchSetup: (element, color) => {
        callback(element, color);
      },
    });
    // 既に表示されている場合は再セットアップ
    const container = this.getContainer();
    if (container) {
      container.querySelectorAll('.color-swatch').forEach((swatch) => {
        const color = (swatch as HTMLElement).dataset.color as StickyColor;
        callback(swatch as HTMLElement, color);
      });
    }
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
    const container = this.getContainer();
    if (container) {
      requestAnimationFrame(() => {
        container.classList.remove('hidden');
      });
    }
    this.isVisible = true;
  }

  public hide(): void {
    const container = this.getContainer();
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

  public onSetManager(callback: SetManagerCallback): void {
    this.setManagerCallback = callback;
  }

  public updateColorSwatches(): void {
    const settings = StorageService.getInstance().getSettings();
    const menuBar = this.shadowRoot.querySelector('.sticky-notes-menu-bar');
    if (menuBar) {
      this.controller.updateColorSwatches(menuBar as HTMLElement, settings.colors);
    }
  }

  public refreshStyles(): void {
    this.updateCSSVariables();

    const settings = StorageService.getInstance().getSettings();
    this.selectedSize = settings.defaultSize;

    const container = this.getContainer();
    if (container) {
      this.controller.updateSizeButtonUI(container, this.selectedSize);
    }
  }

  private cyclePosition(): void {
    const container = this.getContainer();
    if (!container) return;

    this.currentPosition = this.controller.getNextPosition(this.currentPosition);
    this.controller.updatePositionIcon(container, this.renderer, this.currentPosition);
    this.controller.applyModeAndPosition(container, this.currentMode, this.currentPosition, this.floatingPosition);
    this.saveSettings();
  }

  private toggleMode(): void {
    const container = this.getContainer();
    if (!container) return;

    this.currentMode = this.currentMode === 'bar' ? 'floating' : 'bar';

    // コンテナ内部を再レンダリング
    const settings = StorageService.getInstance().getSettings();
    container.innerHTML = this.renderer.renderContainer();
    const menuBar = container.querySelector('.sticky-notes-menu-bar');
    if (menuBar) {
      menuBar.innerHTML = this.renderer.renderMenuBar({
        selectedSize: this.selectedSize,
        currentMode: this.currentMode,
        currentPosition: this.currentPosition,
        settings,
      });
    }

    this.controller.setupEventListeners(container, this.currentMode, this.floatingPosition);
    this.controller.applyModeAndPosition(container, this.currentMode, this.currentPosition, this.floatingPosition);

    // コールバックを再設定
    if (this.colorSwatchCallback) {
      container.querySelectorAll('.color-swatch').forEach((swatch) => {
        const color = (swatch as HTMLElement).dataset.color as StickyColor;
        this.colorSwatchCallback!(swatch as HTMLElement, color);
      });
    }

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
