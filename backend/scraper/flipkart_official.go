package scraper

import (
	"comparez/config"
	"comparez/models"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

func (f *FlipkartScraper) fetchOfficialListings(ctx context.Context, query string) ([]models.PlatformListing, error) {
	cfg := config.AppConfig.Flipkart
	affiliateID := strings.TrimSpace(firstNonEmpty(cfg.Headers["affiliate_id"], os.Getenv("FLIPKART_AFFILIATE_ID")))
	affiliateToken := strings.TrimSpace(firstNonEmpty(cfg.Headers["affiliate_token"], os.Getenv("FLIPKART_AFFILIATE_TOKEN")))
	baseURL := strings.TrimSpace(cfg.BaseURL)
	if baseURL == "" {
		baseURL = "https://affiliate-api.flipkart.net/affiliate/search/json"
	}

	if affiliateID == "" || affiliateToken == "" {
		return nil, fmt.Errorf("flipkart affiliate api credentials not configured")
	}

	requestURL, err := url.Parse(baseURL)
	if err != nil {
		return nil, err
	}
	params := requestURL.Query()
	params.Set("query", query)
	params.Set("resultCount", "15")
	requestURL.RawQuery = params.Encode()

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL.String(), nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Fk-Affiliate-Id", affiliateID)
	request.Header.Set("Fk-Affiliate-Token", affiliateToken)
	request.Header.Set("Accept", "application/json")
	request.Header.Set("User-Agent", "CompareX/1.0")

	response, err := f.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("flipkart affiliate api status: %d", response.StatusCode)
	}

	var payload map[string]interface{}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, err
	}

	items := collectFlipkartProductMaps(payload)
	listings := make([]models.PlatformListing, 0, len(items))
	for _, item := range items {
		listing, ok := mapFlipkartOfficialItem(item)
		if !ok {
			continue
		}
		listings = append(listings, listing)
	}

	if len(listings) == 0 {
		return nil, fmt.Errorf("flipkart affiliate api returned no usable items")
	}

	return listings, nil
}

func collectFlipkartProductMaps(value interface{}) []map[string]interface{} {
	results := make([]map[string]interface{}, 0)
	walkFlipkartValue(value, &results)
	return results
}

func walkFlipkartValue(value interface{}, results *[]map[string]interface{}) {
	switch node := value.(type) {
	case map[string]interface{}:
		if looksLikeFlipkartItem(node) {
			*results = append(*results, node)
		}
		for _, child := range node {
			walkFlipkartValue(child, results)
		}
	case []interface{}:
		for _, child := range node {
			walkFlipkartValue(child, results)
		}
	}
}

func looksLikeFlipkartItem(item map[string]interface{}) bool {
	_, hasTitle := findStringValue(item, "title", "productTitle", "name", "productName")
	if hasTitle {
		return true
	}
	_, hasPrice := findFloatValue(item, "price", "sellingPrice", "flipkartSellingPrice", "discountedPrice", "maximumRetailPrice")
	return hasPrice
}

func mapFlipkartOfficialItem(item map[string]interface{}) (models.PlatformListing, bool) {
	info := firstMapValue(item, "productBaseInfoV1", "productBaseInfo", "productInfoV1", "productInfo")
	if info == nil {
		info = item
	}

	title, ok := findStringValue(info, "title", "productTitle", "name", "productName")
	if !ok {
		if nested := firstMapValue(item, "productBaseInfoV1", "productBaseInfo", "productInfoV1", "productInfo"); nested != nil {
			title, ok = findStringValue(nested, "title", "productTitle", "name", "productName")
		}
	}
	if !ok || strings.TrimSpace(title) == "" {
		return models.PlatformListing{}, false
	}

	price, priceOK := findFloatValue(info, "flipkartSellingPrice", "sellingPrice", "discountedPrice", "finalPrice", "price")
	if !priceOK {
		price, priceOK = findFloatValue(item, "flipkartSellingPrice", "sellingPrice", "discountedPrice", "finalPrice", "price")
	}
	if !priceOK || price <= 0 {
		return models.PlatformListing{}, false
	}

	mrp, mrpOK := findFloatValue(info, "maximumRetailPrice", "mrp", "listingPrice", "originalPrice")
	if !mrpOK {
		mrp, mrpOK = findFloatValue(item, "maximumRetailPrice", "mrp", "listingPrice", "originalPrice")
	}
	if !mrpOK || mrp <= 0 {
		mrp = price
	}

	imageURL := firstStringValue(info, "imageUrl", "imageURL", "image", "thumbnail")
	if imageURL == "" {
		if nested := firstMapValue(info, "imageUrls", "images"); nested != nil {
			imageURL = firstStringFromMap(nested)
		}
	}
	if imageURL == "" {
		imageURL = firstStringValue(item, "imageUrl", "imageURL", "image", "thumbnail")
	}

	productURL := firstStringValue(info, "productUrl", "url", "affiliateLink", "trackingUrl")
	if productURL == "" {
		productURL = firstStringValue(item, "productUrl", "url", "affiliateLink", "trackingUrl")
	}

	return models.PlatformListing{
		Platform:    "Flipkart",
		ProductName: strings.TrimSpace(title),
		Price:       price,
		MRP:         mrp,
		ImageURL:    strings.TrimSpace(imageURL),
		InStock:     true,
		DeepLink:    strings.TrimSpace(productURL),
		ScrapedAt:   time.Now(),
	}, true
}

func firstMapValue(item map[string]interface{}, keys ...string) map[string]interface{} {
	for _, key := range keys {
		if value, ok := item[key]; ok {
			if nested, ok := value.(map[string]interface{}); ok {
				return nested
			}
		}
	}
	return nil
}

func firstStringValue(item map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if value, ok := item[key]; ok {
			switch typed := value.(type) {
			case string:
				if strings.TrimSpace(typed) != "" {
					return typed
				}
			case fmt.Stringer:
				if strings.TrimSpace(typed.String()) != "" {
					return typed.String()
				}
			}
		}
	}
	return ""
}

func findStringValue(item map[string]interface{}, keys ...string) (string, bool) {
	value := firstStringValue(item, keys...)
	if value == "" {
		return "", false
	}
	return value, true
}

func findFloatValue(item map[string]interface{}, keys ...string) (float64, bool) {
	for _, key := range keys {
		value, ok := item[key]
		if !ok {
			continue
		}
		if amount, ok := extractFloat(value); ok {
			return amount, true
		}
		if nested, ok := value.(map[string]interface{}); ok {
			if amount, ok := extractFloatFromMap(nested); ok {
				return amount, true
			}
		}
	}
	return 0, false
}

func extractFloat(value interface{}) (float64, bool) {
	switch typed := value.(type) {
	case float64:
		return typed, true
	case float32:
		return float64(typed), true
	case int:
		return float64(typed), true
	case int64:
		return float64(typed), true
	case json.Number:
		amount, err := typed.Float64()
		if err == nil {
			return amount, true
		}
	}
	return 0, false
}

func extractFloatFromMap(item map[string]interface{}) (float64, bool) {
	if amount, ok := extractFloat(item["amount"]); ok {
		return amount, true
	}
	if amount, ok := extractFloat(item["value"]); ok {
		return amount, true
	}
	if amount, ok := extractFloat(item["sp"]); ok {
		return amount, true
	}
	if amount, ok := extractFloat(item["mrp"]); ok {
		return amount, true
	}
	return 0, false
}

func firstStringFromMap(item map[string]interface{}) string {
	for _, value := range item {
		switch typed := value.(type) {
		case string:
			if strings.TrimSpace(typed) != "" {
				return typed
			}
		case map[string]interface{}:
			if nested := firstStringFromMap(typed); nested != "" {
				return nested
			}
		case []interface{}:
			for _, child := range typed {
				if s, ok := child.(string); ok && strings.TrimSpace(s) != "" {
					return s
				}
				if nested, ok := child.(map[string]interface{}); ok {
					if s := firstStringFromMap(nested); s != "" {
						return s
					}
				}
			}
		}
	}
	return ""
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
