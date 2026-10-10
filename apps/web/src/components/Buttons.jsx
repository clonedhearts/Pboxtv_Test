import axios from "axios";
import React, { useState, useEffect } from "react";
import { Select, SelectItem } from "@nextui-org/select";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { Button } from "@nextui-org/button";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { BiDownload } from "react-icons/bi";
import Spinner from "./svg/Spinner";
import Swal from "sweetalert2";

const DownloadButton = ({ movieData }) => {
  const BASE = import.meta.env.VITE_BASE_URL;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedEpisode, setSelectedEpisode] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [loading, setLoading] = useState({});
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
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

  useEffect(() => {
    if (selectedSeason) {
      const season = movieData.seasons.find(
        (s) => s.season_number === parseInt(selectedSeason)
      );
      if (season) {
        setEpisodes(season.episodes);
        setSelectedEpisode("");
        setQualities([]);
        setSelectedQuality("");
      }
    }
  }, [selectedSeason, movieData.seasons]);

  useEffect(() => {
    if (selectedEpisode) {
      const episode = episodes.find(
        (e) => e.episode_number === parseInt(selectedEpisode)
      );
      if (episode) {
        const validQualities = filterValidQualities(episode.telegram);
        setQualities(validQualities);
        setSelectedQuality("");
      }
    } else if (selectedSeason && episodes.length > 0) {
      // If no episode selected but season is selected, get all unique qualities from all episodes
      // Collect all quality objects from all episodes
      const allQualityObjects = [];
      episodes.forEach(episode => {
        if (episode.telegram) {
          const validQualities = filterValidQualities(episode.telegram);
          validQualities.forEach(q => {
            // Only add if not already in the array (by quality string)
            if (!allQualityObjects.some(existing => existing.quality === q.quality)) {
              allQualityObjects.push(q);
            }
          });
        }
      });
      // Sort by quality (highest first)
      allQualityObjects.sort((a, b) => {
        const aSize = parseInt(a.quality.replace("p", ""), 10) || 0;
        const bSize = parseInt(b.quality.replace("p", ""), 10) || 0;
        return bSize - aSize;
      });
      setQualities(allQualityObjects);
    }
  }, [selectedEpisode, episodes, selectedSeason]);

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
    if (!BASE) {
      console.error("BASE URL is not defined");
      throw new Error("BASE URL is not configured");
    }
    return `${BASE}/dl/${id}/${encodeURIComponent(name)}`;
  };

  const triggerDownload = (url, filename) => {
    if (!url) {
      console.error("Download URL is empty");
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || '';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleButtonClick = async (id, name, quality) => {
    if (!BASE) {
      await Swal.fire({
        title: 'Configuration Error',
        text: 'BASE URL is not configured. Please check your environment variables.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    if (!id || !name) {
      await Swal.fire({
        title: 'Invalid Data',
        text: 'Missing download information. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    setLoading((prev) => ({ ...prev, [quality]: true }));
    try {
      const rawUrl = generateUrl(id, name);
      let shortUrl = rawUrl;
      
      // Only shorten URL if API_URL and API_KEY are configured
      if (API_URL && API_KEY) {
        try {
          shortUrl = await shortenUrl(rawUrl);
        } catch (shortenError) {
          console.warn("URL shortening failed, using direct URL:", shortenError);
          // Continue with raw URL if shortening fails
        }
      }
      
      // Always trigger download for both movies and series
      triggerDownload(shortUrl, name);
    } catch (error) {
      console.error("Download error:", error);
      await Swal.fire({
        title: 'Download Failed',
        text: error.message || 'An error occurred while starting the download. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
    } finally {
      setLoading((prev) => ({ ...prev, [quality]: false }));
    }
  };

  const downloadAllEpisodes = async () => {
    if (!BASE) {
      await Swal.fire({
        title: 'Configuration Error',
        text: 'BASE URL is not configured. Please check your environment variables.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    if (!selectedSeason || !selectedQuality) {
      await Swal.fire({
        title: 'Selection Required',
        text: 'Please select a season and quality first.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    if (episodes.length === 0) {
      await Swal.fire({
        title: 'No Episodes Found',
        text: 'No episodes available for the selected season.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    // Filter episodes that have the selected quality
    const episodesWithQuality = episodes.filter(episode => {
      if (!episode.telegram) return false;
      const validQualities = filterValidQualities(episode.telegram);
      return validQualities.some(q => q.quality === selectedQuality);
    });

    if (episodesWithQuality.length === 0) {
      await Swal.fire({
        title: 'No Episodes Available',
        text: `No episodes found with ${selectedQuality} quality for this season.`,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    // Confirm before downloading
    const { isConfirmed } = await Swal.fire({
      title: 'Download All Episodes?',
      html: `You are about to download <strong>${episodesWithQuality.length} episodes</strong> from Season ${selectedSeason} in <strong>${selectedQuality}</strong> quality.<br><br>This will open multiple download windows.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Download All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
      background: '#1f2937',
      color: '#ffffff'
    });

    if (!isConfirmed) return;

    setIsDownloadingAll(true);
    setDownloadProgress({ current: 0, total: episodesWithQuality.length });

    try {
      // Download episodes with a small delay between each to avoid overwhelming the browser
      for (let i = 0; i < episodesWithQuality.length; i++) {
        const episode = episodesWithQuality[i];
        const validQualities = filterValidQualities(episode.telegram);
        const quality = validQualities.find(q => q.quality === selectedQuality);

        if (quality) {
          try {
            const rawUrl = generateUrl(quality.id, quality.name);
            let shortUrl = rawUrl;
            
            // Only shorten URL if API_URL and API_KEY are configured
            if (API_URL && API_KEY) {
              try {
                shortUrl = await shortenUrl(rawUrl);
              } catch (shortenError) {
                console.warn("URL shortening failed, using direct URL:", shortenError);
                // Continue with raw URL if shortening fails
              }
            }
            
            // Use setTimeout to stagger downloads
            setTimeout(() => {
              triggerDownload(shortUrl, quality.name);
            }, i * 500); // 500ms delay between each download
          } catch (error) {
            console.error(`Error preparing download for episode ${episode.episode_number}:`, error);
          }
        }

        setDownloadProgress({ current: i + 1, total: episodesWithQuality.length });
      }

      // Show success message after a short delay
      setTimeout(async () => {
        await Swal.fire({
          title: 'Downloads Started!',
          html: `Started downloading <strong>${episodesWithQuality.length} episodes</strong>.<br><br>Check your browser's download manager.`,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e11d48',
          background: '#1f2937',
          color: '#ffffff'
        });
        setIsDownloadingAll(false);
        setDownloadProgress({ current: 0, total: 0 });
      }, episodesWithQuality.length * 500 + 1000);
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
      setIsDownloadingAll(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const renderMovieButtons = () => {
    const validQualities = filterValidQualities(movieData.telegram);
    return validQualities.map((q, i) => (
      <Button
        key={i}
        onClick={() => handleButtonClick(q.id, q.name, q.quality)}
        size="sm"
        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium rounded-full border border-white/30 hover:border-white/50 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 hover:scale-105"
        isLoading={loading[q.quality]}
        spinner={<Spinner />}
      >
        {q.quality}
      </Button>
    ));
  };

  const renderShowSelectors = () => (
    <div className="px-2 py-3 flex flex-col gap-3">
      <Select
        isRequired
        variant="bordered"
        aria-label="Select season"
        placeholder="Select season"
        className="w-48"
        classNames={{
          trigger: "bg-white/10 backdrop-blur-md border-white/30 hover:border-white/50 transition-all duration-300",
          value: "text-white font-medium",
          label: "text-white/80"
        }}
        onChange={(e) => setSelectedSeason(e.target.value)}
        value={selectedSeason}
      >
        {movieData.seasons
          .filter(s => s.season_number > 0)
          .sort((a, b) => a.season_number - b.season_number)
          .map((s) => (
            <SelectItem 
              key={s.season_number} 
              value={s.season_number}
              textValue={`Season ${s.season_number}`}
            >
              Season {s.season_number}
            </SelectItem>
          ))}
      </Select>
      <Select
        isRequired
        variant="bordered"
        aria-label="Select episode"
        placeholder="Select episode"
        className="w-full"
        classNames={{
          trigger: "bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300",
          value: "text-white font-medium",
          label: "text-blue-300"
        }}
        onChange={(e) => setSelectedEpisode(e.target.value)}
        value={selectedEpisode}
        disabled={!selectedSeason}
      >
        {episodes
          .filter(e => e.episode_number > 0)
          .sort((a, b) => a.episode_number - b.episode_number)
          .map((e) => (
            <SelectItem 
              key={e.episode_number} 
              value={e.episode_number}
              textValue={`Episode ${e.episode_number}`}
            >
              Episode {e.episode_number}
            </SelectItem>
          ))}
      </Select>
      <button
        onClick={downloadAllEpisodes}
        className="w-full bg-gradient-to-r from-slate-800/90 to-slate-900/90 border border-blue-500/30 hover:border-blue-400/50 text-white font-medium rounded-lg px-3 py-2.5 text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-blue-500/30 flex items-center justify-center gap-2 h-[40px]"
        disabled={!selectedSeason || !selectedQuality || episodes.length === 0 || isDownloadingAll}
        title="Download all episodes from selected season"
      >
        {isDownloadingAll ? (
          <>
            <Spinner />
            <span>{downloadProgress.current}/{downloadProgress.total}</span>
          </>
        ) : (
          <>
            <BiDownload className="text-sm" />
            <span>Download All Episodes</span>
          </>
        )}
      </button>
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
        disabled={qualities.length === 0}
      >
        {qualities.map((q) => (
          <SelectItem 
            key={q.quality} 
            value={q.quality}
            textValue={q.quality}
          >
            {q.quality}
          </SelectItem>
        ))}
      </Select>
      <Button
        onClick={() => {
          const q = qualities.find((q) => q.quality === selectedQuality);
          if (q) handleButtonClick(q.id, q.name, q.quality);
        }}
        size="sm"
        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium rounded-full border border-white/30 hover:border-white/50 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        disabled={!selectedQuality || qualities.length === 0}
        isLoading={loading[selectedQuality]}
        spinner={<Spinner />}
      >
        Download
      </Button>
    </div>
  );

  const hasValidContent = () => {
    if (movieData.media_type === "movie") {
      return filterValidQualities(movieData.telegram).length > 0;
    }
    return movieData.seasons && movieData.seasons.length > 0;
  };

  if (!hasValidContent()) {
    return null;
  }

  return (
    <Popover placement="bottom" showArrow={true}>
      <PopoverTrigger>
        <button className="group uppercase flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium text-xs rounded-lg py-2 px-4 lg:text-sm sm:px-6 sm:max-w-[15rem] sm:py-3 transition-all duration-300 hover:scale-105">
          <FaCloudDownloadAlt className="text-white text-lg group-hover:scale-110 transition-transform duration-300" />
          Download
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-lg border border-white/30 rounded-xl shadow-2xl">
        {movieData.media_type === "movie" ? (
          <div className="px-2 py-3 flex gap-2 flex-wrap">
            {renderMovieButtons()}
          </div>
        ) : (
          renderShowSelectors()
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DownloadButton;
