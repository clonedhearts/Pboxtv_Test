import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/black-and-white.css";

import { FiSearch } from "react-icons/fi";
import { VscClose } from "react-icons/vsc";
import { BiHomeAlt2, BiSolidMovie, BiStar, BiBot } from "react-icons/bi";
import { BsTv, BsTelegram } from "react-icons/bs";
import { RiMovie2Line, RiRobot2Fill } from "react-icons/ri";
import { IoTvOutline, IoClose } from "react-icons/io5";
import { AiOutlineHome, AiOutlineQuestionCircle } from "react-icons/ai";
import { MdPlayArrow, MdKeyboardArrowRight, MdSupportAgent } from "react-icons/md";
import posterPlaceholder from "../assets/images/poster-placeholder.png";

export default function Nav() {
  const BASE = import.meta.env.VITE_BASE_URL;
  const SITENAME = import.meta.env.VITE_SITENAME;
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = React.useState("");
  const [debouncedVal, setDebouncedVal] = React.useState("");
  const [searcResult, setSearchResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [navStatus, setNavStatus] = useState("Home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showQuickResults, setShowQuickResults] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save search to history
  const saveToHistory = (searchTerm) => {
    if (!searchTerm.trim()) return;

    const newHistory = [searchTerm, ...searchHistory.filter(term => term !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Remove single history item
  const removeHistoryItem = (index) => {
    const newHistory = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      setNavStatus("Home");
    } else if (path.startsWith("/mov") || path.startsWith("/Movies")) {
      setNavStatus("Movies");
    } else if (path.startsWith("/ser") || path.startsWith("/Series")) {
      setNavStatus("Series");
    } else if (path.startsWith("/search")) {
      setNavStatus("Search");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (debouncedVal.trim()) {
      setIsLoading(true);
      setShowQuickResults(true);
      fetch(`${BASE}/api/search/?query=${debouncedVal}&page=1`)
        .then((search_res) => search_res.json())
        .then((search_data) => {
          setSearchResult(search_data.results || []);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Search error:", error);
          setIsLoading(false);
          setSearchResult([]);
        });
    } else {
      setSearchResult([]);
      setShowQuickResults(false);
      setIsLoading(false);
    }
  }, [debouncedVal, BASE]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVal(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveToHistory(query.trim());
      navigate(`/search/${encodeURIComponent(query.trim())}`);
      setQuery("");
      setShowQuickResults(false);
      setMobileSearchOpen(false);
      setSearchDialogOpen(false);
    }
  };

  const handleHistorySearch = (searchTerm) => {
    navigate(`/search/${encodeURIComponent(searchTerm)}`);
    setQuery("");
    setSearchDialogOpen(false);
    setMobileSearchOpen(false);
  };

  const handleQuickResultClick = (result) => {
    setQuery("");
    setShowQuickResults(false);
    setMobileSearchOpen(false);
    navigate(
      result.media_type === "movie"
        ? `/mov/${result.tmdb_id}`
        : `/ser/${result.tmdb_id}`
    );
  };

  const handleViewAllResults = () => {
    if (debouncedVal.trim()) {
      navigate(`/search/${encodeURIComponent(debouncedVal.trim())}`);
      setQuery("");
      setShowQuickResults(false);
      setMobileSearchOpen(false);
    }
  };

  let closeSearchResultsDropDown = useRef();
  let searchDialogRef = useRef();
  let searchInputRef = useRef();

  useEffect(() => {
    let closeSearchResultsDropdownHandler = (event) => {
      if (
        closeSearchResultsDropDown.current &&
        !closeSearchResultsDropDown.current.contains(event.target)
      ) {
        setShowQuickResults(false);
      }

      // Close search dialog when clicking outside
      if (
        searchDialogRef.current &&
        !searchDialogRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setSearchDialogOpen(false);
      }
    };
    document.addEventListener("mousedown", closeSearchResultsDropdownHandler);
    return () => {
      document.removeEventListener("mousedown", closeSearchResultsDropdownHandler);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    } else if (e.key === "Escape") {
      setShowQuickResults(false);
      setMobileSearchOpen(false);
      setSearchDialogOpen(false);
    }
  };

  const navItems = [
    { icon: BiHomeAlt2, mobileIcon: AiOutlineHome, name: "Home", path: "/" },
    { icon: BiSolidMovie, mobileIcon: RiMovie2Line, name: "Movies", path: "/Movies" },
    { icon: BsTv, mobileIcon: IoTvOutline, name: "Series", path: "/Series" },
    { icon: BsTelegram, mobileIcon: BsTelegram, name: "Telegram", path: "https://t.me/pboxtv", external: true },
  ];

  const mobileNavItems = [
    { icon: AiOutlineHome, name: "Home", path: "/" },
    { icon: RiMovie2Line, name: "Movies", path: "/Movies" },
    { icon: RiRobot2Fill, name: "Bot", path: "https://t.me/pboxmoviebot", external: true },
    { icon: IoTvOutline, name: "Series", path: "/Series" },
    { icon: MdSupportAgent, name: "Support", path: "https://t.me/pboxtv", external: true },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed flex items-center justify-between w-screen z-50 top-0 left-0 py-4 text-white transition-all duration-500 ${isScrolled
          ? "bg-black/95 backdrop-blur-xl shadow-2xl border-b border-gray-800/50"
          : "bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur-md"
          }`}
      >
        <Link
          to="/"
          className="hidden md:flex items-center gap-3 group hover:scale-105 transition-transform duration-300 pl-4 lg:pl-6"
        >
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-2.5 rounded-xl group-hover:from-red-600 group-hover:to-red-700 transition-all duration-300 shadow-lg group-hover:shadow-red-500/25">
            <MdPlayArrow className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              {SITENAME}
            </h1>
            <p className="text-xs text-gray-400 -mt-1">Your Movie Hub</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-8">
          {navItems.map((navItem, index) => (
            navItem.external ? (
              <a
                key={index}
                href={navItem.path}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group px-6 py-3 rounded-2xl transition-all duration-500 text-gray-300 hover:text-white hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <navItem.icon className="text-xl" />
                  <span className="text-sm font-medium">{navItem.name}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/10 rounded-2xl transition-all duration-500" />
              </a>
            ) : (
              <Link
                key={index}
                to={navItem.path}
                className={`relative group px-6 py-3 rounded-2xl transition-all duration-500 ${navStatus === navItem.name
                  ? "text-red-400"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                onClick={() => setNavStatus(navItem.name)}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <navItem.icon className="text-xl" />
                  <span className="text-sm font-medium">{navItem.name}</span>
                </div>
                {navStatus === navItem.name && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-2xl border border-red-500/30 shadow-lg shadow-red-500/20"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 35,
                      duration: 0.6
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/10 rounded-2xl transition-all duration-500" />
              </Link>
            )
          ))}
        </nav>

        <nav className="hidden md:flex lg:hidden items-center gap-1 ml-4">
          {navItems.map((navItem, index) => (
            navItem.external ? (
              <a
                key={index}
                href={navItem.path}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group px-4 py-2 rounded-xl transition-all duration-300 text-gray-300 hover:text-white hover:bg-white/5"
              >
                <div className="flex flex-col items-center gap-1">
                  <navItem.icon className="text-lg" />
                  <span className="text-xs font-medium">{navItem.name}</span>
                </div>
              </a>
            ) : (
              <Link
                key={index}
                to={navItem.path}
                className={`relative group px-4 py-2 rounded-xl transition-all duration-300 ${navStatus === navItem.name
                  ? "text-red-400 bg-red-500/10"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                onClick={() => setNavStatus(navItem.name)}
              >
                <div className="flex flex-col items-center gap-1">
                  <navItem.icon className="text-lg" />
                  <span className="text-xs font-medium">{navItem.name}</span>
                </div>
                {navStatus === navItem.name && (
                  <motion.div
                    layoutId="tabletActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 35,
                      duration: 0.6
                    }}
                  />
                )}
              </Link>
            )
          ))}
        </nav>

        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <form onSubmit={handleSearch}>
              <div className="relative group">
                <input
                  ref={searchInputRef}
                  type="text"
                  name="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setSearchDialogOpen(true)}
                  placeholder="Search movies, TV shows..."
                  className="w-full py-3.5 px-6 pl-14 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 group-hover:bg-gray-900/90"
                />
                <button
                  type="submit"
                  className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors duration-300"
                >
                  <FiSearch className="text-lg" />
                </button>
              </div>
            </form>

            {/* Desktop Search Dialog */}
            <AnimatePresence>
              {searchDialogOpen && (
                <motion.div
                  ref={searchDialogRef}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl z-50 max-h-80 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">Search History</h3>
                      {searchHistory.length > 0 && (
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-gray-500 hover:text-red-400 transition-colors duration-300"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {searchHistory.length > 0 ? (
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {searchHistory.map((term, index) => (
                          <div key={index} className="flex items-center gap-3 group">
                            <button
                              onClick={() => handleHistorySearch(term)}
                              className="flex-1 text-left px-3 py-2 rounded-xl text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-300 flex items-center gap-3"
                            >
                              <FiSearch className="text-gray-500 group-hover:text-red-400 transition-colors duration-300" />
                              <span className="flex-1 truncate">{term}</span>
                            </button>
                            <button
                              onClick={() => removeHistoryItem(index)}
                              className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                            >
                              <VscClose className="text-sm" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FiSearch className="mx-auto mb-2 text-2xl" />
                        <p className="text-sm">No search history yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex md:hidden items-center justify-between w-full px-4">
          <Link
            to="/"
            className="flex items-center gap-2 group hover:scale-105 transition-transform duration-300"
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-2 rounded-xl group-hover:from-red-600 group-hover:to-red-700 transition-all duration-300 shadow-lg group-hover:shadow-red-500/25">
              <MdPlayArrow className="text-white text-lg" />
            </div>
          </Link>

          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              {SITENAME}
            </h1>
            <p className="text-xs text-gray-400 -mt-1">Your Movie Hub</p>
          </div>

          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="p-2 rounded-xl bg-gray-800/60 backdrop-blur-sm hover:bg-gray-700/60 transition-all duration-300"
          >
            <FiSearch className="text-gray-300 text-xl" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">Search</h2>
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-700/60 transition-all duration-300"
                >
                  <IoClose className="text-gray-300 text-xl" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-hidden flex flex-col">
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      name="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search movies, TV shows..."
                      className="w-full py-4 px-6 pl-14 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors duration-300"
                    >
                      <FiSearch className="text-lg" />
                    </button>
                  </div>
                </form>

                {/* Mobile Search History */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-300">Recent Searches</h3>
                    {searchHistory.length > 0 && (
                      <button
                        onClick={clearSearchHistory}
                        className="text-sm text-gray-500 hover:text-red-400 transition-colors duration-300"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {searchHistory.length > 0 ? (
                    <div className="space-y-2 overflow-y-auto flex-1">
                      {searchHistory.map((term, index) => (
                        <div key={index} className="flex items-center gap-3 group">
                          <button
                            onClick={() => handleHistorySearch(term)}
                            className="flex-1 text-left p-4 rounded-2xl bg-gray-900/50 hover:bg-gray-800/50 transition-all duration-300 flex items-center gap-4 border border-gray-800/30"
                          >
                            <div className="p-2 rounded-xl bg-gray-800/50 group-hover:bg-red-500/20 transition-all duration-300">
                              <FiSearch className="text-gray-400 group-hover:text-red-400 transition-colors duration-300" />
                            </div>
                            <span className="flex-1 text-gray-300 group-hover:text-white transition-colors duration-300 truncate">
                              {term}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                          <button
                            onClick={() => removeHistoryItem(index)}
                            className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                          >
                            <VscClose className="text-lg" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="p-4 rounded-full bg-gray-800/30 inline-block mb-4">
                        <FiSearch className="text-3xl" />
                      </div>
                      <p className="text-base font-medium mb-2">No search history</p>
                      <p className="text-sm">Your recent searches will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-black/95 backdrop-blur-xl border-t border-gray-800/50 md:hidden"
      >
        <nav className="grid grid-cols-5 gap-2 px-4 py-3">
          {mobileNavItems.map((navItem, index) => (
            navItem.external ? (
              <a
                key={index}
                href={navItem.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <navItem.icon className="text-lg" />
                <span className="text-xs font-medium">{navItem.name}</span>
              </a>
            ) : (
              <Link
                key={index}
                to={navItem.path}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 ${navStatus === navItem.name
                  ? "text-red-400 bg-red-500/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                onClick={() => setNavStatus(navItem.name)}
              >
                <navItem.icon className="text-lg" />
                <span className="text-xs font-medium">{navItem.name}</span>
                {navStatus === navItem.name && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="w-4 h-0.5 bg-red-500 rounded-full mt-1"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 35,
                      duration: 0.6
                    }}
                  />
                )}
              </Link>
            )
          ))}
        </nav>
      </motion.div>
    </>
  );
}
