import React from 'react';
import Image from 'next/image';

/**
 * Home page organizers and sponsors section
 * Displays logos in categorized sections
 */
export default function HomeOrganizers() {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: '#1a3a6e' }}
          >
            主辦單位與贊助夥伴
          </h2>
          <div className="w-24 h-1 mx-auto" style={{ backgroundColor: '#d97706' }}></div>
        </div>

        {/* 協辦 */}
        <div className="mb-12">
          <h3
            className="text-2xl font-semibold mb-6 text-center"
            style={{ color: '#1a3a6e' }}
          >
            協辦
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/others/XueDAO-logo.webp"
                alt="XueDAO"
                width={180}
                height={80}
                className="h-16 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/others/ETHTaipei-logo.jpg"
                alt="ETHTaipei"
                width={180}
                height={80}
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* 冠名贊助 */}
        <div className="mb-12">
          <h3
            className="text-2xl font-semibold mb-6 text-center"
            style={{ color: '#1a3a6e' }}
          >
            冠名贊助
          </h3>
          <div className="flex justify-center">
            <div className="flex items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/imToken-logo.svg"
                alt="imToken"
                width={200}
                height={90}
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* 賽道贊助 */}
        <div className="mb-12">
          <h3
            className="text-2xl font-semibold mb-6 text-center"
            style={{ color: '#1a3a6e' }}
          >
            賽道贊助
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/Cathay-logo-nologo.svg"
                alt="Cathay"
                width={180}
                height={80}
                className="h-16 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/Oasis-logo.svg"
                alt="Oasis"
                width={150}
                height={70}
                className="h-14 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/Self-logo.svg"
                alt="Self"
                width={150}
                height={70}
                className="h-14 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/Zircuit-logo.svg"
                alt="Zircuit"
                width={150}
                height={70}
                className="h-14 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/Sui-logo.svg"
                alt="Sui"
                width={150}
                height={70}
                className="h-14 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* 其他贊助 */}
        <div>
          <h3
            className="text-2xl font-semibold mb-6 text-center"
            style={{ color: '#1a3a6e' }}
          >
            其他贊助
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/others/RWA-Nexus-logo.png"
                alt="RWA Nexus"
                width={140}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/others/deFintek-logo.png"
                alt="deFintek"
                width={140}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/others/Pelith-logo.png"
                alt="Pelith"
                width={140}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/others/Sparklands-logo.svg"
                alt="SparkLands"
                width={140}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/others/AsiaVista-logo.svg"
                alt="AsiaVista"
                width={140}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/others/Stockfeel-logo.webp"
                alt="Stockfeel"
                width={140}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Image
                src="/sponsor-media/others/imKey-logo.svg"
                alt="imKey"
                width={140}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

