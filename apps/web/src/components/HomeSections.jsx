import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y, FreeMode } from "swiper/modules";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";

import "swiper/css";
import "swiper/css/free-mode";
import "react-lazy-load-image-component/src/effects/black-and-white.css";

import { BiChevronRight, BiChevronLeft } from "react-icons/bi";
import { HiSparkles } from "react-icons/hi2";

export default function HomeSection(props) {
  const [isHovered, setIsHovered] = useState({ row1: false, row2: false, row3: false, row4: false });
  const swiperRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px 0px", amount: 0.1 });

  const slideNext = (rowNumber) => {
    const swiperRef = swiperRefs[rowNumber - 1];
    if (swiperRef.current) swiperRef.current.slideNext();
  };

  const slidePrev = (rowNumber) => {
    const swiperRef = swiperRefs[rowNumber - 1];
    if (swiperRef.current) swiperRef.current.slidePrev();
  };

  const getRowData = (rowNumber) => {
    if (!props.movieData || props.movieData.length === 0) return [];
    const maxItemsPerRow = Math.min(15, Math.ceil(props.movieData.length / 4));
    const startIndex = (rowNumber - 1) * maxItemsPerRow;
    const endIndex = startIndex + maxItemsPerRow;
    return props.movieData.slice(startIndex, endIndex);
  };

  const renderRow = (rowNumber, rowData) => (
    <motion.div
      key={rowNumber}
      className="relative group w-screen overflow-hidden mb-2"
      style={{ marginLeft: 'calc(-50vw + 50%)' }}
      initial={{ opacity: 0, x: rowNumber % 2 === 0 ? 40 : -40 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: rowNumber % 2 === 0 ? 40 : -40 }}
      transition={{ duration: 0.55, delay: rowNumber * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseEnter={() => setIsHovered(prev => ({ ...prev, [`row${rowNumber}`]: true }))}
      onMouseLeave={() => setIsHovered(prev => ({ ...prev, [`row${rowNumber}`]: false }))}
    >
      <Swiper
        modules={[Navigation, A11y, FreeMode]}
        spaceBetween={8}
        slidesPerView={3}
        freeMode={true}
        grabCursor={true}
        onSwiper={(swiper) => { swiperRefs[rowNumber - 1].current = swiper; }}
        breakpoints={{
          480: { slidesPerView: 4, spaceBetween: 10 },
          640: { slidesPerView: 5, spaceBetween: 14 },
          768: { slidesPerView: 6, spaceBetween: 16 },
          1024: { slidesPerView: 7, spaceBetween: 18 },
          1280: { slidesPerView: 8, spaceBetween: 20 },
          1536: { slidesPerView: 9, spaceBetween: 22 },
          1920: { slidesPerView: 10, spaceBetween: 24 },
        }}
        className="movie-slider w-full px-4 md:px-6 lg:px-8"
      >
        {rowData.map((movie, index) => (
          <SwiperSlide key={`${movie.tmdb_id || movie.id || index}`}>
            <MovieCard movie={movie} delay={index * 30} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Prev button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered[`row${rowNumber}`] ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        onClick={() => slidePrev(rowNumber)}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 md:p-2.5 bg-black/85 backdrop-blur-md border border-lime-500/30 rounded-full text-lime-400 hover:bg-lime-500 hover:text-black hover:border-lime-500 transition-all duration-250 shadow-[0_0_12px_rgba(132,204,22,0.3)]"
      >
        <BiChevronLeft className="text-lg md:text-xl" />
      </motion.button>

      {/* Next button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered[`row${rowNumber}`] ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        onClick={() => slideNext(rowNumber)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 md:p-2.5 bg-black/85 backdrop-blur-md border border-lime-500/30 rounded-full text-lime-400 hover:bg-lime-500 hover:text-black hover:border-lime-500 transition-all duration-250 shadow-[0_0_12px_rgba(132,204,22,0.3)]"
      >
        <BiChevronRight className="text-lg md:text-xl" />
      </motion.button>
    </motion.div>
  );

  return (
    <div ref={sectionRef} className="py-4 md:py-6 movie-section">
      {/* Section Header */}
      <div className="w-screen px-4 md:px-6 lg:px-8" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
        <motion.div
          className="flex items-center justify-between mb-5 md:mb-7"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3">
            {/* Animated accent bar */}
            <motion.div
              className="relative flex flex-col items-center justify-center"
              animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="w-1 h-7 md:h-9 bg-gradient-to-b from-lime-300 to-lime-600 rounded-full shadow-[0_0_14px_rgba(132,204,22,0.9)]" />
            </motion.div>

            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold text-white tracking-wide">
                {props.sectionTitle}
              </h2>
              {/* Sparkle icon for visual flair */}
              <motion.span
                animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <HiSparkles className="text-lime-400 text-sm opacity-70" />
              </motion.span>
            </div>
          </div>

          {/* See All button with animated underline */}
          <Link
            to={props.sectionSeeMoreButtonLink}
            className="group flex items-center gap-1.5 text-gray-400 hover:text-lime-400 transition-colors duration-300 relative"
          >
            <span className="text-sm font-semibold tracking-wide">See All</span>
            <BiChevronRight className="text-lg group-hover:translate-x-1 transition-transform duration-250" />
            {/* Underline */}
            <span className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full bg-lime-400 transition-all duration-300 rounded-full" />
          </Link>
        </motion.div>
      </div>

      {/* Content */}
      {!props.isMovieDataLoading && props.movieData?.length > 0 ? (
        <div className="space-y-1">
          {[1, 2, 3, 4].map(rowNumber => {
            const rowData = getRowData(rowNumber);
            return rowData.length > 0 ? renderRow(rowNumber, rowData) : null;
          })}
        </div>
      ) : (
        <div className="w-screen px-4 md:px-6 lg:px-8" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
          <MovieCardSkeleton />
        </div>
      )}
    </div>
  );
}
