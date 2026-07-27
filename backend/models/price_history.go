package models

import "time"

// PriceHistoryStart is kept in models so history retention semantics are shared
// by handlers and future background jobs.
func PriceHistoryStart(days int) time.Time {
	if days != 90 {
		days = 30
	}
	return time.Now().UTC().AddDate(0, 0, -days)
}
