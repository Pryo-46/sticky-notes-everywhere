/**
 * Shadow DOM セットアップのユーティリティ
 * 各コンポーネントで重複していた Shadow DOM 初期化ロジックを共通化
 */

export interface ShadowDOMOptions {
  /** ホスト要素のID */
  id: string;
  /** CSSスタイル文字列 */
  styles: string;
  /** Shadow DOMのモード（デフォルト: 'closed'） */
  mode?: 'open' | 'closed';
  /** 即座にDOMに追加するか（デフォルト: true） */
  appendToBody?: boolean;
}

export interface ShadowDOMResult {
  /** ホスト要素（document.bodyに追加される外側の要素） */
  host: HTMLDivElement;
  /** Shadow Root（内部コンテンツを追加する場所） */
  shadowRoot: ShadowRoot;
}

/**
 * Shadow DOMホストを作成し、スタイルを注入する
 *
 * @example
 * ```ts
 * const { host, shadowRoot } = createShadowDOM({
 *   id: 'my-component-host',
 *   styles: `.container { display: flex; }`,
 * });
 * shadowRoot.appendChild(myContent);
 * ```
 */
export function createShadowDOM(options: ShadowDOMOptions): ShadowDOMResult {
  const { id, styles, mode = 'closed', appendToBody = true } = options;

  // Shadow DOMホストを作成
  const host = document.createElement('div');
  host.id = id;

  // Shadow Rootを作成
  const shadowRoot = host.attachShadow({ mode });

  // スタイルを注入
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  shadowRoot.appendChild(styleElement);

  // DOMに追加
  if (appendToBody) {
    document.body.appendChild(host);
  }

  return { host, shadowRoot };
}
