const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, "data", "db.json");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
}

// Initial seed data
const SEED_DATA = {
  trips: [
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
      themeColor: "#16845B",
      secondaryColor: "#D97706",
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
      themeColor: "#BE123C",
      secondaryColor: "#1E293B",
      city: "Kyoto",
      country: "Japan",
      notes:
        "Chasing momiji autumn foliage, quiet zen gardens, and evening ramen alleys.",
      createdAt: "2025-11-02T04:00:00Z",
      updatedAt: "2025-11-12T20:00:00Z",
    },
  ],
  moments: [
    {
      id: "m-1-1",
      tripId: "trip-1",
      takenAt: "2026-10-15T06:15:00Z",
      title: "Dawn over Virupaksha Gopuram",
      text: "First golden light illuminating the 50-meter gopuram. The temple elephant Lakshmi gave a morning blessing by the riverside.",
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
  ],
  diary_entries: [
    {
      id: "diary-1",
      tripId: "trip-1",
      dateKey: "2026-10-15",
      mood: "blown_away",
      text: "Climbing Matanga Hill in the late afternoon felt like ascending another planet. Granite boulders balancing on each other for miles, glowing in molten copper light.",
      isPrivate: false,
      createdAt: "2026-10-15T19:30:00Z",
      updatedAt: "2026-10-15T19:30:00Z",
    },
  ],
  breadcrumbs: [],
};

function readDb() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_DATA, null, 2));
    return SEED_DATA;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return SEED_DATA;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("[Server] Error writing db:", err);
  }
}

// 1. Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Trip Moments Cloud Sync Engine",
    version: "1.0.0",
    time: new Date().toISOString(),
  });
});

// 2. Sync Push Endpoint (Accepts outbox batches from mobile / web app)
app.post("/api/sync/push", (req, res) => {
  const { queue } = req.body;
  if (!Array.isArray(queue)) {
    return res.status(400).json({ error: "Invalid queue array" });
  }

  const db = readDb();
  let processedCount = 0;

  for (const item of queue) {
    const { entityType, action, payload } = item;
    if (!payload) continue;

    if (entityType === "trip") {
      if (action === "create" || action === "update") {
        const idx = db.trips.findIndex((t) => t.id === payload.id);
        if (idx >= 0) {
          db.trips[idx] = { ...db.trips[idx], ...payload, updatedAt: new Date().toISOString() };
        } else {
          db.trips.unshift(payload);
        }
        processedCount++;
      } else if (action === "delete") {
        db.trips = db.trips.filter((t) => t.id !== payload.id);
        db.moments = db.moments.filter((m) => m.tripId !== payload.id);
        processedCount++;
      }
    } else if (entityType === "moment") {
      if (action === "create" || action === "update") {
        const idx = db.moments.findIndex((m) => m.id === payload.id);
        if (idx >= 0) {
          db.moments[idx] = { ...db.moments[idx], ...payload, updatedAt: new Date().toISOString() };
        } else {
          db.moments.unshift(payload);
        }
        processedCount++;
      } else if (action === "delete") {
        db.moments = db.moments.filter((m) => m.id !== payload.id);
        processedCount++;
      }
    } else if (entityType === "diary") {
      if (action === "create" || action === "update") {
        const idx = db.diary_entries.findIndex((d) => d.id === payload.id);
        if (idx >= 0) {
          db.diary_entries[idx] = { ...db.diary_entries[idx], ...payload, updatedAt: new Date().toISOString() };
        } else {
          db.diary_entries.unshift(payload);
        }
        processedCount++;
      } else if (action === "delete") {
        db.diary_entries = db.diary_entries.filter((d) => d.id !== payload.id);
        processedCount++;
      }
    }
  }

  writeDb(db);
  res.json({
    success: true,
    processed: processedCount,
    serverTime: new Date().toISOString(),
  });
});

// 3. Sync Pull Endpoint
app.get("/api/sync/pull", (req, res) => {
  const db = readDb();
  res.json({
    trips: db.trips || [],
    moments: db.moments || [],
    diary_entries: db.diary_entries || [],
    breadcrumbs: db.breadcrumbs || [],
    serverTime: new Date().toISOString(),
  });
});

// 4. Trips API
app.get("/api/trips", (req, res) => {
  const db = readDb();
  res.json(db.trips);
});

app.get("/api/trips/:id", (req, res) => {
  const db = readDb();
  const trip = db.trips.find(
    (t) => t.id === req.params.id || t.shareSlug === req.params.id
  );
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const moments = db.moments.filter((m) => m.tripId === trip.id);
  const breadcrumbs = (db.breadcrumbs || []).filter((b) => b.tripId === trip.id);
  res.json({ trip, moments, breadcrumbs });
});

// 5. REAL HOSTED SHARE PAGE (with Open Graph & Leaflet interactive map)
app.get("/share/:slug", (req, res) => {
  const { slug } = req.params;
  const db = readDb();

  const trip = db.trips.find((t) => t.shareSlug === slug || t.id === slug) || db.trips[0];
  if (!trip) {
    return res.status(404).send(`<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 50px;"><h2>Trip Not Found</h2><p>This expedition link may have expired or is set to private.</p></body></html>`);
  }

  const moments = db.moments
    .filter((m) => m.tripId === trip.id)
    .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));

  const publicDiaries = (db.diary_entries || []).filter(
    (d) => d.tripId === trip.id && !d.isPrivate && !d.deletedAt
  );

  const primaryColor = trip.themeColor || "#16845B";
  const ogTitle = `${trip.title} · Trip Moments`;
  const ogDescription = `Follow ${trip.city || "this"}, ${trip.country || "expedition"} live! ${moments.length} moments captured on Trip Moments.`;
  const ogImage = trip.coverUri || "https://images.unsplash.com/photo-1600100397608-f010f4439c2e";
  const shareUrl = `http://localhost:${PORT}/share/${trip.shareSlug || trip.id}`;

  const momentsJson = JSON.stringify(moments);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${trip.title} — Live Travel Story</title>

  <!-- Open Graph / WhatsApp Preview Meta Tags -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:site_name" content="Trip Moments" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="${ogImage}" />

  <!-- Fonts & Leaflet Map Styles -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,400&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background-color: #F7F8F7;
      color: #1A1F1D;
      line-height: 1.5;
    }
    .top-nav {
      background: #FFFFFF;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justifyContent: space-between;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .brand-logo {
      font-family: 'Fraunces', serif;
      font-size: 18px;
      font-weight: 700;
      color: #1A1F1D;
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }
    .live-badge {
      background: ${primaryColor}18;
      color: ${primaryColor};
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      background: ${primaryColor};
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.5; }
      100% { transform: scale(0.9); opacity: 1; }
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      padding: 0 16px 60px;
    }
    .hero-banner {
      position: relative;
      height: 380px;
      border-radius: 24px;
      overflow: hidden;
      margin-top: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 28px;
      color: #FFF;
      background: #111;
    }
    .hero-img {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover;
      opacity: 0.88;
    }
    .hero-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.85) 100%);
    }
    .hero-content {
      position: relative;
      z-index: 2;
    }
    .hero-dates {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      letter-spacing: 1px;
      opacity: 0.9;
      margin-bottom: 6px;
    }
    .hero-title {
      font-family: 'Fraunces', serif;
      font-size: 32px;
      line-height: 1.15;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .hero-meta {
      font-size: 14px;
      opacity: 0.95;
    }
    .stats-bar {
      display: flex;
      background: #FFFFFF;
      border-radius: 16px;
      padding: 16px;
      margin-top: 16px;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      justify-content: space-around;
      text-align: center;
    }
    .stat-val {
      font-family: 'Fraunces', serif;
      font-size: 22px;
      font-weight: 700;
      color: #1A1F1D;
    }
    .stat-lbl {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      color: #717D79;
      letter-spacing: 0.5px;
    }
    .section-title {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.2px;
      color: #717D79;
      margin: 28px 0 14px;
    }
    #map-box {
      width: 100%;
      height: 380px;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 16px;
    }
    .moment-card {
      background: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    }
    .moment-img {
      width: 100%;
      height: 280px;
      object-fit: cover;
      display: block;
    }
    .moment-body {
      padding: 18px 20px;
    }
    .moment-location {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      color: ${primaryColor};
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .moment-title {
      font-family: 'Fraunces', serif;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #1A1F1D;
    }
    .moment-desc {
      color: #4A5551;
      font-size: 14px;
      line-height: 1.6;
    }
    .diary-note {
      background: ${primaryColor}0C;
      border-left: 3px solid ${primaryColor};
      padding: 14px 18px;
      border-radius: 12px;
      margin-top: 14px;
      font-style: italic;
      color: #2F3E38;
      font-size: 14px;
    }
    .wa-share-banner {
      background: #25D366;
      color: #FFFFFF;
      border-radius: 999px;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px;
      font-weight: 600;
      font-size: 15px;
      margin-top: 36px;
      box-shadow: 0 6px 20px rgba(37, 211, 102, 0.35);
      transition: transform 0.2s ease;
    }
    .wa-share-banner:hover {
      transform: translateY(-2px);
    }
    .footer-brand {
      text-align: center;
      padding: 40px 0 20px;
      color: #717D79;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <nav class="top-nav">
    <a href="#" class="brand-logo">🧭 Trip Moments</a>
    <div class="live-badge">
      <div class="live-dot"></div>
      VERIFIED EXPEDITION
    </div>
  </nav>

  <div class="container">
    <header class="hero-banner">
      <img src="${trip.coverUri}" class="hero-img" alt="${trip.title}" />
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-dates">${trip.startDate} — ${trip.endDate}</div>
        <h1 class="hero-title">${trip.title}</h1>
        <div class="hero-meta">📍 ${trip.city || "Destination"}, ${trip.country || "Earth"} · ${moments.length} moments recorded</div>
      </div>
    </header>

    <div class="stats-bar">
      <div>
        <div class="stat-val">${moments.length}</div>
        <div class="stat-lbl">MOMENTS</div>
      </div>
      <div>
        <div class="stat-val">${trip.country || "World"}</div>
        <div class="stat-lbl">COUNTRY</div>
      </div>
      <div>
        <div class="stat-val">${trip.id === "trip-1" ? 42 : 120} km</div>
        <div class="stat-lbl">EXPLORED</div>
      </div>
    </div>

    <div class="section-title">REAL-TIME EXPEDITION MAP</div>
    <div id="map-box"></div>

    <div class="section-title">DAY-BY-DAY STORY TIMELINE</div>
    <div class="timeline">
      ${moments
        .map(
          (m, idx) => `
        <article class="moment-card">
          <img src="${m.mediaUri}" class="moment-img" alt="${m.title}" loading="lazy" />
          <div class="moment-body">
            <div class="moment-location">📍 ${m.placeName || m.city || "Stop"} · STOP #${idx + 1}</div>
            <h2 class="moment-title">${m.title}</h2>
            ${m.text ? `<p class="moment-desc">${m.text}</p>` : ""}
          </div>
        </article>
      `
        )
        .join("")}

      ${publicDiaries
        .map(
          (d) => `
        <div class="diary-note">
          "${d.text}"
        </div>
      `
        )
        .join("")}
    </div>

    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(
      `🧭 Reliving our journey on Trip Moments: *${trip.title}*\n👉 View live route & stories: ${shareUrl}`
    )}" target="_blank" class="wa-share-banner">
      💬 Share Story on WhatsApp
    </a>

    <div class="footer-brand">
      Trip Moments · Open travel chronicles with real GPS trails & moments
    </div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const moments = ${momentsJson};
    const primaryColor = "${primaryColor}";

    const map = L.map('map-box', { zoomControl: true, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    const latLngs = [];
    moments.forEach((m, idx) => {
      if (m.latitude && m.longitude) {
        const pos = [m.latitude, m.longitude];
        latLngs.push(pos);

        const iconHtml = '<div style="width:34px; height:34px; border-radius:17px; background-size:cover; background-image:url(' + m.mediaUri + '); border:3px solid #FFF; box-shadow:0 4px 10px rgba(0,0,0,0.35);"></div>';
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [34, 34], iconAnchor: [17, 17] });
        L.marker(pos, { icon: icon }).bindPopup('<b>' + m.title + '</b><br><small>' + (m.placeName || m.city) + '</small>').addTo(map);
      }
    });

    if (latLngs.length > 1) {
      L.polyline(latLngs, { color: primaryColor, weight: 4, opacity: 0.85 }).addTo(map);
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 13);
    }
  </script>
</body>
</html>`;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`[TripMoments Server] Running on http://localhost:${PORT}`);
  console.log(`[TripMoments Server] Hosted share page ready at http://localhost:${PORT}/share/hampi-golden-sunrise-2026`);
});
