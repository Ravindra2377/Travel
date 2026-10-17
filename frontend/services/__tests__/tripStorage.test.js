import tripStorage, { calculateDistanceKm, INITIAL_TRIPS } from "../tripStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("tripStorage service", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("returns initial trips when storage is empty", async () => {
    const trips = await tripStorage.getTrips();
    expect(trips).toBeDefined();
    expect(trips.length).toBeGreaterThanOrEqual(2);
    expect(trips[0].title).toBe("Golden Sunrise in Hampi");
  });

  test("calculates great-circle distance accurately", () => {
    // Distance between Hampi Bazaar (15.3350, 76.4600) and Vittala Temple (15.3402, 76.4770) ~1.9 km
    const dist = calculateDistanceKm(15.335, 76.46, 15.3402, 76.477);
    expect(dist).toBeGreaterThan(1.5);
    expect(dist).toBeLessThan(2.5);
  });

  test("can add and retrieve a new trip", async () => {
    const newTrip = await tripStorage.addTrip({
      title: "Paris Autumn Walk",
      city: "Paris",
      country: "France",
      startDate: "2026-09-10",
      endDate: "2026-09-15",
    });

    expect(newTrip.id).toBeDefined();
    expect(newTrip.title).toBe("Paris Autumn Walk");

    const allTrips = await tripStorage.getTrips();
    expect(allTrips.some((t) => t.id === newTrip.id)).toBe(true);
  });

  test("can add and toggle favorite moment", async () => {
    const moment = await tripStorage.addMoment({
      tripId: "trip-1",
      title: "Sunset over boulders",
      text: "Golden hour light on ancient stones",
      placeName: "Matanga Hill",
      city: "Hampi",
      country: "India",
      isFavorite: false,
    });

    expect(moment.isFavorite).toBe(false);

    const toggled = await tripStorage.toggleFavoriteMoment(moment.id);
    expect(toggled.isFavorite).toBe(true);
  });

  test("calculates passport totals and stamps", async () => {
    const stats = await tripStorage.getPassportStats();
    expect(stats.totalTrips).toBeGreaterThanOrEqual(2);
    expect(stats.totalMoments).toBeGreaterThanOrEqual(5);
    expect(stats.countriesCount).toBeGreaterThanOrEqual(2);
    expect(stats.stamps).toBeDefined();
    expect(stats.stamps.length).toBeGreaterThanOrEqual(3);
  });

  test("exports and imports backup archive cleanly", async () => {
    const backupJson = await tripStorage.exportBackup();
    expect(typeof backupJson).toBe("string");
    const parsed = JSON.parse(backupJson);
    expect(parsed.appName).toBe("TripMoments");
    expect(Array.isArray(parsed.trips)).toBe(true);
    expect(Array.isArray(parsed.diaryEntries)).toBe(true);

    const success = await tripStorage.importBackup(backupJson);
    expect(success).toBe(true);
  });

  test("loads initial diary entries when storage is empty", async () => {
    const diary = await tripStorage.getDiaryEntries();
    expect(diary).toBeDefined();
    expect(diary.length).toBeGreaterThanOrEqual(1);
    expect(diary[0].mood).toBe("blown_away");
    expect(diary[0].isPrivate).toBe(true);
  });

  test("can save, retrieve, and delete diary entry", async () => {
    const entry = await tripStorage.saveDiaryEntry({
      tripId: "trip-2",
      dateKey: "2025-11-05",
      mood: "peaceful",
      text: "Early morning matcha near Gion alley with mist hanging over cedar rooftops.",
      isPrivate: true,
      linkedMomentIds: ["m-2-1"],
      factsSkeleton: "📍 Gion, Kyoto · 🌤️ 14°C Crisp · 📸 1 moment",
    });

    expect(entry.id).toBeDefined();
    expect(entry.mood).toBe("peaceful");

    const fetched = await tripStorage.getDiaryEntry("trip-2", "2025-11-05");
    expect(fetched).not.toBeNull();
    expect(fetched.text).toContain("matcha");
    expect(fetched.isPrivate).toBe(true);

    // Update entry
    const updated = await tripStorage.saveDiaryEntry({
      ...entry,
      mood: "reflective",
      isPrivate: false,
    });
    expect(updated.mood).toBe("reflective");
    expect(updated.isPrivate).toBe(false);

    // Delete entry
    await tripStorage.deleteDiaryEntry(entry.id);
    const afterDelete = await tripStorage.getDiaryEntry("trip-2", "2025-11-05");
    expect(afterDelete).toBeNull();
  });
});
