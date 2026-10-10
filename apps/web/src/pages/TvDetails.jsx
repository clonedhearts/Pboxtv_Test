import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import MoviesAndSeriesDetailsSections from "../components/MoviesAndSeriesDetailsSections";
import Similars from "../components/Similars";
import SEO from "../components/SEO"; // import SEO
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Watch from "../components/Watch";
import { getFromStorage, saveToStorage } from "../utils/helpers";

export default function MovieDetails() {
  const BASE = import.meta.env.VITE_BASE_URL; // Base URL for backend
  const SITENAME = import.meta.env.VITE_SITENAME;

  let { seriesID } = useParams();

  // States
  const [seriesDetail, setSeriesDetail] = useState({});
  const [similarSeries, setSimilarSeries] = useState([]);
  const [isDetailsLoading, setDetailsIsLoading] = useState(true);
  const [isSimilarLoading, setIsSimilarLoading] = useState(true);

  const [episodeNumber, setEpisodeNumber] = useState();
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(true);
  const [episodes, setEpisodes] = useState([]);
  const [isWatchEpisodePopupOpen, setIsWatchEpisodePopupOpen] = useState(false);

  // Use refs to store AbortControllers for request cancellation
  const abortControllersRef = useRef([]);

  // Cleanup function to cancel pending requests
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => {
        if (controller) controller.abort();
      });
      abortControllersRef.current = [];
    };
  }, []);

  // Fetch Series Details Data and First Season Episodes in Parallel
  useEffect(() => {
    setDetailsIsLoading(true);
    setIsEpisodesLoading(true);
    window.scrollTo(0, 0);

    // Create AbortController for this request
    const detailsController = new AbortController();
    abortControllersRef.current.push(detailsController);

    // Fetch series details
    const seriesPromise = axios
      .get(`${BASE}/api/id/${seriesID}`, {
        signal: detailsController.signal,
      })
      .then((response) => {
        const seriesData = response.data;
        const sortedSeasons = seriesData.seasons.sort(
          (a, b) => a.season_number - b.season_number
        );

        setSeriesDetail({ ...seriesData, seasons: sortedSeasons });

        // Determine first season number
        const firstSeasonNumber = sortedSeasons.length > 0 
          ? sortedSeasons[0].season_number 
          : 1;
        
        setSeasonNumber(firstSeasonNumber);

        // Save to recently viewed when series is viewed
        if (seriesData && seriesData.tmdb_id) {
          const currentRecentlyViewed = getFromStorage('recentlyViewed', []);
          const isAlreadyViewed = currentRecentlyViewed.some(item => item.tmdb_id === seriesData.tmdb_id);
          
          if (!isAlreadyViewed) {
            const updatedRecentlyViewed = [
              {
                tmdb_id: seriesData.tmdb_id,
                title: seriesData.title,
                poster: seriesData.poster,
                release_year: seriesData.release_year,
                media_type: seriesData.media_type || 'tv',
                viewed_at: new Date().toISOString()
              },
              ...currentRecentlyViewed
            ].slice(0, 20);
            saveToStorage('recentlyViewed', updatedRecentlyViewed);
            window.dispatchEvent(new CustomEvent('recentlyViewedUpdated'));
          }
        }

        setDetailsIsLoading(false);

        // Fetch first season episodes immediately after series details load
        if (firstSeasonNumber !== undefined) {
          const episodesController = new AbortController();
          abortControllersRef.current.push(episodesController);

          axios
            .get(`${BASE}/api/id/${seriesID}`, {
              params: { season_number: firstSeasonNumber },
              signal: episodesController.signal,
            })
            .then((response) => {
              setEpisodes(response.data.episodes);
              setIsEpisodesLoading(false);
            })
            .catch((error) => {
              if (error.name !== 'CanceledError') {
                console.error("Error fetching episodes:", error);
                setIsEpisodesLoading(false);
              }
            });
        }
      })
      .catch((error) => {
        if (error.name !== 'CanceledError') {
          console.error("Error fetching series details:", error);
          setDetailsIsLoading(false);
          setIsEpisodesLoading(false);
        }
      });

    return () => {
      detailsController.abort();
    };
  }, [seriesID, BASE]);

  // Fetch Similar Series (non-blocking, can load after main content)
  useEffect(() => {
    setIsSimilarLoading(true);

    const similarController = new AbortController();
    abortControllersRef.current.push(similarController);

    // Delay similar series fetch slightly to prioritize main content
    const timeoutId = setTimeout(() => {
      axios
        .get(`${BASE}/api/similar/`, {
          params: {
            tmdb_id: seriesID,
            media_type: "tvshow",
            limit: 10,
          },
          signal: similarController.signal,
        })
        .then((response) => {
          setSimilarSeries(response.data.similar_media);
          setIsSimilarLoading(false);
        })
        .catch((error) => {
          if (error.name !== 'CanceledError') {
            console.error("Error fetching similar series:", error);
            setIsSimilarLoading(false);
          }
        });
    }, 300); // Small delay to prioritize main content

    return () => {
      clearTimeout(timeoutId);
      similarController.abort();
    };
  }, [seriesID, BASE]);

  // Fetch Episode List when season changes (with cancellation)
  useEffect(() => {
    if (seasonNumber === undefined || !seriesID) return;

    setIsEpisodesLoading(true);

    const episodesController = new AbortController();
    abortControllersRef.current.push(episodesController);

    axios
      .get(`${BASE}/api/id/${seriesID}`, {
        params: { season_number: seasonNumber },
        signal: episodesController.signal,
      })
      .then((response) => {
        setEpisodes(response.data.episodes);
        setIsEpisodesLoading(false);
      })
      .catch((error) => {
        if (error.name !== 'CanceledError') {
          console.error("Error fetching episodes:", error);
          setIsEpisodesLoading(false);
        }
      });

    return () => {
      episodesController.abort();
    };
  }, [seasonNumber, seriesID, BASE]);

  return (
    <div>
      <ToastContainer style={{ fontSize: "0.8rem" }} />

      {/* SEO SECTION */}
      <SEO
        title={SITENAME}
        description={`Discover a world of entertainment where every show, movie, and exclusive content takes you on a journey beyond the screen. ${SITENAME} offers endless options for every mood, helping you relax, escape, and imagine more. Stream your favorites, dream big, and repeat the experience, only with ${SITENAME}.`}
        name={SITENAME}
        type="text/html"
        keywords="watch movies online, watch hd movies, watch full movies, streaming movies online, free streaming movie, watch movies free, watch hd movies online, watch series online, watch hd series free, free tv series, free movies online, tv online, tv links, tv links movies, free tv shows, watch tv shows online, watch tv shows online free, free hd movies, New Movie Releases, Top Movies of the Year, Watch Movies Online, Streaming Services, Movie Reviews, Upcoming Films, Best Movie Scenes, Classic Movies, HD Movie Streaming, Film Trailers, Action Movies, Drama Films, Comedy Movies, Sci-Fi Films, Horror Movie Picks, Family-Friendly Movies, Award-Winning Films, Movie Recommendations, Cinematic Experiences, Behind-the-Scenes, Director Spotlights, Actor Interviews, Film Festivals, Cult Classics, Top Box Office Hits, Celebrity News, Movie Soundtracks, Oscar-Winning Movies, Movie Trivia, Exclusive Film Content, Best Cinematography, Must-Watch Movies, Film Industry News, Filmmaking Tips, Top Movie Blogs, Latest Movie Gossip, Interactive Movie Quizzes, Red Carpet Moments, IMDb Ratings, Movie Fan Communities, fmovies, fmovies.to, fmovies to, fmovies is, fmovie, free movies, online movie, movie online, free movies online, watch movies online free, free hd movies, watch movies online"
        link={`https://${SITENAME}.com`}
      />
      {/* Call MoviesAndSeriesDetailsSections Component */}
      <MoviesAndSeriesDetailsSections
        movieData={seriesDetail}
        isMovieDataLoading={isDetailsLoading}
        detailType="series"
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
        setEpisodeNumber={setEpisodeNumber}
        setSeasonNumber={setSeasonNumber}
        isEpisodesLoading={isEpisodesLoading}
        episodes={episodes}
        setEpisodes={setEpisodes}
        setIsWatchEpisodePopupOpen={setIsWatchEpisodePopupOpen}
        isWatchEpisodePopupOpen={isWatchEpisodePopupOpen}
      />

      <Similars
        movieData={similarSeries}
        isMovieDataLoading={isSimilarLoading}
        sectionTitle="You may also like"
        detailType="similarMovies"
        seeMoreButtonLink={`/similarSeries/${seriesID}`}
      />
      {/* Fullscreen Watch component - hidden when using embedded player */}
      {false && (
        <Watch
          isWatchEpisodePopupOpen={false}
          setIsWatchEpisodePopupOpen={setIsWatchEpisodePopupOpen}
          id={seriesDetail}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          setSeasonNumber={setSeasonNumber}
          setEpisodeNumber={setEpisodeNumber}
          episodes={episodes}
          popUpType="episode"
        />
      )}
    </div>
  );
}
