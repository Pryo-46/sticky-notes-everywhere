// MenuBar用スタイル定義
// CSS変数を使用して動的な値を制御

import { BUTTON_GAP, BUTTON_RADIUS } from '../constants';

// アニメーション定数
const ANIMATION_DURATION = '0.4s';
const ANIMATION_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const OPACITY_DURATION = '0.3s';

export function getMenuBarStyles(): string {
  return `
    /* CSS変数（JavaScriptから動的に設定） */
    :host {
      --button-size: 40px;
      --bar-height: 56px;
      --bar-radius: 28px;
      --icon-size: 24px;
    }

    /* コンテナ：アイコンとメニューバーを含む */
    .sticky-menu-container {
      position: fixed;
      z-index: 2147483647;
      display: flex;
      align-items: flex-start;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    }

    /* 付箋アイコンボタン（常に表示） */
    .sticky-icon-btn {
      width: var(--button-size);
      height: var(--button-size);
      border-radius: 50%;
      border: none;
      background: #6d534b;
      box-shadow: 2px 3px 3px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      z-index: 1;
    }

    .sticky-icon-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
    }

    .sticky-icon-btn:active {
      transform: scale(0.95);
    }

    .sticky-icon-btn svg {
      width: var(--button-size);
      height: var(--button-size);
    }

    /* メニューバー本体 */
    .sticky-notes-menu-bar {
      background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* === バーモード - 上部 === */
    .sticky-menu-container.bar-top {
      top: 0;
      left: 0;
      flex-direction: row;
      align-items: stretch;
    }
    .sticky-menu-container.bar-top .sticky-icon-btn {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
    }
    .sticky-menu-container.bar-top .sticky-icon-btn:hover {
      transform: translateY(-50%) scale(1.1);
    }
    .sticky-menu-container.bar-top .sticky-icon-btn:active {
      transform: translateY(-50%) scale(0.95);
    }
    .sticky-menu-container.bar-top .sticky-notes-menu-bar {
      height: var(--bar-height);
      flex-direction: row;
      padding: 0 16px 0 calc(var(--button-size) + 16px);
      border-radius: var(--bar-radius);
      max-width: 100vw;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
      transition: max-width ${ANIMATION_DURATION} ${ANIMATION_EASING}, opacity ${OPACITY_DURATION} ease;
    }
    .sticky-menu-container.bar-top .sticky-notes-menu-bar::-webkit-scrollbar {
      display: none;
    }
    .sticky-menu-container.bar-top.hidden .sticky-notes-menu-bar {
      max-width: var(--bar-height);
      opacity: 0;
    }

    /* === バーモード - 下部 === */
    .sticky-menu-container.bar-bottom {
      bottom: 0;
      left: 0;
      flex-direction: row;
      align-items: stretch;
    }
    .sticky-menu-container.bar-bottom .sticky-icon-btn {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
    }
    .sticky-menu-container.bar-bottom .sticky-icon-btn:hover {
      transform: translateY(-50%) scale(1.1);
    }
    .sticky-menu-container.bar-bottom .sticky-icon-btn:active {
      transform: translateY(-50%) scale(0.95);
    }
    .sticky-menu-container.bar-bottom .sticky-notes-menu-bar {
      height: var(--bar-height);
      flex-direction: row;
      padding: 0 16px 0 calc(var(--button-size) + 16px);
      border-radius: var(--bar-radius);
      max-width: 100vw;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
      transition: max-width ${ANIMATION_DURATION} ${ANIMATION_EASING}, opacity ${OPACITY_DURATION} ease;
    }
    .sticky-menu-container.bar-bottom .sticky-notes-menu-bar::-webkit-scrollbar {
      display: none;
    }
    .sticky-menu-container.bar-bottom.hidden .sticky-notes-menu-bar {
      max-width: var(--bar-height);
      opacity: 0;
    }

    /* === バーモード - 左部 === */
    .sticky-menu-container.bar-left {
      top: 0;
      left: 0;
      flex-direction: column;
      align-items: stretch;
      max-height: 100vh;
    }
    .sticky-menu-container.bar-left .sticky-icon-btn {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
    }
    .sticky-menu-container.bar-left .sticky-icon-btn:hover {
      transform: translateX(-50%) scale(1.1);
    }
    .sticky-menu-container.bar-left .sticky-icon-btn:active {
      transform: translateX(-50%) scale(0.95);
    }
    .sticky-menu-container.bar-left .sticky-notes-menu-bar {
      width: var(--bar-height);
      flex-direction: column;
      padding: calc(var(--button-size) + 16px) 0 16px 0;
      border-radius: var(--bar-radius);
      max-height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
      transition: max-height ${ANIMATION_DURATION} ${ANIMATION_EASING}, opacity ${OPACITY_DURATION} ease;
    }
    .sticky-menu-container.bar-left .sticky-notes-menu-bar::-webkit-scrollbar {
      display: none;
    }
    .sticky-menu-container.bar-left.hidden .sticky-notes-menu-bar {
      max-height: var(--bar-height);
      opacity: 0;
    }

    /* === バーモード - 右部 === */
    .sticky-menu-container.bar-right {
      top: 0;
      right: 0;
      flex-direction: column;
      align-items: stretch;
      max-height: 100vh;
    }
    .sticky-menu-container.bar-right .sticky-icon-btn {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
    }
    .sticky-menu-container.bar-right .sticky-icon-btn:hover {
      transform: translateX(-50%) scale(1.1);
    }
    .sticky-menu-container.bar-right .sticky-icon-btn:active {
      transform: translateX(-50%) scale(0.95);
    }
    .sticky-menu-container.bar-right .sticky-notes-menu-bar {
      width: var(--bar-height);
      flex-direction: column;
      padding: calc(var(--button-size) + 16px) 0 16px 0;
      border-radius: var(--bar-radius);
      max-height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
      transition: max-height ${ANIMATION_DURATION} ${ANIMATION_EASING}, opacity ${OPACITY_DURATION} ease;
    }
    .sticky-menu-container.bar-right .sticky-notes-menu-bar::-webkit-scrollbar {
      display: none;
    }
    .sticky-menu-container.bar-right.hidden .sticky-notes-menu-bar {
      max-height: var(--bar-height);
      opacity: 0;
    }

    /* === フローティングモード === */
    .sticky-menu-container.floating {
      flex-direction: column;
      align-items: flex-start;
    }
    .sticky-menu-container.floating .sticky-icon-btn {
      position: relative;
      z-index: 2;
      margin-top: 8px;
    }
    .sticky-menu-container.floating .sticky-notes-menu-bar {
      position: absolute;
      top: 0;
      left: calc(var(--button-size) / 2);
      transform: translateX(-50%);
      border-radius: 9999px;
      padding: calc(var(--button-size) + 16px) 0px 20px 0px;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      overflow: visible;
      max-height: 100vh;
      max-width: 100vw;
      transition: max-height ${ANIMATION_DURATION} ${ANIMATION_EASING}, max-width ${ANIMATION_DURATION} ${ANIMATION_EASING}, opacity ${OPACITY_DURATION} ease;
    }
    .sticky-menu-container.floating.hidden .sticky-notes-menu-bar {
      max-height: var(--bar-height);
      max-width: var(--bar-height);
      opacity: 0;
      overflow: hidden;
    }

    /* フローティング時は2列レイアウト */
    .floating .menu-content {
      display: flex;
      flex-direction: row;
      gap: 8px;
      padding: 8px;
      max-height: calc(100vh - var(--button-size) - 40px);
      overflow-y: auto;
      overflow-x: visible;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .floating .menu-content::-webkit-scrollbar {
      display: none;
      padding: 4px;
    }

    /* 左列：ボタン群 */
    .floating .button-column {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
    }

    /* ドラッグハンドル */
    .drag-handle {
      display: none;
      cursor: move;
      padding: 4px;
      color: #adb5bd;
      user-select: none;
    }

    .floating .drag-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
      margin-bottom: 4px;
    }

    .menu-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* 縦向きレイアウト */
    .bar-left .menu-section,
    .bar-right .menu-section,
    .floating .menu-section {
      flex-direction: column;
      gap: 8px;
    }

    .menu-divider {
      width: 1px;
      height: 24px;
      background: #ddd;
    }

    /* 縦向きの仕切り */
    .bar-left .menu-divider,
    .bar-right .menu-divider,
    .floating .menu-divider {
      width: 24px;
      height: 1px;
    }

    .color-palette {
      display: flex;
      gap: ${BUTTON_GAP}px;
    }

    /* 縦向きカラーパレット */
    .bar-left .color-palette,
    .bar-right .color-palette {
      flex-direction: column;
      gap: ${BUTTON_GAP}px;
    }

    .floating .color-palette {
      flex-direction: column;
      flex-wrap: nowrap;
      max-width: none;
    }

    .color-swatch {
      width: var(--button-size);
      height: var(--button-size);
      border-radius: ${BUTTON_RADIUS}px;
      cursor: grab;
      border: 1px solid rgba(0, 0, 0, 0.2);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .color-swatch:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 2px rgba(0, 0, 0, 0.2);
      position: relative;
    }

    .color-swatch:active {
      cursor: grabbing;
    }

    .size-presets {
      display: flex;
      gap: 8px;
    }

    /* 縦向きサイズプリセット */
    .bar-left .size-presets,
    .bar-right .size-presets {
      flex-direction: column;
    }

    .size-btn {
      width: var(--button-size);
      height: var(--button-size);
      padding: 0;
      border: 1px solid #ccc;
      border-radius: ${BUTTON_RADIUS}px;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      color: #333;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }

    .size-btn:hover {
      background: #f0f0f0;
    }

    .size-btn.active {
      background: #4dabf7;
      border-color: #339af0;
      color: #fff;
    }

    .icon-btn {
      width: var(--button-size);
      height: var(--button-size);
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: ${BUTTON_RADIUS}px;
      background: transparent;
      cursor: pointer;
      font-size: 18px;
      color: #495057;
      transition: all 0.15s ease;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .icon-btn:hover {
      background: #e9ecef;
    }

    .icon-btn:active {
      background: #dee2e6;
    }

    .icon-btn.active {
      background: #e7f5ff;
      color: #1c7ed6;
    }

    .icon-btn.active:hover {
      background: #d0ebff;
    }

    .menu-spacer {
      flex: 1;
    }

    /* 縦向きスペーサー */
    .bar-left .menu-spacer,
    .bar-right .menu-spacer {
      flex: 1;
      width: 100%;
    }

    .floating .menu-spacer {
      display: none;
    }

    /* 位置切替ボタン（フローティング時は非表示） */
    .floating .position-btn {
      display: none;
    }

    .actions-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .floating .actions-row {
      flex-wrap: wrap;
      justify-content: center;
    }
  `;
}
