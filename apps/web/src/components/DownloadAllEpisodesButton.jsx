import axios from "axios";
import React, { useState } from "react";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { BiDownload } from "react-icons/bi";
import Spinner from "./svg/Spinner";
import Swal from "sweetalert2";

const DownloadAllEpisodesButton = ({ movieData, seasonNumber, episodes }) => {
  const BASE = import.meta.env.VITE_BASE_URL;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  const [selectedSeason, setSelectedSeason] = useState(seasonNumber?.toString() || "");
  const [selectedQuality, setSelectedQuality] = useState("");
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

  // Get all unique qualities from all episodes in the selected season
  const getAllQualities = () => {
    if (!selectedSeason || !movieData.seasons) return [];
    
    const season = movieData.seasons.find(
      (s) => s.season_number === parseInt(selectedSeason)
    );
    
    if (!season || !season.episodes) return [];
    
    const allQualities = new Set();
    season.episodes.forEach(episode => {
      if (episode.telegram) {
        const validQualities = filterValidQualities(episode.telegram);
        validQualities.forEach(q => {
          allQualities.add(q.quality);
        });
      }
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

    const season = movieData.seasons.find(
      (s) => s.season_number === parseInt(selectedSeason)
    );

    if (!season || !season.episodes) {
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
    const episodesWithQuality = season.episodes.filter(episode => {
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

    setIsDownloading(true);
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
        setIsDownloading(false);
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
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const availableQualities = getAllQualities();

  // Update selected season when seasonNumber prop changes
  React.useEffect(() => {
    if (seasonNumber) {
      setSelectedSeason(seasonNumber.toString());
    }
  }, [seasonNumber]);

  if (!movieData || movieData.media_type !== "series" || !movieData.seasons || movieData.seasons.length === 0) {
    return null;
  }

  return (
    <Popover placement="bottom" showArrow={true}>
      <PopoverTrigger>
        <button className="group uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-red-600/90 to-red-700/90 hover:from-red-500 hover:to-red-600 border border-red-500/50 text-white font-medium text-xs rounded-lg py-2 px-4 lg:text-sm sm:px-6 sm:max-w-[15rem] sm:py-3 transition-all duration-300 hover:scale-105 shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-500/30">
          <BiDownload className="text-white text-lg group-hover:scale-110 transition-transform duration-300" />
          Download All Episodes
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-lg border border-white/30 rounded-xl shadow-2xl">
        <div className="px-2 py-3 flex flex-col gap-3 min-w-[250px]">
          <Select
            isRequired
            variant="bordered"
            aria-label="Select season"
            placeholder="Select season"
            className="w-full"
            classNames={{
              trigger: "bg-white/10 backdrop-blur-md border-white/30 hover:border-white/50 transition-all duration-300",
              value: "text-white font-medium",
              label: "text-white/80"
            }}
            onChange={(e) => {
              setSelectedSeason(e.target.value);
              setSelectedQuality(""); // Reset quality when season changes
            }}
            value={selectedSeason}
          >
            {movieData.seasons
              .filter(s => s.season_number > 0)
              .sort((a, b) => a.season_number - b.season_number)
              .map((s) => (
                <SelectItem 
                  key={s.season_number} 
                  value={s.season_number.toString()}
                  textValue={`Season ${s.season_number}`}
                >
                  Season {s.season_number}
                </SelectItem>
              ))}
          </Select>
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
            disabled={!selectedSeason || availableQualities.length === 0}
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
            onClick={downloadAllEpisodes}
            size="sm"
            className="bg-gradient-to-r from-red-600/90 to-red-700/90 hover:from-red-500 hover:to-red-600 text-white font-medium rounded-full border border-red-500/50 shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!selectedQuality || availableQualities.length === 0 || isDownloading}
            isLoading={isDownloading}
            spinner={<Spinner />}
          >
            {isDownloading ? `Downloading... (${downloadProgress.current}/${downloadProgress.total})` : "Download All Episodes"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DownloadAllEpisodesButton;





