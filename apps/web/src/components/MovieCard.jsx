import { useRef, memo, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { PiStarFill } from "react-icons/pi";
import { BsPlayFill } from "react-icons/bs";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { getFromStorage, saveToStorage } from "../utils/helpers";
import posterPlaceholder from "../assets/images/poster-placeholder.png";

const MovieCard = ({ movie, delay = 0 }) => {
  const [showPlayBtn, setShowPlayBtn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
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
      // Remove from favorites
      const updatedFavorites = favorites.filter(fav => fav.tmdb_id !== movie.tmdb_id);
      saveToStorage('favorites', updatedFavorites);
      setIsFavorite(false);
    } else {
      // Add to favorites
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
    
    // Dispatch custom event for cross-component updates
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowPlayBtn(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPlayBtn(false);
  };

  const cardVariants = useMemo(() => ({
    hidden: {
      opacity: 0,
      y: 10,
      scale: 0.99
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        delay: delay / 1000,
        ease: "easeOut"
      }
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
      <div className="relative cursor-pointer group/slider:hover:opacity-30 group-hover/card:!opacity-100 transition-all duration-200 touch-manipulation">
        <Link
          to={movieLink}
          className="block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="aspect-[9/13.5] w-full rounded-xl relative transition-all duration-300 group-hover/card:shadow-[0_0_20px_rgba(132,204,22,0.6)] group-hover/card:scale-[1.02]">
            <div className="aspect-[9/13.5] w-full rounded-xl overflow-hidden relative z-10 transition-all duration-300">
              <LazyLoadImage
                src={movie.poster ? movie.poster : posterPlaceholder}
                width="100%"
                effect="black-and-white"
                alt={movie.title}
                className="aspect-[9/13.5] w-full object-cover transition-all duration-300 group-hover/card:brightness-110"
              />

              {/* Simplified gradient overlays with subtle lime glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-lime-950/15 via-transparent to-transparent transition-all duration-300 z-20 opacity-0 group-hover/card:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-br from-lime-500/10 via-transparent to-transparent transition-all duration-300 z-20 opacity-0 group-hover/card:opacity-100" />

              {/* Language Badge - Moved to bottom-left */}
              {isInView && (
                <motion.div
                  className="absolute bottom-2 left-2 z-50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (delay / 1000) + 0.1, duration: 0.15, ease: "easeOut" }}
                >
                  <div className="bg-lime-500 border border-lime-400 text-black py-0.5 px-2 rounded-lg font-bold text-[0.5rem] sm:text-[0.6rem] shadow-[0_0_10px_rgba(132,204,22,0.8)] transition-all duration-300 group-hover/card:bg-lime-400 group-hover/card:border-lime-300 group-hover/card:shadow-[0_0_15px_rgba(132,204,22,1)]">
                    {languageText}
                  </div>
                </motion.div>
              )}

              {/* Favorite Heart Button - Bottom-right */}
              {isInView && (
                <motion.button
                  className="absolute bottom-2 right-2 z-50 p-1.5 rounded-full backdrop-blur-xl bg-black/70 border border-lime-400/40 text-lime-400 transition-all duration-300 group-hover/card:bg-black/80 group-hover/card:border-lime-300/60 group-hover/card:shadow-lime-400/20 hover:scale-110"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (delay / 1000) + 0.15, duration: 0.15, ease: "easeOut" }}
                  onClick={toggleFavorite}
                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorite ? (
                    <AiFillHeart className="text-lime-400 text-sm sm:text-base" />
                  ) : (
                    <AiOutlineHeart className="text-lime-400 text-sm sm:text-base" />
                  )}
                </motion.button>
              )}

            </div>
          </div>
        </Link>

        {/* Movie Title and Year */}
        {isInView && (
          <motion.div
            className="text-primaryTextColor mt-2 px-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: (delay / 1000) + 0.05 }}
          >
            <p className="line-clamp-2 text-xs md:text-sm font-semibold mb-1 transition-colors duration-300 group-hover/card:text-lime-400">{movie.title}</p>
            <div className="flex items-center justify-between text-secondaryTextColor">
              {movie.release_year && (
                <p className="text-[0.6rem] font-medium transition-colors duration-300 group-hover/card:text-gray-300">{movie.release_year}</p>
              )}
              {runtimeText && (
                <div className="bg-lime-950/80 border border-lime-500/40 text-lime-300 py-0.5 px-1.5 rounded-lg shadow-[0_0_8px_rgba(132,204,22,0.4)] transition-all duration-300 text-[0.5rem] font-semibold">
                  {runtimeText}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Rating Badge */}
        {isInView && (
          <motion.div
            className="absolute top-2 left-2 z-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (delay / 1000) + 0.1, duration: 0.15, ease: "easeOut" }}
          >
            <div className="flex items-center gap-1 backdrop-blur-xl bg-black/80 border border-lime-400/40 text-lime-300 py-0.5 px-2 rounded-full font-bold text-[0.6rem] shadow-2xl transition-all duration-300 group-hover/card:bg-black/90 group-hover/card:border-lime-300/60 group-hover/card:shadow-lime-400/30">
              <PiStarFill className="text-lime-400 text-[0.6rem] transition-colors duration-300 group-hover/card:text-lime-300" />
              <span>{movie.rating ? movie.rating.toFixed(1) : "0.0"}</span>
            </div>
          </motion.div>
        )}

        {/* Play Button Overlay */}
        <AnimatePresence>
          {showPlayBtn && (
            <Link
              to={movieLink}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lime-400 sm:block z-20"
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{
                  type: "tween",
                  duration: 0.3,
                }}
                className="text-3xl p-1 rounded-full border-4 border-lime-400 bg-black/40 backdrop-blur-sm"
              >
                <BsPlayFill />
              </motion.div>
            </Link>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default memo(MovieCard);
