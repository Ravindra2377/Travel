package handlers

import (
	"comparez/database"
	"comparez/models"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

// ── POST /deals/collect ──
// Frontend pushes scored deals after each scrape cycle
func CollectDeals(c echo.Context) error {
	log.Printf("📥 Received deals collection from frontend")

	var req struct {
		Deals []struct {
			ProductName  string  `json:"product_name"`
			Brand        string  `json:"brand"`
			Category     string  `json:"category"`
			ImageURL     string  `json:"image_url"`
			Platform     string  `json:"platform"`
			Price        float64 `json:"price"`
			MRP          float64 `json:"mrp"`
			DiscountPct  int     `json:"discount_pct"`
			HotScore     float64 `json:"hot_score"`
			DealTier     string  `json:"deal_tier"`
			Tags         []string `json:"tags"`
			DealBadge    string  `json:"deal_badge"`
			StockStatus  string  `json:"stock_status"`
			DeliveryTime string  `json:"delivery_time"`
			ProductURL   string  `json:"product_url"`
			Fingerprint  string  `json:"fingerprint"`
		} `json:"deals"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request format",
		})
	}

	if database.DB == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"error": "Database not connected",
		})
	}

	saved := 0
	for _, d := range req.Deals {
		if d.ProductName == "" || d.Price <= 0 {
			continue
		}

		// Compute savings
		savings := 0.0
		if d.MRP > d.Price {
			savings = d.MRP - d.Price
		}

		// Serialize tags to JSON string
		tagsJSON, _ := json.Marshal(d.Tags)

		// Generate fingerprint if not provided
		fp := d.Fingerprint
		if fp == "" {
			fp = strings.ToLower(d.ProductName)
			fp = strings.ReplaceAll(fp, " ", "")
			if len(fp) > 100 {
				fp = fp[:100]
			}
		}

		deal := models.HotDeal{
			ProductName:  d.ProductName,
			Brand:        d.Brand,
			Category:     d.Category,
			ImageURL:     d.ImageURL,
			Platform:     d.Platform,
			Price:        d.Price,
			MRP:          d.MRP,
			DiscountPct:  d.DiscountPct,
			Savings:      savings,
			HotScore:     d.HotScore,
			DealTier:     d.DealTier,
			Tags:         string(tagsJSON),
			DealBadge:    d.DealBadge,
			StockStatus:  d.StockStatus,
			DeliveryTime: d.DeliveryTime,
			ProductURL:   d.ProductURL,
			Fingerprint:  fp,
			ScrapedAt:    time.Now(),
			ExpiresAt:    time.Now().Add(24 * time.Hour),
		}

		// Upsert: update existing deal if same fingerprint + platform, otherwise insert
		existing := models.HotDeal{}
		result := database.DB.Where("fingerprint = ? AND platform = ?", fp, d.Platform).First(&existing)
		if result.Error == nil {
			// Update existing
			database.DB.Model(&existing).Updates(deal)
		} else {
			// Insert new
			database.DB.Create(&deal)
		}
		saved++
	}

	log.Printf("✅ Collected %d deals (%d saved/updated)", len(req.Deals), saved)
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":    "collected",
		"received":  len(req.Deals),
		"saved":     saved,
		"timestamp": time.Now(),
	})
}

// ── GET /deals/trending ──
// Returns top trending deals sorted by hot_score
func GetTrendingDeals(c echo.Context) error {
	tier := c.QueryParam("tier")
	category := c.QueryParam("category")
	platform := c.QueryParam("platform")
	limitStr := c.QueryParam("limit")

	limit := 20
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	if database.DB == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"error": "Database not connected",
		})
	}

	query := database.DB.Model(&models.HotDeal{}).
		Where("scraped_at > ?", time.Now().Add(-24*time.Hour)).
		Where("stock_status != ?", "out_of_stock").
		Order("hot_score DESC")

	if tier != "" {
		query = query.Where("deal_tier = ?", tier)
	}
	if category != "" {
		query = query.Where("category ILIKE ?", "%"+category+"%")
	}
	if platform != "" {
		query = query.Where("platform = ?", platform)
	}

	var deals []models.HotDeal
	query.Limit(limit).Find(&deals)

	// Parse tags JSON strings back to arrays for the response
	type DealResponse struct {
		models.HotDeal
		ParsedTags []string `json:"parsed_tags"`
	}

	responses := make([]DealResponse, len(deals))
	for i, d := range deals {
		responses[i] = DealResponse{HotDeal: d}
		if d.Tags != "" {
			json.Unmarshal([]byte(d.Tags), &responses[i].ParsedTags)
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"deals":      responses,
		"count":      len(responses),
		"updated_at": time.Now(),
	})
}

// ── GET /deals/price-history ──
// Returns price history for a product fingerprint
func GetPriceHistory(c echo.Context) error {
	fingerprint := c.QueryParam("fingerprint")
	if fingerprint == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "fingerprint parameter is required",
		})
	}

	if database.DB == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{
			"error": "Database not connected",
		})
	}

	// Get all historical prices for this product across platforms
	var history []struct {
		Platform  string    `json:"platform"`
		Price     float64   `json:"price"`
		ScrapedAt time.Time `json:"scraped_at"`
	}

	database.DB.Model(&models.HotDeal{}).
		Select("platform, price, scraped_at").
		Where("fingerprint = ?", fingerprint).
		Where("scraped_at > ?", time.Now().Add(-30*24*time.Hour)). // Last 30 days
		Order("scraped_at ASC").
		Find(&history)

	// Calculate 7-day-ago price per platform
	sevenDaysAgo := time.Now().Add(-7 * 24 * time.Hour)
	priceHistory := map[string]float64{}
	for _, h := range history {
		if h.ScrapedAt.Before(sevenDaysAgo) || h.ScrapedAt.Equal(sevenDaysAgo) {
			priceHistory[h.Platform] = h.Price
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"fingerprint":   fingerprint,
		"history":       history,
		"price_7d_ago":  priceHistory,
		"data_points":   len(history),
	})
}
