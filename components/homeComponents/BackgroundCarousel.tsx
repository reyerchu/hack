import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function BackgroundCarousel() {
  return (
    <div
      className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 -mt-14"
      style={{ height: 'calc(85vh + 56px)', minHeight: '656px' }}
    >
      {/* Background Display */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="w-full h-full">
          <DataFlowEarth />
        </div>
      </div>

      {/* Hero Text - TSMC CareerHack Style with Fluid Typography */}
      <div className="absolute inset-0 z-20 flex items-end justify-center pb-16 landscape:pb-8">
        <div className="text-center text-white max-w-6xl mx-auto px-4 md:px-8">
          {/* Main Title - Fluid Typography */}
          <h1
            className="font-bold mb-2 landscape:mb-1 leading-tight"
            style={{ fontSize: 'clamp(2rem, 6vw, 5rem)' }}
          >
            2025 RWA 黑客松
          </h1>

          {/* Subtitle - Fluid Typography */}
          <h2
            className="font-bold mb-4 landscape:mb-2 text-blue-200"
            style={{ fontSize: 'clamp(1.75rem, 5vw, 4rem)' }}
          >
            Taiwan
          </h2>

          {/* Tagline - Fluid Typography */}
          <p
            className="font-medium mb-2 landscape:mb-1 text-blue-100"
            style={{ fontSize: 'clamp(1.125rem, 2.5vw, 2rem)' }}
          >
            Tokenize Reality, Create the Future
          </p>
          <p
            className="font-medium mb-6 landscape:mb-3 text-blue-200"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
          >
            鏈接現實，創造未來
          </p>

          {/* Event Info - Fluid Typography */}
          <div
            className="flex flex-col md:flex-row justify-center items-center gap-4 landscape:gap-2 mb-8 landscape:mb-4"
            style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}
          >
            <div className="text-center">
              <div className="font-bold text-blue-200">10/29 Wed.</div>
              <div className="text-blue-300">報名截止日</div>
            </div>
            <div className="hidden md:block text-blue-400">|</div>
            <div className="text-center">
              <div className="font-bold text-blue-200">10/31 Fri. - 11/1 Sat.</div>
              <div className="text-blue-300">政大公企中心</div>
              <div className="text-blue-300">競賽時間 & 地點</div>
            </div>
          </div>

          {/* CTA Button - Fluid Typography */}
          <Link href="/team-register-info">
            <a
              className="inline-block bg-white text-blue-900 rounded-lg font-bold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl landscape:px-6 landscape:py-2"
              style={{
                fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
                padding: 'clamp(0.75rem, 1vw, 1rem) clamp(2rem, 3vw, 3rem)',
              }}
            >
              立即報名
            </a>
          </Link>

          {/* Co-hosted by imToken */}
          <div className="mt-8 landscape:mt-4 flex flex-row items-center justify-center gap-3">
            <p className="text-white" style={{ fontSize: 'clamp(0.75rem, 1.2vw, 1rem)' }}>
              Co-hosted by
            </p>
            <a
              href="https://token.im/"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity duration-200"
            >
              <Image
                src="/sponsor-media/imToken-logo-white.svg"
                alt="imToken"
                width={160}
                height={40}
                className="h-8 landscape:h-6 w-auto"
              />
            </a>
          </div>
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
