import React, { useMemo, useRef, useEffect } from "react";
import { View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

/**
 * InteractiveMap
 * High-performance real geographic map using Leaflet and Carto Voyager / OpenStreetMap tiles.
 * Works seamlessly across Web (via iframe / WebView) and iOS/Android.
 */
export const InteractiveMap = ({
  moments = [],
  breadcrumbs = [],
  selectedIndex = 0,
  onSelectMoment,
  themeColor = "#16845B",
  tileStyle = "voyager", // "voyager" | "osm" | "satellite"
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

    const momentsJson = JSON.stringify(validMoments);
    const breadcrumbsJson = JSON.stringify(validBreadcrumbs);

    const tileUrls = {
      voyager:
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      osm: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      satellite:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    const tileAttributions = {
      voyager: "&copy; OpenStreetMap &copy; CARTO",
      osm: "&copy; OpenStreetMap contributors",
      satellite: "Tiles &copy; Esri",
    };

    const activeTileUrl = tileUrls[tileStyle] || tileUrls.voyager;
    const activeAttribution = tileAttributions[tileStyle] || tileAttributions.voyager;

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
    }
    .pin-bubble {
      width: 38px;
      height: 38px;
      border-radius: 19px;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      background-size: cover;
      background-position: center;
      background-color: ${themeColor};
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .pin-selected .pin-bubble {
      transform: scale(1.22);
      border-color: ${themeColor};
      box-shadow: 0 6px 18px rgba(0,0,0,0.45);
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
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      padding: 4px;
    }
    .popup-card {
      font-size: 12px;
    }
    .popup-title {
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 2px;
    }
    .popup-meta {
      color: #64748B;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const moments = ${momentsJson};
    const breadcrumbs = ${breadcrumbsJson};
    const themeColor = "${themeColor}";
    let initialIndex = ${selectedIndex};

    // Initialize Map
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('${activeTileUrl}', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '${activeAttribution}'
    }).addTo(map);

    const markers = [];
    const latLngs = [];

    // Add GPS Breadcrumb trail if available (continuous recorder route)
    if (breadcrumbs && breadcrumbs.length > 1) {
      const trailPoints = breadcrumbs.map(b => [b.latitude, b.longitude]);
      L.polyline(trailPoints, {
        color: '#F59E0B',
        weight: 3,
        opacity: 0.85,
        dashArray: '6, 6'
      }).addTo(map);
    }

    // Connect moments with a styled polyline
    validMoments = moments.filter(m => m.latitude && m.longitude);
    validMoments.forEach((m, idx) => {
      const pos = [m.latitude, m.longitude];
      latLngs.push(pos);

      // Create Custom HTML Pin
      const bgImg = m.mediaUri ? 'background-image: url(' + m.mediaUri + ');' : '';
      const pinHtml = '<div class="custom-pin ' + (idx === initialIndex ? 'pin-selected' : '') + '" id="pin-' + idx + '">' +
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
        selectPin(idx);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_MOMENT', index: idx }));
        } else if (window.parent) {
          window.parent.postMessage(JSON.stringify({ type: 'SELECT_MOMENT', index: idx }), '*');
        }
      });
      markers.push(marker);
    });

    if (latLngs.length > 1) {
      // Smooth connecting route line
      L.polyline(latLngs, {
        color: themeColor,
        weight: 4,
        opacity: 0.85,
        smoothFactor: 1
      }).addTo(map);
    }

    // Fit map bounds
    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([15.3350, 76.4600], 12);
    }

    function selectPin(idx) {
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
      if (markers[idx]) {
        map.flyTo(markers[idx].getLatLng(), Math.max(map.getZoom(), 14), {
          duration: 0.8
        });
      }
    }

    // Listen for flyTo messages from React
    window.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'FLY_TO_INDEX') {
          selectPin(data.index);
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`;
  }, [moments, breadcrumbs, themeColor, tileStyle, selectedIndex]);

  // When selectedIndex updates from parent (e.g. carousel scrub), inform webview
  useEffect(() => {
    if (Platform.OS === "web") {
      // In web iframe, post message
      const iframe = document.getElementById("leaflet-map-iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ type: "FLY_TO_INDEX", index: selectedIndex }),
          "*"
        );
      }
    } else if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: "FLY_TO_INDEX", index: selectedIndex })
      );
    }
  }, [selectedIndex]);

  // Listen for message on Web
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleWebMessage = (e) => {
        try {
          const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (data && data.type === "SELECT_MOMENT" && typeof data.index === "number") {
            onSelectMoment && onSelectMoment(data.index);
          }
        } catch (err) {}
      };
      window.addEventListener("message", handleWebMessage);
      return () => window.removeEventListener("message", handleWebMessage);
    }
  }, [onSelectMoment]);

  const handleNativeMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "SELECT_MOMENT" && typeof data.index === "number") {
        onSelectMoment && onSelectMoment(data.index);
      }
    } catch (e) {}
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, style]}>
        <iframe
          id="leaflet-map-iframe"
          title="Trip Route Map"
          srcDoc={mapHtml}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: 16,
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
        onMessage={handleNativeMessage}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={themeColor} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 380,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E8ECE9",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingBox: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default InteractiveMap;
