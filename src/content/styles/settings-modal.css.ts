// SettingsModal用スタイル定義

import { BUTTON_RADIUS } from '../constants';

export function getSettingsModalStyles(): string {
  return `
    .settings-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .settings-overlay.hidden {
      display: none;
    }

    .settings-modal {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      width: 480px;
      max-width: 90vw;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e9ecef;
      background: #f8f9fa;
    }

    .settings-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #212529;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: ${BUTTON_RADIUS}px;
      background: transparent;
      cursor: pointer;
      color: #868e96;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: #e9ecef;
      color: #495057;
    }

    .settings-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .settings-body::-webkit-scrollbar {
      width: 8px;
    }

    .settings-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .settings-body::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }

    .settings-body::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    .settings-section {
      margin-bottom: 24px;
    }

    .settings-section:last-child {
      margin-bottom: 0;
    }

    .settings-section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #495057;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .preset-selector {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .preset-btn {
      flex: 1;
      padding: 8px 12px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #495057;
      transition: all 0.15s ease;
    }

    .preset-btn:hover {
      border-color: #adb5bd;
      background: #f8f9fa;
    }

    .preset-btn.active {
      border-color: #4dabf7;
      background: #e7f5ff;
      color: #1c7ed6;
    }

    .preset-btn.user-preset {
      border-style: dashed;
    }

    .color-settings {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .color-setting-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .color-picker-input {
      width: 32px;
      height: 32px;
      padding: 0;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: ${BUTTON_RADIUS}px;
      cursor: pointer;
      background: none;
      transition: transform 0.15s ease;
    }

    .color-picker-input:hover {
      transform: scale(1.1);
    }

    .color-picker-input::-webkit-color-swatch-wrapper {
      padding: 2px;
    }

    .color-picker-input::-webkit-color-swatch {
      border: none;
      border-radius: 4px;
    }

    .color-picker-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .color-picker-input:disabled:hover {
      transform: none;
    }

    .color-input {
      width: 90px;
      padding: 4px 8px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
    }

    .color-input:focus {
      outline: none;
      border-color: #4dabf7;
      box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
    }

    .color-input:disabled {
      opacity: 0.6;
      background: #f8f9fa;
      cursor: not-allowed;
    }

    .size-settings {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .size-setting-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .size-label {
      font-size: 14px;
      font-weight: 500;
      color: #495057;
      min-width: 70px;
    }

    .size-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .size-input-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .size-input-group label {
      font-size: 12px;
      color: #868e96;
    }

    .size-input {
      width: 60px;
      padding: 4px 8px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 13px;
      text-align: center;
    }

    .size-input:focus {
      outline: none;
      border-color: #4dabf7;
      box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
    }

    .size-default-radio {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
      cursor: pointer;
    }

    .size-default-radio input[type="radio"] {
      width: 16px;
      height: 16px;
      margin: 0;
      cursor: pointer;
      accent-color: #4dabf7;
    }

    .size-default-radio span {
      font-size: 12px;
      color: #868e96;
    }

    .size-default-radio:has(input:checked) span {
      color: #4dabf7;
      font-weight: 500;
    }

    .button-size-selector {
      display: flex;
      gap: 8px;
    }

    .button-size-btn {
      flex: 1;
      padding: 8px 12px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #495057;
      transition: all 0.15s ease;
    }

    .button-size-btn:hover {
      border-color: #adb5bd;
      background: #f8f9fa;
    }

    .button-size-btn.active {
      border-color: #4dabf7;
      background: #e7f5ff;
      color: #1c7ed6;
    }

    .zindex-setting {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .zindex-input {
      width: 120px;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 14px;
      text-align: right;
    }

    .zindex-input:focus {
      outline: none;
      border-color: #4dabf7;
      box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
    }

    .zindex-hint {
      font-size: 12px;
      color: #868e96;
    }

    .behavior-settings {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .behavior-setting-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .behavior-setting-item.sub-setting {
      margin-left: 24px;
      padding: 10px 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .behavior-setting-item.sub-setting.disabled {
      opacity: 0.5;
    }

    .behavior-setting-item label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #495057;
    }

    .checkbox-label {
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin: 0;
      cursor: pointer;
      accent-color: #4dabf7;
    }

    .behavior-setting-item select {
      padding: 6px 10px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 13px;
      background: #fff;
      cursor: pointer;
      min-width: 180px;
    }

    .behavior-setting-item select:focus {
      outline: none;
      border-color: #4dabf7;
      box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
    }

    .behavior-setting-item select:disabled {
      background: #e9ecef;
      cursor: not-allowed;
    }

    .setting-hint {
      font-size: 12px;
      color: #868e96;
      margin-top: 2px;
    }

    .settings-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary {
      background: #fff;
      border: 1px solid #ced4da;
      color: #495057;
    }

    .btn-secondary:hover {
      background: #f8f9fa;
      border-color: #adb5bd;
    }

    .btn-primary {
      background: #4dabf7;
      border: 1px solid #339af0;
      color: #fff;
    }

    .btn-primary:hover {
      background: #339af0;
    }

    .btn-danger {
      background: #fff;
      border: 1px solid #fa5252;
      color: #fa5252;
    }

    .btn-danger:hover {
      background: #fff5f5;
    }

    .footer-left {
      display: flex;
      gap: 8px;
    }

    .footer-right {
      display: flex;
      gap: 8px;
    }
  `;
}
