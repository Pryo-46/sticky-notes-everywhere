// SetManager用スタイル定義

import { BUTTON_RADIUS } from '../constants';

export function getSetManagerStyles(): string {
  return `
    .set-manager-overlay {
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

    .set-manager-overlay.hidden {
      display: none;
    }

    .set-manager-modal {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      width: 520px;
      max-width: 90vw;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .set-manager-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e9ecef;
      background: #f8f9fa;
    }

    .set-manager-header h2 {
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

    .set-manager-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .set-manager-body::-webkit-scrollbar {
      width: 8px;
    }

    .set-manager-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .set-manager-body::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }

    .set-manager-body::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    /* 保存ボタン */
    .save-current-btn {
      width: 100%;
      padding: 12px 16px;
      border: 2px dashed #4dabf7;
      border-radius: 8px;
      background: #e7f5ff;
      color: #1c7ed6;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-bottom: 20px;
    }

    .save-current-btn:hover {
      background: #d0ebff;
      border-color: #339af0;
    }

    .save-current-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* セクション */
    .set-manager-section {
      margin-bottom: 24px;
    }

    .set-manager-section:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .section-header h3 {
      font-size: 14px;
      font-weight: 600;
      color: #495057;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-header h3 svg {
      width: 18px;
      height: 18px;
    }

    .clear-history-btn {
      padding: 4px 10px;
      border: 1px solid #fa5252;
      border-radius: 4px;
      background: #fff;
      color: #fa5252;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .clear-history-btn:hover {
      background: #fff5f5;
    }

    /* リスト */
    .set-list,
    .history-list {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      overflow: hidden;
    }

    .empty-message {
      padding: 24px;
      text-align: center;
      color: #868e96;
      font-size: 14px;
    }

    /* セットアイテム */
    .set-item,
    .history-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e9ecef;
      transition: background 0.15s ease;
      cursor: pointer;
    }

    .set-item:last-child,
    .history-item:last-child {
      border-bottom: none;
    }

    .set-item:hover,
    .history-item:hover {
      background: #f8f9fa;
    }

    .set-item-info,
    .history-item-info {
      flex: 1;
      min-width: 0;
    }

    .set-item-name,
    .history-item-title {
      font-size: 14px;
      font-weight: 500;
      color: #212529;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .set-item-meta,
    .history-item-meta {
      font-size: 12px;
      color: #868e96;
      margin-top: 2px;
    }

    .history-item-url {
      font-size: 12px;
      color: #adb5bd;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    /* アクションボタン */
    .set-item-actions {
      display: flex;
      gap: 4px;
      margin-left: 12px;
    }

    .action-btn {
      width: 28px;
      height: 28px;
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

    .action-btn:hover {
      background: #e9ecef;
      color: #495057;
    }

    .action-btn.delete:hover {
      background: #fff5f5;
      color: #fa5252;
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
    }

    /* 名前入力ダイアログ */
    .name-input-overlay {
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
    }

    .name-input-overlay.hidden {
      display: none;
    }

    .name-input-dialog {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      width: 360px;
      max-width: 90vw;
      padding: 20px;
    }

    .name-input-dialog h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #212529;
    }

    .name-input-field {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .name-input-field:focus {
      outline: none;
      border-color: #4dabf7;
      box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
    }

    .name-input-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
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

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* 読み込みダイアログ */
    .load-dialog-overlay {
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
    }

    .load-dialog {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      width: 360px;
      max-width: 90vw;
      padding: 20px;
    }

    .load-dialog h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #212529;
    }

    .load-dialog-info {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #868e96;
    }

    .load-dialog-desc {
      margin: 0 0 20px 0;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 12px;
      color: #495057;
      line-height: 1.6;
    }

    .load-dialog-desc strong {
      color: #212529;
    }

    .load-dialog-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .load-dialog-buttons .btn {
      min-width: 80px;
      text-align: center;
    }
  `;
}
