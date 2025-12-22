import type { ButtonSize, ColorPresetName, ExtensionSettings, StickyColor, StickySize } from '../../../types';
import { LIGHT_PRESET, DARK_PRESET, STICKY_COLORS } from '../../../types';
import { isValidHexColor } from '../../utils/colorUtils';

export interface SettingsModalCallbacks {
  onClose?: () => void;
  onSave?: () => void;
  onReset?: () => void;
  onPresetChange?: (preset: ColorPresetName) => void;
  onColorChange?: (color: StickyColor, value: string) => void;
  onSizeChange?: (size: StickySize, dim: 'width' | 'height', value: number) => void;
  onDefaultSizeChange?: (size: StickySize) => void;
  onButtonSizeChange?: (size: ButtonSize) => void;
  onZIndexChange?: (value: number) => void;
  onAutoShowMenuChange?: (value: boolean) => void;
}

/**
 * SettingsModalのイベント処理を担当
 */
export class SettingsModalController {
  private callbacks: SettingsModalCallbacks = {};
  private tempSettings: ExtensionSettings | null = null;

  public setCallbacks(callbacks: SettingsModalCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public setTempSettings(settings: ExtensionSettings): void {
    this.tempSettings = settings;
  }

  public setupEventListeners(modal: HTMLDivElement): void {
    this.setupCloseButtons(modal);
    this.setupPresetButtons(modal);
    this.setupColorInputs(modal);
    this.setupSizeInputs(modal);
    this.setupButtonSizeButtons(modal);
    this.setupZIndexInput(modal);
    this.setupBehaviorInputs(modal);
    this.setupOverlayClick(modal);
  }

  private setupCloseButtons(modal: HTMLDivElement): void {
    modal.querySelector('.close-btn')?.addEventListener('click', () => {
      this.callbacks.onClose?.();
    });

    modal.querySelector('.cancel-btn')?.addEventListener('click', () => {
      this.callbacks.onClose?.();
    });

    modal.querySelector('.save-btn')?.addEventListener('click', () => {
      this.callbacks.onSave?.();
    });

    modal.querySelector('.reset-btn')?.addEventListener('click', () => {
      this.callbacks.onReset?.();
    });
  }

  private setupOverlayClick(modal: HTMLDivElement): void {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.callbacks.onClose?.();
      }
    });
  }

  private setupPresetButtons(modal: HTMLDivElement): void {
    modal.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const preset = target.dataset.preset as ColorPresetName;
        this.callbacks.onPresetChange?.(preset);
      });
    });
  }

  private setupColorInputs(modal: HTMLDivElement): void {
    // カラーピッカー
    modal.querySelectorAll('.color-picker-input').forEach((picker) => {
      picker.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const color = target.dataset.color as StickyColor;
        const value = target.value;

        this.callbacks.onColorChange?.(color, value);

        // テキスト入力も同期
        const textInput = modal.querySelector(`.color-input[data-color="${color}"]`) as HTMLInputElement;
        if (textInput) {
          textInput.value = value;
        }
      });
    });

    // テキスト入力
    modal.querySelectorAll('.color-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const color = target.dataset.color as StickyColor;
        const value = target.value;

        if (isValidHexColor(value)) {
          this.callbacks.onColorChange?.(color, value);

          // カラーピッカーも同期
          const picker = modal.querySelector(`.color-picker-input[data-color="${color}"]`) as HTMLInputElement;
          if (picker) {
            picker.value = value;
          }
        }
      });

      // フォーカスが外れたらtrimする
      input.addEventListener('blur', (e) => {
        const target = e.target as HTMLInputElement;
        const trimmedValue = target.value.trim();
        target.value = trimmedValue;

        if (isValidHexColor(trimmedValue)) {
          const color = target.dataset.color as StickyColor;
          this.callbacks.onColorChange?.(color, trimmedValue);

          // カラーピッカーも同期
          const picker = modal.querySelector(`.color-picker-input[data-color="${color}"]`) as HTMLInputElement;
          if (picker) {
            picker.value = trimmedValue;
          }
        }
      });
    });
  }

  private setupSizeInputs(modal: HTMLDivElement): void {
    modal.querySelectorAll('.size-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const size = target.dataset.size as StickySize;
        const dim = target.dataset.dim as 'width' | 'height';
        const value = parseInt(target.value, 10);

        if (!isNaN(value) && value > 0) {
          this.callbacks.onSizeChange?.(size, dim, value);
        }
      });
    });

    // デフォルトサイズ
    modal.querySelectorAll('input[name="defaultSize"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.callbacks.onDefaultSizeChange?.(target.value as StickySize);
      });
    });
  }

  private setupButtonSizeButtons(modal: HTMLDivElement): void {
    modal.querySelectorAll('.button-size-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const size = target.dataset.buttonSize as ButtonSize;
        this.callbacks.onButtonSizeChange?.(size);

        // アクティブ状態を更新
        modal.querySelectorAll('.button-size-btn').forEach((b) => b.classList.remove('active'));
        target.classList.add('active');
      });
    });
  }

  private setupZIndexInput(modal: HTMLDivElement): void {
    const zIndexInput = modal.querySelector('#baseZIndex') as HTMLInputElement;
    zIndexInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 2147483600) {
        this.callbacks.onZIndexChange?.(value);
      }
    });
  }

  private setupBehaviorInputs(modal: HTMLDivElement): void {
    const autoShowMenuCheckbox = modal.querySelector('#autoShowMenu') as HTMLInputElement;

    autoShowMenuCheckbox?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.callbacks.onAutoShowMenuChange?.(target.checked);
    });
  }

  /** プリセット切り替え時のUI更新 */
  public updatePresetUI(modal: HTMLDivElement, preset: ColorPresetName, colors: Record<StickyColor, string>): void {
    // ボタンのactive状態を更新
    modal.querySelectorAll('.preset-btn').forEach((btn) => {
      const btnPreset = (btn as HTMLButtonElement).dataset.preset;
      btn.classList.toggle('active', btnPreset === preset);
    });

    // 色入力の値を更新し、ユーザープリセット以外は無効化
    const isUserPreset = preset === 'user1' || preset === 'user2';
    STICKY_COLORS.forEach((color) => {
      const picker = modal.querySelector(`.color-picker-input[data-color="${color}"]`) as HTMLInputElement;
      const textInput = modal.querySelector(`.color-input[data-color="${color}"]`) as HTMLInputElement;
      if (picker) {
        picker.value = colors[color];
        picker.disabled = !isUserPreset;
      }
      if (textInput) {
        textInput.value = colors[color];
        textInput.disabled = !isUserPreset;
      }
    });
  }

  /** プリセットに応じた色を取得 */
  public getColorsForPreset(preset: ColorPresetName, userPresets: ExtensionSettings['userPresets']): Record<StickyColor, string> {
    switch (preset) {
      case 'light':
        return { ...LIGHT_PRESET };
      case 'dark':
        return { ...DARK_PRESET };
      case 'user1':
        return { ...userPresets.user1 };
      case 'user2':
        return { ...userPresets.user2 };
    }
  }
}
