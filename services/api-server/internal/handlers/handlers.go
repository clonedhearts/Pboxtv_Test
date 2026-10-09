package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/clonedhearts/pboxtv/api-server/internal/db"
	"github.com/gin-gonic/gin"
)

// Handler holds shared dependencies for all HTTP handlers.
type Handler struct {
	db         *db.Database
	sidecarURL string
	startTime  time.Time
	httpClient *http.Client
}

// New creates a Handler with the given database and sidecar URL.
func New(database *db.Database, sidecarURL string) *Handler {
	if sidecarURL == "" {
		sidecarURL = "http://localhost:8001"
	}
	return &Handler{
		db:         database,
		sidecarURL: sidecarURL,
		startTime:  time.Now(),
		httpClient: &http.Client{Timeout: 0}, // No timeout for streaming
	}
}

// ─────────────────────────── Status ───────────────────────────────────────

func (h *Handler) Status(c *gin.Context) {
	// Ping sidecar for bot count
	botInfo := gin.H{"connected_bots": "unknown", "telegram_bot": "unknown"}
	resp, err := http.Get(h.sidecarURL + "/internal/status")
	if err == nil {
		defer resp.Body.Close()
		// Ignore parse error — best-effort
	}
	_ = botInfo

	uptime := formatDuration(time.Since(h.startTime))
	c.JSON(http.StatusOK, gin.H{
		"server_status": "running",
		"uptime":        uptime,
		"version":       "3.0.0-go",
		"sidecar":       h.sidecarURL,
	})
}

// ─────────────────────────── Movies ───────────────────────────────────────

func (h *Handler) GetMovies(c *gin.Context) {
	sortBy := c.QueryArray("sort_by")
	if len(sortBy) == 0 {
		sortBy = []string{"rating:desc"}
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := h.db.GetMovies(ctx, sortBy, page, pageSize)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ─────────────────────────── TV Shows ─────────────────────────────────────

func (h *Handler) GetTVShows(c *gin.Context) {
	sortBy := c.QueryArray("sort_by")
	if len(sortBy) == 0 {
		sortBy = []string{"rating:desc"}
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := h.db.GetTVShows(ctx, sortBy, page, pageSize)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ─────────────────────────── Media Details ────────────────────────────────

func (h *Handler) GetMediaDetails(c *gin.Context) {
	tmdbIDStr := c.Param("tmdb_id")
	tmdbID, err := strconv.Atoi(tmdbIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tmdb_id"})
		return
	}

	var season, episode *int
	if s := c.Query("season_number"); s != "" {
		sv, _ := strconv.Atoi(s)
		season = &sv
	}
	if e := c.Query("episode_number"); e != "" {
		ev, _ := strconv.Atoi(e)
		episode = &ev
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := h.db.GetMediaDetails(ctx, tmdbID, season, episode)
	if err != nil || result == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Requested details not found"})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ─────────────────────────── Similar ──────────────────────────────────────

func (h *Handler) GetSimilarMedia(c *gin.Context) {
	tmdbIDStr := c.Query("tmdb_id")
	tmdbID, err := strconv.Atoi(tmdbIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tmdb_id"})
		return
	}

	mediaType := c.Query("media_type")
	if mediaType != "movie" && mediaType != "tvshow" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "media_type must be 'movie' or 'tvshow'"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := h.db.FindSimilarMedia(ctx, tmdbID, mediaType, page, pageSize)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ─────────────────────────── Search ───────────────────────────────────────

func (h *Handler) SearchMedia(c *gin.Context) {
	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter is required"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	result, err := h.db.SearchDocuments(ctx, query, page, pageSize)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ─────────────────────────── Ads ──────────────────────────────────────────

func (h *Handler) GetAds(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	ads, err := h.db.GetAds(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch ads"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ads": ads})
}

// ─────────────────────────── Membership ───────────────────────────────────

// IsMember proxies membership check to the Python sidecar.
func (h *Handler) IsMember(c *gin.Context) {
	userID := c.Query("user_id")
	channel := c.Query("channel")

	url := fmt.Sprintf("%s/internal/is_member?user_id=%s&channel=%s", h.sidecarURL, userID, channel)
	resp, err := h.httpClient.Get(url)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"is_member": false})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}

// ─────────────────────────── Streaming ────────────────────────────────────

// Bitrate caps per quality (bytes/sec). Go will throttle the pipe to the sidecar.
var qualityBitrates = map[string]int64{
	"2160p": 25 * 1024 * 1024 / 8, // 25 Mbps
	"1080p": 8 * 1024 * 1024 / 8,  // 8 Mbps
	"720p":  4 * 1024 * 1024 / 8,  // 4 Mbps
	"480p":  2 * 1024 * 1024 / 8,  // 2 Mbps
	"360p":  1 * 1024 * 1024 / 8,  // 1 Mbps
}

// detectQualityFromName guesses quality from filename, e.g. "Movie.1080p.mkv".
func detectQualityFromName(name string) string {
	name = strings.ToLower(name)
	for _, q := range []string{"2160p", "1080p", "720p", "480p", "360p"} {
		if strings.Contains(name, q) {
			return q
		}
	}
	return "720p" // default cap
}

// StreamMedia proxies a streaming request through the Python sidecar with
// adaptive bitrate throttling based on quality detected in the filename.
func (h *Handler) StreamMedia(c *gin.Context) {
	id := c.Param("id")
	name := c.Param("name")

	// Build sidecar URL — Python sidecar exposes /internal/dl/:id/:name
	sidecarStreamURL := fmt.Sprintf("%s/internal/dl/%s/%s", h.sidecarURL, id, name)

	// Forward the Range header if present
	req, err := http.NewRequestWithContext(c.Request.Context(), "GET", sidecarStreamURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create stream request"})
		return
	}
	if rangeHeader := c.GetHeader("Range"); rangeHeader != "" {
		req.Header.Set("Range", rangeHeader)
	}

	resp, err := h.httpClient.Do(req)
	if err != nil {
		log.Printf("Sidecar stream error for %s: %v", id, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "streaming unavailable"})
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for k, vv := range resp.Header {
		for _, v := range vv {
			c.Header(k, v)
		}
	}

	// Adaptive bitrate throttling
	quality := detectQualityFromName(name)
	bytesPerSec, ok := qualityBitrates[quality]
	if !ok {
		bytesPerSec = qualityBitrates["720p"]
	}

	c.Status(resp.StatusCode)

	throttledCopy(c.Writer, resp.Body, bytesPerSec)
}

// throttledCopy copies src to dst limited to bytesPerSec.
func throttledCopy(dst io.Writer, src io.Reader, bytesPerSec int64) {
	const chunkSize = 32 * 1024 // 32 KB chunks
	buf := make([]byte, chunkSize)
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	var sent int64
	for {
		n, err := src.Read(buf)
		if n > 0 {
			dst.Write(buf[:n])
			if f, ok := dst.(http.Flusher); ok {
				f.Flush()
			}
			sent += int64(n)

			// If we've exceeded the budget for this second, wait for next tick
			if sent >= bytesPerSec {
				<-ticker.C
				sent = 0
			}
		}
		if err != nil {
			break
		}
	}
}

// ─────────────────────────── Helpers ──────────────────────────────────────

func formatDuration(d time.Duration) string {
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	s := int(d.Seconds()) % 60
	if h > 0 {
		return fmt.Sprintf("%dh %dm %ds", h, m, s)
	}
	return fmt.Sprintf("%dm %ds", m, s)
}
