/**
 * DealScoringService — CompareZ HOTDEAL Algorithm (Phase 2)
 *
 * Calculates a HotScore (0–100) for every scraped product listing,
 * assigns a deal tier, and auto-generates display tags.
 *
 * Scoring Dimensions:
 *   1. Discount Score        (0–30 pts)
 *   2. Price-Drop Velocity   (0–20 pts)  — requires price history
 *   3. Popularity Score      (0–20 pts)
 *   4. Scarcity Score        (0–15 pts)
 *   5. Deal Freshness        (0–10 pts)
 *   6. Delivery Speed Bonus  (0–5 pts)
 *   7. Platform Trust Mult.  (×0.85–1.0)
 */

class DealScoringService {
  // ── Platform trust weights ──
  static TRUST = {
    Amazon: 1.0,
    Flipkart: 1.0,
    BigBasket: 0.95,
    Blinkit: 0.9,
    Zepto: 0.9,
  };

  // ── Tier thresholds ──
  static TIERS = [
    { min: 80, tier: "on_fire", emoji: "🔴", label: "On Fire" },
    { min: 60, tier: "trending", emoji: "🟠", label: "Trending" },
    { min: 40, tier: "worth_noting", emoji: "🟡", label: "Worth Noting" },
    { min: 0, tier: "regular", emoji: "🟢", label: "Regular Deal" },
  ];

  /**
   * Score a single product listing.
   *
   * @param {Object} deal  — PlatformListing from the scraper
   * @param {Object|null} priceHistory — optional { price_7d_ago, avg_price_30d }
   * @returns {{ hot_score, deal_tier, tier_emoji, tier_label, discount_pct, tags }}
   */
  static calculateHotScore(deal, priceHistory = null) {
    // ── 1. Discount Score (0–30) ──
    let discountPct = 0;
    if (deal.discount) {
      const m = String(deal.discount).match(/(\d+)\s*%/);
      if (m) discountPct = parseInt(m[1], 10);
    }
    if (discountPct === 0 && deal.mrp > 0 && deal.price > 0 && deal.mrp > deal.price) {
      discountPct = Math.round(((deal.mrp - deal.price) / deal.mrp) * 100);
    }
    const discountScore = Math.min(discountPct * 0.6, 30);

    // ── 2. Price-Drop Velocity (0–20) ──
    let velocityScore = 0;
    if (priceHistory && priceHistory.price_7d_ago > 0 && deal.price > 0) {
      const velocity =
        (priceHistory.price_7d_ago - deal.price) / priceHistory.price_7d_ago;
      if (velocity > 0) velocityScore = Math.min(velocity * 100, 20);
    }

    // ── 3. Popularity (0–20) ──
    let popularityScore = 0;
    const ratingCount = deal.rating_count || deal.ratingCount || 0;
    if (ratingCount > 0) {
      popularityScore = Math.min(Math.log10(ratingCount + 1) * 4, 15);
    }
    const rating = deal.rating || 0;
    if (rating >= 4.0) popularityScore += 5;
    popularityScore = Math.min(popularityScore, 20);

    // ── 4. Scarcity (0–15) ──
    let scarcityScore = 5; // default: in_stock
    const stockStatus = deal.stock_status || (deal.in_stock === false ? "out_of_stock" : "in_stock");
    if (stockStatus === "limited" || deal.deal_badge) {
      scarcityScore = 15;
    } else if (stockStatus === "out_of_stock") {
      scarcityScore = 0;
    }

    // ── 5. Freshness (0–10) ──
    const scrapedAt = deal.scraped_at || deal.scrapedAt || Date.now();
    const ageHours =
      (Date.now() - new Date(scrapedAt).getTime()) / 3_600_000;
    const freshnessScore = Math.max(10 - ageHours, 0);

    // ── 6. Delivery Speed Bonus (0–5) ──
    let deliveryBonus = 0;
    const dTime = String(deal.delivery_time || deal.deliveryTime || "");
    const mins = parseInt(dTime, 10) || 0;
    if (mins > 0 && mins <= 15) deliveryBonus = 5;
    else if (mins > 15 && mins <= 60) deliveryBonus = 3;

    // ── 7. Trust multiplier ──
    const weight = DealScoringService.TRUST[deal.platform] || 0.85;

    // ── Aggregate ──
    const raw =
      discountScore +
      velocityScore +
      popularityScore +
      scarcityScore +
      freshnessScore +
      deliveryBonus;

    const hotScore = Math.min(Math.max(Math.round(raw * weight * 10) / 10, 0), 100);

    // ── Tier ──
    const { tier, emoji, label } =
      DealScoringService.TIERS.find((t) => hotScore >= t.min) ||
      DealScoringService.TIERS[DealScoringService.TIERS.length - 1];

    // ── Tags ──
    const tags = [];
    if (discountPct >= 50) tags.push("🔥 Mega Discount");
    else if (discountPct >= 30) tags.push("💰 Great Deal");
    if (deliveryBonus === 5) tags.push("⚡ Instant Delivery");
    if (deal.deal_badge) tags.push(`🏷️ ${deal.deal_badge}`);
    if (rating >= 4.5) tags.push("⭐ Top Rated");

    return {
      hot_score: hotScore,
      deal_tier: tier,
      tier_emoji: emoji,
      tier_label: label,
      discount_pct: discountPct,
      tags,
    };
  }

  /**
   * Score an array of deals and sort by hot_score descending.
   */
  static scoreAll(deals, priceHistoryMap = {}) {
    return deals
      .map((deal) => {
        const history = priceHistoryMap[deal.product_name || deal.productName] || null;
        const scoring = DealScoringService.calculateHotScore(deal, history);
        return { ...deal, ...scoring };
      })
      .sort((a, b) => b.hot_score - a.hot_score);
  }

  /**
   * Detect cross-platform trends and apply bonuses.
   * Call AFTER all platforms have been scraped for the same query.
   */
  static detectTrending(scoredDeals) {
    // Group by product fingerprint
    const groups = {};

    scoredDeals.forEach((deal) => {
      const fp = (deal.product_name || deal.productName || "")
        .toLowerCase()
        .replace(/\b\d+\s*(g|kg|ml|l|pcs?|pack)\b/gi, "")
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 30);

      if (!groups[fp]) groups[fp] = [];
      groups[fp].push(deal);
    });

    Object.values(groups).forEach((group) => {
      const platforms = new Set(group.map((d) => d.platform));

      if (platforms.size >= 3) {
        group.forEach((d) => {
          d.hot_score = Math.min(d.hot_score + 10, 100);
          d.tags = [...(d.tags || []), "🔥 Hot Across Platforms"];
        });
      } else if (platforms.size >= 2) {
        group.forEach((d) => {
          d.hot_score = Math.min(d.hot_score + 5, 100);
          d.tags = [...(d.tags || []), "📊 Multi-Platform"];
        });
      }

      // Mark the cheapest in each group
      if (group.length > 1) {
        const cheapest = group.reduce((a, b) =>
          (a.price || Infinity) < (b.price || Infinity) ? a : b
        );
        cheapest.tags = [...(cheapest.tags || []), "💰 Best Price"];
      }
    });

    // Re-sort after bonuses
    return scoredDeals.sort((a, b) => b.hot_score - a.hot_score);
  }
}

export default DealScoringService;
