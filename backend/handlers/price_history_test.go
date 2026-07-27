package handlers

import (
	"comparez/models"
	"testing"
	"time"
)

func TestComparableHistoryProductRespectsQuantity(t *testing.T) {
	if !isComparableHistoryProduct(
		"Fresho Farm Eggs 12 pcs",
		"Fresho! Farm Eggs - Pack of 12 pcs",
	) {
		t.Fatal("expected the same product and quantity to match")
	}
	if isComparableHistoryProduct(
		"Fresho Farm Eggs 12 pcs",
		"Fresho Farm Eggs 6 pcs",
	) {
		t.Fatal("products with different pack sizes must not share price history")
	}
	if !isComparableHistoryProduct("Amul Milk 1 L", "Amul Milk 1000 ml") {
		t.Fatal("equivalent normalized quantities should match")
	}
}

func TestSummarizePriceHistoryUsesDailyLowAndCurrentPrice(t *testing.T) {
	now := time.Now().UTC()
	searches := []models.SearchHistory{
		{
			CreatedAt: now.AddDate(0, 0, -2),
			Listings: []models.PlatformListing{
				{ProductName: "Fresho Farm Eggs 12 pcs", Price: 72},
				{ProductName: "Fresho Farm Eggs 12 pcs", Price: 68},
			},
		},
		{
			CreatedAt: now.AddDate(0, 0, -1),
			Listings: []models.PlatformListing{
				{ProductName: "Fresho Farm Eggs 12 pcs", Price: 65},
				{ProductName: "Fresho Farm Eggs 6 pcs", Price: 34},
			},
		},
	}

	summary := summarizePriceHistory("Fresho Farm Eggs 12 pcs", 30, searches, 62)
	if summary.Status != "ready" {
		t.Fatalf("expected ready history, got %q", summary.Status)
	}
	if summary.DistinctDays != 3 {
		t.Fatalf("expected three observed days, got %d", summary.DistinctDays)
	}
	if summary.CurrentPrice != 62 || summary.LowestPrice != 62 {
		t.Fatalf(
			"expected current/recent low ₹62, got current %.2f and low %.2f",
			summary.CurrentPrice,
			summary.LowestPrice,
		)
	}
	if summary.UsualPrice != 65 {
		t.Fatalf("expected median usual price ₹65, got %.2f", summary.UsualPrice)
	}
	if summary.Verdict != "At a recent low" {
		t.Fatalf("unexpected verdict %q", summary.Verdict)
	}
}

func TestSummarizePriceHistoryDoesNotInventTrend(t *testing.T) {
	summary := summarizePriceHistory(
		"Paneer 200 g",
		90,
		nil,
		89,
	)
	if summary.Status != "insufficient_data" {
		t.Fatalf("a single current observation must be insufficient, got %q", summary.Status)
	}
	if summary.DistinctDays != 1 || len(summary.Points) != 1 {
		t.Fatalf("expected exactly one real observation, got %d", summary.DistinctDays)
	}
	if summary.Verdict != "Tracking started" {
		t.Fatalf("unexpected insufficient-data verdict %q", summary.Verdict)
	}
}
