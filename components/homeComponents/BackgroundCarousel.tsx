import { useState, useEffect } from 'react';

export default function BackgroundCarousel() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Display */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-full h-screen">
          <DataFlowEarth />
        </div>
      </div>

      {/* Hero Text - TSMC CareerHack Style */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="text-center text-white max-w-6xl mx-auto px-8">
          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-bold mb-4 leading-tight">2025 RWA Hackathon</h1>

          {/* Subtitle */}
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-blue-200">Taiwan</h2>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl font-medium mb-4 text-blue-100">
            Tokenize Reality, Create the Future
          </p>
          <p className="text-xl md:text-2xl font-medium mb-12 text-blue-200">鏈接現實，創造未來</p>

          {/* Event Info */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-12 text-lg md:text-xl">
            <div className="text-center">
              <div className="font-bold text-blue-200">10/27 Mon.</div>
              <div className="text-blue-300">報名截止日</div>
            </div>
            <div className="hidden md:block text-blue-400">|</div>
            <div className="text-center">
              <div className="font-bold text-blue-200">10/31 Fri. - 11/1 Sat.</div>
              <div className="text-blue-300">政大公企中心</div>
              <div className="text-blue-300">競賽時間 & 地點</div>
            </div>
          </div>

          {/* CTA Button */}
          <button className="bg-white text-blue-900 px-12 py-4 rounded-lg font-bold text-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            立即報名
          </button>
        </div>
      </div>
    </div>
  );
}

// DataFlowEarth Component - The only KV component we're keeping
function DataFlowEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Data Flow Earth - Shifted to Right */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Data Flow Lines */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-40"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-35"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30"></div>
      </div>

      {/* Orbital Data Rings - Shifted to Right */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[500px] h-[500px] border border-green-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[600px] h-[600px] border border-blue-400 border-opacity-20 rounded-full"></div>

      {/* Data Points - Shifted to Right */}
      <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/5 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>

      {/* Data Glow - Shifted to Right */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 bg-green-400 bg-opacity-10 rounded-full blur-3xl"></div>

      {/* Left Side Text Area */}
      <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-1/3 h-96 flex items-center justify-center">
        {/* This area is reserved for text content */}
      </div>
    </div>
  );
}
