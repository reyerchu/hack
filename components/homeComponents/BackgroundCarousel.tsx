import { useState, useEffect } from 'react';

export default function BackgroundCarousel() {
  const [currentBackground, setCurrentBackground] = useState(0);

  const backgrounds = [
    {
      id: 1,
      title: '數據流地球',
      component: 'DataFlowEarth',
    },
  ];

  // No auto-rotation needed since there's only one background

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Display */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-full h-screen">{currentBackground === 0 && <DataFlowEarth />}</div>
      </div>

      {/* Hero Text - TSMC CareerHack Style */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="text-center text-white max-w-6xl mx-auto px-8">
          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-bold mb-4 leading-tight">
            2025 RWA Hackthon
          </h1>
          
          {/* Subtitle */}
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-blue-200">
            Taiwan
          </h2>
          
          {/* Tagline */}
          <p className="text-2xl md:text-3xl font-medium mb-4 text-blue-100">
            Tokenize Reality, Create the Future
          </p>
          <p className="text-xl md:text-2xl font-medium mb-12 text-blue-200">
            鏈接現實，創造未來
          </p>
          
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

      {/* No indicator needed since there's only one background */}
    </div>
  );
}

// Background Components - TSMC Style Earth Designs
function EarthWithRings() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe - Shifted to Right */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Earth Surface Pattern */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-blue-500 to-cyan-400 opacity-60"></div>
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-green-500 rounded-full opacity-40"></div>
        <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-green-400 rounded-full opacity-30"></div>
        <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-green-600 rounded-full opacity-35"></div>
      </div>

      {/* Orbital Rings - Shifted to Right */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-20 rounded-full"></div>
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[700px] h-[700px] border border-blue-300 border-opacity-15 rounded-full"></div>

      {/* Light Rays - Shifted to Right */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 bg-cyan-400 bg-opacity-15 rounded-full blur-2xl"></div>

      {/* Data Points - Shifted to Right */}
      <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/5 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-blue-300 rounded-full animate-pulse"></div>

      {/* Left Side Text Area - Placeholder for future text */}
      <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-1/3 h-96 flex items-center justify-center">
        {/* This area is reserved for text content */}
      </div>
    </div>
  );
}

function TechEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Tech Earth Globe - Shifted to Right */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Tech Grid Overlay */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>
        </div>
      </div>

      {/* Orbital Tech Rings - Shifted to Right */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-40 rounded-full"></div>
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-25 rounded-full"></div>

      {/* Tech Nodes - Shifted to Right */}
      <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/5 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 right-1/4 w-5 h-5 bg-blue-300 rounded-full animate-pulse"></div>

      {/* Tech Glow - Shifted to Right */}
      <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>

      {/* Left Side Text Area */}
      <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-1/3 h-96 flex items-center justify-center">
        {/* This area is reserved for text content */}
      </div>
    </div>
  );
}

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

function RWATokenEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* RWA Token Earth */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Token Circles */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-yellow-400 border-opacity-40 rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 border-2 border-yellow-300 border-opacity-35 rounded-full"></div>
        <div className="absolute bottom-1/3 left-1/3 w-20 h-20 border-2 border-yellow-500 border-opacity-30 rounded-full"></div>
      </div>

      {/* Orbital Token Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-yellow-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-yellow-300 border-opacity-20 rounded-full"></div>

      {/* Token Points */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>

      {/* Token Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function FinancialEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Financial Earth */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Financial Icons */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-8 h-8 border border-green-400 border-opacity-30 rounded"></div>
        <div className="absolute top-2/3 right-1/3 w-6 h-6 border border-blue-400 border-opacity-25 rounded"></div>
        <div className="absolute bottom-1/3 left-2/3 w-7 h-7 border border-cyan-400 border-opacity-20 rounded"></div>
      </div>

      {/* Orbital Financial Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-green-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-400 border-opacity-20 rounded-full"></div>

      {/* Financial Points */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>

      {/* Financial Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-400 bg-opacity-10 rounded-full blur-3xl"></div>
    </div>
  );
}

function BlockchainEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Blockchain Earth */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Blockchain Nodes */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-blue-400 rounded-full"></div>
        <div className="absolute top-1/2 right-1/3 w-5 h-5 bg-cyan-400 rounded-full"></div>
        <div className="absolute bottom-1/3 left-1/2 w-7 h-7 bg-blue-300 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-cyan-300 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/2 w-6 h-6 bg-blue-500 rounded-full"></div>
      </div>

      {/* Connection Lines */}
      <div className="absolute top-1/4 left-1/4 w-32 h-px bg-blue-400 bg-opacity-30 transform rotate-12"></div>
      <div className="absolute top-1/2 right-1/3 w-24 h-px bg-cyan-400 bg-opacity-25 transform -rotate-12"></div>
      <div className="absolute bottom-1/3 left-1/2 w-28 h-px bg-blue-300 bg-opacity-20 transform rotate-6"></div>

      {/* Orbital Blockchain Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-20 rounded-full"></div>

      {/* Blockchain Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function RegulatoryEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Regulatory Earth */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Regulatory Grid */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          ></div>
        </div>
      </div>

      {/* Compliance Icons */}
      <div className="absolute top-1/3 left-1/3 w-8 h-8 border border-white border-opacity-20 rounded"></div>
      <div className="absolute top-2/3 right-1/3 w-6 h-6 border border-white border-opacity-15 rounded"></div>
      <div className="absolute bottom-1/3 left-2/3 w-7 h-7 border border-white border-opacity-25 rounded"></div>

      {/* Orbital Regulatory Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white border-opacity-20 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white border-opacity-15 rounded-full"></div>

      {/* Regulatory Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white bg-opacity-5 rounded-full blur-3xl"></div>
    </div>
  );
}

function TaiwanEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Taiwan Earth */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Taiwan Shape */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-40 border border-blue-400 border-opacity-30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border border-cyan-400 border-opacity-25 rounded-full"></div>
      </div>

      {/* City Points */}
      <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
      <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-blue-300 rounded-full animate-pulse"></div>
      <div className="absolute top-2/3 right-1/2 w-3 h-3 bg-cyan-300 rounded-full animate-ping"></div>

      {/* Connection Lines */}
      <div className="absolute top-1/3 left-1/3 w-24 h-px bg-blue-400 bg-opacity-20 transform rotate-12"></div>
      <div className="absolute top-1/2 right-1/3 w-20 h-px bg-cyan-400 bg-opacity-15 transform -rotate-12"></div>

      {/* Orbital Taiwan Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-20 rounded-full"></div>

      {/* Taiwan Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function TokenizationEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Tokenization Earth */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Token Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-yellow-400 border-opacity-30 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-yellow-300 border-opacity-25 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-yellow-500 border-opacity-20 rounded-full"></div>
      </div>

      {/* Token Symbols */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-yellow-300 rounded-full"></div>

      {/* Orbital Tokenization Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-yellow-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-yellow-300 border-opacity-20 rounded-full"></div>

      {/* Tokenization Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function ProfessionalEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Professional Earth */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Professional Glow Effects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-cyan-400 bg-opacity-20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 left-1/2 w-40 h-40 bg-blue-300 bg-opacity-12 rounded-full blur-3xl"></div>
      </div>

      {/* Subtle Lines */}
      <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-30"></div>
      <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-25"></div>

      {/* Professional Grid */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        ></div>
      </div>

      {/* Orbital Professional Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-20 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-15 rounded-full"></div>

      {/* Professional Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-10 rounded-full blur-3xl"></div>
    </div>
  );
}

// New TSMC Style Key Visuals with More Objects and Designs
function MultiOrbitEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Multiple Orbital Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-blue-400 border-opacity-40 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-cyan-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-300 border-opacity-25 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-cyan-300 border-opacity-20 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-blue-200 border-opacity-15 rounded-full"></div>

      {/* Orbital Objects */}
      <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-blue-400 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-cyan-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-blue-300 rounded-full animate-pulse"></div>
      <div className="absolute top-2/3 right-1/3 w-5 h-5 bg-cyan-300 rounded-full animate-ping"></div>

      {/* Connection Lines */}
      <div className="absolute top-1/4 left-1/4 w-32 h-px bg-blue-400 bg-opacity-30 transform rotate-12"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-px bg-cyan-400 bg-opacity-25 transform -rotate-12"></div>
      <div className="absolute bottom-1/3 left-1/3 w-28 h-px bg-blue-300 bg-opacity-20 transform rotate-6"></div>

      {/* Multi-Orbit Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function SatelliteNetworkEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Satellite Network */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        {/* Satellites */}
        <div className="absolute top-1/6 left-1/6 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 right-1/6 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/6 left-1/4 w-5 h-5 bg-blue-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-cyan-300 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/8 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/8 w-4 h-4 bg-cyan-500 rounded-full animate-ping"></div>
      </div>

      {/* Satellite Orbits */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-25 rounded-full"></div>

      {/* Network Connections */}
      <div className="absolute top-1/6 left-1/6 w-24 h-px bg-blue-400 bg-opacity-20 transform rotate-45"></div>
      <div className="absolute top-1/4 right-1/6 w-20 h-px bg-cyan-400 bg-opacity-15 transform -rotate-45"></div>
      <div className="absolute bottom-1/6 left-1/4 w-22 h-px bg-blue-300 bg-opacity-18 transform rotate-30"></div>

      {/* Satellite Network Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-12 rounded-full blur-3xl"></div>
    </div>
  );
}

function DataCenterEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Data Center Buildings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-8 h-12 bg-blue-400 bg-opacity-30 rounded"></div>
        <div className="absolute top-1/2 right-1/4 w-6 h-10 bg-cyan-400 bg-opacity-25 rounded"></div>
        <div className="absolute bottom-1/3 left-1/3 w-7 h-11 bg-blue-300 bg-opacity-28 rounded"></div>
        <div className="absolute top-2/3 right-1/3 w-5 h-9 bg-cyan-300 bg-opacity-22 rounded"></div>
      </div>

      {/* Data Flow Lines */}
      <div className="absolute top-1/3 left-1/4 w-32 h-px bg-blue-400 bg-opacity-30 transform rotate-12"></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-px bg-cyan-400 bg-opacity-25 transform -rotate-12"></div>
      <div className="absolute bottom-1/3 left-1/3 w-28 h-px bg-blue-300 bg-opacity-20 transform rotate-6"></div>

      {/* Data Center Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-20 rounded-full"></div>

      {/* Data Center Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function FinancialNetworkEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Financial Buildings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-10 h-16 bg-green-400 bg-opacity-30 rounded"></div>
        <div className="absolute top-1/3 right-1/4 w-8 h-14 bg-blue-400 bg-opacity-25 rounded"></div>
        <div className="absolute bottom-1/4 left-1/3 w-9 h-15 bg-cyan-400 bg-opacity-28 rounded"></div>
        <div className="absolute top-2/3 right-1/3 w-7 h-13 bg-green-300 bg-opacity-22 rounded"></div>
      </div>

      {/* Financial Data Flow */}
      <div className="absolute top-1/4 left-1/4 w-32 h-px bg-green-400 bg-opacity-30 transform rotate-12"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-px bg-blue-400 bg-opacity-25 transform -rotate-12"></div>
      <div className="absolute bottom-1/4 left-1/3 w-28 h-px bg-cyan-400 bg-opacity-20 transform rotate-6"></div>

      {/* Financial Network Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-green-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-400 border-opacity-20 rounded-full"></div>

      {/* Financial Network Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function BlockchainEcosystemEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Blockchain Nodes */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/6 left-1/6 w-6 h-6 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 right-1/6 w-5 h-5 bg-cyan-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/6 left-1/4 w-7 h-7 bg-blue-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-6 h-6 bg-cyan-300 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/8 w-5 h-5 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/8 w-6 h-6 bg-cyan-500 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/2 w-5 h-5 bg-cyan-400 rounded-full animate-ping"></div>
      </div>

      {/* Blockchain Connections */}
      <div className="absolute top-1/6 left-1/6 w-24 h-px bg-blue-400 bg-opacity-20 transform rotate-45"></div>
      <div className="absolute top-1/4 right-1/6 w-20 h-px bg-cyan-400 bg-opacity-15 transform -rotate-45"></div>
      <div className="absolute bottom-1/6 left-1/4 w-22 h-px bg-blue-300 bg-opacity-18 transform rotate-30"></div>
      <div className="absolute bottom-1/4 right-1/4 w-18 h-px bg-cyan-300 bg-opacity-12 transform -rotate-30"></div>

      {/* Blockchain Ecosystem Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-20 rounded-full"></div>

      {/* Blockchain Ecosystem Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function RWAEcosystemEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* RWA Token Objects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-8 h-8 border-2 border-yellow-400 border-opacity-40 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 border-2 border-yellow-300 border-opacity-35 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 left-1/3 w-10 h-10 border-2 border-yellow-500 border-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/3 w-7 h-7 border-2 border-yellow-400 border-opacity-25 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/8 w-6 h-6 border-2 border-yellow-300 border-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/8 w-8 h-8 border-2 border-yellow-500 border-opacity-20 rounded-full animate-ping"></div>
      </div>

      {/* RWA Connection Lines */}
      <div className="absolute top-1/4 left-1/4 w-24 h-px bg-yellow-400 bg-opacity-20 transform rotate-45"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-px bg-yellow-300 bg-opacity-15 transform -rotate-45"></div>
      <div className="absolute bottom-1/3 left-1/3 w-22 h-px bg-yellow-500 bg-opacity-18 transform rotate-30"></div>

      {/* RWA Ecosystem Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-yellow-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-yellow-300 border-opacity-20 rounded-full"></div>

      {/* RWA Ecosystem Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function RegulatoryFrameworkEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Regulatory Framework Objects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-8 h-8 border border-white border-opacity-30 rounded"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 border border-white border-opacity-25 rounded"></div>
        <div className="absolute bottom-1/3 left-1/3 w-7 h-7 border border-white border-opacity-28 rounded"></div>
        <div className="absolute top-2/3 right-1/3 w-5 h-5 border border-white border-opacity-22 rounded"></div>
        <div className="absolute top-1/2 left-1/8 w-6 h-6 border border-white border-opacity-20 rounded"></div>
        <div className="absolute top-1/2 right-1/8 w-7 h-7 border border-white border-opacity-18 rounded"></div>
      </div>

      {/* Regulatory Grid */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>
        </div>
      </div>

      {/* Regulatory Framework Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white border-opacity-20 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white border-opacity-15 rounded-full"></div>

      {/* Regulatory Framework Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white bg-opacity-5 rounded-full blur-3xl"></div>
    </div>
  );
}

function TaiwanTechEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Taiwan Tech Objects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-6 h-6 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-5 h-5 bg-cyan-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 left-1/2 w-7 h-7 bg-blue-300 rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/2 w-6 h-6 bg-cyan-300 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-5 h-5 bg-cyan-500 rounded-full animate-ping"></div>
      </div>

      {/* Taiwan Tech Connections */}
      <div className="absolute top-1/3 left-1/3 w-20 h-px bg-blue-400 bg-opacity-20 transform rotate-30"></div>
      <div className="absolute top-1/2 right-1/3 w-18 h-px bg-cyan-400 bg-opacity-15 transform -rotate-30"></div>
      <div className="absolute bottom-1/3 left-1/2 w-22 h-px bg-blue-300 bg-opacity-18 transform rotate-15"></div>

      {/* Taiwan Tech Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-20 rounded-full"></div>

      {/* Taiwan Tech Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function TokenizedFutureEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Tokenized Future Objects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-8 h-8 border-2 border-yellow-400 border-opacity-40 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 border-2 border-yellow-300 border-opacity-35 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 left-1/3 w-10 h-10 border-2 border-yellow-500 border-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/3 w-7 h-7 border-2 border-yellow-400 border-opacity-25 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/8 w-6 h-6 border-2 border-yellow-300 border-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/8 w-8 h-8 border-2 border-yellow-500 border-opacity-20 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 left-1/2 w-5 h-5 border-2 border-yellow-400 border-opacity-25 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/2 w-6 h-6 border-2 border-yellow-300 border-opacity-20 rounded-full animate-ping"></div>
      </div>

      {/* Tokenized Future Connections */}
      <div className="absolute top-1/4 left-1/4 w-24 h-px bg-yellow-400 bg-opacity-20 transform rotate-45"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-px bg-yellow-300 bg-opacity-15 transform -rotate-45"></div>
      <div className="absolute bottom-1/3 left-1/3 w-22 h-px bg-yellow-500 bg-opacity-18 transform rotate-30"></div>
      <div className="absolute bottom-1/4 right-1/4 w-18 h-px bg-yellow-400 bg-opacity-12 transform -rotate-30"></div>

      {/* Tokenized Future Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-yellow-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-yellow-300 border-opacity-20 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-yellow-500 border-opacity-15 rounded-full"></div>

      {/* Tokenized Future Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}

function ProfessionalEcosystemEarth() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Earth Globe */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full shadow-2xl"></div>

      {/* Professional Ecosystem Objects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-blue-400 bg-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-cyan-400 bg-opacity-25 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 left-1/3 w-7 h-7 bg-blue-300 bg-opacity-28 rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/3 w-5 h-5 bg-cyan-300 bg-opacity-22 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/8 w-6 h-6 bg-blue-500 bg-opacity-20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/8 w-7 h-7 bg-cyan-500 bg-opacity-18 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-blue-400 bg-opacity-25 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/2 w-5 h-5 bg-cyan-400 bg-opacity-20 rounded-full animate-ping"></div>
        <div className="absolute top-1/6 left-1/6 w-3 h-3 bg-blue-300 bg-opacity-15 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/6 right-1/6 w-4 h-4 bg-cyan-300 bg-opacity-12 rounded-full animate-ping"></div>
      </div>

      {/* Professional Ecosystem Connections */}
      <div className="absolute top-1/4 left-1/4 w-24 h-px bg-blue-400 bg-opacity-20 transform rotate-45"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-px bg-cyan-400 bg-opacity-15 transform -rotate-45"></div>
      <div className="absolute bottom-1/3 left-1/3 w-22 h-px bg-blue-300 bg-opacity-18 transform rotate-30"></div>
      <div className="absolute bottom-1/4 right-1/4 w-18 h-px bg-cyan-300 bg-opacity-12 transform -rotate-30"></div>
      <div className="absolute top-1/2 left-1/8 w-16 h-px bg-blue-500 bg-opacity-10 transform rotate-15"></div>
      <div className="absolute top-1/2 right-1/8 w-14 h-px bg-cyan-500 bg-opacity-8 transform -rotate-15"></div>

      {/* Professional Ecosystem Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 border-opacity-20 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-blue-300 border-opacity-15 rounded-full"></div>

      {/* Professional Ecosystem Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>
    </div>
  );
}
