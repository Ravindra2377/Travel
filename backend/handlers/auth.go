package handlers

import (
	"log"
	"net/http"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"comparez/database"
	"comparez/models"

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
	req.Name = strings.TrimSpace(req.Name)

	if req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Email and password are required"})
	}
	parsedAddress, err := mail.ParseAddress(req.Email)
	if err != nil || parsedAddress.Address != req.Email || len(req.Email) > 254 || len(req.Name) > 100 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid account details"})
	}

	// Password validation
	if len(req.Password) < 8 || len(req.Password) > 72 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Password must be between 8 and 72 characters"})
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
	err = collection.FindOne(c.Request().Context(), bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Email already registered"})
	}

	log.Printf("💾 Inserting new user into MongoDB...")
	_, err = collection.InsertOne(c.Request().Context(), user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return c.JSON(http.StatusConflict, map[string]string{"error": "Email already registered"})
		}
		log.Printf("❌ MongoDB insertion failed: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not create user"})
	}

	t, err := issueToken(user.ID.Hex())
	if err != nil {
		log.Printf("❌ JWT signing failed: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not generate token"})
	}

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
	err := collection.FindOne(c.Request().Context(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database error"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
	}

	t, err := issueToken(user.ID.Hex())
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
