import { useRef, memo, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { PiStarFill } from "react-icons/pi";
import { BsPlayFill, BsInfoCircle } from "react-icons/bs";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { MdAdd } from "react-icons/md";
import { getFromStorage, saveToStorage } from "../utils/helpers";
import posterPlaceholder from "../assets/images/poster-placeholder.png";

// Arc Rating Meter Component
const ArcRating = ({ rating }) => {
  const percentage = (rating / 10) * 100;
  const radius = 14;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = rating >= 7 ? "#84cc16" : rating >= 5 ? "#eab308" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 36, height: 22 }}>
      <svg width="36" height="22" viewBox="0 0 36 22">
        {/* Background arc */}
        <path
          d="M 3 19 A 15 15 0 0 1 33 19"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d="M 3 19 A 15 15 0 0 1 33 19"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <span
        className="absolute bottom-0 text-[0.55rem] font-bold"
        style={{ color }}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

const MovieCard = ({ movie, delay = 0 }) => {
  const [showPlayBtn, setShowPlayBtn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const hoverTimerRef = useRef(null);
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-20px 0px",
    amount: 0.1
  });

  // Check if movie is in favorites
  useEffect(() => {
    const favorites = getFromStorage('favorites', []);
    const isFav = favorites.some(fav => fav.tmdb_id === movie.tmdb_id);
    setIsFavorite(isFav);
  }, [movie.tmdb_id]);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      const favorites = getFromStorage('favorites', []);
      const isFav = favorites.some(fav => fav.tmdb_id === movie.tmdb_id);
      setIsFavorite(isFav);
    };
    
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    window.addEventListener('storage', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleFavoritesUpdate);
    };
  }, [movie.tmdb_id]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favorites = getFromStorage('favorites', []);
    const isFav = favorites.some(fav => fav.tmdb_id === movie.tmdb_id);
    
    if (isFav) {
      const updatedFavorites = favorites.filter(fav => fav.tmdb_id !== movie.tmdb_id);
      saveToStorage('favorites', updatedFavorites);
      setIsFavorite(false);
    } else {
      const newFavorite = {
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        poster: movie.poster,
        release_year: movie.release_year,
        media_type: movie.media_type || 'movie'
      };
      const updatedFavorites = [newFavorite, ...favorites];
      saveToStorage('favorites', updatedFavorites);
      setIsFavorite(true);
    }
    
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  };

  const handleMouseEnter = () => {
    setShowPlayBtn(true);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setIsHovered(true), 300);
  };

  const handleMouseLeave = () => {
    setShowPlayBtn(false);
    setIsHovered(false);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }, []);

  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.35, delay: delay / 1000, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  }), [delay]);

  const movieLink = useMemo(() =>
    movie.media_type === "movie"
      ? `/mov/${movie.tmdb_id}`
      : `/ser/${movie.tmdb_id}`,
    [movie.media_type, movie.tmdb_id]
  );

  const languageText = useMemo(() =>
    movie.languages
      ? movie.languages.map((lang) => lang.charAt(0).toUpperCase() + lang.slice(1)).join("-")
      : "EN",
    [movie.languages]
  );

  const runtimeText = useMemo(() =>
    movie.runtime
      ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
      : null,
    [movie.runtime]
  );

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="relative group/card hover:z-50"
    >
      <div
        className="relative cursor-pointer transition-all duration-300 touch-manipulation"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link to={movieLink} className="block">
          {/* Card Image Container */}
          <div
            className="aspect-[9/13.5] w-full rounded-xl relative transition-all duration-500"
            style={{
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
              boxShadow: isHovered
                ? '0 0 0 1px rgba(132,204,22,0.6), 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(132,204,22,0.35)'
                : '0 4px 16px rgba(0,0,0,0.4)',
              transition: 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s ease'
            }}
          >
            <div className="aspect-[9/13.5] w-full rounded-xl overflow-hidden relative z-10">
              {/* Poster Image */}
              <LazyLoadImage
                src={movie.poster ? movie.poster : posterPlaceholder}
                width="100%"
                effect="black-and-white"
                alt={movie.title}
                className="aspect-[9/13.5] w-full object-cover transition-all duration-500"
                style={{ filter: isHovered ? 'brightness(0.55) saturate(0.9)' : 'brightness(1)' }}
              />

              {/* Glassmorphism bottom overlay on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute inset-0 z-20 flex flex-col justify-end"
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
                    
                    {/* Content */}
                    <div className="relative z-10 p-2.5 space-y-2">
                      {/* Title */}
                      <p className="text-white font-bold text-[0.62rem] sm:text-xs leading-tight line-clamp-2 drop-shadow">
                        {movie.title}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {movie.release_year && (
                          <span className="text-lime-400/80 text-[0.5rem] font-medium">{movie.release_year}</span>
                        )}
                        {runtimeText && (
                          <span className="text-gray-400 text-[0.5rem]">• {runtimeText}</span>
                        )}
                        <span className="text-gray-500 text-[0.5rem] uppercase">{languageText}</span>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Play button */}
                        <motion.div
                          className="flex items-center justify-center bg-lime-500 hover:bg-lime-400 rounded-full w-7 h-7 text-black shadow-[0_0_12px_rgba(132,204,22,0.8)] flex-shrink-0 transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <BsPlayFill className="text-sm ml-0.5" />
                        </motion.div>

                        {/* Favorite button */}
                        <motion.button
                          onClick={toggleFavorite}
                          className="flex items-center justify-center rounded-full w-6 h-6 border border-white/30 bg-white/10 backdrop-blur-sm text-white hover:border-lime-400/60 hover:text-lime-400 flex-shrink-0 transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isFavorite ? (
                            <AiFillHeart className="text-lime-400 text-xs" />
                          ) : (
                            <AiOutlineHeart className="text-xs" />
                          )}
                        </motion.button>

                        {/* Arc Rating */}
                        {movie.rating && (
                          <div className="ml-auto">
                            <ArcRating rating={movie.rating} />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Language Badge - only when NOT hovered */}
              {isInView && !isHovered && (
                <motion.div
                  className="absolute bottom-2 left-2 z-30"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (delay / 1000) + 0.1, duration: 0.2 }}
                >
                  <div className="bg-lime-500/90 backdrop-blur-sm border border-lime-400/60 text-black py-0.5 px-1.5 rounded-md font-bold text-[0.48rem] sm:text-[0.55rem] shadow-[0_0_8px_rgba(132,204,22,0.7)]">
                    {languageText}
                  </div>
                </motion.div>
              )}

              {/* Favorite indicator - only when NOT hovered */}
              {isInView && !isHovered && isFavorite && (
                <motion.div
                  className="absolute bottom-2 right-2 z-30"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="p-1 rounded-full bg-black/60 backdrop-blur-sm border border-lime-400/40">
                    <AiFillHeart className="text-lime-400 text-xs" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Neon border glow effect on hover */}
            {isHovered && (
              <div className="absolute inset-0 rounded-xl pointer-events-none z-0"
                style={{ boxShadow: 'inset 0 0 0 1.5px rgba(132,204,22,0.5)' }}
              />
            )}
          </div>
        </Link>

        {/* Rating Badge (top-left) - NOT hovered */}
        {isInView && !isHovered && (
          <motion.div
            className="absolute top-2 left-2 z-20"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (delay / 1000) + 0.1, duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center gap-0.5 backdrop-blur-xl bg-black/75 border border-lime-400/30 text-lime-300 py-0.5 px-1.5 rounded-full font-bold text-[0.55rem] shadow-lg">
              <PiStarFill className="text-lime-400 text-[0.55rem]" />
              <span>{movie.rating ? movie.rating.toFixed(1) : "0.0"}</span>
            </div>
          </motion.div>
        )}

        {/* Play Button Overlay when NOT expanded */}
        <AnimatePresence>
          {showPlayBtn && !isHovered && (
            <Link
              to={movieLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="hidden absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-lime-400 sm:block z-20 pointer-events-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.9, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-3xl p-2 rounded-full border-2 border-lime-400/70 bg-black/30 backdrop-blur-sm shadow-[0_0_20px_rgba(132,204,22,0.5)]"
              >
                <BsPlayFill />
              </motion.div>
            </Link>
          )}
        </AnimatePresence>

        {/* Movie Title and Year below card */}
        {isInView && (
          <motion.div
            className="text-primaryTextColor mt-2 px-0.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: (delay / 1000) + 0.05 }}
          >
            <p className="line-clamp-1 text-xs md:text-[0.8rem] font-semibold mb-0.5 transition-colors duration-300 group-hover/card:text-lime-400">
              {movie.title}
            </p>
            <div className="flex items-center gap-1.5 text-secondaryTextColor">
              {movie.release_year && (
                <span className="text-[0.58rem] font-medium">{movie.release_year}</span>
              )}
              {runtimeText && (
                <span className="text-[0.55rem] text-gray-500">• {runtimeText}</span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(MovieCard);
