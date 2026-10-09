package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/clonedhearts/pboxtv/api-server/internal/db"
	"github.com/clonedhearts/pboxtv/api-server/internal/handlers"
	"github.com/clonedhearts/pboxtv/api-server/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present (local dev)
	_ = godotenv.Load()

	// Connect MongoDB
	database, err := db.Connect(os.Getenv("MONGO_URI"))
	if err != nil {
		log.Fatalf("MongoDB connection failed: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = database.Client.Disconnect(ctx)
	}()

	// Gin engine
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// ── CORS ────────────────────────────────────────────────────────────────
	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Range", "Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Range", "Accept-Ranges"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ── Rate-limit middleware ────────────────────────────────────────────────
	r.Use(middleware.RateLimit())

	// ── Handlers ────────────────────────────────────────────────────────────
	h := handlers.New(database, os.Getenv("SIDECAR_URL"))

	// Health / status
	r.GET("/", h.Status)

	// Media APIs
	api := r.Group("/api")
	{
		api.GET("/movies", h.GetMovies)
		api.GET("/tvshows", h.GetTVShows)
		api.GET("/id/:tmdb_id", h.GetMediaDetails)
		api.GET("/similar/", h.GetSimilarMedia)
		api.GET("/search/", h.SearchMedia)
		api.GET("/poster", h.GetAds)
	}

	// Membership check (uses Python sidecar)
	r.GET("/is_member", h.IsMember)

	// Streaming endpoint — proxies chunks through sidecar with rate limiting
	r.GET("/dl/:id/:name", h.StreamMedia)

	// ── Start ───────────────────────────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 0, // streaming — no write timeout
		IdleTimeout:  120 * time.Second,
	}

	log.Printf("🚀 PboxTV API Server starting on :%s", port)

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	log.Println("Server stopped.")
}
