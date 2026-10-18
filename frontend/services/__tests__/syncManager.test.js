import syncManager, { SYNC_STATUS } from "../syncManager";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("syncManager service", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await syncManager.clearOutbox();
  });

  test("initializes with idle status and empty outbox", async () => {
    const queue = await syncManager.getOutbox();
    expect(queue).toEqual([]);
    expect(syncManager.status).toBe(SYNC_STATUS.IDLE);
    expect(syncManager.pendingCount).toBe(0);
  });

  test("can enqueue actions to outbox", async () => {
    const item = await syncManager.enqueue("trip", "create", {
      id: "trip-test-1",
      title: "Ladakh Bike Ride",
    });

    expect(item).toBeDefined();
    expect(item.entityType).toBe("trip");
    expect(item.action).toBe("create");
    expect(item.payload.title).toBe("Ladakh Bike Ride");

    const queue = await syncManager.getOutbox();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe(item.id);
  });

  test("notifies subscribers when items are enqueued and synced", async () => {
    const events = [];
    const unsubscribe = syncManager.subscribe((state) => {
      events.push({ ...state });
    });

    await syncManager.enqueue("moment", "create", {
      id: "m-test-1",
      title: "Pangong Lake",
    });

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(syncManager.pendingCount).toBe(1);

    const result = await syncManager.syncPending();
    expect(result.success).toBe(true);
    expect(result.processed).toBe(1);
    expect(syncManager.pendingCount).toBe(0);

    unsubscribe();
  });

  test("clearOutbox resets pending count to zero", async () => {
    await syncManager.enqueue("diary", "create", {
      tripId: "trip-1",
      text: "Cold mountain evening",
    });
    expect(syncManager.pendingCount).toBe(1);

    await syncManager.clearOutbox();
    expect(syncManager.pendingCount).toBe(0);
    const queue = await syncManager.getOutbox();
    expect(queue).toEqual([]);
  });
});
