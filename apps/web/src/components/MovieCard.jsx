import { useRef, memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { PiStarFill } from "react-icons/pi";
import { BsPlayFill } from "react-icons/bs";
import posterPlaceholder from "../assets/images/poster-placeholder.png";

const MovieCard = ({ movie, delay = 0 }) => {
  const [showPlayBtn, setShowPlayBtn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-20px 0px",
    amount: 0.1
  });

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
      y: 20,
      scale: 0.98
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
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
      <div className="relative cursor-pointer group/slider:hover:opacity-30 group-hover/card:!opacity-100 transition-all duration-300 touch-manipulation">
        <Link
          to={movieLink}
          className="block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="aspect-[9/13.5] w-full rounded-xl relative transition-all duration-500 group-hover/card:p-px group-hover/card:shadow-xl group-hover/card:shadow-purple-500/20">
            <div className="aspect-[9/13.5] w-full rounded-xl overflow-hidden relative z-10 transition-all duration-500">
              <LazyLoadImage
                src={movie.poster ? movie.poster : posterPlaceholder}
                width="100%"
                effect="black-and-white"
                alt={movie.title}
                className="aspect-[9/13.5] w-full object-cover transition-all duration-500 group-hover/card:brightness-110"
              />

              {/* Cinematic gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-500 z-20 opacity-0 group-hover/card:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 transition-all duration-500 z-20 opacity-0 group-hover/card:opacity-100" />

              {/* Cinematic vignette effect */}
              <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] transition-all duration-500 z-20 opacity-0 group-hover/card:opacity-100" />

              {/* RIP Quality Badge - Inside Card */}
              {isInView && (
                <motion.div
                  className="absolute bottom-2 left-2 z-50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (delay / 1000) + 0.3, duration: 0.2, ease: "easeOut" }}
                >
                  <div className="backdrop-blur-xl bg-green-500/30 border border-green-400/40 text-green-200 py-0.5 px-2 rounded-full font-semibold text-[0.5rem] sm:text-[0.6rem] shadow-2xl transition-all duration-300 group-hover/card:bg-green-500/40 group-hover/card:border-green-300/50 group-hover/card:shadow-green-400/20">
                    {movie.rip || "Blu-Ray"}
                  </div>
                </motion.div>
              )}

              {/* Language Badge - Inside Card */}
              {isInView && (
                <motion.div
                  className="absolute bottom-2 right-2 z-50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (delay / 1000) + 0.4, duration: 0.2, ease: "easeOut" }}
                >
                  <div className="backdrop-blur-xl bg-blue-500/30 border border-blue-400/40 text-blue-200 py-0.5 px-2 rounded-full font-semibold text-[0.5rem] sm:text-[0.6rem] shadow-2xl transition-all duration-300 group-hover/card:bg-blue-500/40 group-hover/card:border-blue-300/50 group-hover/card:shadow-blue-400/20">
                    {languageText}
                  </div>
                </motion.div>
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
            transition={{ duration: 0.4, delay: (delay / 1000) + 0.1 }}
          >
            <p className="line-clamp-2 text-xs md:text-sm font-semibold mb-1 transition-colors duration-300 group-hover/card:text-white">{movie.title}</p>
            <div className="flex items-center justify-between text-secondaryTextColor">
              {movie.release_year && (
                <p className="text-[0.6rem] font-medium transition-colors duration-300 group-hover/card:text-gray-300">{movie.release_year}</p>
              )}
              {runtimeText && (
                <div className="backdrop-blur-xl bg-purple-500/30 border border-purple-400/40 text-purple-200 py-0.5 px-1.5 rounded-full text-[0.5rem] font-semibold transition-all duration-300 group-hover/card:bg-purple-500/40 group-hover/card:border-purple-300/50 group-hover/card:shadow-purple-400/20">
                  {runtimeText}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Rating Badge */}
        {isInView && (
          <motion.div
            className="absolute top-2 left-2 z-50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (delay / 1000) + 0.2, duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center gap-1 backdrop-blur-xl bg-black/70 border border-yellow-400/40 text-yellow-200 py-0.5 px-2 rounded-full font-bold text-[0.6rem] shadow-2xl transition-all duration-300 group-hover/card:bg-black/80 group-hover/card:border-yellow-300/50 group-hover/card:shadow-yellow-400/20">
              <PiStarFill className="text-yellow-400 text-[0.6rem] transition-colors duration-300 group-hover/card:text-yellow-300" />
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
              className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 sm:block z-20"
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{
                  type: "tween",
                  duration: 0.3,
                }}
                className="text-3xl p-1 rounded-full border-4 border-red-500"
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
