// src/pages/Movies.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { apiService } from "../services/api";
import { SORT_OPTIONS } from "../config/constants";
import MoviesAndSeriesSections from "../components/MoviesAndSeriesSections";
import Pagination from "../components/Pagination";
import SEO from "../components/SEO";

export default function Movies() {
  const BASE = import.meta.env.VITE_BASE_URL; // Base Url for backend
  const SITENAME = import.meta.env.VITE_SITENAME;
  const location = useLocation();
  const abortControllerRef = useRef(null);

  // States
  const [movies, setMovies] = useState([]);
  const [isMoviesDataLoading, setIsMoviesDataLoading] = useState(true);
  const [moviesDataForPageCount, setMoviesDataForPageCount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [movieFilter, setMovieFilter] = useState("updated_on");
  const [movieFilterVal, setMovieFilterVal] = useState("updated_on");
  const [previousFilter, setPreviousFilter] = useState("updated_on");

  // FETCH MOVIE DATA SECTION
  useEffect(() => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsMoviesDataLoading(true);
    window.scrollTo(0, 0);

    // Check if filter is genre-based or year-based
    const isGenreFilter = movieFilter && movieFilter.startsWith("genre:");
    const isYearFilter = movieFilter && movieFilter.startsWith("year:");
    const genreName = isGenreFilter ? movieFilter.split(":")[1] : null;
    const yearValue = isYearFilter ? movieFilter.split(":")[1] : null;

    // Determine sort field and direction
    let sortBy = SORT_OPTIONS.UPDATED; // Default
    if (movieFilter === "title") {
      sortBy = SORT_OPTIONS.TITLE; // "title:asc"
    } else if (movieFilter === "rating") {
      sortBy = SORT_OPTIONS.RATING; // "rating:desc"
    } else if (movieFilter === "views") {
      sortBy = SORT_OPTIONS.VIEWS; // "views:desc"
    } else if (movieFilter === "updated_on") {
      sortBy = SORT_OPTIONS.UPDATED;
    } else if (isGenreFilter || isYearFilter) {
      sortBy = SORT_OPTIONS.UPDATED;
    }

    const params = {
      sort_by: sortBy,
      page: currentPage,
      page_size: 40,
    };

    if (genreName) {
      params.genre = genreName;
    }
    if (yearValue) {
      params.year = yearValue;
    }

    const processMovieData = (responseData) => {
      let movieData = responseData.movies || responseData.results || [];

      // Client-side genre filtering if specified
      if (genreName && movieData.length > 0) {
        const formattedGenre = genreName.trim().toLowerCase();
        const genreMap = {
          'science fiction': ['science fiction', 'sci-fi', 'scifi', 'sf'],
          'sci-fi': ['science fiction', 'sci-fi', 'scifi', 'sf'],
          'tv movie': ['tv movie', 'tv', 'television movie'],
          'romance': ['romance', 'romantic'],
          'action': ['action'],
          'adventure': ['adventure'],
          'animation': ['animation', 'animated'],
          'comedy': ['comedy', 'comedies'],
          'crime': ['crime'],
          'documentary': ['documentary', 'documentaries'],
          'drama': ['drama', 'dramas'],
          'family': ['family'],
          'fantasy': ['fantasy'],
          'history': ['history', 'historical'],
          'horror': ['horror'],
          'music': ['music', 'musical'],
          'mystery': ['mystery', 'mysteries'],
          'thriller': ['thriller', 'thrillers'],
          'war': ['war'],
          'western': ['western', 'westerns']
        };
        const genreVariations = genreMap[formattedGenre] || [formattedGenre];

        movieData = movieData.filter(movie => {
          if (!movie.genres || (Array.isArray(movie.genres) && movie.genres.length === 0)) return false;
          let movieGenres = [];
          if (Array.isArray(movie.genres)) {
            movieGenres = movie.genres.map(g => {
              if (typeof g === 'string') return g.trim().toLowerCase();
              if (g && typeof g === 'object') return (g.name || g.genre || '').trim().toLowerCase();
              return '';
            }).filter(g => g.length > 0);
          } else if (typeof movie.genres === 'string') {
            movieGenres = movie.genres.split(',').map(g => g.trim().toLowerCase()).filter(g => g.length > 0);
          }
          return movieGenres.some(mg => {
            if (mg === formattedGenre) return true;
            return genreVariations.some(variation => {
              if (mg === variation) return true;
              if (mg.includes(variation) || variation.includes(mg)) {
                const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                return regex.test(mg);
              }
              return false;
            });
          });
        });
      }

      const totalCount = genreName && movieData.length < (responseData.total_count || responseData.total || 0)
        ? movieData.length
        : (responseData.total_count || responseData.total || movieData.length || 0);

      setMovies(Array.isArray(movieData) ? movieData : []);
      setMoviesDataForPageCount(totalCount);
      setIsMoviesDataLoading(false);
    };

    if (BASE) {
      axios
        .get(`${BASE}/api/movies`, {
          params,
          signal: abortControllerRef.current.signal,
          timeout: 10000,
        })
        .then((response) => {
          processMovieData(response.data || {});
        })
        .catch((error) => {
          if (axios.isCancel(error)) return;
          console.warn("Direct API call failed, trying apiService:", error.message);
          apiService.getMovies(params)
            .then((response) => {
              processMovieData(response.data || response || {});
            })
            .catch((fallbackError) => {
              if (axios.isCancel(fallbackError)) return;
              console.error("Error fetching movies:", fallbackError);
              setMovies([]);
              setMoviesDataForPageCount(0);
              setIsMoviesDataLoading(false);
            });
        });
    } else {
      apiService.getMovies(params)
        .then((response) => {
          processMovieData(response.data || response || {});
        })
        .catch((fallbackError) => {
          if (axios.isCancel(fallbackError)) return;
          console.error("Error fetching movies:", fallbackError);
          setMovies([]);
          setMoviesDataForPageCount(0);
          setIsMoviesDataLoading(false);
        });
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [movieFilter, currentPage, BASE]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [movieFilter]);

  // Reset loading on navigation
  useEffect(() => {
    if (location.pathname === '/Movies') {
      setIsMoviesDataLoading(true);
    }
  }, [location.pathname]);

  return (
    <div>
      {/* SEO SECTION */}
      <SEO
        title={SITENAME}
        description={`Discover a world of entertainment where every show, movie, and exclusive content takes you on a journey beyond the screen. ${SITENAME} offers endless options for every mood, helping you relax, escape, and imagine more. Stream your favorites, dream big, and repeat the experience, only with ${SITENAME}.`}
        name={SITENAME}
        type="text/html"
        keywords="watch movies online, watch hd movies, watch full movies, streaming movies online, free streaming movie, watch movies free, watch hd movies online, watch series online, watch hd series free, free tv series, free movies online, tv online, tv links, tv links movies, free tv shows, watch tv shows online, watch tv shows online free, free hd movies, New Movie Releases, Top Movies of the Year, Watch Movies Online, Streaming Services, Movie Reviews, Upcoming Films, Best Movie Scenes, Classic Movies, HD Movie Streaming, Film Trailers, Action Movies, Drama Films, Comedy Movies, Sci-Fi Films, Horror Movie Picks, Family-Friendly Movies, Award-Winning Films, Movie Recommendations, Cinematic Experiences, Behind-the-Scenes, Director Spotlights, Actor Interviews, Film Festivals, Cult Classics, Top Box Office Hits, Celebrity News, Movie Soundtracks, Oscar-Winning Movies, Movie Trivia, Exclusive Film Content, Best Cinematography, Must-Watch Movies, Film Industry News, Filmmaking Tips, Top Movie Blogs, Latest Movie Gossip, Interactive Movie Quizzes, Red Carpet Moments, IMDb Ratings, Movie Fan Communities, fmovies, fmovies.to, fmovies to, fmovies is, fmovie, free movies, online movie, movie online, free movies online, watch movies online free, free hd movies, watch movies online"
        link={`https://${SITENAME}.com`}
      />

      {/* Movies component */}
      <MoviesAndSeriesSections
        movieData={movies}
        isMovieDataLoading={isMoviesDataLoading}
        dataType="movies"
        sectionTitle="Browse Movies"
        setMovieFilter={setMovieFilter}
        movieFilter={movieFilter}
        movieFilterVal={movieFilterVal}
        setMovieFilterVal={setMovieFilterVal}
        previousFilter={previousFilter}
        setPreviousFilter={setPreviousFilter}
      />

      {/* Call Pagination Component */}
      <Pagination
        currentPage={currentPage}
        total={moviesDataForPageCount}
        pagesNum={Math.ceil(moviesDataForPageCount / 40)}
        onPageChange={(p) => {
          setCurrentPage(p);
        }}
        limit={40}
      />
    </div>
  );
}
