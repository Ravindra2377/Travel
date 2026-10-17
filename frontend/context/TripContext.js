import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import tripStorage, { INITIAL_TRIPS, INITIAL_MOMENTS } from "../services/tripStorage";

export const TripContext = createContext(null);

export const TripProvider = ({ children }) => {
  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [activeTrip, setActiveTrip] = useState(INITIAL_TRIPS[0]);
  const [moments, setMoments] = useState(INITIAL_MOMENTS);
  const [passportStats, setPassportStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const loadedTrips = await tripStorage.getTrips();
      const loadedMoments = await tripStorage.getMoments();
      const stats = await tripStorage.getPassportStats();

      setTrips(loadedTrips);
      setMoments(loadedMoments);
      setPassportStats(stats);

      // Select active trip: either current activeTrip if still exists, or first with status "active", or first trip
      setActiveTrip((prev) => {
        if (prev && loadedTrips.find((t) => t.id === prev.id)) {
          return loadedTrips.find((t) => t.id === prev.id);
        }
        const foundActive = loadedTrips.find((t) => t.status === "active");
        return foundActive || loadedTrips[0] || null;
      });
    } catch (err) {
      console.error("[TripContext] Error loading trip data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const addTrip = async (tripData) => {
    const newTrip = await tripStorage.addTrip(tripData);
    await loadAllData();
    setActiveTrip(newTrip);
    return newTrip;
  };

  const updateTrip = async (id, changes) => {
    const updated = await tripStorage.updateTrip(id, changes);
    await loadAllData();
    return updated;
  };

  const deleteTrip = async (id) => {
    await tripStorage.deleteTrip(id);
    await loadAllData();
  };

  const addMoment = async (momentData) => {
    const targetTripId = momentData.tripId || activeTrip?.id || (trips[0] && trips[0].id);
    const newMoment = await tripStorage.addMoment({
      ...momentData,
      tripId: targetTripId,
    });
    await loadAllData();
    return newMoment;
  };

  const updateMoment = async (id, changes) => {
    const updated = await tripStorage.updateMoment(id, changes);
    await loadAllData();
    return updated;
  };

  const deleteMoment = async (id) => {
    await tripStorage.deleteMoment(id);
    await loadAllData();
  };

  const toggleFavoriteMoment = async (id) => {
    const updated = await tripStorage.toggleFavoriteMoment(id);
    await loadAllData();
    return updated;
  };

  const exportBackup = async () => {
    return await tripStorage.exportBackup();
  };

  const importBackup = async (jsonString) => {
    const success = await tripStorage.importBackup(jsonString);
    if (success) {
      await loadAllData();
    }
    return success;
  };

  const resetAllData = async () => {
    await tripStorage.resetToDefaults();
    await loadAllData();
  };

  const getMomentsForTrip = useCallback(
    (tripId) => {
      const id = tripId || activeTrip?.id;
      return moments
        .filter((m) => m.tripId === id)
        .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));
    },
    [moments, activeTrip]
  );

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        setActiveTrip,
        moments,
        passportStats,
        loading,
        refreshData: loadAllData,
        getMomentsForTrip,
        addTrip,
        updateTrip,
        deleteTrip,
        addMoment,
        updateMoment,
        deleteMoment,
        toggleFavoriteMoment,
        exportBackup,
        importBackup,
        resetAllData,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTrips must be used within a TripProvider");
  }
  return context;
};

export default TripContext;
