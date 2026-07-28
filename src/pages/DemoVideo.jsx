import React from "react";
import { Play, ArrowLeft, Volume2, Sparkles, Shield, BarChart3, Video, Layers } from "lucide-react";
import { Link } from "react-router-dom";

const DemoVideo = () => {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} /> Back to Storefront
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles size={14} /> Full HD 2:33 Min Walkthrough
          </span>
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5">
            <Volume2 size={14} /> YouTube Music Background
          </span>
        </div>
      </div>

      {/* Main Video Card */}
      <div className="w-full max-w-5xl bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="p-6 bg-gradient-to-r from-gray-900 via-indigo-950/30 to-gray-900 border-b border-gray-800">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
            📹 Admin Dashboard & AI Studio — Official Walkthrough
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Complete 2:33 min video presentation demonstrating Inventory Management, Real-Time Analytics, AI Marketing Generator & Video Storyboard Engine.
          </p>
        </div>

        {/* Video Player Box */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <video
            src="https://raw.githubusercontent.com/Premdeep-Gupta/BALA-JI-AI-ECOMMERCE/main/admin_dashboard.mp4"
            controls
            autoPlay
            playsInline
            poster="https://raw.githubusercontent.com/Premdeep-Gupta/BALA-JI-AI-ECOMMERCE/main/screenshots/admin_dashboard.png"
            className="w-full h-full object-contain shadow-inner"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-900/40 border-t border-gray-800">
          <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
            <BarChart3 className="text-indigo-400 mb-2" size={20} />
            <h3 className="font-semibold text-sm text-white">Sales Analytics</h3>
            <p className="text-xs text-gray-400 mt-1">Real-time revenue metrics, order velocity & performance graphs.</p>
          </div>

          <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
            <Layers className="text-emerald-400 mb-2" size={20} />
            <h3 className="font-semibold text-sm text-white">Inventory CRUD</h3>
            <p className="text-xs text-gray-400 mt-1">Bulk CSV upload, catalog management & stock level alerts.</p>
          </div>

          <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
            <Sparkles className="text-amber-400 mb-2" size={20} />
            <h3 className="font-semibold text-sm text-white">AI Marketing Studio</h3>
            <p className="text-xs text-gray-400 mt-1">Auto-generating promo ad copy, banners & email campaigns.</p>
          </div>

          <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
            <Video className="text-purple-400 mb-2" size={20} />
            <h3 className="font-semibold text-sm text-white">AI Storyboard Engine</h3>
            <p className="text-xs text-gray-400 mt-1">Automated script generator & visual scene storyboard builder.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoVideo;
