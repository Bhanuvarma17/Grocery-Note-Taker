import { ListSession } from '../types';

const DB_NAME = 'GroceryNoteTakerDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';
const LOCAL_STORAGE_KEY = 'grocery_note_taker_sessions_backup';

class DatabaseService {
  private db: IDBDatabase | null = null;
  private isIndexedDBAvailable: boolean = true;

  constructor() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isIndexedDBAvailable = false;
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (!this.isIndexedDBAvailable) {
      throw new Error('IndexedDB not supported');
    }

    return new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('listDate', 'listDate', { unique: false });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };

        request.onerror = (e) => {
          console.warn('IndexedDB failed to open, falling back to localStorage', e);
          this.isIndexedDBAvailable = false;
          reject(request.error);
        };
      } catch (err) {
        this.isIndexedDBAvailable = false;
        reject(err);
      }
    });
  }

  // Fallback storage helpers
  private getFromLocalStorage(): ListSession[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read from localStorage', e);
      return [];
    }
  }

  private saveToLocalStorage(sessions: ListSession[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Get all sessions sorted newest first by listDate, then by updatedAt
  public async getAllSessions(): Promise<ListSession[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const list: ListSession[] = request.result || [];
          list.sort((a, b) => {
            if (b.listDate !== a.listDate) {
              return b.listDate.localeCompare(a.listDate);
            }
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
          // Also sync to localStorage as redundant backup
          this.saveToLocalStorage(list);
          resolve(list);
        };

        request.onerror = () => {
          console.warn('Error reading from IndexedDB, using localStorage');
          resolve(this.getFromLocalStorage());
        };
      });
    } catch {
      return this.getFromLocalStorage();
    }
  }

  // Get single session for date
  public async getSessionByDate(dateString: string): Promise<ListSession | null> {
    const sessions = await this.getAllSessions();
    return sessions.find((s) => s.listDate === dateString) || null;
  }

  // Save / Update session
  public async saveSession(session: ListSession): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const putRequest = store.put(session);

        putRequest.onsuccess = () => {
          // Keep local storage synced as safety replica
          const existing = this.getFromLocalStorage().filter((s) => s.id !== session.id);
          existing.push(session);
          this.saveToLocalStorage(existing);
          resolve();
        };

        putRequest.onerror = () => {
          console.warn('Error saving to IndexedDB, fallback to localStorage');
          const existing = this.getFromLocalStorage().filter((s) => s.id !== session.id);
          existing.push(session);
          this.saveToLocalStorage(existing);
          resolve();
        };
      });
    } catch {
      const existing = this.getFromLocalStorage().filter((s) => s.id !== session.id);
      existing.push(session);
      this.saveToLocalStorage(existing);
    }
  }

  // Delete session by ID
  public async deleteSession(sessionId: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(sessionId);

        request.onsuccess = () => {
          const filtered = this.getFromLocalStorage().filter((s) => s.id !== sessionId);
          this.saveToLocalStorage(filtered);
          resolve();
        };

        request.onerror = () => {
          const filtered = this.getFromLocalStorage().filter((s) => s.id !== sessionId);
          this.saveToLocalStorage(filtered);
          resolve();
        };
      });
    } catch {
      const filtered = this.getFromLocalStorage().filter((s) => s.id !== sessionId);
      this.saveToLocalStorage(filtered);
    }
  }

  // Clear all data
  public async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // Export full JSON
  public async exportBackupJSON(): Promise<string> {
    const sessions = await this.getAllSessions();
    return JSON.stringify(
      {
        appName: 'Grocery Note Taker',
        exportDate: new Date().toISOString(),
        version: 1,
        sessions,
      },
      null,
      2
    );
  }

  // Import JSON
  public async importBackupJSON(jsonString: string): Promise<{ count: number }> {
    const parsed = JSON.parse(jsonString);
    const sessions: ListSession[] = Array.isArray(parsed) ? parsed : parsed.sessions || [];
    if (!Array.isArray(sessions)) {
      throw new Error('Invalid backup file format: missing sessions array');
    }

    for (const session of sessions) {
      if (session.id && session.listDate) {
        await this.saveSession(session);
      }
    }
    return { count: sessions.length };
  }
}

export const dbService = new DatabaseService();
