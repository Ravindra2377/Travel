# CompareZ - Development Documentation

## 📱 Project Overview

**CompareZ** (formerly PricePilot) is a cross-platform mobile application for real-time product price comparison across e-commerce grocery platforms (Blinkit, Zepto, BigBasket, Instamart). The app helps users find the best prices for grocery items by comparing prices across multiple platforms.

**Current Version:** 2.0.0 (Frontend-First Architecture)  
**Last Updated:** February 15, 2026  
**Original Concept:** Price comparison for grocery delivery services

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native with Expo (v54), React 19, React Native 0.81.5 |
| **Backend** | Go (Golang) with custom HTTP handler framework |
| **Database** | PostgreSQL (Neon serverless) & MongoDB |
| **Caching** | Redis |
| **Search** | Meilisearch (v1.10, optional) |
| **Mobile UI** | React Native WebView, AsyncStorage, React Navigation |
| **Styling** | React Native StyleSheet, custom CSS for website |

---

## 📂 Project Structure

```
CompareX/
├── frontend/                  # React Native + Expo app
│   ├── app.json              # Expo configuration
│   ├── package.json          # Dependencies (1376 packages)
│   ├── babel.config.js       # Babel configuration
│   ├── tsconfig.json         # TypeScript config
│   ├── src/                  # Source files
│   │   ├── screens/          # App screens (Home, Search, Accounts, etc.)
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React contexts (DecisionContext, AuthContext)
│   │   └── services/         # API services (DecisionService, LocationService)
│   ├── __tests__/            # Jest test files
│   └── assets/               # Icons, fonts, images
├── backend/                   # Go backend API
│   ├── main.go               # Entry point
│   ├── config/config.go      # Configuration loading
│   ├── database/db.go        # MongoDB connection
│   ├── platform_config.json  # Platform API configurations
│   ├── handlers/             # HTTP route handlers
│   ├── scraper/              # Platform scrapers (Blinkit, Zepto, etc.)
│   ├── models/               # Data models (shopping_decision, user)
│   ├── cmd/                  # CLI commands
│   ├── go.mod/go.sum         # Go module dependencies
│   └── Dockerfile            # Docker configuration
├── docker/                    # Docker Compose infrastructure
│   └── docker-compose.yml    # Postgres, Redis, Meilisearch
├── backend/API_V2.md         # Backend API documentation
├── ARCHITECTURE_V2.md        # Frontend-first architecture guide
├── SETUP_GUIDE.md            # Setup and troubleshooting guide
├── Makefile                  # Build automation
└── README.md                 # High-level project overview
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- Go 1.24+ (optional, for backend)
- Docker & Docker Compose (optional, for full infrastructure)
- Xcode / Android Studio (for native device emulation)

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

### 3. Start Expo Development Server

```bash
npx expo start
# or
npm start
```

- Scan QR code with **Expo Go** app on your phone
- Or press `i` for iOS Simulator, `a` for Android Emulator
- Metro Bundler runs at `http://localhost:8081`

### 4. Start Backend (Optional - for analytics, history)

```bash
cd backend
go run main.go
# Server starts at http://localhost:8080
```

### 5. Start Docker Infrastructure (Postgres, Redis, Meilisearch)

```bash
cd docker
docker-compose up -d
```

- Postgres: `localhost:5432` (user:user, pass:password, db:pricepilot)
- Redis: `localhost:6379`
- Meilisearch: `localhost:7700` (masterKey)

---

## 🏗 Architecture - Frontend-First (V2)

### Problem (V1)

All grocery platforms (Blinkit, Zepto, BigBasket, Instamart) are protected by **Cloudflare bot detection** which blocks non-browser HTTP requests. Simply capturing cookies/tokens and replaying them from the backend **will never work** due to:

- Missing TLS fingerprints
- Missing browser fingerprints
- JavaScript challenge requirements
- CSRF token validation
- Origin header validation

### Solution (V2)

**Frontend-Based Scraping** using authenticated WebViews that maintain full browser context:

```
┌─────────────────────────────────────────────────────────┐
│  NEW ARCHITECTURE                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User logs in → WebView stores session              │
│  2. User searches → Hidden WebViews (authenticated)     │
│  3. WebViews execute fetch() → Return JSON             │
│  4. React Native aggregates → Display comparison       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `frontend/screens/AccountsScreen.js` | Account connection with WebView login |
| `frontend/screens/SearchScreen.js` | Hidden WebViews for authenticated scraping |
| `frontend/services/PlatformScraperService.js` | JavaScript injection scripts per platform |
| `backend/main.go` | API server (optional, for analytics) |
| `backend/platform_config.json` | Platform configurations (fallback token storage) |

---

## 🔐 Account Connection & Token Capture

### How It Works

1. User navigates to **Accounts** tab
2. Taps **Connect** for each platform
3. Logs in normally in the WebView (using phone number/OTP)
4. App automatically captures:
   - `localStorage` data (auth tokens, user data, location)
   - `document.cookie` (session cookies)
5. Tokens stored in **AsyncStorage** (encrypted on iOS)

### Platform-Specific Token Requirements

| Platform | Required Tokens | Storage Location |
|----------|----------------|------------------|
| **Blinkit** | `auth`, `authKey`, `cookie` | localStorage + cookies |
| **Zepto** | `user`, `header-store`, `cookie` | localStorage + cookies |
| **BigBasket** | `cookie` (sessionid, _bb_vid) | cookies |
| **Instamart** | `_session_tid`, `swiggy_auth_headers` | localStorage + cookies |

### Connecting Accounts

1. Open app, go to **Accounts** tab
2. Tap **Connect** for desired platform
3. Log in with credentials in WebView
4. Wait for "✅ Connected successfully!" message
5. Repeat for other platforms

### Manual Token Configuration (Fallback)

If app-based login fails, tokens can be added directly to `backend/platform_config.json`:

```json
{
  "blinkit": {
    "headers": {
      "cookie": "YOUR_COOKIE_STRING_HERE",
      "auth_key": "YOUR_AUTH_KEY_HERE"
    }
  }
}
```

Then restart backend: `go run main.go`

---

## 🔍 Product Search

### How Search Works

1. User goes to **Search** tab
2. Types product name (e.g., "Eggs", "Milk", "Bread")
3. App creates **hidden WebViews** for each connected platform
4. Each WebView:
   - Navigates to platform homepage (restores saved cookies/localStorage)
   - Injects JavaScript fetch script with auth tokens
   - Calls platform API with `fetch(url, {headers})`
   - Parses JSON response
   - Sends results via `window.ReactNativeWebView.postMessage()`
5. React Native aggregates results from all platforms
6. Display comparison with best price, discount %, and platform count

### Search Performance

- **First search:** 3-5 seconds (cold WebViews)
- **Subsequent searches:** 1-3 seconds (WebViews already loaded)
- **Concurrent platforms:** All searched simultaneously
- **Network usage:** ~100KB per platform per search

### Supported Search Queries

Common grocery items: Eggs, Milk, Bread, Rice, Chicken, Vegetables, Fruits, etc.

---

## 📡 API Endpoints (Backend - Optional)

The backend serves for analytics, price history, and optional fallback. All primary scraping happens in frontend.

### Authentication

All backend endpoints require CompareZ JWT token:
```
Authorization: Bearer <comparez-jwt>
```

The backend validates the token and uses its subject as the storage key.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /accounts/connect` | Connect single platform |
| `POST /accounts/bulk-connect` | Connect multiple platforms |
| `DELETE /accounts/disconnect/:platform` | Disconnect platform |
| `GET /accounts/status` | Get connection status |
| `POST /search/collect` | Collect search results for analytics |
| `GET /search/history?limit=10` | Get recent search history |
| `GET /search/validate` | Validate token functionality |
| `GET /compare?q=eggs&lat=12.97&lng=77.59` | Legacy endpoint (V1, deprecated) |

### Request/Response Examples

**Connect Blinkit Account:**

```bash
curl -X POST http://localhost:8080/accounts/connect \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "Blinkit",
    "tokens": {
      "auth": "{\"accessToken\":\"v2::xxx\"}",
      "authKey": "xxx",
      "cookie": "gr_1_accessToken=xxx; gr_1_deviceId=xxx"
    }
  }'
```

**Collect Search Results:**

```bash
curl -X POST http://localhost:8080/search/collect \
  -H "Content-Type: application/json" \
  -d '{
    "query": "eggs",
    "platforms": {
      "Blinkit": [
        {
          "product_name": "Farm Fresh Eggs (6 pcs)",
          "brand": "Farm Fresh",
          "price": 45.0,
          "mrp": 50.0,
          "in_stock": true,
          "platform": "Blinkit"
        }
      ]
    }
  }'
```

**Validate Tokens:**

```bash
curl http://localhost:8080/accounts/validate
```

### Deprecated V1 Endpoints

- `GET /compare?q=eggs&lat=12.97&lng=77.59` - Backend scraping (likely fails due to Cloudflare)
- `POST /tokens` - Redirects to `/accounts/bulk-connect`

### Environment Variables

```bash
# Server
PORT=8080

# Database (Neon)
DATABASE_URL=postgresql://neondb_owner:npg_iGYytwj2SXW0@ep-small-haze-amsgptkz-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis
REDIS_ADDR=localhost:6379

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_KEY=masterKey

# CORS
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.8:8081
```

---

## 🧪 Testing

### Frontend Tests

```bash
# Run all frontend tests
npm test

# Run frontend unit tests
npm run test:frontend-unit

# Run in watch mode
npm run test:watch
```

### Backend Tests

```bash
cd backend
go test ./...
```

### Test Coverage

- Frontend: Jest with react-test-renderer, @testing-library/react-native
- Backend: Go test suite with various handler tests

### Test Categories

- Unit tests for components and services
- Integration tests for account connection flow
- End-to-end tests with detox (e2e)

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"No platforms connected"** | Go to Accounts tab and connect at least one platform |
| "Search returns no results" | Check if tokens are still valid (try reconnecting account) |
| Platform shows "Connected" but search fails | Tokens may have expired - tap refresh icon and reconnect |
| WebView not loading | Check internet connection; Clear app cache and reconnect accounts |
| "Connected" but no results after login | Tokens might have expired (re-login) |
| Backend returns 403/404 | This is expected without authentication - must link accounts first or add tokens to config |
| Expo start fails with "Invalid project root" | Ensure you're in the frontend directory; run `npx expo start` from `/home/kpanviravindra/CompareX/frontend` |

### Platform-Specific Notes

- **Blinkit:** Easiest to capture - stores auth in localStorage; OTP login via phone number
- **Zepto:** Needs `header-store` for location; may require intentId from localStorage
- **BigBasket:** Cookie-based; requires `sessionid` and `_bb_vid`; may need CSRF token
- **Instamart (Swiggy):** Uses Swiggy cookies; requires `_session_tid`; location-dependent results

### Backend Logs

Check backend console for detailed error messages:
```bash
go run main.go
```

Look for patterns like:
- `✅ Blinkit API found 15 items`
- `❌ Blinkit API error: 403 Forbidden`
- `📊 Collected search results: Query: eggs, Platforms: 2, Total: 15`

---

## 🔒 Security

### Current Implementation

- ✅ Credentials never leave the device
- ✅ Tokens stored in AsyncStorage (encrypted on iOS)
- ✅ No backend token transmission (primary flow)
- ✅ WebViews isolated from each other
- ✅ Session cookies have short expiry (platform-dependent)

### Production Recommendations

1. **Add user authentication** - JWT tokens for API access
2. **Encrypt sensitive data** - Encrypt tokens at rest
3. **Rate limiting** - Prevent abuse
4. **Token expiry** - Auto-delete old tokens (TTL)
5. **HTTPS only** - Enforce TLS
6. **Database persistence** - Store tokens in PostgreSQL instead of memory

### JWT Authentication

All API requests require CompareZ JWT:
```
Authorization: Bearer <comparez-jwt>
```

The backend validates the token and uses its subject as the storage key. Client-supplied device IDs and token headers are not trusted for account ownership.

---

## 📊 Data Flow

### 1. User Connects Account

```
User → WebView → JavaScript: Capture localStorage/cookies
      → ReactNative: Send tokens
      → SecureStore: Save encrypted credentials locally
      → Backend: POST /accounts/connect
      → Backend: Memory: Store tokens by authenticated user
```

### 2. User Searches Product

```
User → SearchScreen: Types "eggs"
      → SearchScreen → WebView(Blinkit): Inject fetch script
      → WebView(Blinkit) → Blinkit API: Authenticated request
      → Blinkit API → WebView(Blinkit): JSON response
      → WebView(Blinkit) → SearchScreen: Products data
      → SearchScreen → Backend: POST /search/collect
      → SearchScreen → User: Display results
```

### 3. Result Aggregation

```
All platform results → React Native layer → 
Display comparison with:
- Best price
- Discount %
- Platform count
- Direct buy links
```

---

## 🎯 Next Steps & Roadmap

### Immediate (Current Sprint)

1. **Test with your accounts** - Connect at least 2-3 platforms
2. **Try different queries** - Eggs, Milk, Rice, Chicken, etc.
3. **Report issues** - Check console logs if something fails
4. **Optimize** - Can add result caching in frontend too

### Short-term

1. **Real-time price alerts** - Notify when price drops
2. **Price prediction** - ML model for price trends
3. **Product recommendations** - Based on search history
4. **Wishlists** - Save favorite products
5. **Share deals** - Share best prices with friends

### Long-term

1. **Web dashboard** - Analytics portal
2. **Admin panel** - Manage platforms, users
3. **Multi-device sync** - Sync accounts across devices
4. **Backend database persistence** - Replace memory storage with PostgreSQL
5. **Meilisearch integration** - Full-text search capabilities

---

## 📞 Support

For issues or questions:

1. **Check logs:**
   - Backend: `go run main.go` (console output)
   - Frontend: React Native Metro console (Cmd+M / Ctrl+M)

2. **Verify token capture:** Check `[WebView]` logs in Expo Go

3. **Test endpoints:** Use cURL or Postman against `http://localhost:8080`

4. **Common solutions:**
   - Re-link accounts if tokens expired
   - Use mobile data instead of WiFi (some platforms block WebView logins)
   - Try desktop browser method for token extraction
   - Check `backend/platform_config.json` for manual token setup

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | - | Initial V1 (backend scraping - Cloudflare blocked) |
| 2.0.0 | Feb 2026 | V2 Frontend-First Architecture (WebView-based scraping) |
| 2.0.1 | - | Bug fixes and platform improvements |

---