#!/usr/bin/env node

/**
 * ─────────────────────────────────────────────────────
 *  CompareX — Local Seed Script
 *  Run this from YOUR laptop (residential IP = unblocked)
 *
 *  Usage:
 *    npm install playwright
 *    npx playwright install chromium
 *    node seed_from_local.js
 * ─────────────────────────────────────────────────────
 */

const { chromium } = require("playwright");
const fetch = require("node-fetch");

// ── Configuration ──────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const BACKEND_SECRET = process.env.BACKEND_SECRET || "your-secret-here";

const SEED_QUERIES = [
  // Grocery staples
  "Milk",
  "Eggs",
  "Bread",
  "Atta",
  "Rice",
  "Dal",
  "Sugar",
  "Oil",
  "Butter",
  "Paneer",
  "Curd",
  "Cheese",
  // Beverages
  "Tea",
  "Coffee",
  "Juice",
  "Water",
  // Snacks
  "Biscuits",
  "Chips",
  "Noodles",
  "Oats",
  // Personal care
  "Shampoo",
  "Soap",
  "Toothpaste",
  // Household
  "Detergent",
  "Dish wash",
  "Toilet cleaner",
];

// ── Hot Score Calculator ──────────────────────────────
function calculateHotScore(deal) {
  let score = 0;
  score += Math.min((deal.discountPercent || 0) * 0.6, 30);
  score += deal.isFlashDeal ? 20 : 0;
  score += deal.isLimitedStock ? 15 : 5;
  score += Math.min(Math.log10((deal.ratingsCount || 1) + 1) * 4, 20);
  return Math.min(Math.round(score), 100);
}

// ── Scrape Amazon ─────────────────────────────────────
async function scrapeAmazon(page, query) {
  const results = [];
  try {
    await page.goto(
      `https://www.amazon.in/s?k=${encodeURIComponent(query)}&i=grocery`,
      { waitUntil: "domcontentloaded", timeout: 60000 },
    );

    try {
      await page.waitForSelector('[data-component-type="s-search-result"]', {
        timeout: 12000,
      });
    } catch (e) {
      console.log(`   ⚠️  Amazon: No results selector found for "${query}"`);
      return results;
    }

    await page.waitForTimeout(1500);

    const items = await page.$$eval(
      '[data-component-type="s-search-result"]',
      (els) =>
        els.slice(0, 6).map((el) => {
          const title = el.querySelector("h2 span")?.innerText?.trim() || "";
          const price = parseFloat(
            (el.querySelector(".a-price-whole")?.innerText || "0").replace(
              /,/g,
              "",
            ),
          );
          const oldPrice = parseFloat(
            (
              el.querySelector(".a-price.a-text-price .a-offscreen")
                ?.innerText || "0"
            ).replace(/[₹,]/g, ""),
          );
          const badge = el.querySelector(".a-badge-label")?.innerText || "";
          const stars =
            el.querySelector(".a-icon-star-small .a-icon-alt")?.innerText ||
            "0";
          const reviews =
            el
              .querySelector('[aria-label$="ratings"]')
              ?.getAttribute("aria-label") || "0";
          const img = el.querySelector(".s-image")?.src || "";
          const link = el.querySelector("h2 a")?.href || "";

          return { title, price, oldPrice, badge, stars, reviews, img, link };
        }),
    );

    items
      .filter((d) => d.title && d.price > 0)
      .forEach((d) => {
        const disc =
          d.oldPrice > 0
            ? Math.round(((d.oldPrice - d.price) / d.oldPrice) * 100)
            : 0;
        results.push({
          title: d.title,
          currentPrice: d.price,
          originalPrice: d.oldPrice || d.price,
          discountPercent: disc,
          isFlashDeal: d.badge.toLowerCase().includes("deal"),
          isLimitedStock: d.badge.toLowerCase().includes("limited"),
          avgRating: parseFloat(d.stars.split(" ")[0]) || 0,
          ratingsCount: parseInt(d.reviews.replace(/,/g, "")) || 0,
          imageUrl: d.img,
          productUrl: d.link,
          platform: "Amazon",
          query,
        });
      });
  } catch (e) {
    console.log(`   ⚠️  Amazon "${query}": ${e.message.split("\n")[0]}`);
  }
  return results;
}

// ── Scrape Blinkit ────────────────────────────────────
async function scrapeBlinkit(page, query) {
  const results = [];
  try {
    const apiHits = [];

    const responseHandler = async (res) => {
      if (res.url().includes("search") && res.status() === 200) {
        try {
          const json = await res.json();
          const prods = json?.products || json?.data?.products || [];
          apiHits.push(...prods);
        } catch (_) {}
      }
    };

    page.on("response", responseHandler);

    await page.goto("https://blinkit.com", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Set Bengaluru pincode
    await page.evaluate(() => {
      document.cookie = "userPin=560001; path=/";
      document.cookie = "gr_1=560001; path=/";
    });

    await page.goto(`https://blinkit.com/s/?q=${encodeURIComponent(query)}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(2000);

    const domItems = await page
      .$$eval(
        '[class*="Product__Container"], [data-test-id="product"]',
        (els) =>
          els.slice(0, 6).map((el) => ({
            title:
              el.querySelector('[class*="Product__Name"], h3')?.innerText || "",
            price: parseFloat(
              (
                el.querySelector('[class*="Product__Price"]')?.innerText || "0"
              ).replace(/[₹,]/g, ""),
            ),
            mrp: parseFloat(
              (
                el.querySelector('[class*="Product__Mrp"], s')?.innerText || "0"
              ).replace(/[₹,]/g, ""),
            ),
            img: el.querySelector("img")?.src || "",
          })),
      )
      .catch(() => []);

    const source = domItems.length > 0 ? domItems : apiHits;

    source
      .filter(
        (d) =>
          (d.title || d.name) &&
          (d.price || d.mrp || d.discountedPrice || 0) > 0,
      )
      .forEach((d) => {
        const sp = d.price || d.discountedPrice / 100 || 0;
        const mrp = d.mrp || d.mrp / 100 || sp;
        const disc = mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;

        if (sp > 0 && (d.title || d.name)) {
          results.push({
            title: d.title || d.name || "",
            currentPrice: sp,
            originalPrice: mrp,
            discountPercent: disc,
            isFlashDeal: false,
            isLimitedStock: false,
            avgRating: d.rating || 0,
            ratingsCount: d.rating_count || 0,
            imageUrl: d.img || d.image || "",
            platform: "Blinkit",
            query,
          });
        }
      });

    page.off("response", responseHandler);
  } catch (e) {
    console.log(`   ⚠️  Blinkit "${query}": ${e.message.split("\n")[0]}`);
  }
  return results;
}

// ── Scrape BigBasket ──────────────────────────────────
async function scrapeBigBasket(page, query) {
  const results = [];
  try {
    await page.goto(
      `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}&nc=as`,
      { waitUntil: "networkidle", timeout: 60000 },
    );
    await page.waitForTimeout(2000);

    const items = await page
      .$$eval('[qa="product-card"], .SKUDeck___StyledDiv-sc-1e5d9gk-0', (els) =>
        els.slice(0, 6).map((el) => ({
          title:
            el.querySelector('[qa="product-name"], h3')?.innerText?.trim() ||
            "",
          sp: parseFloat(
            (
              el.querySelector(
                '.Pricing___StyledLabel-sc-pldi2d-1, [qa="product-price"]',
              )?.innerText || "0"
            ).replace(/[₹,]/g, ""),
          ),
          mrp: parseFloat(
            (
              el.querySelector(
                '.Pricing___StyledLabel-sc-pldi2d-2, [qa="product-mrp"]',
              )?.innerText || "0"
            ).replace(/[₹,]/g, ""),
          ),
          img: el.querySelector("img")?.src || "",
          disc: el.querySelector('[qa="discount-badge"]')?.innerText || "",
        })),
      )
      .catch(() => []);

    items
      .filter((d) => d.title && d.sp > 0)
      .forEach((d) => {
        const disc =
          d.mrp > 0
            ? Math.round(((d.mrp - d.sp) / d.mrp) * 100)
            : parseInt(d.disc.replace(/[^0-9]/g, "")) || 0;
        results.push({
          title: d.title,
          currentPrice: d.sp,
          originalPrice: d.mrp || d.sp,
          discountPercent: disc,
          isFlashDeal: false,
          isLimitedStock: false,
          avgRating: 0,
          ratingsCount: 0,
          imageUrl: d.img,
          platform: "BigBasket",
          query,
        });
      });
  } catch (e) {
    console.log(`   ⚠️  BigBasket "${query}": ${e.message.split("\n")[0]}`);
  }
  return results;
}

// ── Scrape Zepto ──────────────────────────────────────
async function scrapeZepto(page, query) {
  const results = [];
  try {
    const apiHits = [];

    const responseHandler = async (res) => {
      if (res.url().includes("/search") && res.status() === 200) {
        try {
          const json = await res.json();
          const items = json?.data?.items || json?.items || [];
          apiHits.push(...items);
        } catch (_) {}
      }
    };

    page.on("response", responseHandler);

    await page.goto(
      `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`,
      { waitUntil: "networkidle", timeout: 60000 },
    );
    await page.waitForTimeout(2000);

    if (apiHits.length > 0) {
      apiHits.slice(0, 6).forEach((item) => {
        const p = item?.product || item;
        const mrp = (p?.mrp || 0) / 100;
        const sp = (p?.discountedPrice || p?.mrp || 0) / 100;
        const disc = mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;

        if ((p?.name || "").trim()) {
          results.push({
            title: (p?.name || "").trim(),
            currentPrice: sp,
            originalPrice: mrp,
            discountPercent: disc,
            isFlashDeal: false,
            isLimitedStock: false,
            avgRating: p?.rating || 0,
            ratingsCount: p?.ratingCount || 0,
            imageUrl: p?.imageUrl || "",
            platform: "Zepto",
            query,
          });
        }
      });
    } else {
      // DOM fallback
      const domItems = await page
        .$$eval('[class*="ProductCard"], [data-testid="product-card"]', (els) =>
          els.slice(0, 6).map((el) => ({
            title:
              el.querySelector('h5, [class*="name"]')?.innerText?.trim() || "",
            price: parseFloat(
              (el.querySelector('[class*="price"]')?.innerText || "0").replace(
                /[₹,]/g,
                "",
              ),
            ),
            img: el.querySelector("img")?.src || "",
          })),
        )
        .catch(() => []);

      domItems
        .filter((d) => d.title && d.price > 0)
        .forEach((d) => {
          results.push({
            title: d.title,
            currentPrice: d.price,
            originalPrice: d.price,
            discountPercent: 0,
            isFlashDeal: false,
            isLimitedStock: false,
            avgRating: 0,
            ratingsCount: 0,
            imageUrl: d.img,
            platform: "Zepto",
            query,
          });
        });
    }

    page.off("response", responseHandler);
  } catch (e) {
    console.log(`   ⚠️  Zepto "${query}": ${e.message.split("\n")[0]}`);
  }
  return results;
}

// ── Upload batch to backend ───────────────────────────
async function uploadBatch(deals) {
  try {
    const response = await fetch(`${BACKEND_URL}/compare`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret": BACKEND_SECRET,
      },
      body: JSON.stringify({
        deals,
        refreshedAt: new Date().toISOString(),
        nextRefreshAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      }),
    });
    return response.ok;
  } catch (error) {
    console.log(`   ❌ Upload failed: ${error.message}`);
    return false;
  }
}

// ── MAIN ──────────────────────────────────────────────
(async () => {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║  🌱 CompareX LOCAL SEED SCRIPT              ║");
  console.log("║  Running from your residential IP           ║");
  console.log("║  No bot blocks! Real data incoming...       ║");
  console.log("╚════════════════════════════════════════════╝\n");

  console.log(`📍 Backend URL: ${BACKEND_URL}`);
  console.log(`🔑 Using secret: ${BACKEND_SECRET.slice(0, 5)}...`);
  console.log(`\n🚀 Starting browser...\n`);

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
      ],
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "en-IN",
    });

    const stats = { Amazon: 0, Blinkit: 0, BigBasket: 0, Zepto: 0 };
    const allDeals = [];
    let batchUploads = 0;
    let successCount = 0;

    for (const query of SEED_QUERIES) {
      console.log(`\n📦 Seeding: "${query}"`);

      const results = await Promise.allSettled([
        scrapeAmazon(page, query),
        scrapeBlinkit(page, query),
        scrapeBigBasket(page, query),
        scrapeZepto(page, query),
      ]);

      const queryDeals = [
        ...(results[0].value || []),
        ...(results[1].value || []),
        ...(results[2].value || []),
        ...(results[3].value || []),
      ]
        .map((d) => ({ ...d, hotScore: calculateHotScore(d) }))
        .sort((a, b) => b.hotScore - a.hotScore);

      stats.Amazon += (results[0].value || []).length;
      stats.Blinkit += (results[1].value || []).length;
      stats.BigBasket += (results[2].value || []).length;
      stats.Zepto += (results[3].value || []).length;

      allDeals.push(...queryDeals);

      // Upload in real-time batches
      if (queryDeals.length > 0) {
        const ok = await uploadBatch(queryDeals);
        if (ok) {
          batchUploads++;
          successCount += queryDeals.length;
          console.log(
            `   ✅ Uploaded ${queryDeals.length} deals live to backend`,
          );
        } else {
          console.log(`   ⚠️  Backend upload skipped (check backend running)`);
        }
      }

      await page.waitForTimeout(2000);
    }

    await browser.close();

    // Final summary
    console.log("\n╔══════════════ SEED COMPLETE ══════════════╗");
    console.log(
      `║  Amazon    : ${String(stats.Amazon).padStart(4)} items              ║`,
    );
    console.log(
      `║  Blinkit   : ${String(stats.Blinkit).padStart(4)} items              ║`,
    );
    console.log(
      `║  BigBasket : ${String(stats.BigBasket).padStart(4)} items              ║`,
    );
    console.log(
      `║  Zepto     : ${String(stats.Zepto).padStart(4)} items              ║`,
    );
    console.log(`║  ─────────────────────────────             ║`);
    console.log(
      `║  TOTAL     : ${String(allDeals.length).padStart(4)} items              ║`,
    );
    console.log(
      `║  UPLOADED  : ${String(successCount).padStart(4)} ✅                   ║`,
    );
    console.log("╚═══════════════════════════════════════════╝");
    console.log("\n🎉 Your database is now seeded with real deals!");
    console.log("   Users can now see actual products on the app.\n");
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
