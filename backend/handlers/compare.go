package handlers

import (
	"comparez/scraper"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

// ScraperSvc is the global scraper service instance
var ScraperSvc *scraper.Service

// CompareProducts handles GET /compare?q=eggs&lat=12.97&lng=77.59
func CompareProducts(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Query parameter 'q' is required",
		})
	}

	// Default location: Bangalore center
	lat := 12.9716
	lng := 77.5946

	if latStr := c.QueryParam("lat"); latStr != "" {
		if parsed, err := strconv.ParseFloat(latStr, 64); err == nil {
			lat = parsed
		}
	}
	if lngStr := c.QueryParam("lng"); lngStr != "" {
		if parsed, err := strconv.ParseFloat(lngStr, 64); err == nil {
			lng = parsed
		}
	}

	if ScraperSvc == nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Scraper service not initialized",
		})
	}

	// Platform credentials are retrieved only from the authenticated user's
	// server-side session. They are never accepted through request headers.
	userTokens := GetTokensForRequest(c)

	result, err := ScraperSvc.Compare(c.Request().Context(), query, lat, lng, userTokens)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Comparison failed: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, result)
}
