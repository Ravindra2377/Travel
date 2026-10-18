import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackingService } from "../trackingService";
import { photoStorage } from "../photoStorage";

describe("trackingService", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("initializes with isTracking false", () => {
    expect(trackingService.isTracking).toBe(false);
    expect(trackingService.currentTripId).toBeNull();
  });

  test("can record and retrieve breadcrumbs by tripId", async () => {
    const p1 = {
      id: "pt-1",
      tripId: "trip-1",
      latitude: 15.335,
      longitude: 76.46,
      timestamp: Date.now(),
    };
    const p2 = {
      id: "pt-2",
      tripId: "trip-2",
      latitude: 35.0116,
      longitude: 135.768,
      timestamp: Date.now(),
    };

    await trackingService.recordBreadcrumb(p1);
    await trackingService.recordBreadcrumb(p2);

    const trip1Points = await trackingService.getBreadcrumbs("trip-1");
    expect(trip1Points.length).toBe(1);
    expect(trip1Points[0].latitude).toBe(15.335);

    const allPoints = await trackingService.getBreadcrumbs();
    expect(allPoints.length).toBe(2);
  });

  test("subscribers receive tracking state changes", () => {
    const states = [];
    const unsubscribe = trackingService.subscribe((state) => {
      states.push({ ...state });
    });

    expect(states.length).toBe(1);
    expect(states[0].isTracking).toBe(false);

    unsubscribe();
  });
});

describe("photoStorage", () => {
  test("returns remote URLs as-is without copying", async () => {
    const httpUrl = "https://images.unsplash.com/photo-1600100397608";
    const result = await photoStorage.persistPhoto(httpUrl);
    expect(result).toBe(httpUrl);
  });

  test("returns data URIs as-is", async () => {
    const dataUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD";
    const result = await photoStorage.persistPhoto(dataUri);
    expect(result).toBe(dataUri);
  });

  test("handles null gracefully", async () => {
    const result = await photoStorage.persistPhoto(null);
    expect(result).toBeNull();
  });
});
