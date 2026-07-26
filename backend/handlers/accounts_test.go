package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const accountTestUserID = "507f1f77bcf86cd799439011"

func authenticateAccountTest(c echo.Context) {
	c.Set(userIDContextKey, accountTestUserID)
}

func TestTokenStoreBasics(t *testing.T) {
	// Reset the store before test
	Store.byKey = make(map[string]*DeviceTokens)

	assert.NotNil(t, Store)
	assert.NotNil(t, Store.byKey)
	assert.Len(t, Store.byKey, 0)
}

func TestAccountKeyUsesAuthenticatedUser(t *testing.T) {
	e := echo.New()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authenticateAccountTest(c)

	key, ok := accountKey(c)
	assert.True(t, ok)
	assert.Equal(t, accountTestUserID, key)
}

func TestAccountKeyRejectsAnonymousRequest(t *testing.T) {
	e := echo.New()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	key, ok := accountKey(c)
	assert.False(t, ok)
	assert.Empty(t, key)
}

func TestConnectAccount(t *testing.T) {
	Store.byKey = make(map[string]*DeviceTokens)
	e := echo.New()

	payload := map[string]interface{}{
		"platform": "Blinkit",
		"tokens": map[string]string{
			"auth":   "test-auth-token",
			"cookie": "test-cookie-value",
		},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/accounts/connect", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Device-Id", "device-1")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authenticateAccountTest(c)

	err := ConnectAccount(c)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rec.Code)

	var response map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &response)
	assert.Equal(t, "connected", response["status"])
	assert.Equal(t, "Blinkit", response["platform"])
	assert.Equal(t, float64(2), response["tokens"]) // 2 tokens in the request
}

func TestConnectAccountInvalidRequest(t *testing.T) {
	Store.byKey = make(map[string]*DeviceTokens)
	e := echo.New()

	// Test missing platform
	payload := map[string]interface{}{
		"tokens": map[string]string{},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/accounts/connect", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authenticateAccountTest(c)

	err := ConnectAccount(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestConnectAccountNoTokens(t *testing.T) {
	Store.byKey = make(map[string]*DeviceTokens)
	e := echo.New()

	payload := map[string]interface{}{
		"platform": "Blinkit",
		"tokens":   map[string]string{},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/accounts/connect", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authenticateAccountTest(c)

	err := ConnectAccount(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestGetAccountStatus(t *testing.T) {
	Store.byKey = make(map[string]*DeviceTokens)
	e := echo.New()

	// First connect an account
	connectPayload := map[string]interface{}{
		"platform": "Blinkit",
		"tokens": map[string]string{
			"auth": "test-token",
		},
	}

	body, _ := json.Marshal(connectPayload)
	req := httptest.NewRequest(http.MethodPost, "/accounts/connect", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Device-Id", "device-1")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authenticateAccountTest(c)
	ConnectAccount(c)

	// Now check status
	req = httptest.NewRequest(http.MethodGet, "/accounts/status", nil)
	req.Header.Set("X-Device-Id", "device-1")
	rec = httptest.NewRecorder()
	c = e.NewContext(req, rec)
	authenticateAccountTest(c)

	err := GetAccountStatus(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var response map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &response)
	assert.Equal(t, float64(1), response["count"])

	connected := response["connected"].([]interface{})
	assert.Len(t, connected, 1)
	assert.Equal(t, "Blinkit", connected[0])
}

func TestGetAccountStatusEmpty(t *testing.T) {
	Store.byKey = make(map[string]*DeviceTokens)
	e := echo.New()

	req := httptest.NewRequest(http.MethodGet, "/accounts/status", nil)
	req.Header.Set("X-Device-Id", "device-unknown")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authenticateAccountTest(c)

	err := GetAccountStatus(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var response map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &response)
	assert.Equal(t, float64(0), response["count"])
}

func TestDisconnectAccount(t *testing.T) {
	Store.byKey = make(map[string]*DeviceTokens)
	e := echo.New()

	// Connect first
	payload := map[string]interface{}{
		"platform": "Blinkit",
		"tokens": map[string]string{
			"auth": "test-token",
		},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/accounts/connect", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Device-Id", "device-1")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authenticateAccountTest(c)
	ConnectAccount(c)

	// Now disconnect
	req = httptest.NewRequest(http.MethodDelete, "/accounts/disconnect/Blinkit", nil)
	req.Header.Set("X-Device-Id", "device-1")
	rec = httptest.NewRecorder()
	c = e.NewContext(req, rec)
	authenticateAccountTest(c)
	c.SetParamNames("platform")
	c.SetParamValues("Blinkit")

	err := DisconnectAccount(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var response map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &response)
	assert.Equal(t, "disconnected", response["status"])
}

func TestBulkConnectAccounts(t *testing.T) {
	Store.byKey = make(map[string]*DeviceTokens)
	e := echo.New()

	payload := map[string]map[string]string{
		"Blinkit": {"auth": "blinkit-token"},
		"Zepto":   {"auth": "zepto-token"},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/accounts/bulk-connect", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Device-Id", "device-1")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authenticateAccountTest(c)

	err := BulkConnectAccounts(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var response map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &response)
	assert.Equal(t, "connected", response["status"])
	assert.Equal(t, float64(2), response["count"])
}

func TestPruneExpiredTokens(t *testing.T) {
	// Create old tokens
	oldTime := time.Now().Add(-25 * time.Hour) // Older than TTL

	Store.byKey = map[string]*DeviceTokens{
		"old-device": {
			Platforms: map[string]map[string]string{
				"Blinkit": {"auth": "token"},
			},
			LastUsedAt: oldTime,
		},
		"new-device": {
			Platforms: map[string]map[string]string{
				"Zepto": {"auth": "token"},
			},
			LastUsedAt: time.Now(),
		},
	}

	now := time.Now()
	Store.mu.Lock()
	pruneExpiredLocked(now)
	Store.mu.Unlock()

	// Old device should be removed
	assert.NotContains(t, Store.byKey, "old-device")
	// New device should remain
	assert.Contains(t, Store.byKey, "new-device")
}

func TestConnectAccountMultiplePlatforms(t *testing.T) {
	Store.byKey = make(map[string]*DeviceTokens)
	e := echo.New()

	// Connect first platform
	payload1 := map[string]interface{}{
		"platform": "Blinkit",
		"tokens": map[string]string{
			"auth": "blinkit-token",
		},
	}

	body1, _ := json.Marshal(payload1)
	req := httptest.NewRequest(http.MethodPost, "/accounts/connect", bytes.NewReader(body1))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Device-Id", "device-1")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	authenticateAccountTest(c)
	ConnectAccount(c)

	// Connect second platform with same device
	payload2 := map[string]interface{}{
		"platform": "Zepto",
		"tokens": map[string]string{
			"auth": "zepto-token",
		},
	}

	body2, _ := json.Marshal(payload2)
	req = httptest.NewRequest(http.MethodPost, "/accounts/connect", bytes.NewReader(body2))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Device-Id", "device-1")
	rec = httptest.NewRecorder()
	c = e.NewContext(req, rec)
	authenticateAccountTest(c)
	ConnectAccount(c)

	// Check status should show both
	req = httptest.NewRequest(http.MethodGet, "/accounts/status", nil)
	req.Header.Set("X-Device-Id", "device-1")
	rec = httptest.NewRecorder()
	c = e.NewContext(req, rec)
	authenticateAccountTest(c)

	GetAccountStatus(c)

	var response map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &response)
	assert.Equal(t, float64(2), response["count"])
}
