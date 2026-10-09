package db

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Database wraps the MongoDB client and collections.
type Database struct {
	Client  *mongo.Client
	movies  *mongo.Collection
	tv      *mongo.Collection
	ads     *mongo.Collection
}

// Connect establishes a MongoDB connection and returns a Database instance.
func Connect(uri string) (*Database, error) {
	if uri == "" {
		return nil, fmt.Errorf("MONGO_URI env variable is not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		return nil, err
	}

	if err = client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("MongoDB ping failed: %w", err)
	}

	dbName := "projectS"
	return &Database{
		Client: client,
		movies: client.Database(dbName).Collection("movie"),
		tv:     client.Database(dbName).Collection("tv"),
		ads:    client.Database(dbName).Collection("ads"),
	}, nil
}

// ─────────────────────────── Movies ───────────────────────────────────────

type SortParam struct {
	Field     string
	Direction int // 1 = asc, -1 = desc
}

func parseSortParams(sortBy []string) []SortParam {
	params := make([]SortParam, 0, len(sortBy))
	for _, s := range sortBy {
		field, dir := s, "desc"
		for i := len(s) - 1; i >= 0; i-- {
			if s[i] == ':' {
				field, dir = s[:i], s[i+1:]
				break
			}
		}
		p := SortParam{Field: field, Direction: -1}
		if dir == "asc" {
			p.Direction = 1
		}
		params = append(params, p)
	}
	return params
}

func buildSort(params []SortParam) bson.D {
	sort := bson.D{}
	for _, p := range params {
		sort = append(sort, bson.E{Key: p.Field, Value: p.Direction})
	}
	return sort
}

func (d *Database) GetMovies(ctx context.Context, sortBy []string, page, pageSize int) (bson.M, error) {
	skip := int64((page - 1) * pageSize)
	sort := buildSort(parseSortParams(sortBy))

	total, err := d.movies.CountDocuments(ctx, bson.D{})
	if err != nil {
		return nil, err
	}

	opts := options.Find().SetSort(sort).SetSkip(skip).SetLimit(int64(pageSize))
	cursor, err := d.movies.Find(ctx, bson.D{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var movies []bson.M
	if err = cursor.All(ctx, &movies); err != nil {
		return nil, err
	}
	convertIDs(movies)

	return bson.M{"total_count": total, "movies": movies}, nil
}

func (d *Database) GetTVShows(ctx context.Context, sortBy []string, page, pageSize int) (bson.M, error) {
	skip := int64((page - 1) * pageSize)
	sort := buildSort(parseSortParams(sortBy))

	total, err := d.tv.CountDocuments(ctx, bson.D{})
	if err != nil {
		return nil, err
	}

	opts := options.Find().SetSort(sort).SetSkip(skip).SetLimit(int64(pageSize))
	cursor, err := d.tv.Find(ctx, bson.D{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var shows []bson.M
	if err = cursor.All(ctx, &shows); err != nil {
		return nil, err
	}
	convertIDs(shows)

	return bson.M{"total_count": total, "tv_shows": shows}, nil
}

func (d *Database) GetMediaDetails(ctx context.Context, tmdbID int, season, episode *int) (bson.M, error) {
	if episode != nil && season != nil {
		return d.getEpisodeDetails(ctx, tmdbID, *season, *episode)
	}
	if season != nil {
		return d.getSeasonDetails(ctx, tmdbID, *season)
	}

	// Try TV first, then movie
	var doc bson.M
	err := d.tv.FindOne(ctx, bson.M{"tmdb_id": tmdbID}).Decode(&doc)
	if err == nil {
		convertID(doc)
		doc["type"] = "tv"
		return doc, nil
	}

	err = d.movies.FindOne(ctx, bson.M{"tmdb_id": tmdbID}).Decode(&doc)
	if err != nil {
		return nil, nil
	}
	convertID(doc)
	doc["type"] = "movie"
	return doc, nil
}

func (d *Database) getSeasonDetails(ctx context.Context, tmdbID, seasonNumber int) (bson.M, error) {
	var show bson.M
	if err := d.tv.FindOne(ctx, bson.M{"tmdb_id": tmdbID}).Decode(&show); err != nil {
		return nil, nil
	}
	seasons, _ := show["seasons"].(bson.A)
	for _, s := range seasons {
		season, ok := s.(bson.M)
		if !ok {
			continue
		}
		if sn, ok := season["season_number"].(int32); ok && int(sn) == seasonNumber {
			season["tmdb_id"] = tmdbID
			season["type"] = "tv"
			return season, nil
		}
	}
	return nil, nil
}

func (d *Database) getEpisodeDetails(ctx context.Context, tmdbID, seasonNumber, episodeNumber int) (bson.M, error) {
	var show bson.M
	if err := d.tv.FindOne(ctx, bson.M{"tmdb_id": tmdbID}).Decode(&show); err != nil {
		return nil, nil
	}
	seasons, _ := show["seasons"].(bson.A)
	for _, s := range seasons {
		season, ok := s.(bson.M)
		if !ok {
			continue
		}
		sn, _ := season["season_number"].(int32)
		if int(sn) != seasonNumber {
			continue
		}
		episodes, _ := season["episodes"].(bson.A)
		for _, e := range episodes {
			ep, ok := e.(bson.M)
			if !ok {
				continue
			}
			en, _ := ep["episode_number"].(int32)
			if int(en) == episodeNumber {
				ep["tmdb_id"] = tmdbID
				ep["type"] = "tv"
				ep["season_number"] = seasonNumber
				ep["episode_number"] = episodeNumber
				return ep, nil
			}
		}
	}
	return nil, nil
}

func (d *Database) FindSimilarMedia(ctx context.Context, tmdbID int, mediaType string, page, pageSize int) (bson.M, error) {
	coll := d.movies
	if mediaType == "tvshow" {
		coll = d.tv
	}

	var parent bson.M
	if err := coll.FindOne(ctx, bson.M{"tmdb_id": tmdbID}).Decode(&parent); err != nil {
		return nil, fmt.Errorf("media not found")
	}

	genres, _ := parent["genres"].(bson.A)
	if len(genres) == 0 {
		return bson.M{"total_count": 0, "similar_media": []bson.M{}}, nil
	}

	skip := int64((page - 1) * pageSize)
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"tmdb_id":  bson.M{"$ne": tmdbID},
			"genres":   bson.M{"$in": genres},
		}}},
		{{Key: "$addFields", Value: bson.M{
			"genreMatchCount": bson.M{"$size": bson.M{"$setIntersection": []interface{}{"$genres", genres}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "genreMatchCount", Value: -1}, {Key: "rating", Value: -1}}}},
		{{Key: "$facet", Value: bson.M{
			"metadata": bson.A{bson.M{"$count": "total_count"}},
			"data":     bson.A{bson.M{"$skip": skip}, bson.M{"$limit": int64(pageSize)}},
		}}},
	}

	cursor, err := coll.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var result []bson.M
	if err = cursor.All(ctx, &result); err != nil || len(result) == 0 {
		return bson.M{"total_count": 0, "similar_media": []bson.M{}}, nil
	}

	metadata, _ := result[0]["metadata"].(bson.A)
	totalCount := 0
	if len(metadata) > 0 {
		if m, ok := metadata[0].(bson.M); ok {
			if tc, ok := m["total_count"].(int32); ok {
				totalCount = int(tc)
			}
		}
	}

	data, _ := result[0]["data"].(bson.A)
	similar := make([]bson.M, 0, len(data))
	for _, item := range data {
		if m, ok := item.(bson.M); ok {
			convertID(m)
			similar = append(similar, m)
		}
	}

	return bson.M{"total_count": totalCount, "similar_media": similar}, nil
}

func (d *Database) SearchDocuments(ctx context.Context, query string, page, pageSize int) (bson.M, error) {
	skip := (page - 1) * pageSize

	regexQ := bson.M{"$regex": ".*" + query + ".*", "$options": "i"}

	tvPipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"$or": bson.A{
			bson.M{"title": regexQ},
			bson.M{"seasons.episodes.telegram.name": regexQ},
		}}}},
		{{Key: "$project", Value: bson.M{
			"_id": 1, "tmdb_id": 1, "title": 1, "genres": 1, "rating": 1,
			"release_year": 1, "poster": 1, "backdrop": 1, "description": 1,
			"total_seasons": 1, "total_episodes": 1, "media_type": 1,
		}}},
	}
	moviePipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"$or": bson.A{
			bson.M{"title": regexQ},
			bson.M{"telegram.name": regexQ},
		}}}},
		{{Key: "$project", Value: bson.M{
			"_id": 1, "tmdb_id": 1, "title": 1, "genres": 1, "rating": 1,
			"release_year": 1, "poster": 1, "backdrop": 1, "description": 1,
			"media_type": 1,
		}}},
	}

	tvCursor, err := d.tv.Aggregate(ctx, tvPipeline, options.Aggregate().SetAllowDiskUse(true))
	if err != nil {
		return nil, err
	}
	defer tvCursor.Close(ctx)
	var tvResults []bson.M
	_ = tvCursor.All(ctx, &tvResults)

	movieCursor, err := d.movies.Aggregate(ctx, moviePipeline)
	if err != nil {
		return nil, err
	}
	defer movieCursor.Close(ctx)
	var movieResults []bson.M
	_ = movieCursor.All(ctx, &movieResults)

	combined := append(tvResults, movieResults...)
	total := len(combined)

	end := skip + pageSize
	if end > total {
		end = total
	}
	page_results := combined
	if skip < total {
		page_results = combined[skip:end]
	} else {
		page_results = []bson.M{}
	}
	convertIDs(page_results)

	return bson.M{"total_count": total, "results": page_results}, nil
}

func (d *Database) GetAds(ctx context.Context) ([]bson.M, error) {
	var doc bson.M
	if err := d.ads.FindOne(ctx, bson.M{"_id": "ads"}).Decode(&doc); err != nil {
		return []bson.M{}, nil
	}
	rawAds, _ := doc["ads"].(bson.A)
	ads := make([]bson.M, 0, len(rawAds))
	for _, a := range rawAds {
		if m, ok := a.(bson.M); ok {
			ads = append(ads, m)
		}
	}
	return ads, nil
}

// ─────────────────────────── Helpers ──────────────────────────────────────

func convertID(doc bson.M) {
	if id, ok := doc["_id"]; ok {
		doc["_id"] = fmt.Sprintf("%v", id)
	}
}

func convertIDs(docs []bson.M) {
	for _, doc := range docs {
		convertID(doc)
	}
}
