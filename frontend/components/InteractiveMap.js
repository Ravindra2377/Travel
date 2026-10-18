import React, { useMemo, useRef, useEffect } from "react";
import { View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

/**
 * City coordinates lookup table for trips without explicit GPS coordinates
 */
const CITY_COORDINATES = {
  hampi: { lat: 15.3350, lng: 76.4600 },
  kyoto: { lat: 35.0116, lng: 135.7680 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  goa: { lat: 15.2993, lng: 74.1240 },
  manali: { lat: 32.2432, lng: 77.1892 },
  ladakh: { lat: 34.1526, lng: 77.5771 },
  leh: { lat: 34.1526, lng: 77.5771 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  kerala: { lat: 9.9312, lng: 76.2673 },
  paris: { lat: 48.8566, lng: 2.3522 },
  rome: { lat: 41.9028, lng: 12.4964 },
};

export function getTripCoordinates(trip) {
  if (typeof trip?.latitude === "number" && typeof trip?.longitude === "number") {
    return { lat: trip.latitude, lng: trip.longitude };
  }
  const cityKey = (trip?.city || "").trim().toLowerCase();
  if (CITY_COORDINATES[cityKey]) {
    return CITY_COORDINATES[cityKey];
  }
  // Fallback defaults
  return { lat: 15.3350, lng: 76.4600 };
}

/**
 * InteractiveMap
 * High-performance real geographic tile map using Leaflet.
 * Features:
 * - Camera flyTo animations with smooth easing
 * - Progressive animated route drawing
 * - Bouncing pin drop animations
 * - Dual mode: Trip Expedition Pins (Home) or Moment Stops & Route (Detail)
 * - Multi-layer tiles (Carto Voyager, OpenStreetMap, Esri Satellite)
 */
export const InteractiveMap = ({
  moments = [],
  breadcrumbs = [],
  trips = [],
  mode = "moments", // "moments" | "trips"
  selectedIndex = 0,
  activeTripId = null,
  onSelectMoment,
  onSelectTrip,
  themeColor = "#16845B",
  tileStyle = "voyager", // "voyager" | "osm" | "satellite"
  flyToLocation = null,  // { latitude, longitude, zoom }
  style,
}) => {
  const webViewRef = useRef(null);

  // Generate HTML payload for Leaflet
  const mapHtml = useMemo(() => {
    const validMoments = moments.filter(
      (m) =>
        typeof m.latitude === "number" &&
        typeof m.longitude === "number" &&
        !isNaN(m.latitude) &&
        !isNaN(m.longitude)
    );

    const validBreadcrumbs = breadcrumbs.filter(
      (b) =>
        typeof b.latitude === "number" &&
        typeof b.longitude === "number" &&
        !isNaN(b.latitude) &&
        !isNaN(b.longitude)
    );

    const preparedTrips = trips.map((t) => {
      const coords = getTripCoordinates(t);
      return {
        id: t.id,
        title: t.title,
        city: t.city,
        country: t.country,
        coverUri: t.coverUri,
        themeColor: t.themeColor || themeColor,
        latitude: coords.lat,
        longitude: coords.lng,
      };
    });

    const momentsJson = JSON.stringify(validMoments);
    const breadcrumbsJson = JSON.stringify(validBreadcrumbs);
    const tripsJson = JSON.stringify(preparedTrips);

    const tileUrls = {
      voyager:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      topo:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      natgeo:
        "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
      satellite:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      osm:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    };

    const tileAttributions = {
      voyager: "Tiles &copy; Esri &mdash; Street Map",
      topo: "Tiles &copy; Esri &mdash; Topo Map",
      natgeo: "Tiles &copy; Esri &mdash; NatGeo World Map",
      satellite: "Tiles &copy; Esri &mdash; Satellite Imagery",
      osm: "Tiles &copy; Esri",
    };

    const activeTileUrl = tileUrls[tileStyle] || tileUrls.voyager;
    const activeAttribution =
      tileAttributions[tileStyle] || tileAttributions.voyager;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #E8ECE9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .custom-pin {
      position: relative;
      cursor: pointer;
      animation: pinDrop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    }
    @keyframes pinDrop {
      0% { transform: translateY(-28px); opacity: 0; }
      70% { transform: translateY(3px); }
      100% { transform: translateY(0); opacity: 1; }
    }
    .pin-bubble {
      width: 38px;
      height: 38px;
      border-radius: 19px;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      background-size: cover;
      background-position: center;
      background-color: ${themeColor};
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .trip-pin-bubble {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      border: 3px solid #FFFFFF;
      box-shadow: 0 6px 18px rgba(0,0,0,0.40);
      background-size: cover;
      background-position: center;
      background-color: ${themeColor};
    }
    .pin-selected .pin-bubble,
    .pin-selected .trip-pin-bubble {
      transform: scale(1.22);
      border-color: ${themeColor};
      box-shadow: 0 8px 24px rgba(0,0,0,0.50);
    }
    .pulse-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      border: 2px solid ${themeColor};
      opacity: 0;
      pointer-events: none;
    }
    .pin-selected .pulse-ring {
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .pin-label {
      position: absolute;
      bottom: -18px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(4px);
      color: #FFF;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    /* Animated progressive route line */
    .animated-route-line {
      stroke-dasharray: 10, 10;
      animation: dash 20s linear infinite;
    }
    @keyframes dash {
      to {
        stroke-dashoffset: -1000;
      }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const isTripsMode = "${mode}" === "trips";
    const moments = ${momentsJson};
    const breadcrumbs = ${breadcrumbsJson};
    const trips = ${tripsJson};
    const themeColor = "${themeColor}";
    let initialIndex = ${selectedIndex};
    let activeTripId = "${activeTripId || ""}";

    // Initialize Map
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('${activeTileUrl}', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '${activeAttribution}'
    }).addTo(map);

    const markers = [];
    const latLngs = [];

    if (isTripsMode) {
      // ── TRIPS MAP SHELL MODE ──────────────────────────────────────────
      trips.forEach((t, idx) => {
        const pos = [t.latitude, t.longitude];
        latLngs.push(pos);

        const isSelected = t.id === activeTripId || (idx === 0 && !activeTripId);
        const bgImg = t.coverUri ? 'background-image: url(' + t.coverUri + ');' : '';
        const pinHtml = '<div class="custom-pin ' + (isSelected ? 'pin-selected' : '') + '" id="trip-pin-' + t.id + '" style="animation-delay: ' + (idx * 0.08) + 's;">' +
          '<div class="pulse-ring" style="border-color: ' + t.themeColor + ';"></div>' +
          '<div class="trip-pin-bubble" style="' + bgImg + '"></div>' +
          '<div class="pin-label">' + t.title + '</div>' +
          '</div>';

        const icon = L.divIcon({
          className: '',
          html: pinHtml,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker(pos, { icon: icon }).addTo(map);
        marker.on('click', () => {
          selectTripPin(t.id, pos);
          postToApp({ type: 'SELECT_TRIP', tripId: t.id });
        });
        markers.push({ id: t.id, marker: marker, pos: pos });
      });

      if (latLngs.length > 1) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [80, 80], maxZoom: 12 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 11);
      } else {
        map.setView([20.5937, 78.9629], 5);
      }
    } else {
      // ── MOMENTS & ROUTE DETAIL MODE ──────────────────────────────────
      if (breadcrumbs && breadcrumbs.length > 1) {
        const trailPoints = breadcrumbs.map(b => [b.latitude, b.longitude]);
        L.polyline(trailPoints, {
          color: '#F59E0B',
          weight: 3,
          opacity: 0.85,
          dashArray: '6, 6'
        }).addTo(map);
      }

      moments.forEach((m, idx) => {
        const pos = [m.latitude, m.longitude];
        latLngs.push(pos);

        const bgImg = m.mediaUri ? 'background-image: url(' + m.mediaUri + ');' : '';
        const pinHtml = '<div class="custom-pin ' + (idx === initialIndex ? 'pin-selected' : '') + '" id="pin-' + idx + '" style="animation-delay: ' + (idx * 0.06) + 's;">' +
          '<div class="pulse-ring"></div>' +
          '<div class="pin-bubble" style="' + bgImg + '"></div>' +
          '<div class="pin-label">' + (m.placeName || m.city || 'Stop ' + (idx + 1)) + '</div>' +
          '</div>';

        const icon = L.divIcon({
          className: '',
          html: pinHtml,
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });

        const marker = L.marker(pos, { icon: icon }).addTo(map);
        marker.on('click', () => {
          selectMomentPin(idx);
          postToApp({ type: 'SELECT_MOMENT', index: idx });
        });
        markers.push(marker);
      });

      if (latLngs.length > 1) {
        // Smooth animated route polyline
        const poly = L.polyline(latLngs, {
          color: themeColor,
          weight: 4.5,
          opacity: 0.9,
          className: 'animated-route-line',
          smoothFactor: 1
        }).addTo(map);
        map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60], maxZoom: 15 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 13);
      } else {
        map.setView([15.3350, 76.4600], 12);
      }
    }

    function selectMomentPin(idx) {
      markers.forEach((m, i) => {
        const el = document.getElementById('pin-' + i);
        if (el) {
          if (i === idx) {
            el.classList.add('pin-selected');
          } else {
            el.classList.remove('pin-selected');
          }
        }
      });
      if (markers[idx] && markers[idx].getLatLng) {
        map.flyTo(markers[idx].getLatLng(), Math.max(map.getZoom(), 14), {
          duration: 1.0,
          easeLinearity: 0.25
        });
      }
    }

    function selectTripPin(tripId, pos) {
      trips.forEach(t => {
        const el = document.getElementById('trip-pin-' + t.id);
        if (el) {
          if (t.id === tripId) {
            el.classList.add('pin-selected');
          } else {
            el.classList.remove('pin-selected');
          }
        }
      });
      if (pos) {
        map.flyTo(pos, 11, { duration: 1.2 });
      }
    }

    function postToApp(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      } else if (window.parent) {
        window.parent.postMessage(JSON.stringify(msg), '*');
      }
    }

    // Listen for flyTo messages from React
    window.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'FLY_TO_INDEX') {
          selectMomentPin(data.index);
        } else if (data.type === 'FLY_TO_TRIP') {
          const target = markers.find(m => m.id === data.tripId);
          if (target) selectTripPin(data.tripId, target.pos);
        } else if (data.type === 'FLY_TO_COORDS' && data.latitude && data.longitude) {
          map.flyTo([data.latitude, data.longitude], data.zoom || 11, { duration: 1.2 });
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`;
  }, [moments, breadcrumbs, trips, mode, themeColor, tileStyle, selectedIndex, activeTripId]);

  // Two-way sync: Notify Leaflet map when selection or flyTo updates
  useEffect(() => {
    const msg =
      mode === "trips"
        ? activeTripId
          ? { type: "FLY_TO_TRIP", tripId: activeTripId }
          : flyToLocation
          ? { type: "FLY_TO_COORDS", ...flyToLocation }
          : null
        : { type: "FLY_TO_INDEX", index: selectedIndex };

    if (!msg) return;

    if (Platform.OS === "web") {
      const iframe = document.getElementById("leaflet-map-iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify(msg), "*");
      }
    } else if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(msg));
    }
  }, [selectedIndex, activeTripId, flyToLocation, mode]);

  // Listen for message on Web
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleWebMessage = (e) => {
        try {
          const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (data && data.type === "SELECT_MOMENT" && typeof data.index === "number") {
            onSelectMoment && onSelectMoment(data.index);
          } else if (data && data.type === "SELECT_TRIP" && data.tripId) {
            onSelectTrip && onSelectTrip(data.tripId);
          }
        } catch (err) {}
      };
      window.addEventListener("message", handleWebMessage);
      return () => window.removeEventListener("message", handleWebMessage);
    }
  }, [onSelectMoment, onSelectTrip]);

  const handleNativeMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "SELECT_MOMENT" && typeof data.index === "number") {
        onSelectMoment && onSelectMoment(data.index);
      } else if (data.type === "SELECT_TRIP" && data.tripId) {
        onSelectTrip && onSelectTrip(data.tripId);
      }
    } catch (err) {
      console.warn("[InteractiveMap] Native message parse error:", err);
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, style]}>
        <iframe
          id="leaflet-map-iframe"
          title="Interactive Travel Map"
          srcDoc={mapHtml}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        style={styles.webView}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={handleNativeMessage}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={themeColor} />
          </View>
        )}
        startInLoadingState
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E8ECE9",
    overflow: "hidden",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8ECE9",
  },
});

export default InteractiveMap;
