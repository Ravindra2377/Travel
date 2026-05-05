/**
 * deal_scraper.js — GitHub Actions Deal Pipeline
 *
 * Runs every 4 hours via cron. Scrapes deal/offer pages from
 * Amazon, Flipkart, Blinkit, Zepto, and BigBasket using Playwright.
 * Scores each deal with the HOTDEAL algorithm and uploads to the backend.
 *
 * Usage:  node scripts/deal_scraper.js
 * Env:    BACKEND_URL (required)
 */

const { chromium } = require("playwright");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ── Configuration ────────────────────────────────────────
const BACKEND_URL =
  process.env.BACKEND_URL || "https://comparex-8ztd.onrender.com";

// Common grocery search terms to discover deals for
const SEARCH_QUERIES = [
  "Eggs",
  "Milk",
  "Rice",
  "Atta",
  "Oil",
  "Bread",
  "Paneer",
  "Chicken",
  "Sugar",
  "Dal",
  "Butter",
  "Cheese",
  "Curd",
  "Tea",
  "Coffee",
];

const PLATFORMS = [
  {
    name: "Amazon",
    searchUrl: (q) =>
      `https://www.amazon.in/s?k=${encodeURIComponent(q)}&i=grocery`,
    parseProducts: async (page) => {
      return page.evaluate(() => {
        const cards = document.querySelectorAll(
          '[data-component-type="s-search-result"]'
        );
        return Array.from(cards)
          .slice(0, 15)
          .map((card) => {
            const titleEl = card.querySelector("h2 a span");
            const priceWhole = card.querySelector(".a-price-whole");
            const mrpEl = card.querySelector(
              ".a-price.a-text-price .a-offscreen"
            );
            const imgEl = card.querySelector("img.s-image");
            const ratingEl = card.querySelector(".a-icon-alt");
            const linkEl = card.querySelector("h2 a");

            const price = priceWhole
              ? parseFloat(priceWhole.textContent.replace(/[^0-9.]/g, ""))
              : 0;
            const mrpText = mrpEl ? mrpEl.textContent : "";
            const mrp = mrpText
              ? parseFloat(mrpText.replace(/[^0-9.]/g, ""))
              : price;
            const ratingText = ratingEl ? ratingEl.textContent : "";
            const rating = ratingText
              ? parseFloat(ratingText.split(" ")[0])
              : 0;

            return {
              product_name: titleEl ? titleEl.textContent.trim() : "",
              price,
              mrp: mrp || price,
              image_url: imgEl ? imgEl.src : "",
              rating,
              product_url: linkEl
                ? "https://www.amazon.in" + linkEl.getAttribute("href")
                : "",
            };
          })
          .filter((p) => p.product_name && p.price > 0);
      });
    },
  },
  {
    name: "Flipkart",
    searchUrl: (q) =>
      `https://www.flipkart.com/search?q=${encodeURIComponent(q)}&otracker=search&as-show=on&as=off`,
    parseProducts: async (page) => {
      return page.evaluate(() => {
        // Flipkart uses various card selectors
        const cards = document.querySelectorAll(
          "._1AtVbE, [data-id], ._4ddWXP, ._2kHMtA"
        );
        const results = [];

        cards.forEach((card) => {
          const titleEl =
            card.querySelector("._4rR01T") ||
            card.querySelector(".s1Q9rs") ||
            card.querySelector("a.IRpwTa");
          const priceEl =
            card.querySelector("._30jeq3") ||
            card.querySelector("._1_WHN1");
          const mrpEl =
            card.querySelector("._3I9_wc") ||
            card.querySelector("._27UcVY");
          const imgEl = card.querySelector("img._396cs4, img._2r_T1I");
          const linkEl = card.querySelector("a._1fQZEK, a.s1Q9rs, a.IRpwTa");

          const priceText = priceEl ? priceEl.textContent : "";
          const price = priceText
            ? parseFloat(priceText.replace(/[^0-9.]/g, ""))
            : 0;
          const mrpText = mrpEl ? mrpEl.textContent : "";
          const mrp = mrpText
            ? parseFloat(mrpText.replace(/[^0-9.]/g, ""))
            : price;

          if (titleEl && price > 0) {
            results.push({
              product_name: titleEl.textContent.trim(),
              price,
              mrp: mrp || price,
              image_url: imgEl ? imgEl.src : "",
              product_url: linkEl
                ? "https://www.flipkart.com" + linkEl.getAttribute("href")
                : "",
            });
          }
        });

        return results.slice(0, 15);
      });
    },
  },
  {
    name: "BigBasket",
    searchUrl: (q) =>
      `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
    parseProducts: async (page) => {
      // BigBasket also has a listing API we can try
      const query = await page.evaluate(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("q") || "";
      });

      // Try the internal API first
      try {
        const apiUrl = `https://www.bigbasket.com/listing-svc/v2/products?type=pc&slug=${encodeURIComponent(query.toLowerCase())}&q=${encodeURIComponent(query)}&page=1&tab_type=%5B%22all%22%5D&sorted_on=relevance`;
        const response = await page.evaluate(async (url) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return null;
            return res.json();
          } catch {
            return null;
          }
        }, apiUrl);

        if (response?.tabs?.[0]?.product_info?.products) {
          return response.tabs[0].product_info.products.slice(0, 15).map((p) => ({
            product_name: `${p.brand?.name || ""} ${p.desc || ""}`.trim(),
            price: p.pricing?.discount?.prim_price?.sp || p.pricing?.discount?.prim_price?.mrp || 0,
            mrp: p.pricing?.discount?.prim_price?.mrp || 0,
            image_url: p.images?.[0]?.s || "",
            product_url: `https://www.bigbasket.com/pd/${p.sku}/${p.url_key || ""}`,
          })).filter((p) => p.product_name && p.price > 0);
        }
      } catch (e) {
        console.log(`  [BigBasket] API fallback failed: ${e.message}`);
      }

      // DOM fallback
      return page.evaluate(() => {
        const cards = document.querySelectorAll(
          '[class*="SKUDeck"], [class*="ProductCard"]'
        );
        return Array.from(cards)
          .slice(0, 15)
          .map((card) => {
            const nameEl =
              card.querySelector("h3") || card.querySelector('[class*="Name"]');
            const text = card.textContent || "";
            const prices = text.match(
              /₹\s*([0-9]+(?:\.[0-9]+)?)/g
            );
            const priceValues = (prices || []).map((p) =>
              parseFloat(p.replace(/[^0-9.]/g, ""))
            );
            const imgEl = card.querySelector("img");

            return {
              product_name: nameEl ? nameEl.textContent.trim() : "",
              price: priceValues.length > 0 ? Math.min(...priceValues) : 0,
              mrp:
                priceValues.length > 1
                  ? Math.max(...priceValues)
                  : priceValues[0] || 0,
              image_url: imgEl ? imgEl.src : "",
            };
          })
          .filter((p) => p.product_name && p.price > 0);
      });
    },
  },
  {
    name: "Blinkit",
    searchUrl: (q) =>
      `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
    parseProducts: async (page) => {
      return page.evaluate(() => {
        const cards = document.querySelectorAll(
          '[class*="Product__UpdatedPlpProductContainer"], div.tw-flex.tw-w-full.tw-flex-col'
        );
        return Array.from(cards)
          .slice(0, 15)
          .map((card) => {
            const text = card.textContent || "";
            const nameEl =
              card.querySelector('[class*="Product__UpdatedTitle"]') ||
              card.querySelector("div div div");
            const imgEl = card.querySelector("img");
            const prices = text.match(/₹\s*([0-9]+(?:\.[0-9]+)?)/g);
            const priceValues = (prices || []).map((p) =>
              parseFloat(p.replace(/[^0-9.]/g, ""))
            );

            return {
              product_name: nameEl ? nameEl.textContent.trim() : "",
              price: priceValues.length > 0 ? Math.min(...priceValues) : 0,
              mrp:
                priceValues.length > 1
                  ? Math.max(...priceValues)
                  : priceValues[0] || 0,
              image_url: imgEl ? imgEl.src : "",
            };
          })
          .filter((p) => p.product_name && p.price > 0);
      });
    },
  },
  {
    name: "Zepto",
    searchUrl: (q) =>
      `https://www.zepto.com/search?query=${encodeURIComponent(q)}`,
    parseProducts: async (page) => {
      // Wait for Zepto's dynamic content
      await page.waitForTimeout(3000);

      return page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/pn/"]');
        return Array.from(links)
          .slice(0, 15)
          .map((link) => {
            const container = link.closest("div") || link;
            const text = container.textContent || "";
            const imgEl = container.querySelector("img");
            const prices = text.match(/₹\s*([0-9]+(?:\.[0-9]+)?)/g);
            const priceValues = (prices || []).map((p) =>
              parseFloat(p.replace(/[^0-9.]/g, ""))
            );

            // Extract name from the link text, removing price and quantity tokens
            let name = "";
            const headings = container.querySelectorAll("h3, h4, p, span");
            for (const el of headings) {
              const t = el.textContent.trim();
              if (t.length > 5 && !t.startsWith("₹") && !/^\d+$/.test(t)) {
                name = t;
                break;
              }
            }

            return {
              product_name: name,
              price: priceValues.length > 0 ? Math.min(...priceValues) : 0,
              mrp:
                priceValues.length > 1
                  ? Math.max(...priceValues)
                  : priceValues[0] || 0,
              image_url: imgEl ? imgEl.src : "",
              product_url: link.href || "",
            };
          })
          .filter((p) => p.product_name && p.price > 0);
      });
    },
  },
];

// ── Hot Score Calculator (mirrors DealScoringService.js) ──
function calculateHotScore(deal) {
  let discountPct = 0;
  if (deal.mrp > 0 && deal.price > 0 && deal.mrp > deal.price) {
    discountPct = Math.round(((deal.mrp - deal.price) / deal.mrp) * 100);
  }
  const discountScore = Math.min(discountPct * 0.6, 30);

  let popularityScore = 0;
  const rating = deal.rating || 0;
  if (rating >= 4.0) popularityScore = 15;
  else if (rating >= 3.0) popularityScore = 8;
  popularityScore = Math.min(popularityScore, 20);

  const scarcityScore = 5; // default: in_stock
  const freshnessScore = 10; // just scraped, full freshness

  let deliveryBonus = 0;
  const dTime = String(deal.delivery_time || "");
  const mins = parseInt(dTime, 10) || 0;
  if (mins > 0 && mins <= 15) deliveryBonus = 5;
  else if (mins > 15 && mins <= 60) deliveryBonus = 3;

  const TRUST = {
    Amazon: 1.0,
    Flipkart: 1.0,
    BigBasket: 0.95,
    Blinkit: 0.9,
    Zepto: 0.9,
  };
  const weight = TRUST[deal.platform] || 0.85;

  const raw =
    discountScore +
    popularityScore +
    scarcityScore +
    freshnessScore +
    deliveryBonus;

  return Math.min(Math.max(Math.round(raw * weight * 10) / 10, 0), 100);
}

function getTier(score) {
  if (score >= 80) return { deal_tier: "on_fire", tier_emoji: "🔴" };
  if (score >= 60) return { deal_tier: "trending", tier_emoji: "🟠" };
  if (score >= 40) return { deal_tier: "worth_noting", tier_emoji: "🟡" };
  return { deal_tier: "regular", tier_emoji: "🟢" };
}

function generateTags(deal, discountPct) {
  const tags = [];
  if (discountPct >= 50) tags.push("🔥 Mega Discount");
  else if (discountPct >= 30) tags.push("💰 Great Deal");
  else if (discountPct >= 15) tags.push("👍 Good Price");
  if (deal.rating >= 4.5) tags.push("⭐ Top Rated");
  return tags;
}

// ── Main Scraper ─────────────────────────────────────────
async function scrapeDeals() {
  console.log("🔥 CompareX Deal Scraper — Starting");
  console.log(`   Backend: ${BACKEND_URL}`);
  console.log(`   Queries: ${SEARCH_QUERIES.length}`);
  console.log(`   Platforms: ${PLATFORMS.length}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const allDeals = [];
  const stats = {};

  for (const platform of PLATFORMS) {
    stats[platform.name] = { total: 0, errors: 0 };

    for (const query of SEARCH_QUERIES) {
      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        viewport: { width: 412, height: 915 },
        locale: "en-IN",
      });

      const page = await context.newPage();

      try {
        const url = platform.searchUrl(query);
        console.log(`  🔍 ${platform.name} → "${query}"`);

        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });

        // Anti-bot delay
        await page.waitForTimeout(1500 + Math.random() * 2000);

        const products = await platform.parseProducts(page);

        products.forEach((prod) => {
          const discountPct =
            prod.mrp > prod.price && prod.mrp > 0
              ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100)
              : 0;

          // Only include products with meaningful discounts
          if (discountPct < 5 && prod.price === prod.mrp) return;

          const hotScore = calculateHotScore({
            ...prod,
            platform: platform.name,
          });
          const tier = getTier(hotScore);
          const tags = generateTags(prod, discountPct);

          allDeals.push({
            product_name: prod.product_name,
            brand: prod.brand || "",
            category: query,
            image_url: prod.image_url || "",
            platform: platform.name,
            price: prod.price,
            mrp: prod.mrp,
            discount_pct: discountPct,
            hot_score: hotScore,
            ...tier,
            tags,
            stock_status: "in_stock",
            delivery_time: prod.delivery_time || "",
            product_url: prod.product_url || "",
          });
        });

        stats[platform.name].total += products.length;
        console.log(`     ✅ ${products.length} products found`);
      } catch (err) {
        stats[platform.name].errors++;
        console.log(`     ❌ Failed: ${err.message}`);
      } finally {
        await page.close();
        await context.close();
      }

      // Delay between searches to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1500));
    }
  }

  await browser.close();

  // Sort by hot score
  allDeals.sort((a, b) => b.hot_score - a.hot_score);

  // Print summary
  console.log("\n╔═══════════════ SCRAPER SUMMARY ═══════════════╗");
  Object.entries(stats).forEach(([plat, s]) => {
    const status = s.errors > 0 ? `⚠️  ${s.errors} errors` : "✅ OK";
    console.log(
      `║  ${plat.padEnd(12)}: ${String(s.total).padStart(4)} products | ${status.padEnd(15)} ║`
    );
  });
  console.log(`║  ${"TOTAL".padEnd(12)}: ${String(allDeals.length).padStart(4)} deals scored${" ".repeat(17)} ║`);
  console.log("╚═══════════════════════════════════════════════╝\n");

  return allDeals;
}

// ── Upload to Backend ────────────────────────────────────
async function uploadToBackend(deals) {
  if (deals.length === 0) {
    console.log("⚠️  No deals to upload.");
    return;
  }

  // Upload in batches of 25 to avoid payload limits
  const BATCH_SIZE = 25;
  let uploaded = 0;

  for (let i = 0; i < deals.length; i += BATCH_SIZE) {
    const batch = deals.slice(i, i + BATCH_SIZE);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/deals/collect`,
        { deals: batch },
        { timeout: 15000 }
      );
      uploaded += res.data?.saved || batch.length;
      console.log(
        `  📤 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} deals sent (${res.data?.saved || "?"} saved)`
      );
    } catch (err) {
      console.error(
        `  ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${err.message}`
      );
    }
  }

  console.log(`\n🚀 Upload complete: ${uploaded}/${deals.length} deals saved`);
}

// ── Entry Point ──────────────────────────────────────────
(async () => {
  try {
    const deals = await scrapeDeals();

    // Save locally as artifact
    const outputDir = path.join(__dirname, "..", "output");
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(
      path.join(outputDir, "deals.json"),
      JSON.stringify(
        {
          scraped_at: new Date().toISOString(),
          count: deals.length,
          deals: deals,
        },
        null,
        2
      )
    );
    console.log(`💾 Saved ${deals.length} deals to output/deals.json`);

    // Upload to backend
    await uploadToBackend(deals);

    console.log("\n✅ Pipeline complete! Next run in 4 hours.");
    process.exit(0);
  } catch (err) {
    console.error("💥 Fatal error:", err);
    process.exit(1);
  }
})();
