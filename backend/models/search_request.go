package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SearchRequest struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Query     string             `bson:"query" json:"query"`
	Status    string             `bson:"status" json:"status"` // pending, processing, completed, failed
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}
