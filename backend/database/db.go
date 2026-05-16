package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

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

	fmt.Println("🚀 Connected to MongoDB")
}

