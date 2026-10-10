import React, { useState, useEffect } from "react";
import axios from "axios";
import HeroSlider from "../components/HomeHero";
import PromotionalBanner from "../components/PromotionalBanner";
import HomeSections from "../components/HomeSections";
import SEO from "../components/SEO";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { inject } from '@vercel/analytics';

inject();

export default function Home() {
  const BASE = import.meta.env.VITE_BASE_URL;
  const SITENAME = import.meta.env.VITE_SITENAME;

  const [heroPopularMovies, setHeroPopularMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTv, setTrendingTv] = useState([]);
  const [isHeroLoading, setIsHeroLoading] = useState(true);
  const [isTrendingMoviesLoading, setIsTrendingMoviesLoading] = useState(true);
  const [isTrendingTvLoading, setIsTrendingTvLoading] = useState(true);

  useEffect(() => {
    if (!BASE) {
      console.error("BASE URL is not defined");
      setIsHeroLoading(false);
      return;
    }
    setIsHeroLoading(true);
    window.scrollTo(0, 0);
    
    // Fetch both movies and series for hero banner
    const fetchMovies = axios.get(`${BASE}/api/movies`, {
      params: {
        sort_by: "updated_on:desc",
        page: 1,
        page_size: 5,
      },
    });

    const fetchSeries = axios.get(`${BASE}/api/tvshows`, {
      params: {
        sort_by: "id:desc",
        page: 1,
        page_size: 5,
      },
    });

    Promise.all([fetchMovies, fetchSeries])
      .then(([moviesResponse, seriesResponse]) => {
        const movies = moviesResponse.data?.movies || moviesResponse.data?.results || [];
        const series = seriesResponse.data?.tv_shows || seriesResponse.data?.tvshows || seriesResponse.data?.results || [];
        
        const validMovies = Array.isArray(movies) ? movies : [];
        // Sort series by ID descending (newest first) before filtering
        const sortedSeries = Array.isArray(series) 
          ? [...series].sort((a, b) => {
              if (a.id && b.id) {
                return b.id - a.id;
              }
              if (a.updated_on && b.updated_on) {
                return new Date(b.updated_on) - new Date(a.updated_on);
              }
              return 0;
            })
          : [];
        const validSeries = sortedSeries;
        
        // Filter out items without valid backdrops
        const filteredMovies = validMovies.filter(item =>
          item.backdrop &&
          item.backdrop.trim() !== '' &&
          !item.backdrop.includes('null') &&
          !item.backdrop.includes('undefined')
        );
        
        const filteredSeries = validSeries.filter(item =>
          item.backdrop &&
          item.backdrop.trim() !== '' &&
          !item.backdrop.includes('null') &&
          !item.backdrop.includes('undefined')
        );
        
        // Combine movies and series, interleaving them (alternating)
        const combined = [];
        const maxLength = Math.max(filteredMovies.length, filteredSeries.length);
        
        for (let i = 0; i < maxLength; i++) {
          if (i < filteredMovies.length) {
            combined.push({ ...filteredMovies[i], media_type: 'movie' });
          }
          if (i < filteredSeries.length) {
            combined.push({ ...filteredSeries[i], media_type: 'tv' });
          }
        }
        
        // If no filtered items, use unfiltered ones
        const finalItems = combined.length > 0 
          ? combined 
          : [...validMovies.map(m => ({ ...m, media_type: 'movie' })), ...validSeries.map(s => ({ ...s, media_type: 'tv' }))];
        
        setHeroPopularMovies(finalItems);
        setIsHeroLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching hero content:", error);
        setHeroPopularMovies([]);
        setIsHeroLoading(false);
      });
  }, [BASE]);

  useEffect(() => {
    if (!BASE) {
      console.error("BASE URL is not defined");
      setIsTrendingMoviesLoading(false);
      return;
    }
    setIsTrendingMoviesLoading(true);
    axios
      .get(`${BASE}/api/movies`, {
        params: {
          sort_by: "updated_on:desc",
          page: 1,
          page_size: 60,
        },
      })
      .then((response) => {
        const movies = response.data?.movies || response.data?.results || [];
        setTrendingMovies(Array.isArray(movies) ? movies : []);
        setIsTrendingMoviesLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching trending movies:", error);
        setTrendingMovies([]);
        setIsTrendingMoviesLoading(false);
      });
  }, [BASE]);

  useEffect(() => {
    setIsTrendingTvLoading(true);

    axios
      .get(`${BASE}/api/tvshows`, {
        params: {
          sort_by: "updated_on:desc",
          page: 1,
          page_size: 60,
        },
      })
      .then((response) => {
        setTrendingTv(response.data.tv_shows);
        setIsTrendingTvLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching trending TV shows:", error);
        setIsTrendingTvLoading(false);
      });
  }, [BASE]);

  return (
    <div>
      <ToastContainer style={{ fontSize: "0.8rem" }} />
      <SEO
        title={SITENAME}
        description={`Discover a world of entertainment where every show, movie, and exclusive content takes you on a journey beyond the screen. ${SITENAME} offers endless options for every mood, helping you relax, escape, and imagine more. Stream your favorites, dream big, and repeat the experience, only with ${SITENAME}.`}
        name={SITENAME}
        type="text/html"
        keywords="watch movies online, watch hd movies, watch full movies, streaming movies online, free streaming movie, watch movies free, watch hd movies online, watch series online, watch hd series free, free tv series, free movies online, tv online, tv links, tv links movies, free tv shows, watch tv shows online, watch tv shows online free, free hd movies, New Movie Releases, Top Movies of the Year, Watch Movies Online, Streaming Services, Movie Reviews, Upcoming Films, Best Movie Scenes, Classic Movies, HD Movie Streaming, Film Trailers, Action Movies, Drama Films, Comedy Movies, Sci-Fi Films, Horror Movie Picks, Family-Friendly Movies, Award-Winning Films, Movie Recommendations, Cinematic Experiences, Behind-the-Scenes, Director Spotlights, Actor Interviews, Film Festivals, Cult Classics, Top Box Office Hits, Celebrity News, Movie Soundtracks, Oscar-Winning Movies, Movie Trivia, Exclusive Film Content, Best Cinematography, Must-Watch Movies, Film Industry News, Filmmaking Tips, Top Movie Blogs, Latest Movie Gossip, Interactive Movie Quizzes, Red Carpet Moments, IMDb Ratings, Movie Fan Communities, fmovies, fmovies.to, fmovies to, fmovies is, fmovie, free movies, online movie, movie online, free movies online, watch movies online free, free hd movies, watch movies online"
        link={`https://${SITENAME}.com`}
      />

      <div className="col-span-1 lg:col-span-2">
        <HeroSlider
          movieData={heroPopularMovies}
          isMovieDataLoading={isHeroLoading}
          dataType="heroPopularMovies"
          sliderTypePrev="slideHeroTrendingMovies-prev"
          sliderTypeNext="slideHeroTrendingMovies-next"
        />
      </div>

      <HomeSections
        movieData={trendingMovies}
        isMovieDataLoading={isTrendingMoviesLoading}
        sectionTitle="Latest Movies"
        sectionSeeMoreButtonLink="/Movies"
        dataType="latestMovies"
      />

      <HomeSections
        movieData={trendingTv}
        isMovieDataLoading={isTrendingTvLoading}
        sectionTitle="Latest Series"
        sectionSeeMoreButtonLink="/Series"
        dataType="latestTv"
      />

      <PromotionalBanner />
    </div>
  );
}
