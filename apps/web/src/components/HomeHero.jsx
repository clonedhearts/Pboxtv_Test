import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { LazyLoadImage } from "react-lazy-load-image-component";
import PropTypes from "prop-types";

import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { FaPlay } from "react-icons/fa";
import { FaCircle } from "react-icons/fa6";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function HeroSlider({ movieData, isMovieDataLoading }) {
  const navigate = useNavigate();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 30,
      skipSnaps: false,
      draggable: true,
    },
    [Autoplay({ delay: 8000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const scrollTo = useCallback(
    (index) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );

  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  const onInit = useCallback((emblaApi) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("reInit", onInit);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  const filteredMovieData = movieData?.filter(movie =>
    movie.backdrop &&
    movie.backdrop.trim() !== '' &&
    !movie.backdrop.includes('null') &&
    !movie.backdrop.includes('undefined')
  ) || [];

  // Get featured content for the overlay card - dynamic based on selected index (only current card)
  const getFeaturedContent = () => {
    if (filteredMovieData.length === 0) return [];

    const currentIndex = selectedIndex;
    return [filteredMovieData[currentIndex]]; // Only current/active content
  };

  const featuredContent = getFeaturedContent();

  return (
    <div className="relative w-screen overflow-hidden pt-14 sm:pt-12" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
      {!isMovieDataLoading && filteredMovieData.length > 0 ? (
        <div className="embla !w-full">
          <div className="embla__viewport !w-full" ref={emblaRef}>
            <div className="embla__container !w-full">
              {filteredMovieData.map((movie, index) => (
                <div
                  className="embla__slide cursor-pointer"
                  key={`${movie.tmdb_id}-${index}`}
                  onClick={() => navigate(`/mov/${movie.tmdb_id}`)}
                >
                  <div className="relative w-full h-72 sm:h-80 md:h-96 lg:h-[30rem] overflow-hidden">
                    {/* Backdrop Image */}
                    <LazyLoadImage
                      src={movie.backdrop}
                      className="w-full h-full object-fit absolute inset-0 z-0"
                      effect="opacity"
                      threshold={100}
                      alt={movie.title || 'Movie backdrop'}
                      loading="eager"
                      decoding="async"
                      style={{ width: '100%', height: '100%' }}
                    />

                    {/* Gradient Overlay for text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>

                    {/* Content Card Overlay - Positioned at bottom center for mobile */}
                    <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 sm:hidden">
                      <div className="relative flex justify-center">
                        {featuredContent.map((content, cardIndex) => {
                          const isActive = cardIndex === 0; // First card is always active
                          return (
                            <Link
                              key={`${content.tmdb_id}-${cardIndex}`}
                              to={`/mov/${content.tmdb_id}`}
                              className="group flex-shrink-0 transition-all duration-300 w-full max-w-md sm:max-w-lg md:max-w-xl"
                              style={{ textDecoration: "none" }}
                            >
                              <div className={`bg-black/60 backdrop-blur-sm rounded-lg px-3 pt-2 pb-1 border transition-all duration-300 group-hover:bg-black/70 ${isActive
                                ? 'border-white/40 bg-black/70'
                                : 'border-white/20 hover:border-white/30'
                                }`}>
                                <div className="flex items-center gap-3 sm:gap-4 relative">
                                  {/* Thumbnail - extends out of box from top */}
                                  <div className="relative -mt-6 w-12 h-20 flex-shrink-0">
                                    <LazyLoadImage
                                      src={content.poster || content.backdrop}
                                      className="w-full h-full object-cover rounded"
                                      effect="opacity"
                                      alt={content.title || 'Content poster'}
                                    />
                                  </div>

                                  <div className="flex flex-row-reverse items-center justify-between gap-3">
                                    <div className="flex-shrink-0">
                                      <div className="bg-red-600 rounded-full p-2 sm:p-2.5 transform transition-transform duration-300 group-hover:scale-110">
                                        <FaPlay className="text-white text-xs sm:text-sm" />
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h3 className={`text-white font-bold mb-1 line-clamp-1 group-hover:text-red-400 transition-colors duration-300 ${isActive
                                        ? 'text-sm sm:text-base'
                                        : 'text-xs sm:text-sm'
                                        }`}>
                                        {content.title}
                                      </h3>

                                      {/* Meta Info */}
                                      <div className={`flex items-center gap-1.5 min-w-0 ${isActive ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
                                        }`}>
                                        <span className="flex items-center gap-1 text-white/80 flex-shrink-0">
                                          <FaCircle className="text-[3px]" />
                                          TV
                                        </span>
                                        {content.release_year && (
                                          <>
                                            <span className="text-white/40 flex-shrink-0">|</span>
                                            <span className="text-white/80 flex-shrink-0">
                                              {content.release_year}
                                            </span>
                                          </>
                                        )}
                                        <span className="text-white/40 flex-shrink-0">|</span>
                                        <span className="text-white/80 flex-shrink-0">
                                          {content.languages?.slice(0, 1).map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(", ")}
                                        </span>
                                        {content.genres && content.genres.length > 0 && (
                                          <>
                                            <span className="text-white/40 flex-shrink-0">|</span>
                                            <span className="text-white/80 min-w-0 flex-1 truncate">
                                              {content.genres.slice(0, 2).join(", ")}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Desktop Content Overlay - Positioned at bottom left for sm+ screens */}
                    <div className="absolute bottom-6 left-6 z-20 hidden sm:block max-w-md lg:max-w-lg pointer-events-none">
                      <div className="text-white">
                        <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 line-clamp-1 flex-nowrap w-[60vw]">
                          {movie.title}
                        </h2>

                        {/* Meta Info */}
                        <div className="flex items-center gap-2 text-sm lg:text-base text-white/80">
                          <span className="flex items-center gap-1">
                            <FaCircle className="text-[4px]" />
                            TV
                          </span>
                          {movie.release_year && (
                            <>
                              <span className="text-white/40">|</span>
                              <span>{movie.release_year}</span>
                            </>
                          )}
                          <span className="text-white/40">|</span>
                          <span>
                            {movie.languages?.slice(0, 1).map(lang =>
                              lang.charAt(0).toUpperCase() + lang.slice(1)
                            ).join(", ")}
                          </span>
                          {movie.genres && movie.genres.length > 0 && (
                            <>
                              <span className="text-white/40">|</span>
                              <span className="line-clamp-1">
                                {movie.genres.slice(0, 2).join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Pagination Dots - Positioned at bottom right for sm+ screens */}
          <div className="embla__dots right-positioned !hidden sm:!block">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`embla__dot ${index === selectedIndex ? "embla__dot--selected" : ""}`}
                onClick={() => scrollTo(index)}
              />
            ))}
          </div>

          {/* Navigation Buttons - Only visible on sm+ screens */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              scrollPrev();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 hidden sm:block"
            aria-label="Previous slide"
          >
            <FaChevronLeft className="text-lg" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              scrollNext();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 hidden sm:block"
            aria-label="Next slide"
          >
            <FaChevronRight className="text-lg" />
          </button>
        </div>
      ) : (
        <div className="relative w-screen h-[50vh] sm:h-[75vh] md:h-[80vh] lg:h-[85vh] xl:h-[90vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div className="w-full h-full bg-gray-800/30 animate-pulse"></div>

          {/* Loading state content card - positioned at bottom center */}
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="relative flex justify-center">
              <div className="flex-shrink-0 w-full max-w-md sm:max-w-lg md:max-w-xl">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-0.5 border border-white/40 animate-pulse">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative -mt-6 w-16 sm:w-20 md:w-24 h-20 sm:h-24 md:h-28 flex-shrink-0">
                      <div className="w-full h-full bg-gray-700/30 rounded-md animate-pulse"></div>
                    </div>
                    <div className="flex flex-row-reverse items-center justify-between gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-700/30 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 sm:h-5 bg-gray-700/30 rounded animate-pulse"></div>
                        <div className="h-3 sm:h-4 bg-gray-700/30 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .embla {
          width: 100vw;
          overflow: hidden;
          position: relative;
        }
        
        .embla__viewport {
          overflow: hidden;
          width: 100%;
        }
        
        .embla__container {
          display: flex;
          backface-visibility: hidden;
          touch-action: pan-y pinch-zoom;
          width: 100%;
        }
        
        .embla__slide {
          flex: 0 0 100%;
          min-width: 0;
          position: relative;
        }
        
        .embla__dots {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          display: flex;
          align-items: center;
        }
        
        .embla__dots.right-positioned {
          left: auto;
          right: 1.5rem;
          transform: none;
        }
        
        .embla__dot {
          width: 10px;
          height: 10px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
          margin-right: 0.4rem;
        }
        
        .embla__dot:last-child {
          margin-right: 0;
        }
        
        .embla__dot:hover {
          background: rgba(255, 255, 255, 0.7);
          transform: scale(1.15);
        }
        
        .embla__dot--selected {
          background: rgba(255, 255, 255, 0.95);
          width: 1.5rem;
          border-radius: 16px;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 640px) {
          .embla__dots {
            bottom: 0.5rem;
          }
          
          .embla__dot {
            width: 8px;
            height: 8px;
          }
          
          .embla__dot--selected {
            width: 24px;
            border-radius: 12px;
          }
        }
      `}</style>
    </div>
  );
}

HeroSlider.propTypes = {
  movieData: PropTypes.array,
  isMovieDataLoading: PropTypes.bool
};
