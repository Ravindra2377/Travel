/**
 * ============================================================
 *  CompareX Deal Scraper v3.0 — Deals Pages First
 *
 *  Instead of searching for individual products, this scrapes
 *  the DEDICATED DEALS/OFFERS pages on each platform where
 *  discounted products are already curated.
 *
 *  Platforms:
 *    Amazon    → amazon.in/deals  (Today's Deals)
 *    Flipkart  → flipkart.com/offers-store
 *    BigBasket → bigbasket.com/cl/offers/
 *    Blinkit   → blinkit.com (homepage deals banner)
 *    Zepto     → zeptonow.com (offers section)
 * ============================================================
 */

const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');

// ── CONFIG ────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL;
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
const PINCODE = '560001';
const CITY = 'Bengaluru';

const STEALTH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'sec-ch-ua': '"Chromium";v="120", "Not_A Brand";v="8"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-platform': '"Android"',
};

// ── UTILITIES ─────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function clean(str) {
  return (str || '').replace(/\s+/g, ' ').trim();
}

// Proxies a URL through ScraperAPI if key is available
function getProxyUrl(targetUrl, useRender = false) {
  if (!SCRAPER_API_KEY) return targetUrl;
  return `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&country_code=in${useRender ? '&render=true' : ''}&url=${encodeURIComponent(targetUrl)}`;
}

// Proxies a URL through ScraperAPI for Node.js https/axios requests
function getScraperApiOptions(hostname, path, method = 'GET') {
  if (!SCRAPER_API_KEY) {
    return { hostname, path, method };
  }
  const targetUrl = `https://${hostname}${path}`;
  return {
    hostname: 'api.scraperapi.com',
    path: `/?api_key=${SCRAPER_API_KEY}&country_code=in&url=${encodeURIComponent(targetUrl)}`,
    method
  };
}

function calculateHotScore(deal) {
  let score = 0;
  const disc = deal.discountPercent || 0;
  score += Math.min(disc * 0.6, 30);
  score += deal.isFlashDeal ? 20 : 0;
  score += deal.isLimitedStock ? 15 : 5;
  score += Math.min(Math.log10((deal.ratingsCount || 1) + 1) * 4, 20);
  score += Math.min(disc / 5, 10);
  score += 10; // freshness: just scraped
  return Math.min(Math.round(score), 100);
}

async function newStealthPage(browser) {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders(STEALTH_HEADERS);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en'] });
    window.chrome = { runtime: {} };
  });
  return page;
}

// ══════════════════════════════════════════════════════════════════
//  AMAZON — Today's Deals page
// ══════════════════════════════════════════════════════════════════
async function scrapeAmazonDeals(browser) {
  const page = await newStealthPage(browser);
  const results = [];
  const dealPages = [
    'https://www.amazon.in/deals?ref_=nav_cs_gb',
    'https://www.amazon.in/gp/browse.html?node=14528985031', // Grocery deals
  ];

  for (const url of dealPages) {
    try {
      console.log(`   📄 Loading: ${url.split('?')[0]}`);
      const proxyUrl = getProxyUrl(url, true);
      await page.goto(proxyUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      await page.waitForSelector(
        '[data-component-type="s-search-result"], .DealCard-module, [class*="deal"], [class*="Deal"]',
        { timeout: 12000 }
      ).catch(() => null);

      await delay(rand(1500, 2500));

      const items = await page.evaluate(() => {
        const deals = [];
        document.querySelectorAll(
          '.DealCard-module__dealCard, [data-testid="deal-card"], [class*="DealGridItem"]'
        ).forEach((el) => {
          const title = el.querySelector('[class*="Title"], [class*="title"], h2, h3')?.innerText || '';
          const priceEl = el.querySelector('[class*="Price"], [class*="price"], .a-price-whole');
          const price = parseFloat((priceEl?.innerText || '0').replace(/[₹,\s]/g, ''));
          const discEl = el.querySelector('[class*="discount"], [class*="savings"], [class*="off"]');
          const discText = discEl?.innerText || '';
          const discMatch = discText.match(/(\d+)\s*%/);
          const discPct = discMatch ? parseInt(discMatch[1]) : 0;
          const img = el.querySelector('img')?.src || '';
          const badge = el.querySelector('[class*="badge"], [class*="Badge"]')?.innerText || '';

          if (title && price > 0) {
            deals.push({
              title: title.trim().slice(0, 120),
              currentPrice: price,
              originalPrice: discPct > 0 ? Math.round(price / (1 - discPct / 100)) : price,
              discountPercent: discPct,
              isFlashDeal: badge.toLowerCase().includes('deal') || badge.toLowerCase().includes('lightning'),
              imageUrl: img,
            });
          }
        });

        document.querySelectorAll('[data-component-type="s-search-result"]').forEach((el) => {
          const titleEl = el.querySelector('h2 span') || el.querySelector('.a-size-medium');
          const priceWhole = el.querySelector('.a-price-whole');
          const priceOld = el.querySelector('.a-price.a-text-price .a-offscreen');
          const imgEl = el.querySelector('.s-image');
          const badge = el.querySelector('.a-badge-label');
          const currentPrice = parseFloat((priceWhole?.innerText || '0').replace(/,/g, ''));
          const originalPrice = parseFloat((priceOld?.innerText || '0').replace(/[₹,]/g, ''));
          const disc = originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
          if (titleEl && currentPrice > 0 && disc >= 5) {
            deals.push({
              title: titleEl.innerText.trim().slice(0, 120),
              currentPrice,
              originalPrice: originalPrice || currentPrice,
              discountPercent: disc,
              isFlashDeal: (badge?.innerText || '').toLowerCase().includes('deal'),
              imageUrl: imgEl?.src || '',
            });
          }
        });
        return deals;
      });

      items.forEach((d) => results.push({ ...d, platform: 'Amazon' }));
      console.log(`     ✅ ${items.length} deals found`);
    } catch (err) {
      console.error(`     ❌ ${err.message.split('\n')[0]}`);
    }
  }
  await page.close();
  return results;
}

// ══════════════════════════════════════════════════════════════════
//  FLIPKART — Offers Store page
// ══════════════════════════════════════════════════════════════════
async function scrapeFlipkartDeals() {
  return new Promise((resolve) => {
    const results = [];
    const baseOptions = getScraperApiOptions('www.flipkart.com', '/api/6/page/fetch?pageUri=%2Foffers-store&type=PAGE', 'GET');
    const options = {
      ...baseOptions,
      headers: {
        'User-Agent': STEALTH_HEADERS['User-Agent'],
        'X-User-Agent': 'Mozilla/5.0 (Linux; Android 13) FKUA/app/42/42.0/android;V2',
        Accept: 'application/json',
        Referer: 'https://www.flipkart.com/offers-store',
      },
    };

    https.get(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const findProducts = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (Array.isArray(obj)) { obj.forEach(findProducts); return; }
            if (obj.title && (obj.finalPrice || obj.price || obj.mrp)) {
              const price = obj.finalPrice?.value || obj.price?.value || obj.price || 0;
              const mrp = obj.mrp?.value || obj.mrp || price;
              const disc = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
              if (price > 0 && disc >= 5) {
                results.push({
                  title: clean(typeof obj.title === 'string' ? obj.title : obj.title?.text || ''),
                  currentPrice: price,
                  originalPrice: mrp,
                  discountPercent: disc,
                  isFlashDeal: !!(obj.offerTag || obj.dealTag),
                  avgRating: obj.rating?.average || 0,
                  ratingsCount: obj.rating?.count || 0,
                  imageUrl: obj.image?.url || obj.images?.[0]?.url || '',
                  platform: 'Flipkart',
                });
              }
            }
            Object.values(obj).forEach(findProducts);
          };
          findProducts(json);
        } catch (_) {}
        resolve(results.slice(0, 40));
      });
    }).on('error', () => resolve(results));
  });
}

// ══════════════════════════════════════════════════════════════════
//  BIGBASKET — Offers / Savings page
// ══════════════════════════════════════════════════════════════════
async function scrapeBigBasketDeals() {
  return new Promise((resolve) => {
    const results = [];
    const slugs = ['offers', 'smart-value', 'best-offers'];
    let completed = 0;
    slugs.forEach((slug) => {
      const baseOptions = getScraperApiOptions('www.bigbasket.com', `/product/get-products/?slug=${slug}&pg=1&ps=20&order=discount`, 'GET');
      const options = {
        ...baseOptions,
        headers: {
          'User-Agent': STEALTH_HEADERS['User-Agent'],
          Accept: 'application/json',
          Referer: 'https://www.bigbasket.com/',
          'x-channel': 'BB-APP',
        },
      };
      https.get(options, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            const prods = json?.tabs?.[0]?.product_info?.products || [];
            prods.forEach((p) => {
              const sp = p?.sp || 0;
              const mrp = p?.mrp || sp;
              const disc = mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
              if (sp > 0 && disc >= 5) {
                results.push({
                  title: clean(`${p?.brand?.name || ''} ${p?.desc || ''}`),
                  currentPrice: sp,
                  originalPrice: mrp,
                  discountPercent: disc,
                  isFlashDeal: false,
                  avgRating: p?.rating?.value || 0,
                  ratingsCount: p?.rating?.count || 0,
                  imageUrl: p?.images?.[0]?.s?.replace('{fmt}', 'jpg') || '',
                  platform: 'BigBasket',
                });
              }
            });
          } catch (_) {}
          completed++;
          if (completed === slugs.length) resolve(results);
        });
      }).on('error', () => {
        completed++;
        if (completed === slugs.length) resolve(results);
      });
    });
  });
}

// ══════════════════════════════════════════════════════════════════
//  BLINKIT — Homepage deals + category offers
// ══════════════════════════════════════════════════════════════════
async function scrapeBlinkitDeals(browser) {
  const page = await newStealthPage(browser);
  const results = [];
  const apiResults = [];
  try {
    page.on('response', async (response) => {
      const url = response.url();
      if ((url.includes('/v2/category') || url.includes('/v2/home') || url.includes('/v2/widget')) && response.status() === 200) {
        try {
          const json = await response.json();
          const extract = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (Array.isArray(obj)) { obj.forEach(extract); return; }
            if (obj.name && (obj.mrp || obj.price || obj.sale_price)) {
              const mrp = obj.mrp || 0;
              const sp = obj.sale_price || obj.price || mrp;
              const disc = mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
              if (sp > 0 && disc >= 5) {
                apiResults.push({
                  title: clean(obj.name),
                  currentPrice: sp,
                  originalPrice: mrp,
                  discountPercent: disc,
                  isFlashDeal: false,
                  avgRating: obj.rating || 0,
                  ratingsCount: obj.rating_count || 0,
                  imageUrl: obj.image_url || obj.image || '',
                  platform: 'Blinkit',
                });
              }
            }
            Object.values(obj).forEach(extract);
          };
          extract(json);
        } catch (_) {}
      }
    });

    const proxyHomeUrl = getProxyUrl('https://blinkit.com', true);
    await page.goto(proxyHomeUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate((pin) => {
      document.cookie = `userPin=${pin}; path=/`;
      document.cookie = `gr_1=${pin}; path=/`;
    }, PINCODE);
    await delay(1000);
    await page.goto(proxyHomeUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(rand(2000, 4000));

    const offerUrls = [
      'https://blinkit.com/cn/deals-of-the-day/cid/2979/1192',
      'https://blinkit.com/cn/price-drop/cid/2980/1192',
    ];
    for (const url of offerUrls) {
      try {
        const proxyOfferUrl = getProxyUrl(url, true);
        await page.goto(proxyOfferUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await delay(rand(1500, 3000));
      } catch (_) {}
    }
    const seen = new Set();
    apiResults.forEach((d) => {
      if (!seen.has(d.title)) {
        seen.add(d.title);
        results.push(d);
      }
    });
  } catch (err) {
    console.error(`   ❌ Blinkit: ${err.message.split('\n')[0]}`);
  } finally {
    await page.close();
  }
  return results;
}

// ══════════════════════════════════════════════════════════════════
//  ZEPTO — Offers / deals section via API
// ══════════════════════════════════════════════════════════════════
async function scrapeZeptoDeals() {
  return new Promise((resolve) => {
    const results = [];
    const body = JSON.stringify({ store_id: '17', page: 'HOME' });
    const baseOptions = getScraperApiOptions('api.zeptonow.com', '/api/v3/home', 'POST');
    const req = https.request({
      ...baseOptions,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': STEALTH_HEADERS['User-Agent'],
        'app-version': '12.15.8',
        Origin: 'https://www.zeptonow.com',
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const extract = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (Array.isArray(obj)) { obj.forEach(extract); return; }
            if (obj.name && (obj.mrp || obj.discountedPrice || obj.sellingPrice)) {
              const mrpRaw = obj.mrp || 0;
              const spRaw = obj.discountedPrice || obj.sellingPrice || mrpRaw;
              const mrp = mrpRaw > 10000 ? mrpRaw / 100 : mrpRaw;
              const sp = spRaw > 10000 ? spRaw / 100 : spRaw;
              const disc = mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
              if (sp > 0 && disc >= 5) {
                results.push({
                  title: clean(obj.name),
                  currentPrice: sp,
                  originalPrice: mrp,
                  discountPercent: disc,
                  isFlashDeal: false,
                  avgRating: obj.rating || 0,
                  ratingsCount: obj.ratingCount || 0,
                  imageUrl: obj.imageUrl || obj.image || '',
                  platform: 'Zepto',
                });
              }
            }
            Object.values(obj).forEach(extract);
          };
          extract(json);
        } catch (_) {}
        resolve(results.slice(0, 40));
      });
    });
    req.on('error', () => resolve(results));
    req.write(body);
    req.end();
  });
}

// ══════════════════════════════════════════════════════════════════
//  SCORING + UPLOAD
// ══════════════════════════════════════════════════════════════════
function scoreAndRank(deals) {
  return deals
    .filter((d) => d.title && d.currentPrice > 0)
    .map((d) => ({ ...d, hotScore: calculateHotScore(d) }))
    .sort((a, b) => b.hotScore - a.hotScore);
}

async function uploadToBackend(deals) {
  if (!BACKEND_URL || !deals.length) {
    console.log('⚠️  Skipping upload (no backend URL or 0 deals)');
    return;
  }
  const BATCH_SIZE = 25;
  let uploaded = 0;
  for (let i = 0; i < deals.length; i += BATCH_SIZE) {
    const batch = deals.slice(i, i + BATCH_SIZE).map((d) => ({
      product_name: d.title,
      brand: '',
      category: '',
      image_url: d.imageUrl || '',
      platform: d.platform,
      price: d.currentPrice,
      mrp: d.originalPrice,
      discount_pct: d.discountPercent,
      hot_score: d.hotScore,
      deal_tier: d.hotScore >= 80 ? 'on_fire' : d.hotScore >= 60 ? 'trending' : d.hotScore >= 40 ? 'worth_noting' : 'regular',
      tags: [],
      stock_status: 'in_stock',
      delivery_time: '',
      product_url: '',
      deal_badge: d.isFlashDeal ? 'Flash Deal' : '',
    }));
    const payload = JSON.stringify({ deals: batch });
    await new Promise((resolve) => {
      const url = new URL(BACKEND_URL + '/deals/collect');
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      }, (res) => {
        let respBody = '';
        res.on('data', (c) => (respBody += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(respBody);
            uploaded += json?.saved || batch.length;
            console.log(`   📤 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} deals → ${json?.saved || '?'} saved`);
          } catch (_) { console.log(`   📤 Batch ${Math.floor(i / BATCH_SIZE) + 1}: HTTP ${res.statusCode}`); }
          resolve();
        });
      });
      req.on('error', (e) => { console.error(`   ❌ Upload error: ${e.message}`); resolve(); });
      req.write(payload);
      req.end();
    });
  }
  console.log(`\n🚀 Upload complete: ${uploaded}/${deals.length} deals saved`);
}

// ══════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════
(async () => {
  console.log('\n🔥 CompareX Deal Scraper v3.0 — Deals Pages');
  console.log(`   City: ${CITY} | Pincode: ${PINCODE}`);
  console.log(`   Strategy: Scrape dedicated DEALS/OFFERS pages`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--disable-web-security'],
  });

  const stats = {};
  console.log('🛒 Amazon — Today\'s Deals...');
  const amazonDeals = await scrapeAmazonDeals(browser);
  stats.Amazon = amazonDeals.length;
  console.log(`   Total: ${amazonDeals.length} deals\n`);
  await delay(rand(1000, 2000));

  console.log('🛒 Flipkart — Offers Store...');
  const flipkartDeals = await scrapeFlipkartDeals();
  stats.Flipkart = flipkartDeals.length;
  console.log(`   Total: ${flipkartDeals.length} deals\n`);

  console.log('🛒 BigBasket — Best Offers...');
  const bigbasketDeals = await scrapeBigBasketDeals();
  stats.BigBasket = bigbasketDeals.length;
  console.log(`   Total: ${bigbasketDeals.length} deals\n`);

  console.log('🛒 Blinkit — Deals of the Day...');
  const blinkitDeals = await scrapeBlinkitDeals(browser);
  stats.Blinkit = blinkitDeals.length;
  console.log(`   Total: ${blinkitDeals.length} deals\n`);
  await delay(rand(1000, 2000));

  console.log('🛒 Zepto — Offers...');
  const zeptoDeals = await scrapeZeptoDeals();
  stats.Zepto = zeptoDeals.length;
  console.log(`   Total: ${zeptoDeals.length} deals\n`);

  await browser.close();

  const allDeals = [...amazonDeals, ...flipkartDeals, ...bigbasketDeals, ...blinkitDeals, ...zeptoDeals];
  const rankedDeals = scoreAndRank(allDeals);

  console.log('╔══════════════ SCRAPER SUMMARY v3.0 ══════════════╗');
  for (const [platform, count] of Object.entries(stats)) {
    console.log(`║  ${platform.padEnd(10)}: ${String(count).padStart(4)} deals from offers page       ║`);
  }
  console.log(`║  TOTAL     : ${String(rankedDeals.length).padStart(4)} deals scored + ranked          ║`);
  console.log('╚══════════════════════════════════════════════════╝');

  fs.mkdirSync('output', { recursive: true });
  fs.writeFileSync('output/deals.json', JSON.stringify(rankedDeals, null, 2));
  console.log(`\n💾 Saved ${rankedDeals.length} deals to output/deals.json`);

  if (rankedDeals.length > 0) {
    console.log('\n🏆 Top 5 Deals:');
    rankedDeals.slice(0, 5).forEach((d, i) => {
      console.log(`   ${i + 1}. [${d.platform}] ${d.title.slice(0, 45)} — ₹${d.currentPrice} (${d.discountPercent}% off) Score:${d.hotScore}`);
    });
  }

  await uploadToBackend(rankedDeals);
  console.log('\n✅ Done! Next run in 4 hours.\n');
})();
