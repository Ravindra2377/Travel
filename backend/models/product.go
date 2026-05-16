package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Product represents a generic product across all platforms
type Product struct {
	ID       string  `bson:"id" json:"id"`
	Name     string  `bson:"name" json:"name"`
	Brand    string  `bson:"brand,omitempty" json:"brand,omitempty"`
	Category string  `bson:"category,omitempty" json:"category,omitempty"`
	ImageURL string  `bson:"image_url,omitempty" json:"image_url,omitempty"`
	Weight   string  `bson:"weight,omitempty" json:"weight,omitempty"` // e.g. "500g", "1kg", "12 pcs"
	Rating   float64 `bson:"rating,omitempty" json:"rating,omitempty"`
}

// PlatformListing represents a product listing on a specific platform
type PlatformListing struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	SearchHistoryID primitive.ObjectID `bson:"search_history_id" json:"search_history_id"`
	Platform        string             `bson:"platform" json:"platform"`
	ProductName     string             `bson:"product_name" json:"product_name"`
	Brand           string             `bson:"brand,omitempty" json:"brand,omitempty"`
	ImageURL        string             `bson:"image_url,omitempty" json:"image_url,omitempty"`
	Price           float64            `bson:"price" json:"price"`
	MRP             float64            `bson:"mrp,omitempty" json:"mrp,omitempty"`      // Original/MRP price
	Discount        string             `bson:"discount,omitempty" json:"discount,omitempty"` // e.g. "10% OFF"
	InStock         bool               `bson:"in_stock" json:"in_stock"`
	DeliveryTime    string             `bson:"delivery_time,omitempty" json:"delivery_time,omitempty"` // e.g. "10 mins", "2 hours"
	DeliveryCharge  float64            `bson:"delivery_charge" json:"delivery_charge"`
	Rating          float64            `bson:"rating,omitempty" json:"rating,omitempty"`
	Offers          []string           `bson:"offers,omitempty" json:"offers,omitempty"`
	DeepLink        string             `bson:"deep_link,omitempty" json:"deep_link,omitempty"`               // URL or app deep link
	ProductURL      string             `bson:"product_url,omitempty" json:"product_url,omitempty"`             // Alias for DeepLink from frontend
	ScrapedAt       time.Time          `bson:"scraped_at" json:"scraped_at"`
	Quantity        string             `bson:"quantity,omitempty" json:"quantity,omitempty"`
}

// CompareResult is the API response for a comparison query
type CompareResult struct {
	Query    string            `json:"query"`
	Products []ComparedProduct `json:"products"`
}

// ComparedProduct groups listings for the same/similar product
type ComparedProduct struct {
	Name      string            `json:"name"`
	Category  string            `json:"category,omitempty"`
	ImageURL  string            `json:"image_url,omitempty"`
	BestPrice float64           `json:"best_price"`
	Listings  []PlatformListing `json:"listings"`
}
