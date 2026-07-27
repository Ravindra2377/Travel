package handlers

import (
	"comparez/database"
	"comparez/models"
	"math"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const maxPriceHistoryDocuments int64 = 1000

type priceHistoryPoint struct {
	Date  string  `json:"date"`
	Price float64 `json:"price"`
}

type priceHistorySummary struct {
	Days             int                 `json:"days"`
	ProductName      string              `json:"product_name"`
	CurrentPrice     float64             `json:"current_price"`
	UsualPrice       float64             `json:"usual_price"`
	LowestPrice      float64             `json:"lowest_price"`
	HighestPrice     float64             `json:"highest_price"`
	ObservationCount int                 `json:"observation_count"`
	DistinctDays     int                 `json:"distinct_days"`
	Status           string              `json:"status"`
	Verdict          string              `json:"verdict"`
	Points           []priceHistoryPoint `json:"points"`
}

func normalizeHistoryTokens(value string) []string {
	var builder strings.Builder
	builder.Grow(len(value))
	for _, r := range strings.ToLower(value) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			builder.WriteRune(r)
		} else {
			builder.WriteByte(' ')
		}
	}

	stopWords := map[string]struct{}{
		"the": {}, "and": {}, "with": {}, "for": {}, "pack": {}, "pouch": {},
		"buy": {}, "online": {}, "fresh": {}, "best": {}, "value": {},
	}
	seen := make(map[string]struct{})
	tokens := make([]string, 0)
	for _, token := range strings.Fields(builder.String()) {
		if len(token) < 2 {
			continue
		}
		if _, ignored := stopWords[token]; ignored {
			continue
		}
		if _, exists := seen[token]; exists {
			continue
		}
		seen[token] = struct{}{}
		tokens = append(tokens, token)
	}
	sort.Strings(tokens)
	return tokens
}

func historyProductSimilarity(target, candidate string) float64 {
	targetTokens := normalizeHistoryTokens(target)
	candidateTokens := normalizeHistoryTokens(candidate)
	if len(targetTokens) == 0 || len(candidateTokens) == 0 {
		return 0
	}

	targetSet := make(map[string]struct{}, len(targetTokens))
	for _, token := range targetTokens {
		targetSet[token] = struct{}{}
	}
	candidateSet := make(map[string]struct{}, len(candidateTokens))
	for _, token := range candidateTokens {
		candidateSet[token] = struct{}{}
	}

	intersection := 0
	for token := range targetSet {
		if _, exists := candidateSet[token]; exists {
			intersection++
		}
	}
	union := len(targetSet) + len(candidateSet) - intersection
	if union == 0 {
		return 0
	}
	return float64(intersection) / float64(union)
}

var historyQuantityPattern = regexp.MustCompile(
	`(?i)\b(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|gm|grams?|ml|millilitres?|milliliters?|l|ltr|litres?|liters?|pcs?|pieces?|pack)\b`,
)

func normalizeHistoryQuantity(value string) string {
	match := historyQuantityPattern.FindStringSubmatch(strings.ToLower(value))
	if len(match) != 3 {
		return ""
	}
	amount, err := strconv.ParseFloat(match[1], 64)
	if err != nil || amount <= 0 {
		return ""
	}

	unit := match[2]
	switch {
	case unit == "kg" || strings.HasPrefix(unit, "kilogram"):
		amount *= 1000
		unit = "g"
	case unit == "gm" || strings.HasPrefix(unit, "gram"):
		unit = "g"
	case unit == "l" || unit == "ltr" || strings.HasPrefix(unit, "litre") || strings.HasPrefix(unit, "liter"):
		amount *= 1000
		unit = "ml"
	case strings.HasPrefix(unit, "millilitre") || strings.HasPrefix(unit, "milliliter"):
		unit = "ml"
	case strings.HasPrefix(unit, "pc") || strings.HasPrefix(unit, "piece"):
		unit = "pc"
	}
	return strconv.FormatFloat(amount, 'f', -1, 64) + unit
}

func isComparableHistoryProduct(target, candidate string) bool {
	targetQuantity := normalizeHistoryQuantity(target)
	candidateQuantity := normalizeHistoryQuantity(candidate)
	if targetQuantity != "" && candidateQuantity != "" && targetQuantity != candidateQuantity {
		return false
	}

	targetNormalized := strings.Join(normalizeHistoryTokens(target), " ")
	candidateNormalized := strings.Join(normalizeHistoryTokens(candidate), " ")
	if targetNormalized == "" || candidateNormalized == "" {
		return false
	}
	if targetNormalized == candidateNormalized {
		return true
	}
	if strings.Contains(targetNormalized, candidateNormalized) ||
		strings.Contains(candidateNormalized, targetNormalized) {
		return true
	}
	return historyProductSimilarity(target, candidate) >= 0.5
}

func median(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	sortedValues := append([]float64(nil), values...)
	sort.Float64s(sortedValues)
	middle := len(sortedValues) / 2
	if len(sortedValues)%2 == 0 {
		return (sortedValues[middle-1] + sortedValues[middle]) / 2
	}
	return sortedValues[middle]
}

func roundPrice(value float64) float64 {
	return math.Round(value*100) / 100
}

func summarizePriceHistory(
	productName string,
	days int,
	searches []models.SearchHistory,
	currentPrice float64,
) priceHistorySummary {
	dailyLowest := make(map[string]float64)
	observationCount := 0

	for _, search := range searches {
		for _, listing := range search.Listings {
			if listing.Price <= 0 || !isComparableHistoryProduct(productName, listing.ProductName) {
				continue
			}
			observationCount++
			day := search.CreatedAt.UTC().Format("2006-01-02")
			if existing, ok := dailyLowest[day]; !ok || listing.Price < existing {
				dailyLowest[day] = listing.Price
			}
		}
	}

	today := time.Now().UTC().Format("2006-01-02")
	if currentPrice > 0 {
		if existing, ok := dailyLowest[today]; !ok || currentPrice < existing {
			dailyLowest[today] = currentPrice
		}
	}

	dates := make([]string, 0, len(dailyLowest))
	for date := range dailyLowest {
		dates = append(dates, date)
	}
	sort.Strings(dates)

	points := make([]priceHistoryPoint, 0, len(dates))
	prices := make([]float64, 0, len(dates))
	for _, date := range dates {
		price := roundPrice(dailyLowest[date])
		points = append(points, priceHistoryPoint{Date: date, Price: price})
		prices = append(prices, price)
	}

	summary := priceHistorySummary{
		Days:             days,
		ProductName:      productName,
		ObservationCount: observationCount,
		DistinctDays:     len(points),
		Status:           "insufficient_data",
		Verdict:          "Tracking started",
		Points:           points,
	}
	if len(prices) == 0 {
		return summary
	}

	summary.CurrentPrice = prices[len(prices)-1]
	if currentPrice > 0 {
		summary.CurrentPrice = roundPrice(currentPrice)
	}
	summary.UsualPrice = roundPrice(median(prices))
	summary.LowestPrice = prices[0]
	summary.HighestPrice = prices[0]
	for _, price := range prices[1:] {
		if price < summary.LowestPrice {
			summary.LowestPrice = price
		}
		if price > summary.HighestPrice {
			summary.HighestPrice = price
		}
	}

	if len(points) < 2 {
		return summary
	}

	summary.Status = "ready"
	switch {
	case summary.CurrentPrice <= summary.LowestPrice:
		summary.Verdict = "At a recent low"
	case summary.UsualPrice > 0 && summary.CurrentPrice <= summary.UsualPrice*0.95:
		summary.Verdict = "Good time to buy"
	case summary.UsualPrice > 0 && summary.CurrentPrice >= summary.UsualPrice*1.10:
		summary.Verdict = "Higher than usual"
	default:
		summary.Verdict = "Around the usual price"
	}
	return summary
}

// GetPriceHistory returns daily lowest comparable prices from the user's own
// saved searches. It never invents missing days or interpolates prices.
// GET /price-history?name=...&query=...&days=30&current_price=...
func GetPriceHistory(c echo.Context) error {
	_, ok := authenticatedUserObjectID(c)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
	}
	if database.DB == nil {
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Database unavailable"})
	}

	productName := strings.TrimSpace(c.QueryParam("name"))
	if productName == "" || len(productName) > 240 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "A valid product name is required"})
	}

	days := 30
	if parsed, err := strconv.Atoi(c.QueryParam("days")); err == nil && parsed == 90 {
		days = 90
	}
	currentPrice, _ := strconv.ParseFloat(c.QueryParam("current_price"), 64)
	if currentPrice < 0 || currentPrice > 10000000 {
		currentPrice = 0
	}

	filter := bson.M{
		"created_at": bson.M{
			"$gte": models.PriceHistoryStart(days),
		},
	}
	if query := strings.TrimSpace(c.QueryParam("query")); query != "" && len(query) <= 200 {
		filter["query"] = bson.M{"$regex": "^" + regexp.QuoteMeta(query) + "$", "$options": "i"}
	}

	cursor, err := database.DB.Collection("search_history").Find(
		c.Request().Context(),
		filter,
		options.Find().
			SetSort(bson.D{{Key: "created_at", Value: -1}}).
			SetLimit(maxPriceHistoryDocuments),
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not load price history"})
	}
	defer cursor.Close(c.Request().Context())

	searches := make([]models.SearchHistory, 0)
	for cursor.Next(c.Request().Context()) {
		var item models.SearchHistory
		if err := cursor.Decode(&item); err == nil {
			searches = append(searches, item)
		}
	}
	if err := cursor.Err(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not read price history"})
	}

	return c.JSON(
		http.StatusOK,
		summarizePriceHistory(productName, days, searches, currentPrice),
	)
}
