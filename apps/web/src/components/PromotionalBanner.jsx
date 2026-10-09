import React from "react";
import { motion } from "framer-motion";
import { FaDownload, FaWifi } from "react-icons/fa";
import { HiOutlineRefresh } from "react-icons/hi";

export default function PromotionalBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-[2px] rounded-2xl mx-4 sm:mx-6 md:mx-8 lg:mx-16 my-8 shadow-2xl"
    >
      <div className="bg-black/95 backdrop-blur-md rounded-2xl p-3 sm:p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl" />
        <div className="relative z-10">
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-6 md:gap-8 justify-between items-stretch">
            <div className="flex items-center gap-3 group flex-1">
              <div className="relative flex-shrink-0">
                <div className="relative p-2.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-400/30">
                  <FaWifi className="text-blue-400 text-base" />
                </div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-white text-sm font-bold">Offline Mode</p>
                <p className="text-gray-300 text-xs">Watch Anywhere</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 group flex-1">
              <div className="relative flex-shrink-0">
                <div className="relative p-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30">
                  <FaDownload className="text-green-400 text-base" />
                </div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-white text-sm font-bold">100% Free</p>
                <p className="text-gray-300 text-xs">No Subscriptions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 group flex-1">
              <div className="relative flex-shrink-0">
                <div className="relative p-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30">
                  <HiOutlineRefresh className="text-purple-400 text-base" />
                </div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-white text-sm font-bold">Daily Updates</p>
                <p className="text-gray-300 text-xs">Fresh Content</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
