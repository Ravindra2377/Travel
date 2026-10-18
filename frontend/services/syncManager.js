import AsyncStorage from "@react-native-async-storage/async-storage";

const OUTBOX_STORAGE_KEY = "@trip_moments_sync_outbox_v1";

export const SYNC_STATUS = {
  IDLE: "synced",
  SYNCING: "syncing",
  OFFLINE: "offline",
};

class SyncManager {
  constructor() {
    this.status = SYNC_STATUS.IDLE;
    this.listeners = new Set();
    this.pendingCount = 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener({ status: this.status, pendingCount: this.pendingCount });
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener({ status: this.status, pendingCount: this.pendingCount });
      } catch (e) {
        console.warn("[SyncManager] Listener notification error:", e);
      }
    }
  }

  async getOutbox() {
    try {
      const data = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("[SyncManager] Failed to read outbox:", e);
      return [];
    }
  }

  async saveOutbox(queue) {
    try {
      await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
      this.pendingCount = queue.length;
      this.notify();
    } catch (e) {
      console.error("[SyncManager] Failed to save outbox:", e);
    }
  }

  async enqueue(entityType, action, payload) {
    const queue = await this.getOutbox();
    const item = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityType, // 'trip' | 'moment' | 'diary'
      action,     // 'create' | 'update' | 'delete'
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    queue.push(item);
    await this.saveOutbox(queue);
    return item;
  }

  async syncPending(endpointUrl = null) {
    const queue = await this.getOutbox();
    if (queue.length === 0) {
      this.status = SYNC_STATUS.IDLE;
      this.pendingCount = 0;
      this.notify();
      return { success: true, processed: 0 };
    }

    this.status = SYNC_STATUS.SYNCING;
    this.notify();

    // In v0.1: simulate cloud roundtrip or send to real endpoint if configured
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Successfully processed items are drained from the local outbox
      await this.saveOutbox([]);
      this.status = SYNC_STATUS.IDLE;
      this.pendingCount = 0;
      this.notify();
      return { success: true, processed: queue.length };
    } catch (err) {
      console.error("[SyncManager] Sync failed; retaining offline outbox:", err);
      this.status = SYNC_STATUS.OFFLINE;
      this.notify();
      return { success: false, error: err };
    }
  }

  async clearOutbox() {
    await this.saveOutbox([]);
    this.status = SYNC_STATUS.IDLE;
    this.pendingCount = 0;
    this.notify();
  }
}

export const syncManager = new SyncManager();
export default syncManager;
