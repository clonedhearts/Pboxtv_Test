import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@nextui-org/modal";
import { AiOutlineClose } from "react-icons/ai";
import { FaYoutube, FaFilm } from "react-icons/fa";
import axios from "axios";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API || "cc29e1ece19538044f4749ef19c0c739";

const TrailerModal = ({ isOpen, onClose, movieTitle, releaseYear, tmdbId, mediaType = "movie" }) => {
  const [trailerVideos, setTrailerVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && (tmdbId || movieTitle)) {
      fetchTrailer();
    } else {
      setTrailerVideos([]);
      setCurrentVideoIndex(0);
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, tmdbId, movieTitle, releaseYear, mediaType]);

  const fetchTrailer = async () => {
    setIsLoading(true);
    setError(null);

    const type = mediaType === "series" || mediaType === "tv" ? "tv" : "movie";

    try {
      let resolvedTmdbId = tmdbId;

      // If tmdbId not provided or invalid, search TMDB by title
      if (!resolvedTmdbId && movieTitle) {
        try {
          const searchUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
            movieTitle
          )}${releaseYear ? (type === "movie" ? `&year=${releaseYear}` : `&first_air_date_year=${releaseYear}`) : ""}`;
          const searchRes = await axios.get(searchUrl, { timeout: 8000 });
          if (searchRes.data?.results?.length > 0) {
            resolvedTmdbId = searchRes.data.results[0].id;
          }
        } catch (searchErr) {
          console.warn("TMDB title search fallback error:", searchErr);
        }
      }

      if (!resolvedTmdbId) {
        setError("Could not locate title on TMDB");
        setIsLoading(false);
        return;
      }

      // Fetch videos from TMDB
      const videosUrl = `https://api.themoviedb.org/3/${type}/${resolvedTmdbId}/videos?api_key=${TMDB_API_KEY}`;
      const response = await axios.get(videosUrl, { timeout: 8000 });
      const results = response.data?.results || [];

      // Filter YouTube videos
      const ytVideos = results.filter(
        (v) => v.site === "YouTube" && v.key && /^[a-zA-Z0-9_-]{11}$/.test(v.key)
      );

      if (ytVideos.length === 0) {
        // Try opposite media type just in case (e.g. miniseries cataloged as movie or vice versa)
        const altType = type === "movie" ? "tv" : "movie";
        try {
          const altVideosUrl = `https://api.themoviedb.org/3/${altType}/${resolvedTmdbId}/videos?api_key=${TMDB_API_KEY}`;
          const altResponse = await axios.get(altVideosUrl, { timeout: 5000 });
          const altResults = altResponse.data?.results || [];
          const altYt = altResults.filter(
            (v) => v.site === "YouTube" && v.key && /^[a-zA-Z0-9_-]{11}$/.test(v.key)
          );
          if (altYt.length > 0) {
            ytVideos.push(...altYt);
          }
        } catch {
          // ignore fallback error
        }
      }

      if (ytVideos.length === 0) {
        setError("No official trailer available for this title.");
        setTrailerVideos([]);
      } else {
        // Prioritize Official Trailers > Trailers > Teasers > Clips
        const sorted = [...ytVideos].sort((a, b) => {
          const score = (v) => {
            let s = 0;
            if (v.type === "Trailer") s += 10;
            if (v.type === "Teaser") s += 5;
            if (v.official) s += 4;
            if (v.iso_639_1 === "en") s += 2;
            return s;
          };
          return score(b) - score(a);
        });

        setTrailerVideos(sorted);
        setCurrentVideoIndex(0);
      }
    } catch (err) {
      console.error("Error fetching trailer from TMDB:", err);
      setError("Unable to load trailer right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentVideo = trailerVideos[currentVideoIndex];
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${movieTitle} ${releaseYear || ""} official trailer`
  )}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      placement="center"
      classNames={{
        base: "bg-[#0b0f17]/95 backdrop-blur-2xl border border-lime-500/20 max-h-[95vh] md:max-h-[85vh] w-[95vw] md:w-auto rounded-2xl shadow-[0_0_50px_rgba(132,204,22,0.15)]",
        wrapper: "items-center justify-center p-2 md:p-4 z-[9999]",
        header: "border-b border-white/10 px-4 py-3 bg-black/40",
        body: "p-0 overflow-hidden",
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.25, ease: "easeOut" },
          },
          exit: {
            y: 15,
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.2, ease: "easeIn" },
          },
        },
      }}
    >
      <ModalContent className="max-w-full w-full md:max-w-5xl">
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center flex-shrink-0 text-lime-400">
                  <FaFilm className="text-sm" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-bold text-white truncate">
                    {movieTitle}
                  </h2>
                  <p className="text-xs text-lime-400/90 font-medium">
                    {currentVideo?.name || "Official Trailer"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={currentVideo ? `https://www.youtube.com/watch?v=${currentVideo.key}` : youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 text-xs font-semibold transition-all hover:scale-105"
                  title="Watch on YouTube"
                >
                  <FaYoutube className="text-red-400 text-sm" />
                  <span>YouTube</span>
                </a>
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <AiOutlineClose className="text-xl" />
                </button>
              </div>
            </ModalHeader>

            <ModalBody className="overflow-hidden p-0 bg-black">
              <div
                className="relative w-full bg-black overflow-hidden flex items-center justify-center"
                style={{
                  paddingBottom: "56.25%", // 16:9 aspect ratio
                  minHeight: "260px",
                  height: 0,
                }}
              >
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b0f17]">
                    <div className="w-12 h-12 border-3 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-medium text-white/70">Loading trailer...</p>
                  </div>
                ) : error || !currentVideo ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#0b0f17] via-black to-[#0b0f17]">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
                      <FaFilm className="text-2xl" />
                    </div>
                    <p className="text-base font-semibold text-white mb-1">
                      {error || "Trailer Not Found"}
                    </p>
                    <p className="text-xs text-white/60 mb-5 max-w-md">
                      An official embedded trailer was not found on TMDB for this title. You can watch it directly on YouTube.
                    </p>
                    <a
                      href={youtubeSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-500 to-lime-400 text-black font-bold text-sm shadow-lg shadow-lime-500/20 hover:scale-105 transition-all"
                    >
                      <FaYoutube className="text-base text-red-600" />
                      <span>Search on YouTube</span>
                    </a>
                  </div>
                ) : (
                  <iframe
                    key={currentVideo.key}
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${currentVideo.key}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                    title={`${movieTitle} Trailer`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ border: "none" }}
                  />
                )}
              </div>

              {/* Multiple trailers switcher */}
              {trailerVideos.length > 1 && (
                <div className="p-3 bg-black/60 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-thin">
                  <span className="text-xs text-white/50 uppercase font-semibold px-2">
                    Videos:
                  </span>
                  {trailerVideos.map((video, idx) => (
                    <button
                      key={video.id || idx}
                      onClick={() => setCurrentVideoIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        currentVideoIndex === idx
                          ? "bg-lime-400 text-black shadow-md shadow-lime-400/20"
                          : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                      }`}
                    >
                      {video.type || "Trailer"} {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default TrailerModal;


