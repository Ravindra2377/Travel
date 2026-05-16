package handlers

import (
	"context"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"comparez/database"
	"comparez/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Register(c echo.Context) error {
	log.Printf("📝 Registration request received")
	req := new(RegisterRequest)
	if err := c.Bind(req); err != nil {
		log.Printf("❌ Failed to bind registration request: %v", err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	if database.DB == nil {
		log.Printf("❌ Database connection is nil in Register")
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Database unavailable"})
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Password = strings.TrimSpace(req.Password)

	log.Printf("👤 Registering user: %s", req.Email)

	if req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Email and password are required"})
	}

	// Password validation
	if len(req.Password) < 8 || len(req.Password) > 16 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Password must be between 8 and 16 characters"})
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(req.Password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(req.Password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(req.Password)
	hasSpecial := regexp.MustCompile(`[!@#$%^&*(),.?":{}|<>]`).MatchString(req.Password)

	if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Password must contain uppercase, lowercase, number and special character"})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Password hash failed: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not hash password"})
	}

	user := models.User{
		ID:        primitive.NewObjectID(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hash),
	}

	collection := database.DB.Collection("users")

	// Check if exists
	var existingUser models.User
	err = collection.FindOne(context.TODO(), bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		log.Printf("⚠️  Registration failed: Email %s already exists", req.Email)
		return c.JSON(http.StatusConflict, map[string]string{"error": "Email already registered"})
	}

	log.Printf("💾 Inserting new user into MongoDB...")
	_, err = collection.InsertOne(context.TODO(), user)
	if err != nil {
		log.Printf("❌ MongoDB insertion failed: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not create user"})
	}

	log.Printf("🔑 Generating JWT for new user...")
	// Generate JWT
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["id"] = user.ID.Hex()
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Printf("⚠️  JWT_SECRET not found in env, using default")
		secret = "comparez-secret-key-123"
	}

	t, err := token.SignedString([]byte(secret))
	if err != nil {
		log.Printf("❌ JWT signing failed: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not generate token"})
	}

	log.Printf("✅ Registration successful for %s", req.Email)
	return c.JSON(http.StatusCreated, map[string]interface{}{
		"token": t,
		"user": map[string]interface{}{
			"id":    user.ID.Hex(),
			"email": user.Email,
			"name":  user.Name,
		},
	})
}

func Login(c echo.Context) error {
	log.Printf("🔑 Login request received")
	req := new(LoginRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	if database.DB == nil {
		log.Printf("❌ Database connection is nil in Login")
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "Database unavailable"})
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Email and password are required"})
	}

	var user models.User
	collection := database.DB.Collection("users")
	err := collection.FindOne(context.TODO(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database error"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
	}

	// Generate JWT
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["id"] = user.ID.Hex()
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not generate token"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token": t,
		"user": map[string]interface{}{
			"id":    user.ID.Hex(),
			"email": user.Email,
			"name":  user.Name,
		},
	})
}
