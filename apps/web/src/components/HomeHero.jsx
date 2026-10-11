import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay } from "react-icons/fa";
import { PiStarFill } from "react-icons/pi";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { MdInfoOutline } from "react-icons/md";
import { HiCalendar, HiClock, HiTranslate } from "react-icons/hi";



export default function HeroSlider({ movieData, isMovieDataLoading }) {

  const navigate = useNavigate();



  const filteredMovieData = movieData?.filter(movie =>

    movie.backdrop &&

    movie.backdrop.trim() !== '' &&

    !movie.backdrop.includes('null') &&

    !movie.backdrop.includes('undefined')

  ) || [];



  // State for current hero index (auto-changing)

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);



  // Auto-change hero banner every 5 seconds

  const [isPaused, setIsPaused] = useState(false);



  // Swipe gesture state

  const touchStartX = useRef(null);

  const touchStartY = useRef(null);

  const touchEndX = useRef(null);

  const touchEndY = useRef(null);

  const minSwipeDistance = 30; // Minimum distance for a swipe (reduced for better sensitivity)

  

  useEffect(() => {

    if (filteredMovieData.length === 0 || isPaused) return;



    const interval = setInterval(() => {

      setCurrentHeroIndex((prevIndex) => 

        (prevIndex + 1) % filteredMovieData.length

      );

    }, 5000); // Change every 5 seconds



    return () => clearInterval(interval);

  }, [filteredMovieData.length, isPaused]);



  // Navigation functions (moved before swipe handlers)

  const goToNext = () => {

    if (filteredMovieData.length === 0) return;

    setCurrentHeroIndex((prevIndex) => 

      (prevIndex + 1) % filteredMovieData.length

    );

    setIsPaused(true);

    setTimeout(() => setIsPaused(false), 10000); // Resume auto-scroll after 10 seconds

  };



  const goToPrevious = () => {

    if (filteredMovieData.length === 0) return;

    setCurrentHeroIndex((prevIndex) => 

      prevIndex === 0 ? filteredMovieData.length - 1 : prevIndex - 1

    );

    setIsPaused(true);

    setTimeout(() => setIsPaused(false), 10000); // Resume auto-scroll after 10 seconds

  };



  // Swipe gesture handlers

  const onTouchStart = (e) => {

    // Don't interfere with button clicks or if no movies

    if (e.target.closest('button') || e.target.closest('a') || filteredMovieData.length <= 1) {

      return;

    }

    touchEndX.current = null;

    touchEndY.current = null;

    touchStartX.current = e.targetTouches[0].clientX;

    touchStartY.current = e.targetTouches[0].clientY;

  };



  const onTouchMove = (e) => {

    if (!touchStartX.current) return;

    

    const currentX = e.targetTouches[0].clientX;

    const currentY = e.targetTouches[0].clientY;

    

    touchEndX.current = currentX;

    touchEndY.current = currentY;

    

    // Prevent scrolling if we're doing a horizontal swipe

    const distanceX = Math.abs(touchStartX.current - currentX);

    const distanceY = Math.abs((touchStartY.current || 0) - currentY);

    

    // If horizontal movement is greater than vertical, prevent default scrolling

    if (distanceX > distanceY && distanceX > 10) {

      e.preventDefault();

      e.stopPropagation();

    }

  };



  const onTouchEnd = (e) => {

    // Don't interfere with button clicks or if no movies

    if (e.target.closest('button') || e.target.closest('a') || filteredMovieData.length <= 1) {

      touchStartX.current = null;

      touchStartY.current = null;

      touchEndX.current = null;

      touchEndY.current = null;

      return;

    }



    if (!touchStartX.current) {

      touchStartX.current = null;

      touchStartY.current = null;

      touchEndX.current = null;

      touchEndY.current = null;

      return;

    }



    // Use changedTouches if available, otherwise use stored values

    const endX = touchEndX.current !== null ? touchEndX.current : (e.changedTouches?.[0]?.clientX || touchStartX.current);

    const endY = touchEndY.current !== null ? touchEndY.current : (e.changedTouches?.[0]?.clientY || touchStartY.current);



    const distanceX = touchStartX.current - endX;

    const distanceY = (touchStartY.current || 0) - (endY || 0);

    const absDistanceX = Math.abs(distanceX);

    const absDistanceY = Math.abs(distanceY);

    

    const isLeftSwipe = distanceX > minSwipeDistance;

    const isRightSwipe = distanceX < -minSwipeDistance;

    const isVerticalSwipe = absDistanceY > absDistanceX;



    // Only handle horizontal swipes, ignore vertical swipes (page scrolling)

    if (!isVerticalSwipe && (isLeftSwipe || isRightSwipe)) {

      if (isLeftSwipe) {

        goToNext();

      } else if (isRightSwipe) {

        goToPrevious();

      }

    }

    

    // Reset

    touchStartX.current = null;

    touchStartY.current = null;

    touchEndX.current = null;

    touchEndY.current = null;

  };



  // Mouse drag handlers for desktop

  const onMouseDown = (e) => {

    // Only start drag if clicking on the background, not on buttons

    if (e.target.closest('button') || e.target.closest('a')) return;

    touchEndX.current = null;

    touchEndY.current = null;

    touchStartX.current = e.clientX;

    touchStartY.current = e.clientY;

  };



  const onMouseMove = (e) => {

    if (touchStartX.current === null) return;

    touchEndX.current = e.clientX;

    touchEndY.current = e.clientY;

  };



  const onMouseUp = (e) => {

    if (!touchStartX.current || touchEndX.current === null) {

      touchStartX.current = null;

      touchStartY.current = null;

      touchEndX.current = null;

      touchEndY.current = null;

      return;

    }

    if (touchStartY.current === null || touchEndY.current === null) {

      touchStartX.current = null;

      touchStartY.current = null;

      touchEndX.current = null;

      touchEndY.current = null;

      return;

    }



    const distanceX = touchStartX.current - touchEndX.current;

    const distanceY = touchStartY.current - touchEndY.current;

    const isLeftSwipe = distanceX > minSwipeDistance;

    const isRightSwipe = distanceX < -minSwipeDistance;

    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);



    // Only handle horizontal swipes, ignore vertical swipes (page scrolling)

    if (!isVerticalSwipe) {

      if (isLeftSwipe) {

        goToNext();

      }

      if (isRightSwipe) {

        goToPrevious();

      }

    }

    

    // Reset

    touchStartX.current = null;

    touchStartY.current = null;

    touchEndX.current = null;

    touchEndY.current = null;

  };



  const goToSlide = (index) => {

    if (filteredMovieData.length === 0) return;

    setCurrentHeroIndex(index);

    setIsPaused(true);

    setTimeout(() => setIsPaused(false), 10000); // Resume auto-scroll after 10 seconds

  };



  // Get current hero movie

  const heroMovie = filteredMovieData.length > 0 ? filteredMovieData[currentHeroIndex] : null;



  // Preload next hero image for faster transitions

  useEffect(() => {

    if (filteredMovieData.length > 0) {

      const nextIndex = (currentHeroIndex + 1) % filteredMovieData.length;

      const nextMovie = filteredMovieData[nextIndex];

      if (nextMovie?.backdrop) {

        const link = document.createElement('link');

        link.rel = 'preload';

        link.as = 'image';

        link.href = nextMovie.backdrop;

        document.head.appendChild(link);

        return () => {

          document.head.removeChild(link);

        };

      }

    }

  }, [currentHeroIndex, filteredMovieData]);



  // Format metadata: "2025 • HI | WEBRip"

  const formatMetadata = (movie) => {

    const parts = [];

    if (movie.release_year) parts.push(movie.release_year);

    

    if (movie.languages && movie.languages.length > 0) {

      const lang = movie.languages[0].toUpperCase();

      parts.push(lang);

    }

    

    if (movie.rip) {

      parts.push(movie.rip);

    }

    

    if (parts.length === 0) return null;

    

    // Format: "2025 • HI | WEBRip"

    if (parts.length === 1) return parts[0];

    if (parts.length === 2) return `${parts[0]} • ${parts[1]}`;

    return `${parts[0]} • ${parts[1]} | ${parts[2]}`;

  };



  // Mouse parallax for hero image
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroContainerRef = useRef(null);

  const handleMouseMoveHero = (e) => {
    if (!heroContainerRef.current) return;
    const rect = heroContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
    setMousePos({ x, y });
  };

  const handleMouseLeaveHero = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (

    <div className="relative w-full mb-0 px-1.5 md:px-3">

      {!isMovieDataLoading && heroMovie ? (

        <div className="relative group" ref={heroContainerRef} onMouseMove={handleMouseMoveHero} onMouseLeave={handleMouseLeaveHero}>

          <AnimatePresence mode="wait">

            <motion.div

              key={`hero-${heroMovie.tmdb_id}-${currentHeroIndex}`}

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              exit={{ opacity: 0 }}

              transition={{ duration: 0.5 }}

              className="w-full"

            >

              {/* Cinematic Hero Banner */}
              <div
                className="relative w-full mb-6 sm:mb-8 md:mb-10 rounded-2xl sm:rounded-3xl h-[28vh] sm:h-[32vh] md:h-[62vh] lg:h-[72vh] xl:h-[76vh] border border-lime-500/25 shadow-[0_0_40px_rgba(132,204,22,0.15),0_25px_60px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing select-none overflow-hidden"
                style={{ marginBottom: '1.5rem', userSelect: 'none' }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >

            {/* Parallax Background Image */}
            <motion.img
              src={heroMovie.backdrop || heroMovie.poster || ''}
              alt={heroMovie.title || 'Movie backdrop'}
              className="absolute w-[105%] h-[105%] rounded-2xl sm:rounded-3xl"
              style={{
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block',
                backgroundColor: '#1a1a1a',
                top: '-2.5%',
                left: '-2.5%',
              }}
              animate={{
                x: mousePos.x,
                y: mousePos.y,
              }}
              transition={{ type: 'spring', stiffness: 80, damping: 25, mass: 0.8 }}
              loading="eager"
              onError={(e) => {
                const currentSrc = e.target.src;
                if (heroMovie.poster && currentSrc !== heroMovie.poster && heroMovie.backdrop) {
                  e.target.src = heroMovie.poster;
                } else if (!heroMovie.backdrop && heroMovie.poster && currentSrc !== heroMovie.poster) {
                  e.target.src = heroMovie.poster;
                } else {
                  e.target.style.opacity = '0.3';
                }
              }}
            />

            {/* Cinematic gradient layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/10 z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-0" />
            {/* Subtle vignette */}
            <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />

            

            {/* Cinematic content overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end px-3 sm:px-5 md:px-8 lg:px-12 pb-4 sm:pb-6 md:pb-8 lg:pb-10">
              <motion.div
                className="max-w-2xl space-y-2 sm:space-y-3"
                key={`content-${heroMovie.tmdb_id}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Media type badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[0.5rem] sm:text-[0.6rem] font-bold uppercase tracking-widest text-lime-400 bg-lime-500/15 border border-lime-500/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {heroMovie.media_type === 'tv' ? '📺 Series' : '🎬 Movie'}
                  </span>
                  {heroMovie.rip && (
                    <span className="text-[0.5rem] sm:text-[0.6rem] font-semibold uppercase tracking-widest text-gray-300 bg-white/10 border border-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {heroMovie.rip}
                    </span>
                  )}
                </div>

                {/* Title with text-shadow glow */}
                <h1 className="text-white font-extrabold text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl leading-tight line-clamp-2"
                  style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 0 40px rgba(132,204,22,0.15)' }}>
                  {heroMovie.title}
                </h1>

                {/* Meta pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {heroMovie.rating && (
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-lime-400/50 text-lime-400 px-2 py-0.5 rounded-full text-[0.58rem] sm:text-xs font-bold shadow-[0_0_10px_rgba(132,204,22,0.3)]">
                      <PiStarFill className="text-[0.6rem]" />
                      <span>{heroMovie.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {heroMovie.release_year && (
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md border border-white/15 text-gray-300 px-2 py-0.5 rounded-full text-[0.55rem] sm:text-[0.65rem]">
                      <HiCalendar className="text-[0.6rem]" />
                      <span>{heroMovie.release_year}</span>
                    </div>
                  )}
                  {heroMovie.runtime && (
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md border border-white/15 text-gray-300 px-2 py-0.5 rounded-full text-[0.55rem] sm:text-[0.65rem]">
                      <HiClock className="text-[0.6rem]" />
                      <span>{Math.floor(heroMovie.runtime / 60)}h {heroMovie.runtime % 60}m</span>
                    </div>
                  )}
                  {heroMovie.languages && heroMovie.languages[0] && (
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md border border-white/15 text-gray-300 px-2 py-0.5 rounded-full text-[0.55rem] sm:text-[0.65rem] uppercase">
                      <HiTranslate className="text-[0.6rem]" />
                      <span>{heroMovie.languages[0]}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-300 text-[0.62rem] sm:text-[0.72rem] md:text-xs lg:text-sm leading-relaxed max-w-lg line-clamp-2 hidden sm:block"
                  style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                  {heroMovie.description || heroMovie.overview || "An incredible story that will leave you breathless."}
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-2 sm:gap-3 pt-1">
                  {/* Watch Now */}
                  <motion.button
                    onClick={() => {
                      const route = heroMovie.media_type === 'tv'
                        ? `/ser/${heroMovie.tmdb_id}`
                        : `/mov/${heroMovie.tmdb_id}`;
                      navigate(route);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 bg-lime-500 hover:bg-lime-400 text-black px-3 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-2.5 rounded-lg font-black text-[0.65rem] sm:text-xs md:text-sm tracking-wide shadow-[0_0_20px_rgba(132,204,22,0.5)] hover:shadow-[0_0_30px_rgba(132,204,22,0.7)] border border-lime-300/50 transition-all duration-200"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FaPlay className="text-[0.6rem] sm:text-[0.7rem] md:text-[0.8rem]" />
                    <span>WATCH NOW</span>
                  </motion.button>

                  {/* More Info */}
                  <motion.button
                    onClick={() => {
                      const route = heroMovie.media_type === 'tv'
                        ? `/ser/${heroMovie.tmdb_id}`
                        : `/mov/${heroMovie.tmdb_id}`;
                      navigate(route);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/40 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-lg backdrop-blur-md font-semibold text-[0.65rem] sm:text-xs md:text-sm tracking-wide transition-all duration-200"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <MdInfoOutline className="text-sm sm:text-base" />
                    <span className="hidden sm:inline">More Info</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>

          </div>

          </motion.div>

        </AnimatePresence>



        {/* Navigation Arrows - Cinematic Style */}
        {filteredMovieData.length > 1 && (
          <>
            <motion.button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 z-20 p-2.5 bg-black/60 backdrop-blur-md border border-lime-500/30 rounded-full text-lime-400 hover:bg-lime-500 hover:text-black hover:border-lime-400 transition-all duration-250 shadow-[0_0_15px_rgba(132,204,22,0.2)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(132,204,22,0.5)' }}
              whileTap={{ scale: 0.9 }}
              aria-label="Previous movie"
            >
              <BiChevronLeft className="text-xl" />
            </motion.button>
            <motion.button
              onClick={goToNext}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 z-20 p-2.5 bg-black/60 backdrop-blur-md border border-lime-500/30 rounded-full text-lime-400 hover:bg-lime-500 hover:text-black hover:border-lime-400 transition-all duration-250 shadow-[0_0_15px_rgba(132,204,22,0.2)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(132,204,22,0.5)' }}
              whileTap={{ scale: 0.9 }}
              aria-label="Next movie"
            >
              <BiChevronRight className="text-xl" />
            </motion.button>
          </>
        )}

        {/* Navigation Dots - Progress bars style */}
        {filteredMovieData.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-6 z-20 flex gap-1.5 items-center">
            {filteredMovieData.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="relative h-0.5 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: index === currentHeroIndex ? 28 : 8 }}
                aria-label={`Go to slide ${index + 1}`}
              >
                <div className="absolute inset-0 bg-white/25 rounded-full" />
                {index === currentHeroIndex && (
                  <motion.div
                    className="absolute inset-0 bg-lime-400 rounded-full shadow-[0_0_6px_rgba(132,204,22,0.9)]"
                    layoutId="heroActiveDot"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        </div>

      ) : (
        <div className="w-full">
          {/* Loading Hero Skeleton - Cinematic shimmer */}
          <div className="relative w-full h-[28vh] sm:h-[32vh] md:h-[62vh] lg:h-[72vh] bg-[#0d1117] overflow-hidden rounded-2xl sm:rounded-3xl border border-lime-500/10">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(132,204,22,0.04) 50%, transparent 65%)', animation: 'shimmerSweep 2s infinite' }} />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 space-y-3">
              <div className="h-3 bg-[#1a2030] rounded-full w-24 mb-2" />
              <div className="h-6 sm:h-9 bg-[#1a2030] rounded-lg w-2/3" />
              <div className="flex gap-2">
                <div className="h-4 bg-[#1a2030] rounded-full w-12" />
                <div className="h-4 bg-[#1a2030] rounded-full w-12" />
                <div className="h-4 bg-[#1a2030] rounded-full w-16" />
              </div>
              <div className="h-3 bg-[#1a2030] rounded-full w-full max-w-sm hidden sm:block" />
              <div className="flex gap-3 pt-2">
                <div className="h-8 sm:h-10 bg-[#1a2030] rounded-lg w-24 sm:w-32" />
                <div className="h-8 sm:h-10 bg-[#1a2030] rounded-lg w-16 sm:w-24" />
              </div>
            </div>
          </div>
        </div>
      )}



      <style>{`

        @keyframes fadeIn {

          from {

            opacity: 0;

            transform: translateY(10px);

          }

          to {

            opacity: 1;

            transform: translateY(0);

          }

        }

        .animate-fadeIn {

          animation: fadeIn 0.5s ease-in-out;

        }

        .scrollbar-hide {

          -ms-overflow-style: none;

          scrollbar-width: none;

        }

        .scrollbar-hide::-webkit-scrollbar {

          display: none;

        }

      `}</style>

    </div>

  );

}



HeroSlider.propTypes = {

  movieData: PropTypes.array,

  isMovieDataLoading: PropTypes.bool

};
