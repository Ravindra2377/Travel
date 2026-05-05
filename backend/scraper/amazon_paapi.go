package scraper

import (
	"comparez/models"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
)

const amazonPAAPIService = "ProductAdvertisingAPI"

func (a *AmazonScraper) fetchOfficialListings(ctx context.Context, query string) ([]models.PlatformListing, error) {
	accessKey := strings.TrimSpace(os.Getenv("AMAZON_PAAPI_ACCESS_KEY"))
	secretKey := strings.TrimSpace(os.Getenv("AMAZON_PAAPI_SECRET_KEY"))
	partnerTag := strings.TrimSpace(os.Getenv("AMAZON_PARTNER_TAG"))
	region := strings.TrimSpace(os.Getenv("AMAZON_PAAPI_REGION"))
	if region == "" {
		region = "eu-west-1"
	}

	if accessKey == "" || secretKey == "" || partnerTag == "" {
		return nil, fmt.Errorf("amazon pa-api credentials not configured")
	}

	endpoint := "https://webservices.amazon.in/paapi5/searchitems"
	body := map[string]interface{}{
		"Keywords":    query,
		"SearchIndex": "All",
		"ItemCount":   10,
		"PartnerTag":  partnerTag,
		"PartnerType": "Associates",
		"Marketplace": "www.amazon.in",
		"Resources": []string{
			"Images.Primary.Medium",
			"ItemInfo.Title",
			"Offers.Listings.Price",
			"Offers.Listings.SavingBasis",
			"Offers.Summaries.HighestPrice",
			"Offers.Summaries.LowestPrice",
		},
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(string(payload)))
	if err != nil {
		return nil, err
	}

	timestamp := time.Now().UTC()
	amzDate := timestamp.Format("20060102T150405Z")
	dateStamp := timestamp.Format("20060102")
	payloadHash := sha256Hex(payload)
	canonicalURI := "/paapi5/searchitems"
	canonicalQueryString := ""
	canonicalHeaders := map[string]string{
		"content-encoding": "amz-1.0",
		"content-type":     "application/json; charset=utf-8",
		"host":             "webservices.amazon.in",
		"x-amz-date":       amzDate,
		"x-amz-target":     "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
	}

	headersList := make([]string, 0, len(canonicalHeaders))
	for key := range canonicalHeaders {
		headersList = append(headersList, key)
	}
	sort.Strings(headersList)

	canonicalHeaderString := ""
	for _, key := range headersList {
		canonicalHeaderString += key + ":" + canonicalHeaders[key] + "\n"
		request.Header.Set(http.CanonicalHeaderKey(key), canonicalHeaders[key])
	}

	signedHeaders := strings.Join(headersList, ";")
	canonicalRequest := strings.Join([]string{
		http.MethodPost,
		canonicalURI,
		canonicalQueryString,
		canonicalHeaderString,
		signedHeaders,
		payloadHash,
	}, "\n")

	credentialScope := strings.Join([]string{dateStamp, region, amazonPAAPIService, "aws4_request"}, "/")
	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		sha256Hex([]byte(canonicalRequest)),
	}, "\n")

	signingKey := deriveAWSV4Key(secretKey, dateStamp, region, amazonPAAPIService)
	signature := hex.EncodeToString(hmacSHA256(signingKey, []byte(stringToSign)))
	authorization := fmt.Sprintf(
		"AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		accessKey,
		credentialScope,
		signedHeaders,
		signature,
	)
	request.Header.Set("Authorization", authorization)
	request.Header.Set("Content-Encoding", "amz-1.0")
	request.Header.Set("Content-Type", "application/json; charset=utf-8")
	request.Header.Set("Host", "webservices.amazon.in")
	request.Header.Set("X-Amz-Date", amzDate)
	request.Header.Set("X-Amz-Target", "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems")

	response, err := a.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("amazon pa-api status: %d", response.StatusCode)
	}

	var payloadResponse amazonPAAPIResponse
	if err := json.NewDecoder(response.Body).Decode(&payloadResponse); err != nil {
		return nil, err
	}
	if len(payloadResponse.Errors) > 0 {
		return nil, fmt.Errorf("amazon pa-api error: %s", payloadResponse.Errors[0].Message)
	}

	listings := make([]models.PlatformListing, 0, len(payloadResponse.SearchResult.Items))
	for _, item := range payloadResponse.SearchResult.Items {
		title := strings.TrimSpace(item.ItemInfo.Title.DisplayValue)
		if title == "" {
			continue
		}

		price := item.PriceAmount()
		mrp := item.MRPAmount()
		imageURL := strings.TrimSpace(item.Images.Primary.Medium.URL)
		if mrp == 0 {
			mrp = price
		}
		if price <= 0 {
			continue
		}

		listings = append(listings, models.PlatformListing{
			Platform:    "Amazon",
			ProductName: title,
			Price:       price,
			MRP:         mrp,
			ImageURL:    imageURL,
			InStock:     true,
			DeepLink:    strings.TrimSpace(item.DetailPageURL),
			ScrapedAt:   time.Now(),
		})
	}

	if len(listings) == 0 {
		return nil, fmt.Errorf("amazon pa-api returned no usable items")
	}

	return listings, nil
}

type amazonPAAPIResponse struct {
	SearchResult struct {
		Items []amazonPAAPIItem `json:"Items"`
	} `json:"SearchResult"`
	Errors []struct {
		Message string `json:"Message"`
	} `json:"Errors"`
}

type amazonPAAPIItem struct {
	ASIN          string `json:"ASIN"`
	DetailPageURL string `json:"DetailPageURL"`
	ItemInfo      struct {
		Title struct {
			DisplayValue string `json:"DisplayValue"`
		} `json:"Title"`
	} `json:"ItemInfo"`
	Images struct {
		Primary struct {
			Medium struct {
				URL string `json:"URL"`
			} `json:"Medium"`
		} `json:"Primary"`
	} `json:"Images"`
	Offers struct {
		Listings []struct {
			Price struct {
				Amount float64 `json:"Amount"`
			} `json:"Price"`
			SavingBasis struct {
				Amount float64 `json:"Amount"`
			} `json:"SavingBasis"`
		} `json:"Listings"`
		Summaries []struct {
			HighestPrice struct {
				Amount float64 `json:"Amount"`
			} `json:"HighestPrice"`
			LowestPrice struct {
				Amount float64 `json:"Amount"`
			} `json:"LowestPrice"`
		} `json:"Summaries"`
	} `json:"Offers"`
}

func (i amazonPAAPIItem) PriceAmount() float64 {
	if len(i.Offers.Listings) > 0 {
		if amount := i.Offers.Listings[0].Price.Amount; amount > 0 {
			return amount
		}
	}
	if len(i.Offers.Summaries) > 0 {
		if amount := i.Offers.Summaries[0].LowestPrice.Amount; amount > 0 {
			return amount
		}
	}
	return 0
}

func (i amazonPAAPIItem) MRPAmount() float64 {
	if len(i.Offers.Listings) > 0 {
		if amount := i.Offers.Listings[0].SavingBasis.Amount; amount > 0 {
			return amount
		}
	}
	if len(i.Offers.Summaries) > 0 {
		if amount := i.Offers.Summaries[0].HighestPrice.Amount; amount > 0 {
			return amount
		}
	}
	return 0
}

func sha256Hex(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func hmacSHA256(key []byte, data []byte) []byte {
	mac := hmac.New(sha256.New, key)
	_, _ = mac.Write(data)
	return mac.Sum(nil)
}

func deriveAWSV4Key(secretKey, dateStamp, region, service string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secretKey), []byte(dateStamp))
	kRegion := hmacSHA256(kDate, []byte(region))
	kService := hmacSHA256(kRegion, []byte(service))
	return hmacSHA256(kService, []byte("aws4_request"))
}
