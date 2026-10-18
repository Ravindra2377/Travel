const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(DATA_DIR, "db.seed.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Authentication key for syncing mutations
const SYNC_API_KEY = process.env.SYNC_API_KEY || "dev-sync-token-secret";

// Rate limiting: simple in-memory window limiter
const rateLimitMap = new Map();
function rateLimiter(windowMs = 60000, maxRequests = 200) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
    } else {
      entry.count += 1;
    }
    rateLimitMap.set(ip, entry);

    if (entry.count > maxRequests) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    next();
  };
}

// Security: HTML entity escaping to eliminate XSS
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Security: JSON serialization that prevents script tag breakout
function safeJsonStringify(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// Security: Auth middleware for sync mutations
function authenticateSync(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (token !== SYNC_API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid sync authorization token" });
  }
  next();
}

function isCallerAuthenticated(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  return token === SYNC_API_KEY;
}

// Middleware setup
app.use(rateLimiter(60000, 250));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : true,
  methods: ["GET", "POST", "OPTIONS"],
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Ensure data & upload directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Static route for uploaded photos
app.use("/uploads", express.static(UPLOADS_DIR));

// Initial seed data fallback
const FALLBACK_SEED = {
  trips: [
    {
      id: "trip-1",
      title: "Golden Sunrise in Hampi",
      startDate: "2026-10-14",
      endDate: "2026-10-18",
      status: "active",
      privacy: "link_only",
      shareSlug: "hampi-golden-sunrise-2026",
      coverUri: "https://images.unsplash.com/photo-1600100397608-f010f4439c2e?q=80&w=1200&auto=format&fit=crop",
      themeColor: "#16845B",
      secondaryColor: "#D97706",
      city: "Hampi",
      country: "India",
      notes: "Exploring the 14th-century Vijayanagara ruins, granite boulder hills, and ancient river crossings.",
      createdAt: "2026-10-14T05:00:00Z",
      updatedAt: "2026-10-16T18:00:00Z"
    }
  ],
  moments: [],
  diary_entries: [],
  breadcrumbs: []
};

function readDb() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[Server] Could not parse db.json, falling back to seed", e.message);
    }
  }

  // Fallback to seed file
  if (fs.existsSync(SEED_FILE)) {
    try {
      const raw = fs.readFileSync(SEED_FILE, "utf-8");
      const seed = JSON.parse(raw);
      fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
      return seed;
    } catch (e) {
      console.warn("[Server] Could not parse db.seed.json", e.message);
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(FALLBACK_SEED, null, 2));
  return FALLBACK_SEED;
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
    version: "1.1.0",
    time: new Date().toISOString(),
  });
});

// 2. Photo Upload Endpoint
app.post("/api/photos/upload", authenticateSync, (req, res) => {
  const { filename, base64Data, contentType = "image/jpeg" } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: "Missing base64Data in request body" });
  }

  try {
    const ext = filename ? filename.split(".").pop() : "jpg";
    const safeFilename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(filePath, buffer);

    const host = req.get("host") || `localhost:${PORT}`;
    const protocol = req.protocol || "http";
    const photoUrl = `${protocol}://${host}/uploads/${safeFilename}`;

    res.json({
      success: true,
      url: photoUrl,
      filename: safeFilename,
    });
  } catch (err) {
    console.error("[Server] Photo upload failed:", err);
    res.status(500).json({ error: "Failed to save photo" });
  }
});

// 3. Sync Push Endpoint (Protected with authenticateSync)
app.post("/api/sync/push", authenticateSync, (req, res) => {
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

// 4. Sync Pull Endpoint (Privacy-filtered if unauthenticated)
app.get("/api/sync/pull", (req, res) => {
  const db = readDb();
  const authenticated = isCallerAuthenticated(req);

  if (authenticated) {
    return res.json({
      trips: db.trips || [],
      moments: db.moments || [],
      diary_entries: db.diary_entries || [],
      breadcrumbs: db.breadcrumbs || [],
      serverTime: new Date().toISOString(),
    });
  }

  // Unauthenticated callers only receive public/link_only trips and non-private diaries
  const visibleTrips = (db.trips || []).filter((t) => t.privacy !== "private");
  const visibleTripIds = new Set(visibleTrips.map((t) => t.id));

  const visibleMoments = (db.moments || []).filter((m) => visibleTripIds.has(m.tripId));
  const visibleDiaries = (db.diary_entries || []).filter(
    (d) => visibleTripIds.has(d.tripId) && !d.isPrivate
  );
  const visibleBreadcrumbs = (db.breadcrumbs || []).filter((b) => visibleTripIds.has(b.tripId));

  res.json({
    trips: visibleTrips,
    moments: visibleMoments,
    diary_entries: visibleDiaries,
    breadcrumbs: visibleBreadcrumbs,
    serverTime: new Date().toISOString(),
  });
});

// 5. Trips API
app.get("/api/trips", (req, res) => {
  const db = readDb();
  const authenticated = isCallerAuthenticated(req);
  if (authenticated) {
    return res.json(db.trips || []);
  }
  const publicTrips = (db.trips || []).filter((t) => t.privacy !== "private");
  res.json(publicTrips);
});

app.get("/api/trips/:id", (req, res) => {
  const db = readDb();
  const trip = (db.trips || []).find(
    (t) => t.id === req.params.id || t.shareSlug === req.params.id
  );
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const authenticated = isCallerAuthenticated(req);
  if (trip.privacy === "private" && !authenticated) {
    return res.status(403).json({ error: "This trip is private" });
  }

  const moments = (db.moments || []).filter((m) => m.tripId === trip.id);
  const breadcrumbs = (db.breadcrumbs || []).filter((b) => b.tripId === trip.id);
  res.json({ trip, moments, breadcrumbs });
});

// 6. REAL HOSTED SHARE PAGE (with HTML escaping, 404 for unknown slugs, 403 for private trips)
app.get("/share/:slug", (req, res) => {
  const { slug } = req.params;
  const db = readDb();

  // Strict lookup: NO fallback to db.trips[0]
  const trip = (db.trips || []).find((t) => t.shareSlug === slug || t.id === slug);
  if (!trip) {
    return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trip Not Found — Trip Moments</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F7F8F7; color: #1A1F1D; text-align: center; padding: 60px 20px; }
    .card { max-width: 440px; margin: 0 auto; background: #FFF; border-radius: 20px; padding: 36px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p { color: #717D79; font-size: 14px; line-height: 1.5; }
    a { display: inline-block; margin-top: 20px; color: #16845B; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 12px;">🧭</div>
    <h1>Expedition Not Found</h1>
    <p>This trip link could not be found or has been removed. Check the link or ask the traveler for an updated invite.</p>
  </div>
</body>
</html>`);
  }

  // Privacy enforcement
  if (trip.privacy === "private") {
    return res.status(403).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Private Expedition — Trip Moments</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F7F8F7; color: #1A1F1D; text-align: center; padding: 60px 20px; }
    .card { max-width: 440px; margin: 0 auto; background: #FFF; border-radius: 20px; padding: 36px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p { color: #717D79; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
    <h1>Private Expedition</h1>
    <p>This travel journal is set to private by its author and cannot be viewed via public link.</p>
  </div>
</body>
</html>`);
  }

  const moments = (db.moments || [])
    .filter((m) => m.tripId === trip.id)
    .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));

  const publicDiaries = (db.diary_entries || []).filter(
    (d) => d.tripId === trip.id && !d.isPrivate && !d.deletedAt
  );

  // Sanitized text values for HTML rendering
  const safeTitle = escapeHtml(trip.title || "My Journey");
  const safeCity = escapeHtml(trip.city || "Destination");
  const safeCountry = escapeHtml(trip.country || "Earth");
  const safeStartDate = escapeHtml(trip.startDate || "");
  const safeEndDate = escapeHtml(trip.endDate || "");
  const safeCoverUri = escapeHtml(trip.coverUri || "https://images.unsplash.com/photo-1600100397608-f010f4439c2e");
  const safePrimaryColor = escapeHtml(trip.themeColor || "#16845B");

  const ogTitle = `${safeTitle} · Trip Moments`;
  const ogDescription = `Follow ${safeCity}, ${safeCountry} live! ${moments.length} moments captured on Trip Moments.`;
  const shareUrl = `http://localhost:${PORT}/share/${encodeURIComponent(trip.shareSlug || trip.id)}`;

  // Safe JSON payload preventing script injection
  const safeMomentsJson = safeJsonStringify(
    moments.map((m) => ({
      id: m.id,
      title: m.title,
      placeName: m.placeName,
      city: m.city,
      latitude: m.latitude,
      longitude: m.longitude,
      mediaUri: m.mediaUri,
      text: m.text,
    }))
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — Live Travel Story</title>

  <!-- Open Graph / WhatsApp Preview Meta Tags -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${safeTitle} · Trip Moments" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:image" content="${safeCoverUri}" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:site_name" content="Trip Moments" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle} · Trip Moments" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="${safeCoverUri}" />

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
      justify-content: space-between;
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
      background: ${safePrimaryColor}18;
      color: ${safePrimaryColor};
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
      background: ${safePrimaryColor};
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
      color: ${safePrimaryColor};
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
      background: ${safePrimaryColor}0C;
      border-left: 3px solid ${safePrimaryColor};
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
      <img src="${safeCoverUri}" class="hero-img" alt="${safeTitle}" />
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-dates">${safeStartDate} — ${safeEndDate}</div>
        <h1 class="hero-title">${safeTitle}</h1>
        <div class="hero-meta">📍 ${safeCity}, ${safeCountry} · ${moments.length} moments recorded</div>
      </div>
    </header>

    <div class="stats-bar">
      <div>
        <div class="stat-val">${moments.length}</div>
        <div class="stat-lbl">MOMENTS</div>
      </div>
      <div>
        <div class="stat-val">${safeCountry}</div>
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
          <img src="${escapeHtml(m.mediaUri || "")}" class="moment-img" alt="${escapeHtml(m.title || "Moment")}" loading="lazy" />
          <div class="moment-body">
            <div class="moment-location">📍 ${escapeHtml(m.placeName || m.city || "Stop")} · STOP #${idx + 1}</div>
            <h2 class="moment-title">${escapeHtml(m.title || "Moment")}</h2>
            ${m.text ? `<p class="moment-desc">${escapeHtml(m.text)}</p>` : ""}
          </div>
        </article>
      `
        )
        .join("")}

      ${publicDiaries
        .map(
          (d) => `
        <div class="diary-note">
          "${escapeHtml(d.text || "")}"
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
    const moments = ${safeMomentsJson};
    const primaryColor = "${safePrimaryColor}";

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
        L.marker(pos, { icon: icon }).bindPopup('<b>' + m.title + '</b><br><small>' + (m.placeName || m.city || '') + '</small>').addTo(map);
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

// Start listening if run directly as script
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[TripMoments Server] Running on http://localhost:${PORT}`);
    console.log(`[TripMoments Server] Hosted share page ready at http://localhost:${PORT}/share/hampi-golden-sunrise-2026`);
  });
}

module.exports = app;
