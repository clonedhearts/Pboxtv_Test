from Backend.config import Telegram
from Backend.helper.imdb import get_detail, get_season, search_title
from Backend.helper.mediainfo import get_media_quality
import PTN
from themoviedb import aioTMDb
from Backend.helper.pyro import extract_tmdb_id, normalize_languages

tmdb = aioTMDb(key=Telegram.TMDB_API, language="en-US", region="US")

async def metadata(filename, media):
    try:
        data = PTN.parse(filename)
        title = data.get('title')
        season = data.get('season')
        episode = data.get('episode')
        if isinstance(episode, list):
            episode = episode[0]
        year = data.get('year')
        quality = data.get('resolution') or await get_media_quality(media)
        languages = normalize_languages(data.get('language'))
        rip = data.get('quality')

        default_id = extract_tmdb_id(Telegram.USE_DEFAULT_ID) if Telegram.USE_DEFAULT_ID else extract_tmdb_id(filename)

        if title:
            if season and episode:
                try:
                    if Telegram.USE_TMDB:
                        if default_id is None:
                            tv_shows = await tmdb.search().tv(query=title, first_air_date_year=year)
                            tv_show = None
                            for show in tv_shows:
                                if show.name.lower() == title.lower():
                                    tv_show = show.id
                                    break
                            if tv_show is None:
                                tv_show = tv_shows[0].id
                            tv_show_details = await tmdb.tv(tv_show).details()
                            try:
                                episode_details = await tmdb.episode(tv_show, season, episode).details()
                                episode_title = episode_details.name or f"S{season}E{episode}"
                                episode_backdrop = f"https://image.tmdb.org/t/p/original{episode_details.still_path}" if episode_details.still_path else ''
                            except Exception:
                                episode_title = f"S{season}E{episode}"
                                episode_backdrop = ''
                        else:
                            tv_show_details = await tmdb.tv(int(default_id)).details()
                            try:
                                episode_details = await tmdb.episode(int(default_id), season, episode).details()
                                episode_title = episode_details.name
                                episode_backdrop = f"https://image.tmdb.org/t/p/original{episode_details.still_path}" if episode_details.still_path else ''
                            except Exception:
                                episode_title = f"S{season}E{episode}"
                                episode_backdrop = ''
                    else:
                        if default_id is None:
                            tv_shows = await search_title(query=title, type="tvSeries")
                            tvshow = tv_shows['id']
                        else:
                            tvshow = default_id
                        tv_show_details = await get_detail(imdb_id=tvshow)
                        try:
                            episode_details = await get_season(imdb_id=tvshow, season_id=season, episode_id=episode)
                            episode_title = episode_details.get('title', f"S{season}E{episode}")
                            episode_backdrop = episode_details.get('image', '')
                        except Exception:
                            episode_title = f"S{season}E{episode}"
                            episode_backdrop = ''
                    tmdb_id = tv_show_details.id if Telegram.USE_TMDB else tv_show_details['id'].replace("tt", "")
                    title = tv_show_details.name if Telegram.USE_TMDB else tv_show_details['title']
                    year = tv_show_details.first_air_date.year if Telegram.USE_TMDB else tv_show_details['releaseDetailed']['year']
                    rate = tv_show_details.vote_average if Telegram.USE_TMDB else tv_show_details['rating']['star']
                    description = tv_show_details.overview if Telegram.USE_TMDB else tv_show_details['plot']
                    total_seasons = tv_show_details.number_of_seasons if Telegram.USE_TMDB else len(tv_show_details['all_seasons'])
                    total_episodes = tv_show_details.number_of_episodes if Telegram.USE_TMDB else ' '.join(str(len(season['episodes']) * total_seasons) for season in tv_show_details['seasons'])
                    poster = f"https://image.tmdb.org/t/p/w500{tv_show_details.poster_path}" if Telegram.USE_TMDB else tv_show_details['image']
                    backdrop = f"https://image.tmdb.org/t/p/original{tv_show_details.backdrop_path}" if Telegram.USE_TMDB else ''
                    genres = [genre.name for genre in tv_show_details.genres] if Telegram.USE_TMDB else tv_show_details['genre']
                    status = tv_show_details.status if Telegram.USE_TMDB else 'Unknown'
                    return {
                        "tmdb_id": tmdb_id,
                        "title": title,
                        "year": year,
                        "rate": rate or 0,
                        "description": description,
                        "total_seasons": total_seasons,
                        "total_episodes": total_episodes,
                        "poster": poster or '',
                        "backdrop": backdrop or '',
                        "status": status,
                        "genres": genres,
                        "media_type": "tv",
                        "season_number": season,
                        "episode_number": episode,
                        "episode_title": episode_title,
                        "episode_backdrop": episode_backdrop,
                        "quality": quality or '',
                        "languages": languages or ['en'],
                        "rip": rip or 'Blu-ray'
                    }
                except Exception as e:
                    print(f"Error fetching TV show details: {e}")
                    return None
            else:
                return await fetch_movie_metadata(title, year, quality, default_id, languages, rip)
    except Exception as e:
        print(f"[metadata error] Skipping file: {filename} — {e}")
        return None


async def fetch_movie_metadata(title, year=None, quality=None, default_id=None, languages=None, rip=None):
    query = f"{title} {year}" if year else title

    if title:
        try:
            if default_id is None:
                if Telegram.USE_TMDB:
                    movies = await tmdb.search().movies(query=title, year=year if year else None)
                    movie_id = movies[0].id
                    movies_details = await tmdb.movie(int(movie_id)).details()
                else:
                    movies = await search_title(query=query, type="movie")
                    movie_id = movies['id']
                    movies_details = await get_detail(imdb_id=movie_id)
            else:
                if default_id.startswith("tt"):
                    movies_details = await get_detail(imdb_id=default_id)
                else:
                    movies_details = await tmdb.movie(int(default_id)).details()

            # Extract relevant movie metadata
            tmdb_id = movies_details.id if Telegram.USE_TMDB else movies_details['id'].replace("tt", "")
            title = movies_details.title if Telegram.USE_TMDB else movies_details['title']
            year = movies_details.release_date.year if Telegram.USE_TMDB else movies_details['releaseDetailed']['year']
            rate = movies_details.vote_average if Telegram.USE_TMDB else movies_details['rating']['star']
            description = movies_details.overview if Telegram.USE_TMDB else movies_details['plot']
            poster = f"https://image.tmdb.org/t/p/w500{movies_details.poster_path}" if Telegram.USE_TMDB else movies_details['image']
            backdrop = f"https://image.tmdb.org/t/p/original{movies_details.backdrop_path}" if Telegram.USE_TMDB else None
            
            if not backdrop:
                movies = await tmdb.search().movies(query=title, year=year)
                movie = movies[0].id
                movies_details_force = await tmdb.movie(movie).details()
                backdrop = f"https://image.tmdb.org/t/p/original{movies_details_force.backdrop_path}"

            runtime = movies_details.runtime if Telegram.USE_TMDB else movies_details['runtimeSeconds'] // 60
            media_type = "movie"
            genres = [genre.name for genre in movies_details.genres] if Telegram.USE_TMDB else movies_details['genre']

            # Return the movie metadata
            return {
                "tmdb_id": tmdb_id,
                "title": title,
                "year": year,
                "rate": rate or 0,
                "description": description,
                "poster": poster or '',
                "backdrop": backdrop or '',
                "media_type": media_type,
                "genres": genres,
                "runtime": runtime or 0,
                "quality": quality or '',
                "languages": languages or ['en'],
                "rip": rip or 'Blu-ray'
            }

        except Exception as e:
            print(f"Error fetching movie details: {e}")
            return None  # Or handle error as needed