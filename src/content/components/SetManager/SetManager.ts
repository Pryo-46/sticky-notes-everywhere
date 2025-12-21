import type { PageHistory, StickyNoteData, StickyNoteSet } from '../../../types';
import { StorageService } from '../../managers/StorageService';
import { getSetManagerStyles } from '../../styles/set-manager.css';
import { createShadowDOM } from '../../utils/shadowDOM';
import { SetManagerRenderer } from './SetManagerRenderer';
import { SetManagerController, LoadMode } from './SetManagerController';

export interface SetManagerOptions {
  getCurrentNotes: () => StickyNoteData[];
}

type LoadNotesCallback = (notes: StickyNoteData[], mode: LoadMode) => void;

export class SetManager {
  private element: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private storageService: StorageService;
  private renderer: SetManagerRenderer;
  private controller: SetManagerController;
  private getCurrentNotes: () => StickyNoteData[];
  private loadNotesCallback: LoadNotesCallback | null = null;

  private sets: StickyNoteSet[] = [];
  private history: PageHistory[] = [];

  constructor(options: SetManagerOptions) {
    this.storageService = StorageService.getInstance();
    this.getCurrentNotes = options.getCurrentNotes;

    this.renderer = new SetManagerRenderer();
    this.controller = new SetManagerController();

    const { host, shadowRoot } = createShadowDOM({
      id: 'sticky-notes-set-manager-host',
      styles: '',
      appendToBody: false,
    });
    this.element = host;
    this.shadowRoot = shadowRoot;

    this.setupControllerCallbacks();
    this.render();
  }

  private setupControllerCallbacks(): void {
    this.controller.setCallbacks({
      onClose: () => this.hide(),
      onSaveCurrentNotes: (name) => this.saveCurrentNotes(name),
      onLoadSet: (notes, mode) => this.loadNotes(notes, mode),
      onDeleteSet: (setId) => this.deleteSet(setId),
      onRenameSet: (setId, newName) => this.renameSet(setId, newName),
      onLoadHistory: (notes, mode) => this.loadNotes(notes, mode),
      onClearHistory: () => this.clearHistory(),
    });
  }

  private render(): void {
    const style = document.createElement('style');
    style.textContent = getSetManagerStyles();
    this.shadowRoot.appendChild(style);

    const modal = document.createElement('div');
    modal.className = 'set-manager-overlay hidden';
    this.shadowRoot.appendChild(modal);
  }

  private async refreshData(): Promise<void> {
    this.sets = await this.storageService.loadSets();
    this.history = await this.storageService.loadPageHistory();
    this.controller.setData(this.sets, this.history);
  }

  private updateUI(): void {
    const modal = this.shadowRoot.querySelector('.set-manager-overlay') as HTMLDivElement;
    if (!modal) return;

    const currentNotes = this.getCurrentNotes();
    modal.innerHTML = this.renderer.renderModal(this.sets, this.history, currentNotes.length > 0);
    this.controller.setupEventListeners(modal);
  }

  public async show(): Promise<void> {
    if (!this.element.parentElement) {
      document.body.appendChild(this.element);
    }

    await this.refreshData();
    this.updateUI();

    this.shadowRoot.querySelector('.set-manager-overlay')?.classList.remove('hidden');
  }

  public hide(): void {
    this.shadowRoot.querySelector('.set-manager-overlay')?.classList.add('hidden');
  }

  public onLoadNotes(callback: LoadNotesCallback): void {
    this.loadNotesCallback = callback;
  }

  private async saveCurrentNotes(name: string): Promise<void> {
    const notes = this.getCurrentNotes();
    if (notes.length === 0) return;

    // 常に新規セットとして保存（IDで区別）
    const newSet: StickyNoteSet = {
      id: this.generateId(),
      name,
      notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.storageService.saveSet(newSet);

    await this.refreshData();
    this.updateUI();
  }

  private async deleteSet(setId: string): Promise<void> {
    await this.storageService.deleteSet(setId);
    await this.refreshData();
    this.updateUI();
  }

  private async renameSet(setId: string, newName: string): Promise<void> {
    await this.storageService.updateSetName(setId, newName);
    await this.refreshData();
    this.updateUI();
  }

  private loadNotes(notes: StickyNoteData[], mode: LoadMode): void {
    this.loadNotesCallback?.(notes, mode);
    this.hide();
  }

  private async clearHistory(): Promise<void> {
    await this.storageService.clearPageHistory();
    await this.refreshData();
    this.updateUI();
  }

  private generateId(): string {
    return `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
