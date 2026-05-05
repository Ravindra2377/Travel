package models

import "time"

// HotDeal represents a scored, trending product deal surfaced by the HOTDEAL algorithm.
type HotDeal struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Product Identity
	ProductName string `gorm:"not null;size:255;index" json:"product_name"`
	Brand       string `gorm:"size:100" json:"brand,omitempty"`
	Category    string `gorm:"size:100;index" json:"category,omitempty"`
	ImageURL    string `json:"image_url,omitempty"`

	// Pricing
	Platform    string  `gorm:"not null;size:50;index" json:"platform"`
	Price       float64 `gorm:"not null" json:"price"`
	MRP         float64 `json:"mrp,omitempty"`
	DiscountPct int     `json:"discount_pct"`
	Savings     float64 `json:"savings"`

	// Scoring
	HotScore float64 `gorm:"index" json:"hot_score"`
	DealTier string  `gorm:"size:20;index" json:"deal_tier"` // on_fire, trending, worth_noting, regular
	Tags     string  `gorm:"type:text" json:"tags,omitempty"` // JSON array string

	// Metadata
	DealBadge    string `gorm:"size:100" json:"deal_badge,omitempty"`
	StockStatus  string `gorm:"size:20" json:"stock_status"`
	DeliveryTime string `gorm:"size:50" json:"delivery_time,omitempty"`
	ProductURL   string `json:"product_url,omitempty"`

	// Freshness
	ScrapedAt time.Time `gorm:"index" json:"scraped_at"`
	ExpiresAt time.Time `json:"expires_at,omitempty"`

	// Deduplication & Price History
	Fingerprint string `gorm:"size:100;index" json:"fingerprint"`
}
