import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const TG_URL = import.meta.env.VITE_TG_URL;
  const SITENAME = import.meta.env.VITE_SITENAME;
  const location = useLocation();

  const contentTypes = [
    { 
      name: "Movies", 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        </svg>
      )
    },
    { 
      name: "TV Shows", 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5l-1 2v1h8v-1l-1-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H3V5h18v10z"/>
        </svg>
      )
    },
    { 
      name: "Anime", 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          <circle cx="15.5" cy="9.5" r="1.5"/>
          <circle cx="8.5" cy="9.5" r="1.5"/>
        </svg>
      )
    },
    { 
      name: "K-Drama", 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    }
  ];

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Movies", path: "/movies" },
    { name: "Series", path: "/series" }
  ];

  return (
    <footer className="relative bg-gradient-to-t from-gray-900 via-gray-800 to-transparent border-t border-gray-700/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="group">
              <a href="/" className="inline-block">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent group-hover:from-red-400 group-hover:to-red-500 transition-all duration-300">
                    {SITENAME}
                  </h2>
                  <p className="text-sm text-gray-400 font-medium tracking-wide">
                    Your Ultimate Movie Hub
                  </p>
                </div>
              </a>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Stream unlimited entertainment. Join @PboxTV on Telegram
            </p>
            
            <div className="flex items-center space-x-4">
              <a
                href="https://t.me/pboxtv"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white transition-transform duration-300 group-hover:rotate-12"
                >
                  <path
                    d="M12,24c6.629,0 12,-5.371 12,-12c0,-6.629 -5.371,-12 -12,-12c-6.629,0 -12,5.371 -12,12c0,6.629 5.371,12 12,12zM5.491,11.74l11.57,-4.461c0.537,-0.194 1.006,0.131 0.832,0.943l0.001,-0.001l-1.97,9.281c-0.146,0.658 -0.537,0.818 -1.084,0.508l-3,-2.211l-1.447,1.394c-0.16,0.16 -0.295,0.295 -0.605,0.295l0.213,-3.053l5.56,-5.023c0.242,-0.213 -0.054,-0.333 -0.373,-0.121l-6.871,4.326l-2.962,-0.924c-0.643,-0.204 -0.657,-0.643 0.136,-0.953z"
                    fill="currentColor"
                  />
                </svg>
                <div className="absolute inset-0 bg-red-400 rounded-full blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </a>
              
              <div className="text-sm text-gray-400">
                <span className="block font-medium">Join our channel</span>
                <span className="text-xs opacity-75">Get latest updates</span>
              </div>
            </div>
          </div>

          {/* Content Types */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white relative">
              What We Offer
              <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map((type, index) => (
                <div
                  key={type.name}
                  className="group relative p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 hover:bg-gray-800/80 cursor-pointer"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-red-500 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300">
                      {type.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">
                      {type.name}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white relative">
              Quick Access
              <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-red-500 to-transparent"></div>
            </h3>
            
            <nav className="space-y-3">
              {quickLinks.map((link, index) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`group flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:bg-gray-800/50 ${
                    location.pathname === link.path
                      ? 'bg-red-500/10 border-l-2 border-red-500'
                      : 'hover:border-l-2 hover:border-red-500/50'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-600 group-hover:bg-red-500 transition-colors duration-300"></div>
                  <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors duration-300 capitalize">
                    {link.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-700/50">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 text-gray-400 text-sm">
              <div className="relative">
                <div className="w-6 h-6 rounded-full border-2 border-gray-600 flex items-center justify-center">
                  <span className="text-xs font-bold">©</span>
                </div>
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="font-medium">
                {new Date().getFullYear()} {SITENAME}. All Rights Reserved
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700/50">
                Made with ❤️ for entertainment
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/3 rounded-full blur-3xl"></div>
      </div>
    </footer>
  );
}
