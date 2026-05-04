# CompareX — Copy & Paste Setup Commands

## 🔥 Complete Setup in 10 Minutes

### Terminal 1: Install & Run Seed Script

```bash
# Navigate to project
cd /Users/chethannv/Downloads/CompareX

# Install dependencies (one time)
npm install playwright node-fetch

# Install Chromium browser (one time, ~200MB)
npx playwright install chromium

# Set configuration
export BACKEND_URL="https://your-app.onrender.com"
export BACKEND_SECRET="your-secret-here"

# Run the seed script (~5 minutes)
node seed_from_local.js
```

**Expected output after 5 minutes:**

```
╔══════════════ SEED COMPLETE ══════════════╗
║  Amazon    :  150 items                   ║
║  BigBasket :   90 items                   ║
║  Blinkit   :   80 items                   ║
║  Zepto     :   70 items                   ║
║  TOTAL     :  390 items uploaded ✅       ║
╚═══════════════════════════════════════════╝
```

### Terminal 2: Verify Backend Health

```bash
# Test your health endpoint
curl https://your-app.onrender.com/health

# Should return:
# {"status":"up","db":"connected"}
```

### Browser: Set Up Cron Job (2 minutes)

1. Open: https://cron-job.org
2. Click: "Sign Up" or "Sign In"
3. Click: "Create Cron Job"
4. Fill in these fields:

   ```
   Title:           CompareX Keep Alive
   URL:             https://your-app.onrender.com/health
   Cron Expression: */14 * * * *
   HTTP Method:     GET
   Expected Code:   200
   ```

5. Click: "Save"
6. Done! ✅

---

## 🎯 All Commands at Once (Copy-Paste Ready)

```bash
cd /Users/chethannv/Downloads/CompareX && \
npm install playwright node-fetch && \
npx playwright install chromium && \
export BACKEND_URL="https://your-app.onrender.com" && \
export BACKEND_SECRET="your-secret-here" && \
node seed_from_local.js
```

**Then:**

1. Go to https://cron-job.org
2. Add cron job with URL: `https://your-app.onrender.com/health`
3. Schedule: `*/14 * * * *`
4. Done!

---

## ✅ Verification Checklist

After setup, verify everything works:

```bash
# 1. Check health endpoint
curl https://your-app.onrender.com/health

# 2. Check database has data (should have deals)
curl "https://your-app.onrender.com/compare?q=milk"

# 3. Check cron job logs at cron-job.org
# → Should show successful pings every 14 min

# 4. Open your app
# → Should see deals on "Compare" screen
```

---

## 🚨 If Anything Goes Wrong

### Issue: "Cannot find module 'playwright'"

```bash
npm install playwright node-fetch
```

### Issue: "Chromium installation failed"

```bash
npx playwright install chromium --with-deps
```

### Issue: "Backend connection refused"

```bash
# Make sure backend is running
curl http://localhost:8080  # if local
# Or check Render dashboard if deployed
```

### Issue: "Empty results"

```bash
# Wait for script to complete (5+ minutes)
# Check browser console for network errors
# Try again - platforms have rate limiting
```

---

## 📊 What Happens When It Works

| When                 | What                   | Result              |
| -------------------- | ---------------------- | ------------------- |
| **Day 1**            | Run seed script        | 300+ deals in DB    |
| **Day 1 onward**     | Cron job pings /health | Server never sleeps |
| **Each user search** | Crowdsourced scraping  | More deals added    |
| **1 week**           | Organic growth         | 1000+ deals         |
| **Always**           | Cost                   | **$0**              |

---

## 💾 Configuration Files Created

Your project now has these setup files:

- `seed_from_local.js` — Main seed script
- `SEED_SETUP.md` — Detailed setup guide
- `ZERO_COST_FIXES_GUIDE.md` — Complete documentation
- `.env.seed.example` — Environment template
- `seed-package.json` — npm script config
- `quickstart.sh` — Bash setup script
- `COPY_PASTE_COMMANDS.md` — This file

---

## 🎉 You're All Set!

Just run:

```bash
cd /Users/chethannv/Downloads/CompareX
export BACKEND_URL="https://your-app.onrender.com"
export BACKEND_SECRET="your-secret-here"
node seed_from_local.js
```

Then set up the cron job at https://cron-job.org

That's it! ✅
