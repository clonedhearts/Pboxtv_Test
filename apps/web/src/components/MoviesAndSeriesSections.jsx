import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";

// ─── Genre definitions ────────────────────────────────────────────────────────
const MOVIE_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Family", "Fantasy", "History",
  "Horror", "Music", "Mystery", "Romance", "Science Fiction",
  "Thriller", "War", "Western",
];

const SERIES_GENRES = [
  "Drama", "Crime", "Comedy", "Sci-Fi & Fantasy", "Mystery",
  "Action & Adventure", "Documentary", "Reality", "Animation",
  "Family", "War & Politics", "Kids",
];

const RATINGS = ["Any rating", "9+", "8+", "7+", "6+", "5+"];

const SORT_LABELS = [
  { label: "Most watched", value: "views" },
  { label: "Latest",       value: "updated_on" },
  { label: "Top rated",    value: "rating" },
  { label: "A - Z",        value: "title" },
];

const currentYear = new Date().getFullYear();
const YEARS = ["Any year", ...Array.from({ length: currentYear - 1979 }, (_, i) => String(currentYear - i))];

// ─── Sidebar select ───────────────────────────────────────────────────────────
const SidebarSelect = ({ label, options, value, onChange }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-[#131720] border border-gray-700/60 text-gray-200 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-lime-500/60 cursor-pointer transition-colors duration-200 hover:border-gray-600"
      >
        {options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function MoviesAndSeriesSections(props) {
  const {
    movieData = [],
    isMovieDataLoading,
    dataType,
    setMovieFilter,
    movieFilter,
    movieFilterVal,
    setMovieFilterVal,
    previousFilter,
    setPreviousFilter,
  } = props;

  const genres = dataType === "series" ? SERIES_GENRES : MOVIE_GENRES;

  const [sidebarGenre,  setSidebarGenre]  = useState("All genres");
  const [sidebarRating, setSidebarRating] = useState("Any rating");
  const [sidebarYear,   setSidebarYear]   = useState("Any year");
  const [sidebarSort,   setSidebarSort]   = useState("views");

  const activeGenrePill = useMemo(() => {
    if (movieFilter && movieFilter.startsWith("genre:")) return movieFilter.split(":")[1];
    return null;
  }, [movieFilter]);

  const handleApplyFilters = () => {
    if (sidebarGenre !== "All genres") {
      setMovieFilter(`genre:${sidebarGenre}`);
      if (setMovieFilterVal) setMovieFilterVal("genre");
    } else {
      const val = sidebarSort || "updated_on";
      setMovieFilter(val);
      if (setMovieFilterVal) setMovieFilterVal(val);
    }
  };

  const handleReset = () => {
    setSidebarGenre("All genres");
    setSidebarRating("Any rating");
    setSidebarYear("Any year");
    setSidebarSort("views");
    setMovieFilter("updated_on");
    if (setMovieFilterVal) setMovieFilterVal("updated_on");
  };

  const handleGenrePill = (genre) => {
    if (activeGenrePill === genre) {
      setMovieFilter("updated_on");
      if (setMovieFilterVal) setMovieFilterVal("updated_on");
      setSidebarGenre("All genres");
    } else {
      setMovieFilter(`genre:${genre}`);
      if (setMovieFilterVal) setMovieFilterVal("genre");
      setSidebarGenre(genre);
    }
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 min-h-screen movie-section">

      {/* Genre pill row */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 min-w-max pb-1">
          {genres.map((genre) => {
            const active = activeGenrePill === genre;
            return (
              <button
                key={genre}
                onClick={() => handleGenrePill(genre)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-lime-500 border-lime-400 text-black shadow-[0_0_12px_rgba(132,204,22,0.5)]"
                    : "bg-[#131720] border-gray-700/60 text-gray-300 hover:border-lime-500/40 hover:text-white"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column layout: sidebar + main */}
      <div className="flex gap-6 items-start">

        {/* Left Sidebar - desktop only */}
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 rounded-2xl border border-gray-800/70 bg-[#0e1118]/90 backdrop-blur-md p-5 sticky top-24">
          <div className="flex items-center justify-between mb-5">
            <span className="text-white font-bold text-base">Refine results</span>
            <button
              onClick={handleReset}
              className="text-lime-400 hover:text-lime-300 text-sm font-semibold transition-colors duration-150"
            >
              Reset
            </button>
          </div>

          <SidebarSelect label="Genre"          options={["All genres", ...genres]} value={sidebarGenre}  onChange={setSidebarGenre} />
          <SidebarSelect label="Minimum rating" options={RATINGS}                   value={sidebarRating} onChange={setSidebarRating} />
          <SidebarSelect label="Release year"   options={YEARS}                     value={sidebarYear}   onChange={setSidebarYear} />
          <SidebarSelect label="Sort by"        options={SORT_LABELS}               value={sidebarSort}   onChange={setSidebarSort} />

          <button
            onClick={handleApplyFilters}
            className="mt-2 w-full py-2.5 rounded-xl font-bold text-sm text-black bg-lime-400 hover:bg-lime-300 shadow-[0_0_16px_rgba(132,204,22,0.4)] transition-all duration-200 active:scale-95"
          >
            Apply filters
          </button>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Results header */}
          <div className="mb-5">
            <p className="text-lime-400 text-xs font-bold uppercase tracking-widest mb-0.5">Results</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {isMovieDataLoading ? (
                <span className="inline-block w-32 h-8 rounded-lg bg-gray-800 animate-pulse" />
              ) : (
                <>{movieData.length.toLocaleString()} titles</>
              )}
            </h1>
          </div>

          {/* Mobile sort bar */}
          <div className="flex lg:hidden items-center gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
            {SORT_LABELS.map((s) => (
              <button
                key={s.value}
                onClick={() => { setMovieFilter(s.value); if (setMovieFilterVal) setMovieFilterVal(s.value); }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                  movieFilterVal === s.value
                    ? "bg-lime-500 border-lime-400 text-black"
                    : "bg-[#131720] border-gray-700/60 text-gray-300 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Card Grid - using original MovieCard */}
          {isMovieDataLoading ? (
            <MovieCardSkeleton />
          ) : movieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <p className="text-lg font-semibold">No titles found</p>
              <p className="text-sm mt-1">Try adjusting the filters</p>
            </div>
          ) : (
            <div className="w-full">
              <div className="grid gap-x-2 gap-y-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {movieData.map((movie, index) => {
                  if (!movie) return null;
                  return (
                    <div
                      key={`${movie.tmdb_id || movie.id || index}`}
                      className="transform transition-all duration-300 hover:scale-105 hover:z-10 group w-full"
                    >
                      <MovieCard movie={movie} delay={index % 20} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 text-center text-gray-400 text-sm">
                Showing {movieData.length} items
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
