package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var DB *mongo.Database

func Connect() {
	uri := strings.TrimSpace(os.Getenv("MONGO_URI"))
	if uri == "" {
		uri = strings.TrimSpace(os.Getenv("DATABASE_URL"))
	}
	if uri == "" {
		log.Println("⚠️  No MONGO_URI or DATABASE_URL provided in .env, falling back to localhost")
		uri = "mongodb://localhost:27017"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)

	var connErr error
	var localClient *mongo.Client

	for attempt := 1; attempt <= 3; attempt++ {
		localClient, connErr = mongo.Connect(ctx, clientOptions)
		if connErr == nil {
			// Ping the database
			connErr = localClient.Ping(ctx, nil)
			if connErr == nil {
				break
			}
		}
		log.Printf("⚠️  MongoDB connection attempt %d/3 failed: %v", attempt, connErr)
		if attempt < 3 {
			time.Sleep(time.Duration(attempt*2) * time.Second)
		}
	}

	if connErr != nil {
		fmt.Printf("❌ MONGODB CONNECTION ERROR: %v\n", connErr)
		Client = nil
		DB = nil
		return
	}

	Client = localClient
	DB = Client.Database("comparez") // Use 'comparez' database
	indexCtx, indexCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer indexCancel()
	if _, err := DB.Collection("users").Indexes().CreateOne(
		indexCtx,
		mongo.IndexModel{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true).SetName("unique_user_email"),
		},
	); err != nil {
		log.Printf("⚠️  Failed to ensure unique user email index: %v", err)
	}
	if _, err := DB.Collection("search_history").Indexes().CreateOne(
		indexCtx,
		mongo.IndexModel{
			Keys: bson.D{
				{Key: "user_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
			Options: options.Index().SetName("user_search_history"),
		},
	); err != nil {
		log.Printf("⚠️  Failed to ensure search history index: %v", err)
	}

	fmt.Println("🚀 Connected to MongoDB")
}
