import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { PiStarFill } from "react-icons/pi";
import { BsPlayFill } from "react-icons/bs";
import posterPlaceholder from "../assets/images/poster-placeholder.png";

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

// ─── Compact card ─────────────────────────────────────────────────────────────
const BrowseCard = ({ movie, dataType }) => {
  const [hovered, setHovered] = useState(false);

  const link =
    movie.media_type === "movie" || dataType === "movies"
      ? `/mov/${movie.tmdb_id}`
      : `/ser/${movie.tmdb_id}`;

  const rating = movie.rating ? Number(movie.rating).toFixed(1) : null;

  const episodeMeta = useMemo(() => {
    if (dataType !== "series") return null;
    const parts = [];
    if (movie.seasons_count) parts.push(`Season ${movie.seasons_count}`);
    if (movie.episodes_count) parts.push(`Episode 1-${movie.episodes_count}`);
    if (parts.length === 0 && movie.release_year) parts.push(String(movie.release_year));
    return parts.join(" ");
  }, [movie, dataType]);

  const ratingColor =
    rating >= 8 ? "#84cc16" :
    rating >= 6 ? "#eab308" :
    "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={link} className="block">
        <div
          className="relative rounded-xl overflow-hidden aspect-[2/3] w-full"
          style={{
            boxShadow: hovered
              ? "0 0 0 2px rgba(132,204,22,0.55), 0 16px 40px rgba(0,0,0,0.8)"
              : "0 4px 16px rgba(0,0,0,0.5)",
            transition: "box-shadow 0.35s ease, transform 0.35s ease",
            transform: hovered ? "scale(1.035)" : "scale(1)",
          }}
        >
          <LazyLoadImage
            src={movie.poster || posterPlaceholder}
            alt={movie.title}
            effect="black-and-white"
            width="100%"
            height="100%"
            className="w-full h-full object-cover"
            style={{
              filter: hovered ? "brightness(0.55)" : "brightness(1)",
              transition: "filter 0.35s ease",
            }}
          />

          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-2.5"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lime-500 shadow-[0_0_16px_rgba(132,204,22,0.9)]">
                  <BsPlayFill className="text-black text-sm ml-0.5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {rating && (
            <div
              className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[0.65rem] font-bold shadow-lg z-10"
              style={{
                background: "rgba(0,0,0,0.78)",
                backdropFilter: "blur(6px)",
                border: `1px solid ${ratingColor}55`,
                color: ratingColor,
              }}
            >
              <PiStarFill style={{ color: ratingColor }} className="text-[0.6rem]" />
              {rating}
            </div>
          )}
        </div>

        <div className="mt-2 px-0.5">
          <p
            className="text-[0.8rem] font-semibold line-clamp-1 transition-colors duration-200"
            style={{ color: hovered ? "#84cc16" : "white" }}
          >
            {movie.title}
          </p>
          {dataType === "series" && episodeMeta ? (
            <p className="text-[0.65rem] text-gray-400 mt-0.5 line-clamp-1">{episodeMeta}</p>
          ) : (
            movie.release_year && (
              <p className="text-[0.65rem] text-gray-400 mt-0.5">{movie.release_year}</p>
            )
          )}
        </div>
      </Link>
    </motion.div>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-[2/3] w-full rounded-xl bg-gray-800/70" />
    <div className="mt-2 h-3 bg-gray-800/70 rounded w-3/4" />
    <div className="mt-1 h-2.5 bg-gray-800/50 rounded w-1/2" />
  </div>
);

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
    <div className="px-4 md:px-6 lg:px-8 py-6 min-h-screen">

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

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">

        {/* Left Sidebar */}
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

          {/* Header */}
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

          {/* Mobile filter bar */}
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

          {/* Card Grid */}
          {isMovieDataLoading ? (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
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
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {movieData.map((movie, idx) =>
                movie ? (
                  <BrowseCard
                    key={`${movie.tmdb_id || movie.id || idx}`}
                    movie={movie}
                    dataType={dataType}
                  />
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
