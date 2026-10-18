import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { FONTS, SHADOWS } from "../config/theme";

/**
 * City coordinates lookup table for trips without explicit GPS coordinates
 */
const CITY_COORDINATES = {
  hampi: { lat: 15.3350, lng: 76.4600 },
  kyoto: { lat: 35.0116, lng: 135.7680 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  positano: { lat: 40.6281, lng: 14.4850 },
  amalfi: { lat: 40.6340, lng: 14.6027 },
  italy: { lat: 40.6281, lng: 14.4850 },
  rome: { lat: 41.9028, lng: 12.4964 },
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  newyork: { lat: 40.7128, lng: -74.0060 },
  bali: { lat: -8.4095, lng: 115.1889 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  cairo: { lat: 30.0444, lng: 31.2357 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  santorini: { lat: 36.3932, lng: 25.4615 },
  goa: { lat: 15.2993, lng: 74.1240 },
  manali: { lat: 32.2432, lng: 77.1892 },
  ladakh: { lat: 34.1526, lng: 77.5771 },
  leh: { lat: 34.1526, lng: 77.5771 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  kerala: { lat: 9.9312, lng: 76.2673 },
};

export function getTripCoordinates(trip) {
  if (
    typeof trip?.latitude === "number" &&
    typeof trip?.longitude === "number" &&
    !isNaN(trip.latitude) &&
    !isNaN(trip.longitude)
  ) {
    return { lat: trip.latitude, lng: trip.longitude };
  }
  const cityKey = (trip?.city || "").trim().toLowerCase();
  if (CITY_COORDINATES[cityKey]) {
    return CITY_COORDINATES[cityKey];
  }
  const countryKey = (trip?.country || "").trim().toLowerCase();
  if (CITY_COORDINATES[countryKey]) {
    return CITY_COORDINATES[countryKey];
  }
  // Default to Hampi
  return { lat: 15.3350, lng: 76.4600 };
}

/**
 * InteractiveMap
 * Supports:
 * 1. 3D Interactive Travel Globe (Polarsteps style with Three.js / Globe.GL)
 *    - Real spherical Earth (no world duplication; Asia only appears once!)
 *    - 3D curved flight arcs connecting expeditions
 *    - Bouncing photo pins with pulse rings and title tags
 * 2. 2D Cartographic Map (Leaflet with noWrap)
 *    - For detail route trails and street-level exploration
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
  tileStyle = "voyager",
  flyToLocation = null,
  style,
}) => {
  const { isDark } = useTheme();
  const webViewRef = useRef(null);

  // Default to 3D Globe for trip overview, and 2D Flat Map for moments/route detail
  const [mapType, setMapType] = useState(mode === "trips" ? "globe" : "flat");

  // Synchronize mapType if mode changes externally
  useEffect(() => {
    if (mode === "moments") {
      setMapType("flat");
    }
  }, [mode]);

  const preparedTrips = useMemo(() => {
    return trips.map((t) => {
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
  }, [trips, themeColor]);

  const validMoments = useMemo(() => {
    return moments.filter(
      (m) =>
        typeof m.latitude === "number" &&
        typeof m.longitude === "number" &&
        !isNaN(m.latitude) &&
        !isNaN(m.longitude)
    );
  }, [moments]);

  const validBreadcrumbs = useMemo(() => {
    return breadcrumbs.filter(
      (b) =>
        typeof b.latitude === "number" &&
        typeof b.longitude === "number" &&
        !isNaN(b.latitude) &&
        !isNaN(b.longitude)
    );
  }, [breadcrumbs]);

  // Generate 3D Globe HTML (Three.js / Globe.gl)
  const globeHtml = useMemo(() => {
    const tripsJson = JSON.stringify(preparedTrips);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://unpkg.com/globe.gl@2.46.2/dist/globe.gl.min.js"></script>
  <style>
    html, body, #globeViz {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #0B130E;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .globe-pin {
      position: relative;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
      pointer-events: auto;
      user-select: none;
    }
    .globe-pin-bubble {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      border: 3px solid #FFFFFF;
      box-shadow: 0 6px 20px rgba(0,0,0,0.60);
      background-size: cover;
      background-position: center;
      background-color: ${themeColor};
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .pin-selected .globe-pin-bubble {
      transform: scale(1.24);
      border-color: #F59E0B;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.7);
    }
    .pulse-ring {
      position: absolute;
      top: -4px;
      left: 50%;
      margin-left: -26px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2.5px solid ${themeColor};
      animation: pulse 2s infinite ease-out;
      pointer-events: none;
    }
    @keyframes pulse {
      0% { transform: scale(0.85); opacity: 0.95; }
      100% { transform: scale(1.65); opacity: 0; }
    }
    .globe-pin-label {
      margin-top: 6px;
      background: rgba(15, 23, 42, 0.90);
      backdrop-filter: blur(6px);
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 8px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.18);
    }
  </style>
</head>
<body>
  <div id="globeViz"></div>
  <script>
    const trips = ${tripsJson};
    let activeTripId = "${activeTripId || ""}";

    // Arcs between consecutive trips
    const arcs = [];
    for (let i = 0; i < trips.length - 1; i++) {
      arcs.push({
        startLat: trips[i].latitude,
        startLng: trips[i].longitude,
        endLat: trips[i+1].latitude,
        endLng: trips[i+1].longitude,
        color: trips[i].themeColor || '#F59E0B'
      });
    }

    const postToApp = (data) => {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else {
        window.parent.postMessage(JSON.stringify(data), "*");
      }
    };

    const globe = Globe()
      .globeImageUrl('https://unpkg.com/three-globe@2.45.6/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe@2.45.6/example/img/earth-topology.png')
      .backgroundColor('rgba(11, 19, 14, 1)')
      .showAtmosphere(true)
      .atmosphereColor('#6EE7B7')
      .atmosphereAltitude(0.18)
      .arcsData(arcs)
      .arcColor(d => [d.color || '#F59E0B', '#34D399'])
      .arcAltitude(0.24)
      .arcStroke(1.8)
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(2200)
      .htmlElementsData(trips)
      .htmlLat(d => d.latitude)
      .htmlLng(d => d.longitude)
      .htmlElement(d => {
        const isSelected = d.id === activeTripId;
        const el = document.createElement('div');
        el.className = 'globe-pin ' + (isSelected ? 'pin-selected' : '');
        el.id = 'pin-' + d.id;
        
        const pulse = document.createElement('div');
        pulse.className = 'pulse-ring';
        pulse.style.borderColor = d.themeColor || '${themeColor}';
        el.appendChild(pulse);

        const bubble = document.createElement('div');
        bubble.className = 'globe-pin-bubble';
        if (d.coverUri) {
          bubble.style.backgroundImage = 'url(' + d.coverUri + ')';
        }
        bubble.style.borderColor = isSelected ? (d.themeColor || '#F59E0B') : '#FFFFFF';
        el.appendChild(bubble);

        const label = document.createElement('div');
        label.className = 'globe-pin-label';
        label.innerText = d.title;
        el.appendChild(label);

        el.onclick = () => {
          selectPin(d.id, d.latitude, d.longitude);
          postToApp({ type: 'SELECT_TRIP', tripId: d.id });
        };
        return el;
      })
      (document.getElementById('globeViz'));

    function selectPin(tripId, lat, lng) {
      activeTripId = tripId;
      document.querySelectorAll('.globe-pin').forEach(p => p.classList.remove('pin-selected'));
      const activeEl = document.getElementById('pin-' + tripId);
      if (activeEl) activeEl.classList.add('pin-selected');
      if (typeof lat === 'number' && typeof lng === 'number') {
        globe.pointOfView({ lat: lat, lng: lng, altitude: 2.1 }, 1200);
      }
    }

    // Initial camera position centered on active trip or India/Asia
    const initialTrip = trips.find(t => t.id === activeTripId) || trips[0];
    if (initialTrip) {
      globe.pointOfView({ lat: initialTrip.latitude, lng: initialTrip.longitude, altitude: 2.2 }, 0);
    } else {
      globe.pointOfView({ lat: 22.0, lng: 78.0, altitude: 2.4 }, 0);
    }

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableZoom = true;

    // Listen for flyTo messages from React
    window.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'FLY_TO_TRIP') {
          const target = trips.find(t => t.id === data.tripId);
          if (target) selectPin(target.id, target.latitude, target.longitude);
        } else if (data.type === 'FLY_TO_COORDS' && data.latitude && data.longitude) {
          globe.pointOfView({ lat: data.latitude, lng: data.longitude, altitude: data.zoom ? (12 / data.zoom) : 2.0 }, 1200);
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`;
  }, [preparedTrips, activeTripId, themeColor]);

  // Generate 2D Flat Map HTML (Leaflet with noWrap)
  const flatHtml = useMemo(() => {
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

    // Initialize Map with strict world boundaries so Asia never duplicates
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0
    });

    L.tileLayer('${activeTileUrl}', {
      maxZoom: 19,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      attribution: '${activeAttribution}'
    }).addTo(map);

    const markers = [];
    const latLngs = [];

    const postToApp = (data) => {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else {
        window.parent.postMessage(JSON.stringify(data), "*");
      }
    };

    function selectTripPin(tripId, pos) {
      activeTripId = tripId;
      document.querySelectorAll('.custom-pin').forEach(p => p.classList.remove('pin-selected'));
      const activeEl = document.getElementById('trip-pin-' + tripId);
      if (activeEl) activeEl.classList.add('pin-selected');
      if (pos) map.flyTo(pos, 6, { duration: 1.2 });
    }

    function selectMomentPin(idx) {
      document.querySelectorAll('.custom-pin').forEach(p => p.classList.remove('pin-selected'));
      const activeEl = document.getElementById('pin-' + idx);
      if (activeEl) activeEl.classList.add('pin-selected');
      if (latLngs[idx]) map.flyTo(latLngs[idx], 13, { duration: 1.0 });
    }

    if (isTripsMode) {
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
        map.fitBounds(L.latLngBounds(latLngs), { padding: [80, 80], maxZoom: 8 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 6);
      } else {
        map.setView([22.0, 78.0], 4);
      }
    } else {
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
        map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60], maxZoom: 14 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 12);
      }
    }

    // Listen for flyTo messages from React
    window.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'FLY_TO_INDEX') {
          if (typeof data.index === 'number') {
            selectMomentPin(data.index);
          }
        } else if (data.type === 'FLY_TO_TRIP') {
          const target = markers.find(m => m.id === data.tripId);
          if (target) selectTripPin(data.tripId, target.pos);
        } else if (data.type === 'FLY_TO_COORDS' && data.latitude && data.longitude) {
          map.flyTo([data.latitude, data.longitude], data.zoom || 8, { duration: 1.2 });
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`;
  }, [
    validMoments,
    validBreadcrumbs,
    preparedTrips,
    mode,
    themeColor,
    tileStyle,
    selectedIndex,
    activeTripId,
  ]);

  const activeHtml = mapType === "globe" ? globeHtml : flatHtml;

  // Two-way sync: Notify WebView when selection or flyTo updates
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
      const iframe = document.getElementById("travel-map-iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify(msg), "*");
      }
    } else if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(msg));
    }
  }, [selectedIndex, activeTripId, flyToLocation, mode, mapType]);

  // Listen for message on Web
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleWebMessage = (e) => {
        try {
          const data =
            typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (
            data &&
            data.type === "SELECT_MOMENT" &&
            typeof data.index === "number"
          ) {
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
      if (
        data.type === "SELECT_MOMENT" &&
        typeof data.index === "number"
      ) {
        onSelectMoment && onSelectMoment(data.index);
      } else if (data.type === "SELECT_TRIP" && data.tripId) {
        onSelectTrip && onSelectTrip(data.tripId);
      }
    } catch (err) {
      console.warn("[InteractiveMap] Native message parse error:", err);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === "web" ? (
        <iframe
          id="travel-map-iframe"
          title="Interactive Travel Map"
          srcDoc={activeHtml}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: activeHtml }}
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
      )}

      {/* Floating 3D Globe / 2D Map Switcher Pill */}
      {mode === "trips" && (
        <View style={styles.togglePillContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.togglePill,
              {
                backgroundColor: isDark
                  ? "rgba(18, 26, 22, 0.88)"
                  : "rgba(255, 255, 255, 0.92)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(0, 0, 0, 0.08)",
              },
              SHADOWS.md,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMapType((prev) => (prev === "globe" ? "flat" : "globe"));
            }}
            activeOpacity={0.85}
          >
            <Ionicons
              name={mapType === "globe" ? "globe" : "map"}
              size={14}
              color={themeColor}
            />
            <Text
              style={[
                FONTS.captionBold,
                { color: themeColor, fontSize: 11, marginLeft: 5 },
              ]}
            >
              {mapType === "globe" ? "3D Globe" : "2D Map"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0B130E",
    overflow: "hidden",
    zIndex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B130E",
  },
  togglePillContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 116 : 96,
    right: 18,
    zIndex: 40,
  },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
});

export default InteractiveMap;
