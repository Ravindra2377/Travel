# Trip Moments 🧭

A mobile travel memory application where a trip feels like a story, not a folder.

Built with **Expo SDK 57**, **React Native 0.86**, and the tactile **LiquidGlass** design system.

---

## 🌟 The Core Idea: A Trip is a Story

Everything revolves around one object: the **Trip**. Each trip has a cover, a route, days, and moments, and it can be replayed or shared as a finished piece.

### Key Screens

1. **Trip Cover**: A full-bleed hero photo with a serif title (`Fraunces`), dates (`IBM Plex Mono`), and quiet stats (days, places, moments, kilometers).
2. **Day-by-Day Journal**: A scroll-driven timeline. Each day opens with a frosted glass header (date, weather icon & temperature, city), and moments sit below in varied photo card sizes with time and place stamps.
3. **Route Map**: The traveler's path drawn across an interactive map with photo pins and a route scrub slider that highlights the moment nearest to each stop.
4. **Fast Capture**: One-tap "Trip Mode". Time, place, and weather are filled in automatically via `expo-location` and Open-Meteo, with offline instant saving.
5. **Recap Reel & 9:16 Cards**: Auto-built Instagram-style story reel of the trip, plus shareable 9:16 story cards.
6. **Traveler's Passport**: A profile of countries, cities, kilometers, and collectible expedition stamps across all journeys.

---

## 🎨 Design System & Aesthetics

- **Surfaces**: Photography leads. `LiquidGlass` and `GlassCard` translucent chrome float over travel imagery with gradient scrims.
- **Typography**:
  - `Fraunces` (serif) for story titles and headers.
  - `IBM Plex Mono` for timestamps, GPS coordinates, and ticket stamps.
  - `Inter` for body and narrative captions.
- **Colors**:
  - Light Paper (`#F7F8F7`), Ink (`#18201C`), and Forest Green (`#16845B`).
  - Dark Emerald (`#0E1511`) night mode.
  - Per-trip color tinting derived from each trip's cover palette.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo Go (SDK 57) or Android/iOS Emulator

### Run the App
```bash
cd frontend
npm install
npx expo start -c
```

### Run Tests
```bash
cd frontend
npm test
```
All 17 test suites (124+ unit tests) validate storage CRUD, distance calculation, theme tokens, and screen mounting.
