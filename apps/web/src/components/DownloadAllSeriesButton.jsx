import axios from "axios";
import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { BiDownload } from "react-icons/bi";
import Spinner from "./svg/Spinner";
import Swal from "sweetalert2";

const DownloadAllSeriesButton = ({ movieData }) => {
  const BASE = import.meta.env.VITE_BASE_URL;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  const [selectedSeasons, setSelectedSeasons] = useState([]);
  const [selectedEpisodes, setSelectedEpisodes] = useState("all"); // "all" or specific episode numbers
  const [selectedQuality, setSelectedQuality] = useState("");
  const [episodes, setEpisodes] = useState({}); // Store episodes by season
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const isValidQuality = (quality) => {
    return quality && 
           quality.quality && 
           quality.quality.trim() !== "" && 
           quality.id && 
           quality.name;
  };

  const filterValidQualities = (qualityArray) => {
    return qualityArray?.filter(isValidQuality) || [];
  };

  // Load episodes for selected seasons
  useEffect(() => {
    if (selectedSeasons.length === 0) {
      setEpisodes({});
      return;
    }

    const loadEpisodes = async () => {
      const episodesBySeason = {};
      
      for (const seasonNum of selectedSeasons) {
        const season = movieData.seasons.find(s => s.season_number === parseInt(seasonNum));
        if (season && season.episodes) {
          episodesBySeason[seasonNum] = season.episodes;
        } else {
          // Try to fetch episodes from API if not in season data
          try {
            const response = await axios.get(`${BASE}/api/id/${movieData.tmdb_id}`, {
              params: { season_number: seasonNum },
            });
            if (response.data && response.data.episodes) {
              episodesBySeason[seasonNum] = response.data.episodes;
            }
          } catch (error) {
            console.error(`Error fetching episodes for season ${seasonNum}:`, error);
          }
        }
      }
      
      setEpisodes(episodesBySeason);
    };

    loadEpisodes();
  }, [selectedSeasons, movieData.seasons, movieData.tmdb_id, BASE]);

  // Get all unique qualities from selected seasons' episodes
  const getAllQualities = () => {
    if (selectedSeasons.length === 0) return [];
    
    const allQualities = new Set();
    selectedSeasons.forEach(seasonNum => {
      const seasonEpisodes = episodes[seasonNum] || [];
      seasonEpisodes.forEach(episode => {
        if (episode.telegram) {
          const validQualities = filterValidQualities(episode.telegram);
          validQualities.forEach(q => {
            allQualities.add(q.quality);
          });
        }
      });
    });
    
    return Array.from(allQualities).sort((a, b) => {
      const aSize = parseInt(a.replace("p", ""), 10) || 0;
      const bSize = parseInt(b.replace("p", ""), 10) || 0;
      return bSize - aSize; // Sort descending (highest quality first)
    });
  };

  const shortenUrl = async (url) => {
    try {
      const response = await axios.get(API_URL, {
        params: {
          api: API_KEY,
          url: url,
          format: "json",
        },
      });
      const data = response.data;
      return data?.shortenedUrl || data?.short || data?.url || url;
    } catch (error) {
      console.error("Error shortening URL:", error);
      return url;
    }
  };

  const generateUrl = (id, name) => {
    return `${BASE}/dl/${id}/${encodeURIComponent(name)}`;
  };

  const triggerDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || '';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSeasonChange = (selectedValues) => {
    setSelectedSeasons(selectedValues);
    setSelectedEpisodes("all"); // Reset episodes when seasons change
    setSelectedQuality(""); // Reset quality when seasons change
  };

  const downloadAllSeries = async () => {
    if (selectedSeasons.length === 0) {
      await Swal.fire({
        title: 'Selection Required',
        text: 'Please select at least one season first.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    if (!selectedQuality) {
      await Swal.fire({
        title: 'Selection Required',
        text: 'Please select a quality first.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    // Collect episodes from selected seasons
    const allEpisodes = [];
    selectedSeasons.forEach(seasonNum => {
      const seasonEpisodes = episodes[seasonNum] || [];
      const season = movieData.seasons.find(s => s.season_number === parseInt(seasonNum));
      
      seasonEpisodes.forEach(episode => {
        // Filter by selected episodes (all or specific)
        let shouldInclude = false;
        if (selectedEpisodes === "all") {
          shouldInclude = true;
        } else if (selectedEpisodes && selectedEpisodes.startsWith("S") && selectedEpisodes.includes("E")) {
          // Format: S1E1, S2E3, etc.
          const match = selectedEpisodes.match(/S(\d+)E(\d+)/);
          if (match) {
            const selectedSeason = parseInt(match[1]);
            const selectedEpisode = parseInt(match[2]);
            shouldInclude = parseInt(seasonNum) === selectedSeason && episode.episode_number === selectedEpisode;
          }
        }
        
        if (shouldInclude && episode.telegram) {
          const validQualities = filterValidQualities(episode.telegram);
          const quality = validQualities.find(q => q.quality === selectedQuality);
          if (quality) {
            allEpisodes.push({
              ...episode,
              season_number: parseInt(seasonNum),
              quality: quality
            });
          }
        }
      });
    });

    if (allEpisodes.length === 0) {
      await Swal.fire({
        title: 'No Episodes Available',
        text: `No episodes found with ${selectedQuality} quality across all seasons.`,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    // Count episodes per season for display
    const episodesBySeason = {};
    allEpisodes.forEach(ep => {
      if (!episodesBySeason[ep.season_number]) {
        episodesBySeason[ep.season_number] = 0;
      }
      episodesBySeason[ep.season_number]++;
    });
    const seasonCounts = Object.entries(episodesBySeason)
      .map(([season, count]) => `Season ${season}: ${count} episodes`)
      .join('<br>');

    // Confirm before downloading
    const { isConfirmed } = await Swal.fire({
      title: 'Download All Series?',
      html: `You are about to download <strong>${allEpisodes.length} episodes</strong> from <strong>${Object.keys(episodesBySeason).length} seasons</strong> in <strong>${selectedQuality}</strong> quality.<br><br>${seasonCounts}<br><br>This will open multiple download windows.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Download All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
      background: '#1f2937',
      color: '#ffffff',
      width: '90%',
      maxWidth: '500px'
    });

    if (!isConfirmed) return;

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: allEpisodes.length });

    try {
      // Download episodes with a small delay between each to avoid overwhelming the browser
      for (let i = 0; i < allEpisodes.length; i++) {
        const episode = allEpisodes[i];
        const rawUrl = generateUrl(episode.quality.id, episode.quality.name);
        const shortUrl = await shortenUrl(rawUrl);
        
        // Use setTimeout to stagger downloads
        setTimeout(() => {
          triggerDownload(shortUrl, episode.quality.name);
        }, i * 500); // 500ms delay between each download

        setDownloadProgress({ current: i + 1, total: allEpisodes.length });
      }

      // Show success message after a short delay
      setTimeout(async () => {
        await Swal.fire({
          title: 'Downloads Started!',
          html: `Started downloading <strong>${allEpisodes.length} episodes</strong> from <strong>${Object.keys(episodesBySeason).length} seasons</strong>.<br><br>Check your browser's download manager.`,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e11d48',
          background: '#1f2937',
          color: '#ffffff'
        });
        setIsDownloading(false);
        setDownloadProgress({ current: 0, total: 0 });
      }, allEpisodes.length * 500 + 1000);
    } catch (error) {
      console.error("Download error:", error);
      await Swal.fire({
        title: 'Download Error',
        text: 'An error occurred while starting downloads. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const availableQualities = getAllQualities();

  if (!movieData || movieData.media_type !== "series" || !movieData.seasons || movieData.seasons.length === 0) {
    return null;
  }

  return (
    <Popover placement="bottom" showArrow={true}>
      <PopoverTrigger>
        <button className="group uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600/90 to-purple-700/90 hover:from-purple-500 hover:to-purple-600 border border-purple-500/50 text-white font-medium text-xs rounded-lg py-2 px-4 lg:text-sm sm:px-6 sm:max-w-[15rem] sm:py-3 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-600/20 hover:shadow-xl hover:shadow-purple-500/30">
          <BiDownload className="text-white text-lg group-hover:scale-110 transition-transform duration-300" />
          Download All Series
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-lg border border-white/30 rounded-xl shadow-2xl">
        <div className="px-2 py-3 flex flex-col gap-3 min-w-[280px] max-w-[400px]">
          {/* Select Seasons */}
          <Select
            isRequired
            variant="bordered"
            aria-label="Select seasons"
            placeholder="Select seasons"
            selectionMode="multiple"
            className="w-full"
            classNames={{
              trigger: "bg-white/10 backdrop-blur-md border-white/30 hover:border-white/50 transition-all duration-300",
              value: "text-white font-medium",
              label: "text-white/80"
            }}
            selectedKeys={selectedSeasons}
            onSelectionChange={(keys) => handleSeasonChange(Array.from(keys))}
          >
            {movieData.seasons
              .filter(s => s.season_number > 0)
              .sort((a, b) => a.season_number - b.season_number)
              .map((s) => (
                <SelectItem 
                  key={s.season_number.toString()}
                  value={s.season_number.toString()}
                  textValue={`Season ${s.season_number}`}
                >
                  Season {s.season_number}
                </SelectItem>
              ))}
          </Select>

          {/* Select Episodes - Show only if seasons are selected */}
          {selectedSeasons.length > 0 && (
            <>
              <Select
                isRequired
                variant="bordered"
                aria-label="Select episodes"
                placeholder="Select episodes"
                className="w-full"
                classNames={{
                  trigger: "bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300",
                  value: "text-white font-medium",
                  label: "text-blue-300"
                }}
                onChange={(e) => setSelectedEpisodes(e.target.value)}
                value={selectedEpisodes}
              >
                <SelectItem key="all" value="all" textValue="All Episodes">
                  All Episodes
                </SelectItem>
                {Object.keys(episodes).length > 0 && (
                  <>
                    {selectedSeasons.map(seasonNum => {
                      const seasonEpisodes = episodes[seasonNum] || [];
                      return seasonEpisodes
                        .filter(e => e.episode_number > 0)
                        .sort((a, b) => a.episode_number - b.episode_number)
                        .map((e) => (
                          <SelectItem 
                            key={`S${seasonNum}E${e.episode_number}`}
                            value={`S${seasonNum}E${e.episode_number}`}
                            textValue={`Season ${seasonNum} Episode ${e.episode_number}`}
                          >
                            S{seasonNum}E{e.episode_number}
                          </SelectItem>
                        ));
                    })}
                  </>
                )}
              </Select>
              <button
                onClick={() => setSelectedEpisodes("all")}
                className="mt-2 w-full bg-gradient-to-r from-slate-800/90 to-slate-900/90 border border-blue-500/30 hover:border-blue-400/50 text-white font-medium rounded-lg px-3 py-2 text-sm transition-all duration-300 hover:scale-105"
                title="Select all episodes from selected seasons"
              >
                <span className="inline-flex items-center justify-center gap-1">
                  <BiDownload className="text-sm" />
                  All Episodes
                </span>
              </button>
            </>
          )}

          {/* Select Quality */}
          <Select
            isRequired
            variant="bordered"
            aria-label="Select quality"
            placeholder="Select quality"
            className="w-full"
            classNames={{
              trigger: "bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300",
              value: "text-white font-medium",
              label: "text-blue-300"
            }}
            onChange={(e) => setSelectedQuality(e.target.value)}
            value={selectedQuality}
            disabled={availableQualities.length === 0 || selectedSeasons.length === 0}
          >
            {availableQualities.map((quality) => (
              <SelectItem 
                key={quality} 
                value={quality}
                textValue={quality}
              >
                {quality}
              </SelectItem>
            ))}
          </Select>

          {isDownloading && (
            <div className="text-white/80 text-sm text-center py-2">
              Downloading: {downloadProgress.current} / {downloadProgress.total}
            </div>
          )}

          <Button
            onClick={downloadAllSeries}
            size="sm"
            className="bg-gradient-to-r from-purple-600/90 to-purple-700/90 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-full border border-purple-500/50 shadow-lg shadow-purple-600/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={selectedSeasons.length === 0 || !selectedQuality || availableQualities.length === 0 || isDownloading}
            isLoading={isDownloading}
            spinner={<Spinner />}
          >
            {isDownloading ? `Downloading... (${downloadProgress.current}/${downloadProgress.total})` : "Download All Series"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DownloadAllSeriesButton;

