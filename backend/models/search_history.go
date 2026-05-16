package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SearchHistory persists a user's search queries and result summaries
type SearchHistory struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
	UserID          primitive.ObjectID `bson:"user_id" json:"user_id"`
	SearchRequestID primitive.ObjectID `bson:"search_request_id,omitempty" json:"search_request_id,omitempty"`
	Query           string             `bson:"query" json:"query"`
	ResultCount     int                `bson:"result_count" json:"result_count"`
	BestPrice       float64            `bson:"best_price,omitempty" json:"best_price,omitempty"`
	BestPlatform    string             `bson:"best_platform,omitempty" json:"best_platform,omitempty"`
	PlatformsUsed   string             `bson:"platforms_used,omitempty" json:"platforms_used,omitempty"`
	Listings        []PlatformListing  `bson:"listings,omitempty" json:"listings,omitempty"`
}
