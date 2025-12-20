import type { IStorageService } from '../types/storage';
import { StorageService } from '../managers/StorageService';

/**
 * 依存性注入用のサービスコンテナ
 * シングルトンパターンからの移行を容易にし、テスト時にモックを注入可能にする
 */
class ServiceContainerImpl {
  private storageService: IStorageService | null = null;

  /**
   * StorageServiceを取得
   * 未設定の場合はデフォルトのStorageServiceを使用
   */
  public getStorageService(): IStorageService {
    if (!this.storageService) {
      this.storageService = StorageService.getInstance();
    }
    return this.storageService;
  }

  /**
   * StorageServiceを設定（テスト用）
   */
  public setStorageService(service: IStorageService): void {
    this.storageService = service;
  }

  /**
   * コンテナをリセット（テスト用）
   */
  public reset(): void {
    this.storageService = null;
  }
}

export const ServiceContainer = new ServiceContainerImpl();

/**
 * StorageServiceを取得するヘルパー関数
 */
export function getStorageService(): IStorageService {
  return ServiceContainer.getStorageService();
}
