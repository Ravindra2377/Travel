package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
)

// ─── Constants ───────────────────────────────────────────────────────────────

const (
	groqChatURL  = "https://api.groq.com/openai/v1/chat/completions"
	groqAudioURL = "https://api.groq.com/openai/v1/audio/transcriptions"
)

// ─── Request / Response types ────────────────────────────────────────────────

// AIChatRequest mirrors the Groq chat completions request shape.
type AIChatRequest struct {
	Model          string                 `json:"model"`
	Messages       []map[string]string    `json:"messages"`
	MaxTokens      int                    `json:"max_tokens"`
	Temperature    float64                `json:"temperature"`
	ResponseFormat map[string]interface{} `json:"response_format,omitempty"`
}

// ─── POST /ai/chat ───────────────────────────────────────────────────────────
// Proxies a chat completion request to the Groq API with the server-side key.

func AIChat(c echo.Context) error {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "AI service not configured",
		})
	}

	// Read and validate the incoming request body.
	var req AIChatRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
	}
	if req.Model == "" || len(req.Messages) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "model and messages are required",
		})
	}

	// Forward to Groq.
	body, err := json.Marshal(req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to encode request",
		})
	}

	groqReq, err := http.NewRequest("POST", groqChatURL, bytes.NewReader(body))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to create upstream request",
		})
	}
	groqReq.Header.Set("Content-Type", "application/json")
	groqReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(groqReq)
	if err != nil {
		return c.JSON(http.StatusBadGateway, map[string]string{
			"error": "Failed to reach AI service",
		})
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.JSON(http.StatusBadGateway, map[string]string{
			"error": "Failed to read AI response",
		})
	}

	// Return the Groq response as-is (preserving status code).
	return c.Blob(resp.StatusCode, "application/json", respBody)
}

// ─── POST /ai/transcribe ────────────────────────────────────────────────────
// Proxies an audio transcription (Whisper) request to the Groq API.
// Expects multipart/form-data with "file", "model", and optional "language".

func AITranscribe(c echo.Context) error {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "AI service not configured",
		})
	}

	// Parse the incoming multipart form (max 25 MB for audio files).
	contentType := c.Request().Header.Get("Content-Type")
	mediaType, params, err := mime.ParseMediaType(contentType)
	if err != nil || !strings.HasPrefix(mediaType, "multipart/") {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Expected multipart/form-data",
		})
	}

	reader := multipart.NewReader(c.Request().Body, params["boundary"])

	// Build a new multipart body to forward to Groq.
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Failed to parse multipart data",
			})
		}

		fieldName := part.FormName()
		if fieldName == "file" {
			// Copy the audio file part.
			destPart, err := writer.CreateFormFile("file", part.FileName())
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": "Failed to create file part",
				})
			}
			if _, err := io.Copy(destPart, part); err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": "Failed to copy file data",
				})
			}
		} else {
			// Copy form fields (model, language, etc.).
			val, _ := io.ReadAll(part)
			if err := writer.WriteField(fieldName, string(val)); err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": "Failed to write form field",
				})
			}
		}
		part.Close()
	}
	writer.Close()

	// Forward to Groq Whisper endpoint.
	groqReq, err := http.NewRequest("POST", groqAudioURL, &buf)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to create upstream request",
		})
	}
	groqReq.Header.Set("Content-Type", writer.FormDataContentType())
	groqReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(groqReq)
	if err != nil {
		return c.JSON(http.StatusBadGateway, map[string]string{
			"error": "Failed to reach AI service",
		})
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.JSON(http.StatusBadGateway, map[string]string{
			"error": "Failed to read AI response",
		})
	}

	return c.Blob(resp.StatusCode, "application/json", respBody)
}
