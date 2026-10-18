import AsyncStorage from "@react-native-async-storage/async-storage";
import syncManager from "./syncManager";

const STORAGE_KEYS = {
  TRIPS: "@trip_moments_trips_v1",
  MOMENTS: "@trip_moments_moments_v1",
  DIARY: "@trip_moments_diary_v1",
  SAVED_PLACES: "@trip_moments_saved_places_v1",
  SETTINGS: "@trip_moments_settings_v1",
};

export const INITIAL_TRIPS = [
  {
    id: "trip-1",
    title: "Golden Sunrise in Hampi",
    startDate: "2026-10-14",
    endDate: "2026-10-18",
    status: "active",
    privacy: "link_only",
    shareSlug: "hampi-golden-sunrise-2026",
    coverUri:
      "https://images.unsplash.com/photo-1600100397608-f010f4439c2e?q=80&w=1200&auto=format&fit=crop",
    themeColor: "#16845B", // Forest green
    secondaryColor: "#D97706", // Warm amber
    city: "Hampi",
    country: "India",
    notes:
      "Exploring the 14th-century Vijayanagara ruins, granite boulder hills, and ancient river crossings.",
    createdAt: "2026-10-14T05:00:00Z",
    updatedAt: "2026-10-16T18:00:00Z",
  },
  {
    id: "trip-2",
    title: "Autumn Across Tokyo & Kyoto",
    startDate: "2025-11-02",
    endDate: "2025-11-12",
    status: "completed",
    privacy: "link_only",
    shareSlug: "kyoto-autumn-momiji-2025",
    coverUri:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
    themeColor: "#BE123C", // Autumn maple red
    secondaryColor: "#1E293B", // Indigo slate
    city: "Kyoto",
    country: "Japan",
    notes:
      "Chasing momiji autumn foliage, quiet zen gardens, and evening ramen alleys.",
    createdAt: "2025-11-02T04:00:00Z",
    updatedAt: "2025-11-12T20:00:00Z",
  },
  {
    id: "trip-3",
    title: "Cliffside Romance in Amalfi",
    startDate: "2027-06-12",
    endDate: "2027-06-20",
    status: "planned",
    privacy: "private",
    shareSlug: "amalfi-cliffside-2027",
    coverUri:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1200&auto=format&fit=crop",
    themeColor: "#0284C7", // Azure sea
    secondaryColor: "#F59E0B", // Sunlit lemon
    city: "Positano",
    country: "Italy",
    notes:
      "Driving the dramatic coastline from Positano to Ravello, lemon groves, and sea caves.",
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
  },
];

export const INITIAL_MOMENTS = [
  {
    id: "m-1-1",
    tripId: "trip-1",
    takenAt: "2026-10-15T06:15:00Z",
    title: "Dawn over Virupaksha Gopuram",
    text: "First golden light illuminating the 50-meter gopuram. The temple elephant Lakshmi gave a morning blessing by the riverside as bells chimed across the ghats.",
    placeName: "Virupaksha Temple, Hampi Bazaar",
    city: "Hampi",
    country: "India",
    latitude: 15.335,
    longitude: 76.46,
    weather: { temp: 24, condition: "Sunny", icon: "sunny" },
    mediaUri:
      "https://images.unsplash.com/photo-1600100397608-f010f4439c2e?q=80&w=1000&auto=format&fit=crop",
    mediaType: "photo",
    tags: ["temple", "sunrise", "heritage"],
    isFavorite: true,
    createdAt: "2026-10-15T06:20:00Z",
    updatedAt: "2026-10-15T06:20:00Z",
  },
  {
    id: "m-1-2",
    tripId: "trip-1",
    takenAt: "2026-10-15T09:45:00Z",
    title: "Coracle Ride on the Tungabhadra",
    text: "Spinning slowly across turbulent eddies in circular woven coracles. Giant granite boulders rise vertically out of the emerald water.",
    placeName: "Tungabhadra River Ferry Point",
    city: "Hampi",
    country: "India",
    latitude: 15.3385,
    longitude: 76.4632,
    weather: { temp: 28, condition: "Clear", icon: "sunny" },
    mediaUri:
      "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?q=80&w=1000&auto=format&fit=crop",
    mediaType: "photo",
    tags: ["river", "adventure", "coracle"],
    isFavorite: false,
    createdAt: "2026-10-15T10:00:00Z",
    updatedAt: "2026-10-15T10:00:00Z",
  },
  {
    id: "m-1-3",
    tripId: "trip-1",
    takenAt: "2026-10-15T17:40:00Z",
    title: "Matanga Hill Golden Hour",
    text: "Climbed 500 steps barefoot. Reached the peak right as the sky turned molten amber, casting mile-long shadows across the ruins complex.",
    placeName: "Matanga Hill Summit",
    city: "Hampi",
    country: "India",
    latitude: 15.3318,
    longitude: 76.468,
    weather: { temp: 27, condition: "Golden Hour", icon: "partly-sunny" },
    mediaUri:
      "https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=1000&auto=format&fit=crop",
    mediaType: "photo",
    tags: ["sunset", "panorama", "hiking"],
    isFavorite: true,
    createdAt: "2026-10-15T17:50:00Z",
    updatedAt: "2026-10-15T17:50:00Z",
  },
  {
    id: "m-1-4",
    tripId: "trip-1",
    takenAt: "2026-10-16T08:30:00Z",
    title: "Clay Cup Chai in Anegundi",
    text: "Fresh ginger cardamom chai served in unglazed earthen kulhads with banana walnut crêpes at the rock climbers hangout across the river.",
    placeName: "Sanapur Lake Bouldering Cafe",
    city: "Anegundi",
    country: "India",
    latitude: 15.352,
    longitude: 76.471,
    weather: { temp: 26, condition: "Breezy", icon: "sunny" },
    mediaUri:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=1000&auto=format&fit=crop",
    mediaType: "photo",
    tags: ["chai", "food", "morning"],
    isFavorite: false,
    createdAt: "2026-10-16T08:45:00Z",
    updatedAt: "2026-10-16T08:45:00Z",
  },
  {
    id: "m-1-5",
    tripId: "trip-1",
    takenAt: "2026-10-16T15:20:00Z",
    title: "Monolithic Stone Chariot",
    text: "The iconic Garuda shrine built in the shape of an ornate processional chariot. Carved from granite blocks with interlocking joints that still amaze architects.",
    placeName: "Vittala Temple Complex",
    city: "Hampi",
    country: "India",
    latitude: 15.3402,
    longitude: 76.477,
    weather: { temp: 31, condition: "Sunny", icon: "sunny" },
    mediaUri:
      "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=1000&auto=format&fit=crop",
    mediaType: "photo",
    tags: ["unesco", "architecture", "history"],
    isFavorite: true,
    createdAt: "2026-10-16T15:35:00Z",
    updatedAt: "2026-10-16T15:35:00Z",
  },
  {
    id: "m-2-1",
    tripId: "trip-2",
    takenAt: "2025-11-04T17:15:00Z",
    title: "Tunnel of Vermilion Torii Gates",
    text: "Wandering through the endless red tunnels of Fushimi Inari. Small stone fox guardians wearing red bibs in the misty mountain pine grove.",
    placeName: "Fushimi Inari Taisha, Kyoto",
    city: "Kyoto",
    country: "Japan",
    latitude: 34.9671,
    longitude: 135.7727,
    weather: { temp: 15, condition: "Misty", icon: "cloudy" },
    mediaUri:
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop",
    mediaType: "photo",
    tags: ["kyoto", "torii", "japan"],
    isFavorite: true,
    createdAt: "2025-11-04T17:30:00Z",
    updatedAt: "2025-11-04T17:30:00Z",
  },
  {
    id: "m-2-2",
    tripId: "trip-2",
    takenAt: "2025-11-06T12:00:00Z",
    title: "Omoide Yokocho Ramen Counter",
    text: "Tucked into Memory Lane under the train tracks. Steaming tonkotsu broth with charred chashu and pickled bamboo shoots in a four-seat wooden stall.",
    placeName: "Shinjuku Memory Lane, Tokyo",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.6938,
    longitude: 139.6999,
    weather: { temp: 17, condition: "Crisp", icon: "sunny" },
    mediaUri:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=1000&auto=format&fit=crop",
    mediaType: "photo",
    tags: ["tokyo", "food", "ramen"],
    isFavorite: false,
    createdAt: "2025-11-06T12:20:00Z",
    updatedAt: "2025-11-06T12:20:00Z",
  },
  {
    id: "m-2-3",
    tripId: "trip-2",
    takenAt: "2025-11-08T07:45:00Z",
    title: "Arashiyama Bamboo Sanctuary",
    text: "Arrived just after dawn before any crowds. The sound of thousands of towering bamboo stalks swaying in the early mountain breeze is unforgettable.",
    placeName: "Arashiyama Bamboo Grove",
    city: "Kyoto",
    country: "Japan",
    latitude: 35.0165,
    longitude: 135.6713,
    weather: { temp: 13, condition: "Chilly", icon: "cloudy" },
    mediaUri:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=1000&auto=format&fit=crop",
    mediaType: "photo",
    tags: ["nature", "kyoto", "peace"],
    isFavorite: true,
    createdAt: "2025-11-08T08:00:00Z",
    updatedAt: "2025-11-08T08:00:00Z",
  },
];

export const DIARY_MOODS = [
  { id: "adventurous", label: "Adventurous", emoji: "🥾", color: "#16845B" },
  { id: "peaceful", label: "Peaceful", emoji: "🧘", color: "#0284C7" },
  { id: "joyful", label: "Joyful", emoji: "😊", color: "#D97706" },
  { id: "blown_away", label: "Blown Away", emoji: "🤯", color: "#7C3AED" },
  { id: "exhausted", label: "Exhausted", emoji: "😴", color: "#64748B" },
  { id: "reflective", label: "Reflective", emoji: "✨", color: "#E11D48" },
];

export const DIARY_STARTER_PROMPTS = [
  "🍽️ The best thing I ate today was...",
  "🤝 Someone memorable I met was...",
  "✨ Something that completely surprised me was...",
  "🌅 My favorite quiet moment was...",
  "🎒 What I learned or discovered today...",
  "👣 Where my feet wandered when I got lost...",
];

export const INITIAL_DIARY_ENTRIES = [
  {
    id: "diary-1-2026-10-15",
    tripId: "trip-1",
    dateKey: "2026-10-15",
    mood: "blown_away",
    text:
      "Woke up at 5:30 AM before the sun cleared the boulder ridge. The temple elephant Lakshmi stepped into the river ghats right as the gopuram caught its first golden ray—a sight that makes you forget time exists.\n\nClimbing Matanga Hill in the late afternoon felt like ascending another planet. Granite boulders balancing on each other for miles, glowing in molten copper light. Met a local flutist playing near the summit pavilion; the melody drifted all the way across the Tungabhadra.",
    linkedMomentIds: ["m-1-1", "m-1-2", "m-1-3"],
    isPrivate: true,
    tags: ["sunrise", "matanga", "peace"],
    factsSkeleton: "📍 Hampi Bazaar & Matanga Hill · 🌤️ 27°C Golden Hour · 📸 3 moments · 🚶 ~2.8 km traveled",
    audioUri: null,
    createdAt: "2026-10-15T19:30:00Z",
    updatedAt: "2026-10-15T19:30:00Z",
    deletedAt: null,
  },
];


// Helper: Calculate great-circle distance between two GPS points in kilometers
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Storage Service API
export const tripStorage = {
  async getTrips() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRIPS);
      if (!data) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.TRIPS,
          JSON.stringify(INITIAL_TRIPS)
        );
        return INITIAL_TRIPS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("[tripStorage] Error loading trips", e);
      return INITIAL_TRIPS;
    }
  },

  async saveTrips(trips) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
      return trips;
    } catch (e) {
      console.error("[tripStorage] Error saving trips", e);
      throw e;
    }
  },

  async getMoments() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MOMENTS);
      if (!data) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.MOMENTS,
          JSON.stringify(INITIAL_MOMENTS)
        );
        return INITIAL_MOMENTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("[tripStorage] Error loading moments", e);
      return INITIAL_MOMENTS;
    }
  },

  async saveMoments(moments) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MOMENTS, JSON.stringify(moments));
      return moments;
    } catch (e) {
      console.error("[tripStorage] Error saving moments", e);
      throw e;
    }
  },

  async addTrip(trip) {
    const trips = await this.getTrips();
    const cleanTitle = (trip?.title || "trip")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const newTrip = {
      ...trip,
      id: trip?.id || `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      privacy: trip?.privacy || "link_only",
      shareSlug: trip?.shareSlug || `${cleanTitle}-${Math.random().toString(36).substring(2, 6)}`,
      status: trip?.status || "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newTrip, ...trips];
    await this.saveTrips(updated);
    try {
      await syncManager.enqueue("trip", "create", newTrip);
    } catch (e) {
      // offline outbox handled internally
    }
    return newTrip;
  },

  async updateTrip(id, changes) {
    const trips = await this.getTrips();
    const updated = trips.map((t) =>
      t.id === id ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t
    );
    await this.saveTrips(updated);
    const updatedTrip = updated.find((t) => t.id === id);
    if (updatedTrip) {
      try {
        await syncManager.enqueue("trip", "update", updatedTrip);
      } catch (e) {}
    }
    return updatedTrip;
  },

  async deleteTrip(id) {
    const trips = await this.getTrips();
    const updatedTrips = trips.filter((t) => t.id !== id);
    await this.saveTrips(updatedTrips);

    // Also delete associated moments
    const moments = await this.getMoments();
    const updatedMoments = moments.filter((m) => m.tripId !== id);
    await this.saveMoments(updatedMoments);

    // Also delete associated diary entries
    const diaryEntries = await this.getDiaryEntries();
    const updatedDiary = diaryEntries.filter((d) => d.tripId !== id);
    await this.saveDiaryEntries(updatedDiary);

    try {
      await syncManager.enqueue("trip", "delete", { id });
    } catch (e) {}

    return true;
  },

  async addMoment(moment) {
    const moments = await this.getMoments();
    const newMoment = {
      ...moment,
      id: moment?.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      takenAt: moment?.takenAt || new Date().toISOString(),
      mediaType: moment?.mediaType || "photo",
      isFavorite: Boolean(moment?.isFavorite),
      tags: moment?.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newMoment, ...moments];
    await this.saveMoments(updated);
    try {
      await syncManager.enqueue("moment", "create", newMoment);
    } catch (e) {}
    return newMoment;
  },

  async updateMoment(id, changes) {
    const moments = await this.getMoments();
    const updated = moments.map((m) =>
      m.id === id ? { ...m, ...changes, updatedAt: new Date().toISOString() } : m
    );
    await this.saveMoments(updated);
    const updatedMoment = updated.find((m) => m.id === id);
    if (updatedMoment) {
      try {
        await syncManager.enqueue("moment", "update", updatedMoment);
      } catch (e) {}
    }
    return updatedMoment;
  },

  async deleteMoment(id) {
    const moments = await this.getMoments();
    const updated = moments.filter((m) => m.id !== id);
    await this.saveMoments(updated);
    try {
      await syncManager.enqueue("moment", "delete", { id });
    } catch (e) {}
    return true;
  },

  async toggleFavoriteMoment(id) {
    const moments = await this.getMoments();
    const updated = moments.map((m) =>
      m.id === id ? { ...m, isFavorite: !m.isFavorite, updatedAt: new Date().toISOString() } : m
    );
    await this.saveMoments(updated);
    return updated.find((m) => m.id === id);
  },

  async getPassportStats() {
    const trips = await this.getTrips();
    const moments = await this.getMoments();

    const countries = new Set();
    const cities = new Set();
    let totalDistanceKm = 0;

    trips.forEach((t) => {
      if (t.country) countries.add(t.country);
      if (t.city) cities.add(t.city);
    });

    moments.forEach((m) => {
      if (m.country) countries.add(m.country);
      if (m.city) cities.add(m.city);
    });

    // Approximate distance between consecutive moments in trips
    trips.forEach((trip) => {
      const tripMoments = moments
        .filter((m) => m.tripId === trip.id && m.latitude && m.longitude)
        .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));

      for (let i = 1; i < tripMoments.length; i++) {
        const d = calculateDistanceKm(
          tripMoments[i - 1].latitude,
          tripMoments[i - 1].longitude,
          tripMoments[i].latitude,
          tripMoments[i].longitude
        );
        totalDistanceKm += d;
      }
    });

    // Base km calculation for completed trips
    totalDistanceKm = Math.max(Math.round(totalDistanceKm), 360);

    const stamps = [
      {
        id: "stamp-hampi",
        title: "Hampi Heritage",
        category: "Ancient UNESCO",
        city: "Hampi",
        country: "India",
        earned: moments.some((m) => m.city?.toLowerCase().includes("hampi")),
        date: "OCT 2026",
      },
      {
        id: "stamp-kyoto",
        title: "Torii Sanctuary",
        category: "Zen Pathway",
        city: "Kyoto",
        country: "Japan",
        earned: moments.some((m) => m.city?.toLowerCase().includes("kyoto")),
        date: "NOV 2025",
      },
      {
        id: "stamp-sunrise",
        title: "Dawn Walker",
        category: "Golden Hour Trail",
        city: "Multiple",
        country: "World",
        earned: moments.filter((m) => m.tags?.includes("sunrise") || m.isFavorite).length >= 2,
        date: "OCT 2026",
      },
      {
        id: "stamp-storyteller",
        title: "Master Chronicler",
        category: "5+ Story Moments",
        city: "Wanderer",
        country: "Global",
        earned: moments.length >= 5,
        date: "2026",
      },
    ];

    return {
      totalTrips: trips.length,
      totalMoments: moments.length,
      countriesCount: countries.size,
      citiesCount: cities.size,
      totalDistanceKm,
      stamps,
      countriesList: Array.from(countries),
      citiesList: Array.from(cities),
    };
  },

  // Diary Service Methods
  async getDiaryEntries(tripId = null) {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DIARY);
      let entries = INITIAL_DIARY_ENTRIES;
      if (data) {
        entries = JSON.parse(data);
      } else {
        await AsyncStorage.setItem(
          STORAGE_KEYS.DIARY,
          JSON.stringify(INITIAL_DIARY_ENTRIES)
        );
      }
      if (tripId) {
        return entries.filter((e) => e.tripId === tripId && !e.deletedAt);
      }
      return entries.filter((e) => !e.deletedAt);
    } catch (e) {
      console.error("[tripStorage] Error loading diary entries", e);
      return INITIAL_DIARY_ENTRIES;
    }
  },

  async getDiaryEntry(tripId, dateKey) {
    const entries = await this.getDiaryEntries(tripId);
    return entries.find((e) => e.tripId === tripId && e.dateKey === dateKey && !e.deletedAt) || null;
  },

  async saveDiaryEntries(entries) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(entries));
      return entries;
    } catch (e) {
      console.error("[tripStorage] Error saving diary entries", e);
      throw e;
    }
  },

  async saveDiaryEntry(entry) {
    const rawData = await AsyncStorage.getItem(STORAGE_KEYS.DIARY);
    const entries = rawData ? JSON.parse(rawData) : [...INITIAL_DIARY_ENTRIES];

    const existingIndex = entries.findIndex(
      (e) => (entry.id && e.id === entry.id) || (e.tripId === entry.tripId && e.dateKey === entry.dateKey)
    );

    let saved;
    if (existingIndex >= 0) {
      saved = {
        ...entries[existingIndex],
        ...entry,
        updatedAt: new Date().toISOString(),
      };
      entries[existingIndex] = saved;
    } else {
      saved = {
        id: entry.id || `diary-${entry.tripId}-${entry.dateKey}-${Date.now().toString(36)}`,
        tripId: entry.tripId,
        dateKey: entry.dateKey,
        text: entry.text || "",
        mood: entry.mood || "adventurous",
        linkedMomentIds: entry.linkedMomentIds || [],
        isPrivate: entry.isPrivate !== undefined ? entry.isPrivate : true,
        tags: entry.tags || [],
        audioUri: entry.audioUri || null,
        factsSkeleton: entry.factsSkeleton || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };
      entries.unshift(saved);
    }

    await this.saveDiaryEntries(entries);
    try {
      await syncManager.enqueue("diary", existingIndex >= 0 ? "update" : "create", saved);
    } catch (e) {}
    return saved;
  },

  async deleteDiaryEntry(id) {
    const rawData = await AsyncStorage.getItem(STORAGE_KEYS.DIARY);
    const entries = rawData ? JSON.parse(rawData) : [...INITIAL_DIARY_ENTRIES];
    const updated = entries.map((e) =>
      e.id === id ? { ...e, deletedAt: new Date().toISOString() } : e
    );
    await this.saveDiaryEntries(updated);
    try {
      await syncManager.enqueue("diary", "delete", { id });
    } catch (e) {}
    return true;
  },

  async exportBackup() {
    const trips = await this.getTrips();
    const moments = await this.getMoments();
    const diaryEntries = await this.getDiaryEntries();
    return JSON.stringify(
      {
        version: "1.1",
        appName: "TripMoments",
        exportedAt: new Date().toISOString(),
        trips,
        moments,
        diaryEntries,
      },
      null,
      2
    );
  },

  async importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.trips)) {
        await this.saveTrips(data.trips);
      }
      if (Array.isArray(data.moments)) {
        await this.saveMoments(data.moments);
      }
      if (Array.isArray(data.diaryEntries)) {
        await this.saveDiaryEntries(data.diaryEntries);
      }
      return true;
    } catch (e) {
      console.error("[tripStorage] Failed to import backup", e);
      throw new Error("Invalid backup file format");
    }
  },

  async resetToDefaults() {
    await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(INITIAL_TRIPS));
    await AsyncStorage.setItem(STORAGE_KEYS.MOMENTS, JSON.stringify(INITIAL_MOMENTS));
    await AsyncStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(INITIAL_DIARY_ENTRIES));
    return true;
  },
};

export default tripStorage;
