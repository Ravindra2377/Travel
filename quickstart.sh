#!/bin/bash

# ─────────────────────────────────────────────────────
#  CompareX Zero-Cost Render Fixes — Quick Start
#  Copy & paste each section into your terminal
# ─────────────────────────────────────────────────────

echo "🚀 CompareX Seed Script Quickstart"
echo "─────────────────────────────────────────────────"

# STEP 1: Install dependencies
echo ""
echo "📦 Step 1: Installing dependencies..."
npm install playwright node-fetch

# STEP 2: Install Chromium browser
echo ""
echo "🌐 Step 2: Installing Chromium browser..."
npx playwright install chromium

# STEP 3: Configure environment variables
echo ""
echo "🔧 Step 3: Setting configuration..."
echo ""
echo "   Choose your setup:"
echo "   [A] Local development (backend running on localhost:8080)"
echo "   [B] Production on Render (backend deployed)"
echo ""
read -p "Choose [A/B]: " choice

if [ "$choice" == "A" ] || [ "$choice" == "a" ]; then
    export BACKEND_URL="http://localhost:8080"
    echo "   ✅ Using local backend: $BACKEND_URL"
else
    read -p "Enter your Render URL (e.g., https://my-app.onrender.com): " RENDER_URL
    export BACKEND_URL="$RENDER_URL"
    echo "   ✅ Using Render backend: $BACKEND_URL"
fi

read -p "Enter your backend secret (or press Enter for 'your-secret-here'): " SECRET
export BACKEND_SECRET="${SECRET:-your-secret-here}"
echo "   ✅ Backend secret configured"

# STEP 4: Run seed script
echo ""
echo "🌱 Step 4: Running seed script..."
echo "   (Browser will open — watch the scraping in action!)"
echo ""
node seed_from_local.js

echo ""
echo "✅ Seed script complete!"
echo ""
echo "Next: Configure your cron job at https://cron-job.org"
echo "   URL: $BACKEND_URL/health"
echo "   Interval: Every 14 minutes"
echo ""
