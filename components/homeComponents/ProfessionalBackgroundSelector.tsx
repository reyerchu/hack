import { useState } from 'react';

export default function ProfessionalBackgroundSelector() {
  const [selectedBackground, setSelectedBackground] = useState(1);

  const backgrounds = [
    {
      id: 1,
      title: '深藍漸變幾何',
      description: '深藍色漸變背景配幾何圖形',
      component: 'DeepBlueGradient',
    },
    {
      id: 2,
      title: '金色粒子流',
      description: '金色粒子流動效果',
      component: 'GoldenParticleFlow',
    },
    {
      id: 3,
      title: '科技網格',
      description: '科技感網格背景',
      component: 'TechGrid',
    },
    {
      id: 4,
      title: '代幣化光效',
      description: '代幣化主題光效背景',
      component: 'TokenizationLight',
    },
    {
      id: 5,
      title: '金融數據流',
      description: '金融數據流動背景',
      component: 'FinancialDataFlow',
    },
    {
      id: 6,
      title: '區塊鏈節點',
      description: '區塊鏈網絡節點背景',
      component: 'BlockchainNodes',
    },
    {
      id: 7,
      title: '監管合規紋理',
      description: '監管合規主題紋理',
      component: 'RegulatoryTexture',
    },
    {
      id: 8,
      title: '台灣地圖抽象',
      description: '台灣地圖抽象化背景',
      component: 'TaiwanMapAbstract',
    },
    {
      id: 9,
      title: 'RWA代幣環',
      description: 'RWA代幣環形背景',
      component: 'RWATokenRing',
    },
    {
      id: 10,
      title: '專業光暈',
      description: '專業光暈效果背景',
      component: 'ProfessionalGlow',
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Selector */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-4 border border-white border-opacity-20 max-h-96 overflow-y-auto">
          <h3 className="text-white text-lg font-bold mb-4">選擇背景設計</h3>
          <div className="space-y-2">
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setSelectedBackground(bg.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                  selectedBackground === bg.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                }`}
              >
                <div className="font-bold text-sm">{bg.title}</div>
                <div className="text-xs opacity-80">{bg.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Background Display */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-full h-screen">
          {selectedBackground === 1 && <DeepBlueGradient />}
          {selectedBackground === 2 && <GoldenParticleFlow />}
          {selectedBackground === 3 && <TechGrid />}
          {selectedBackground === 4 && <TokenizationLight />}
          {selectedBackground === 5 && <FinancialDataFlow />}
          {selectedBackground === 6 && <BlockchainNodes />}
          {selectedBackground === 7 && <RegulatoryTexture />}
          {selectedBackground === 8 && <TaiwanMapAbstract />}
          {selectedBackground === 9 && <RWATokenRing />}
          {selectedBackground === 10 && <ProfessionalGlow />}
        </div>
      </div>
    </div>
  );
}

// Background Components
function DeepBlueGradient() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Geometric Shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-600 bg-opacity-20 rounded-full blur-xl"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-cyan-500 bg-opacity-30 rounded-full blur-lg"></div>
      <div className="absolute bottom-32 left-40 w-40 h-40 bg-blue-800 bg-opacity-25 rounded-full blur-2xl"></div>

      {/* Geometric Lines */}
      <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-30"></div>
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-20"></div>
      <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-25"></div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        ></div>
      </div>
    </div>
  );
}

function GoldenParticleFlow() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Golden Particles */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
      <div className="absolute top-32 left-40 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
      <div className="absolute top-48 left-60 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
      <div className="absolute top-64 left-80 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
      <div className="absolute top-80 left-100 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>

      {/* Flow Lines */}
      <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-40"></div>
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-30"></div>
      <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-35"></div>

      {/* Golden Glow Effects */}
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-yellow-400 bg-opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-yellow-300 bg-opacity-15 rounded-full blur-2xl"></div>
    </div>
  );
}

function TechGrid() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Tech Grid */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Hexagonal Pattern */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-blue-400 border-opacity-30 transform rotate-45"></div>
      <div className="absolute top-1/2 right-1/3 w-24 h-24 border border-cyan-400 border-opacity-25 transform rotate-12"></div>
      <div className="absolute bottom-1/3 left-1/3 w-28 h-28 border border-blue-300 border-opacity-20 transform -rotate-12"></div>

      {/* Tech Nodes */}
      <div className="absolute top-1/3 left-1/3 w-4 h-4 bg-blue-400 rounded-full"></div>
      <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-cyan-400 rounded-full"></div>
      <div className="absolute bottom-1/3 left-2/3 w-5 h-5 bg-blue-300 rounded-full"></div>
    </div>
  );
}

function TokenizationLight() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Token Circles */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-yellow-400 border-opacity-40 rounded-full"></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 border-2 border-yellow-300 border-opacity-35 rounded-full"></div>
      <div className="absolute bottom-1/3 left-1/2 w-28 h-28 border-2 border-yellow-500 border-opacity-30 rounded-full"></div>

      {/* Light Rays */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50"></div>
      <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-40"></div>
      <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-45"></div>

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400 bg-opacity-20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-yellow-300 bg-opacity-25 rounded-full blur-lg"></div>
    </div>
  );
}

function FinancialDataFlow() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Data Flow Lines */}
      <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-40"></div>
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-35"></div>
      <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30"></div>

      {/* Financial Icons */}
      <div className="absolute top-1/3 left-1/4 w-8 h-8 border border-green-400 border-opacity-30 rounded"></div>
      <div className="absolute top-2/3 right-1/3 w-6 h-6 border border-blue-400 border-opacity-25 rounded"></div>
      <div className="absolute bottom-1/3 left-2/3 w-7 h-7 border border-cyan-400 border-opacity-20 rounded"></div>

      {/* Data Points */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-green-400 rounded-full"></div>
      <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-blue-400 rounded-full"></div>
      <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
    </div>
  );
}

function BlockchainNodes() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Blockchain Nodes */}
      <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-blue-400 rounded-full"></div>
      <div className="absolute top-1/2 right-1/3 w-5 h-5 bg-cyan-400 rounded-full"></div>
      <div className="absolute bottom-1/3 left-1/2 w-7 h-7 bg-blue-300 rounded-full"></div>
      <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-cyan-300 rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/2 w-6 h-6 bg-blue-500 rounded-full"></div>

      {/* Connection Lines */}
      <div className="absolute top-1/4 left-1/4 w-32 h-px bg-blue-400 bg-opacity-30 transform rotate-12"></div>
      <div className="absolute top-1/2 right-1/3 w-24 h-px bg-cyan-400 bg-opacity-25 transform -rotate-12"></div>
      <div className="absolute bottom-1/3 left-1/2 w-28 h-px bg-blue-300 bg-opacity-20 transform rotate-6"></div>

      {/* Network Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.3) 2px, transparent 2px)',
            backgroundSize: '60px 60px',
          }}
        ></div>
      </div>
    </div>
  );
}

function RegulatoryTexture() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Regulatory Grid */}
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

      {/* Compliance Icons */}
      <div className="absolute top-1/3 left-1/3 w-8 h-8 border border-white border-opacity-20 rounded"></div>
      <div className="absolute top-2/3 right-1/3 w-6 h-6 border border-white border-opacity-15 rounded"></div>
      <div className="absolute bottom-1/3 left-2/3 w-7 h-7 border border-white border-opacity-25 rounded"></div>

      {/* Professional Lines */}
      <div className="absolute top-1/4 left-0 w-full h-px bg-white bg-opacity-10"></div>
      <div className="absolute top-1/2 left-0 w-full h-px bg-white bg-opacity-8"></div>
      <div className="absolute top-3/4 left-0 w-full h-px bg-white bg-opacity-12"></div>
    </div>
  );
}

function TaiwanMapAbstract() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Abstract Taiwan Shape */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-40 border border-blue-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border border-cyan-400 border-opacity-25 rounded-full"></div>

      {/* City Points */}
      <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-blue-400 rounded-full"></div>
      <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-cyan-400 rounded-full"></div>
      <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-blue-300 rounded-full"></div>
      <div className="absolute top-2/3 right-1/2 w-3 h-3 bg-cyan-300 rounded-full"></div>

      {/* Connection Lines */}
      <div className="absolute top-1/3 left-1/3 w-24 h-px bg-blue-400 bg-opacity-20 transform rotate-12"></div>
      <div className="absolute top-1/2 right-1/3 w-20 h-px bg-cyan-400 bg-opacity-15 transform -rotate-12"></div>
    </div>
  );
}

function RWATokenRing() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Token Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-yellow-400 border-opacity-30 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-yellow-300 border-opacity-25 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-yellow-500 border-opacity-20 rounded-full"></div>

      {/* Token Symbols */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-yellow-300 rounded-full"></div>

      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400 bg-opacity-10 rounded-full blur-2xl"></div>
    </div>
  );
}

function ProfessionalGlow() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>

      {/* Professional Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-blue-400 bg-opacity-15 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-cyan-400 bg-opacity-20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-1/3 left-1/2 w-40 h-40 bg-blue-300 bg-opacity-12 rounded-full blur-3xl"></div>

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
    </div>
  );
}
