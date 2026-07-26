package handlers

import (
	"comparez/database"
	"comparez/models"
	"context"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// SearchResult represents a product search result from frontend
type SearchResult struct {
	Query       string                              `json:"query"`
	Timestamp   time.Time                           `json:"timestamp"`
	ResultCount int                                 `json:"result_count"`
	Platforms   map[string][]models.PlatformListing `json:"platforms"`
}

// CollectSearchResults receives search results from frontend for analytics/caching
// POST /search/collect
func CollectSearchResults(c echo.Context) error {
	var req struct {
		Query     string                              `json:"query"`
		Platforms map[string][]models.PlatformListing `json:"platforms"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request format",
		})
	}

	req.Query = strings.TrimSpace(req.Query)
	if req.Query == "" || len(req.Query) > 200 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Query is required",
		})
	}

	// Count total results
	totalResults := 0
	for _, products := range req.Platforms {
		totalResults += len(products)
	}

	// Store in database for testing and history
	if database.DB != nil {
		uid, ok := authenticatedUserObjectID(c)
		if !ok {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		}

		history := models.SearchHistory{
			ID:          primitive.NewObjectID(),
			Query:       req.Query,
			UserID:      uid,
			ResultCount: totalResults,
			CreatedAt:   time.Now(),
		}

		// Determine best price and platform
		var bestPrice float64
		var bestPlatform string

		allListings := []models.PlatformListing{}
		for platform, listings := range req.Platforms {
			for _, l := range listings {
				l.ID = primitive.NewObjectID()
				l.SearchHistoryID = history.ID
				l.Platform = platform // Ensure platform is set
				l.ScrapedAt = time.Now()
				if l.DeepLink == "" && l.ProductURL != "" {
					l.DeepLink = l.ProductURL
				}
				allListings = append(allListings, l)

				if l.Price > 0 && (bestPrice == 0 || l.Price < bestPrice) {
					bestPrice = l.Price
					bestPlatform = platform
				}
			}
		}

		history.BestPrice = bestPrice
		history.BestPlatform = bestPlatform
		history.Listings = allListings

		collection := database.DB.Collection("search_history")
		if _, err := collection.InsertOne(context.TODO(), history); err != nil {
			log.Printf("❌ Failed to save search history: %v", err)
		} else {
			log.Printf("✅ Saved search history (ID: %s) with %d listings", history.ID.Hex(), len(allListings))
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":        "collected",
		"query":         req.Query,
		"platforms":     len(req.Platforms),
		"total_results": totalResults,
	})
}

// GetSearchHistory returns recent searches for the user
// GET /search/history?limit=10
func GetSearchHistory(c echo.Context) error {
	uid, ok := authenticatedUserObjectID(c)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
	}
	limit := int64(10)
	if raw := c.QueryParam("limit"); raw != "" {
		if parsed, err := strconv.ParseInt(raw, 10, 64); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}
	if database.DB == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Database unavailable"})
	}

	cursor, err := database.DB.Collection("search_history").Find(
		c.Request().Context(),
		bson.M{"user_id": uid},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}).SetLimit(limit),
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not load search history"})
	}
	defer cursor.Close(c.Request().Context())

	searches := make([]models.SearchHistory, 0, limit)
	for cursor.Next(c.Request().Context()) {
		var item models.SearchHistory
		if err := cursor.Decode(&item); err == nil {
			item.Listings = nil
			searches = append(searches, item)
		}
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"searches": searches,
		"count":    len(searches),
	})
}

// ValidateTokens checks if stored tokens are still valid by testing each platform
// GET /search/validate
func ValidateTokens(c echo.Context) error {
	key, ok := accountKey(c)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
	}

	Store.mu.RLock()
	deviceTokens, exists := Store.byKey[key]
	Store.mu.RUnlock()

	if !exists {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"valid":    []string{},
			"invalid":  []string{},
			"untested": []string{},
			"message":  "No tokens stored",
		})
	}

	// For each platform, check if tokens exist
	valid := make([]string, 0)
	invalid := make([]string, 0)

	for platform, tokens := range deviceTokens.Platforms {
		if len(tokens) > 0 {
			// Basic validation: check if required keys exist
			hasTokens := false
			switch platform {
			case "Blinkit":
				hasTokens = tokens["auth"] != "" || tokens["cookie"] != ""
			case "Zepto":
				hasTokens = tokens["user"] != "" || tokens["cookie"] != ""
			case "BigBasket":
				hasTokens = tokens["cookie"] != ""
			default:
				hasTokens = len(tokens) > 0
			}

			if hasTokens {
				valid = append(valid, platform)
			} else {
				invalid = append(invalid, platform)
			}
		} else {
			invalid = append(invalid, platform)
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"valid":     valid,
		"invalid":   invalid,
		"message":   "Token validation completed",
		"timestamp": time.Now(),
	})
}
