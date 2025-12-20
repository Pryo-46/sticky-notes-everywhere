import { MAX_SAFE_ZINDEX } from '../constants';

export class ZIndexManager {
  private baseZIndex: number;
  private maxZIndex: number;

  constructor(baseZIndex: number) {
    this.baseZIndex = baseZIndex;
    this.maxZIndex = baseZIndex;
  }

  /** 次のz-indexを取得して更新 */
  public getNext(): number {
    return ++this.maxZIndex;
  }

  /** 現在の最大z-indexを取得 */
  public getCurrent(): number {
    return this.maxZIndex;
  }

  /** オーバーフロー防止が必要かチェック */
  public needsRebalance(): boolean {
    return this.maxZIndex >= MAX_SAFE_ZINDEX;
  }

  /** z-indexを基準値にリセット */
  public reset(): void {
    this.maxZIndex = this.baseZIndex;
  }

  /** ベースz-indexを更新 */
  public updateBaseZIndex(newBaseZIndex: number): void {
    const offset = this.maxZIndex - this.baseZIndex;
    this.baseZIndex = newBaseZIndex;
    this.maxZIndex = newBaseZIndex + offset;
  }

  /** ベースz-indexを取得 */
  public getBaseZIndex(): number {
    return this.baseZIndex;
  }
}
